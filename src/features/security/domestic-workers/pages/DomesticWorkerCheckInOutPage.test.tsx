import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { DomesticWorkerCheckInOutPage } from './DomesticWorkerCheckInOutPage';

const API_BASE = 'https://localhost:7219';

const guardUser: AuthUser = {
  id: 'user-1',
  email: 'guard@example.com',
  name: 'Gate Guard',
  tenantId: 'tenant-1',
  roles: ['SecurityGuard'],
  permissions: ['domesticworker.view', 'domesticworker.checkin', 'domesticworker.checkout'],
  buildingIds: [],
  buildingPermissions: [],
};

const worker = {
  domesticWorkerProfileId: 'worker-1',
  fullName: 'Rahima Begum',
  phone: '01711000000',
  workerType: 'Maid',
  identityDocumentType: null,
  identityDocumentNumberMasked: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  verificationStatus: 'Verified',
  status: 'Active',
  statusReason: null,
};

const suspendedWorker = {
  ...worker,
  domesticWorkerProfileId: 'worker-2',
  fullName: 'Karim Mia',
  status: 'Suspended',
  statusReason: 'Pending re-verification',
};

function mockPropertyLookups() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({
        items: [{ buildingId: 'bld-1', name: 'Tower A', code: 'A', address: null }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
    http.get(`${API_BASE}/api/v1/properties/buildings/bld-1/flats`, () =>
      HttpResponse.json({
        items: [{ flatId: 'flat-1', buildingId: 'bld-1', flatNumber: '101', floorNumber: 1, flatType: 'Residential', areaSqFt: null }],
        page: 1,
        pageSize: 200,
        total: 1,
      }),
    ),
    http.get(`${API_BASE}/api/v1/properties/buildings/bld-1/gates`, () =>
      HttpResponse.json([{ gateId: 'gate-1', buildingId: 'bld-1', name: 'Main Gate' }]),
    ),
  );
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('DomesticWorkerCheckInOutPage', () => {
  it('shows search results as an explicit pick list, then checks the selected worker in', async () => {
    mockPropertyLookups();
    let receivedBody: unknown = null;

    server.use(
      http.get(`${API_BASE}/api/v1/domestic-workers`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('search')).toBe('Rahima');
        return HttpResponse.json({ items: [worker], page: 1, pageSize: 5, total: 1 });
      }),
      http.get(`${API_BASE}/api/v1/access-sessions/currently-inside`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 }),
      ),
      http.post(`${API_BASE}/api/v1/access-sessions/domestic-workers/checkin`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          accessSessionId: 'session-1',
          accessCategory: 'DomesticWorker',
          guestProfileId: null,
          vehicleId: null,
          hostFlatId: 'flat-1',
          purposeOfVisit: null,
          entryGateId: 'gate-1',
          entryAtUtc: new Date().toISOString(),
          exitGateId: null,
          exitAtUtc: null,
          checkedInBy: null,
          checkedOutBy: null,
          approvalStatus: 'Approved',
          passOrQrNumber: null,
          remarks: null,
          status: 'CheckedIn',
          overrideReason: null,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DomesticWorkerCheckInOutPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByPlaceholderText('Search by name or mobile number'), 'Rahima');
    await user.click(screen.getByRole('button', { name: /search/i }));

    // Result appears as a pick-list entry, not auto-selected.
    const resultButton = await screen.findByRole('button', { name: /Rahima Begum/ });
    await user.click(resultButton);

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a flat', '101');
    await chooseOption(user, 'Select a gate', 'Main Gate');
    await user.click(screen.getByRole('button', { name: /check in/i }));

    await waitFor(() => expect(receivedBody).not.toBeNull());
    expect(receivedBody).toMatchObject({
      domesticWorkerProfileId: 'worker-1',
      hostFlatId: 'flat-1',
      entryGateId: 'gate-1',
    });
  }, 15000);

  it('warns before check-in when the selected worker is not Active, and surfaces the real backend rejection', async () => {
    mockPropertyLookups();

    server.use(
      http.get(`${API_BASE}/api/v1/domestic-workers`, () =>
        HttpResponse.json({ items: [suspendedWorker], page: 1, pageSize: 5, total: 1 }),
      ),
      http.get(`${API_BASE}/api/v1/access-sessions/currently-inside`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 }),
      ),
      http.post(`${API_BASE}/api/v1/access-sessions/domestic-workers/checkin`, () =>
        HttpResponse.json(
          {
            status: 403,
            title: 'Worker cannot enter',
            detail: 'Domestic worker cannot enter: Worker status is Suspended (Pending re-verification). An override reason is required.',
          },
          { status: 403 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<DomesticWorkerCheckInOutPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByPlaceholderText('Search by name or mobile number'), 'Karim');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await user.click(await screen.findByRole('button', { name: /Karim Mia/ }));

    // Proactive warning shown before any check-in attempt.
    expect(screen.getByText(/this worker is suspended/i)).toBeInTheDocument();

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a flat', '101');
    await chooseOption(user, 'Select a gate', 'Main Gate');
    await user.click(screen.getByRole('button', { name: /check in/i }));

    expect(
      await screen.findByText(
        'Domestic worker cannot enter: Worker status is Suspended (Pending re-verification). An override reason is required.',
      ),
    ).toBeInTheDocument();
  }, 15000);

  it('checks out a worker from the currently-inside quick list', async () => {
    mockPropertyLookups();
    let checkoutCalled = false;

    server.use(
      http.get(`${API_BASE}/api/v1/domestic-workers`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 5, total: 0 }),
      ),
      http.get(`${API_BASE}/api/v1/access-sessions/currently-inside`, () =>
        HttpResponse.json({
          items: [
            {
              accessSessionId: 'session-open',
              accessCategory: 'DomesticWorker',
              guestProfileId: null,
              vehicleId: null,
              hostFlatId: 'flat-1',
              purposeOfVisit: null,
              entryGateId: 'gate-1',
              entryAtUtc: new Date().toISOString(),
              exitGateId: null,
              exitAtUtc: null,
              checkedInBy: null,
              checkedOutBy: null,
              approvalStatus: 'Approved',
              passOrQrNumber: null,
              remarks: null,
              status: 'CheckedIn',
              overrideReason: null,
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        }),
      ),
      http.post(`${API_BASE}/api/v1/access-sessions/domestic-workers/session-open/checkout`, () => {
        checkoutCalled = true;
        return HttpResponse.json({
          accessSessionId: 'session-open',
          accessCategory: 'DomesticWorker',
          guestProfileId: null,
          vehicleId: null,
          hostFlatId: 'flat-1',
          purposeOfVisit: null,
          entryGateId: 'gate-1',
          entryAtUtc: new Date().toISOString(),
          exitGateId: 'gate-1',
          exitAtUtc: new Date().toISOString(),
          checkedInBy: null,
          checkedOutBy: null,
          approvalStatus: 'Approved',
          passOrQrNumber: null,
          remarks: null,
          status: 'CheckedOut',
          overrideReason: null,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DomesticWorkerCheckInOutPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.click(await screen.findByRole('button', { name: /check out/i }));
    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a gate', 'Main Gate');
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => expect(checkoutCalled).toBe(true));
  }, 15000);
});
