import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { AttendanceRegisterPage } from './AttendanceRegisterPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Front Desk Admin',
  tenantId: 'tenant-1',
  roles: ['FrontDeskAdmin'],
  permissions: ['staffattendance.view', 'staffattendance.manage', 'staffattendance.correct', 'staffattendance.approve'],
  buildingIds: [],
  buildingPermissions: [],
};

const openRecord = {
  attendanceRecordId: 'rec-1',
  staffMemberId: 'staff-1',
  staffMemberFullName: 'Md. Karim Sheikh',
  staffMemberRole: 'Guard',
  workDate: '2026-08-08',
  scheduledStartUtc: null,
  scheduledEndUtc: null,
  checkInUtc: '2026-08-08T02:00:00Z',
  checkOutUtc: null,
  workLocation: 'Main Gate',
  source: 'Manual',
  correctionRequested: false,
  correctionReason: null,
  approvedBy: null,
  approvedAtUtc: null,
  isLateArrival: false,
  isEarlyDeparture: false,
  overtimeMinutes: 0,
};

const pendingCorrectionRecord = {
  ...openRecord,
  attendanceRecordId: 'rec-2',
  checkOutUtc: '2026-08-08T10:00:00Z',
  correctionRequested: true,
  correctionReason: 'Missed the actual check-in time by an hour.',
};

describe('AttendanceRegisterPage', () => {
  it('confirms and clocks a staff member out', async () => {
    let clockOutCalled = false;

    server.use(
      http.get(`${API_BASE}/api/v1/attendance-records`, () =>
        HttpResponse.json({ items: [openRecord], page: 1, pageSize: 20, total: 1 }),
      ),
      http.post(`${API_BASE}/api/v1/attendance-records/rec-1/clock-out`, () => {
        clockOutCalled = true;
        return HttpResponse.json({ ...openRecord, checkOutUtc: '2026-08-08T10:00:00Z' });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<AttendanceRegisterPage />, { auth: { user: adminUser, isInitialized: true } });

    expect(await screen.findByText('Md. Karim Sheikh')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clock out/i }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/clock out this staff member/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Md\. Karim Sheikh/)).toBeInTheDocument();
    expect(clockOutCalled).toBe(false);

    await user.click(within(dialog).getByRole('button', { name: /^clock out$/i }));

    await waitFor(() => expect(clockOutCalled).toBe(true));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  }, 15000);

  it('leaves the record unchanged when the clock-out confirmation is cancelled', async () => {
    let clockOutCalled = false;

    server.use(
      http.get(`${API_BASE}/api/v1/attendance-records`, () =>
        HttpResponse.json({ items: [openRecord], page: 1, pageSize: 20, total: 1 }),
      ),
      http.post(`${API_BASE}/api/v1/attendance-records/rec-1/clock-out`, () => {
        clockOutCalled = true;
        return HttpResponse.json({ ...openRecord, checkOutUtc: '2026-08-08T10:00:00Z' });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<AttendanceRegisterPage />, { auth: { user: adminUser, isInitialized: true } });

    await user.click(await screen.findByRole('button', { name: /clock out/i }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(clockOutCalled).toBe(false);
    expect(screen.getByText('Open')).toBeInTheDocument();
  }, 15000);

  it('confirms and approves an attendance correction', async () => {
    let approveCalled = false;

    server.use(
      http.get(`${API_BASE}/api/v1/attendance-records`, () =>
        HttpResponse.json({ items: [pendingCorrectionRecord], page: 1, pageSize: 20, total: 1 }),
      ),
      http.post(`${API_BASE}/api/v1/attendance-records/rec-2/approve-correction`, () => {
        approveCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<AttendanceRegisterPage />, { auth: { user: adminUser, isInitialized: true } });

    expect(await screen.findByText('Correction requested')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^approve$/i }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/approve this attendance correction/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Missed the actual check-in time by an hour\./)).toBeInTheDocument();
    expect(approveCalled).toBe(false);

    await user.click(within(dialog).getByRole('button', { name: /^approve$/i }));

    await waitFor(() => expect(approveCalled).toBe(true));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  }, 15000);

  it('leaves the correction unapproved when the approval confirmation is cancelled', async () => {
    let approveCalled = false;

    server.use(
      http.get(`${API_BASE}/api/v1/attendance-records`, () =>
        HttpResponse.json({ items: [pendingCorrectionRecord], page: 1, pageSize: 20, total: 1 }),
      ),
      http.post(`${API_BASE}/api/v1/attendance-records/rec-2/approve-correction`, () => {
        approveCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<AttendanceRegisterPage />, { auth: { user: adminUser, isInitialized: true } });

    await user.click(await screen.findByRole('button', { name: /^approve$/i }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(approveCalled).toBe(false);
    expect(screen.getByText('Correction requested')).toBeInTheDocument();
  }, 15000);

  it('submits a correction request with the entered reason', async () => {
    let receivedBody: unknown = null;

    server.use(
      http.get(`${API_BASE}/api/v1/attendance-records`, () =>
        HttpResponse.json({ items: [openRecord], page: 1, pageSize: 20, total: 1 }),
      ),
      http.post(`${API_BASE}/api/v1/attendance-records/rec-1/request-correction`, async ({ request }) => {
        receivedBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<AttendanceRegisterPage />, { auth: { user: adminUser, isInitialized: true } });

    await user.click(await screen.findByRole('button', { name: /correct/i }));
    await user.type(screen.getByLabelText('Reason'), 'Missed the actual check-in time by an hour.');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => expect(receivedBody).toEqual({ reason: 'Missed the actual check-in time by an hour.' }));
  }, 15000);
});
