import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { PoolAccessPage } from './PoolAccessPage';

const API_BASE = 'https://localhost:7219';

const operatorUser: AuthUser = {
  id: 'user-1',
  email: 'lifeguard@example.com',
  name: 'Lifeguard',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['pool.checkin', 'pool.checkout'],
  buildingIds: [],
  buildingPermissions: [],
};

const pool = {
  facilityId: 'pool-1',
  buildingId: 'bld-1',
  name: 'Main Pool',
  facilityType: 'SwimmingPool',
  capacity: 10,
  operatingHoursStart: null,
  operatingHoursEnd: null,
  requiresApproval: false,
  bookingChargeAmount: null,
  depositAmount: null,
  cancellationDeadlineHours: 0,
  cancellationDeductionPercentage: 0,
  guestFeeAmount: 200,
  minimumAgeUnaccompanied: 12,
  requiresSafetyAcknowledgement: true,
  blocksEntryIfAccountOverdue: false,
  isActive: true,
};

const resident = { residentId: 'res-1', flatId: 'flat-1', fullName: 'Karim Ahmed', phone: '01711000000', email: null, residentType: 'Owner' };

function emptySessions(total = 0) {
  return { items: [], page: 1, pageSize: 100, total };
}

async function choosePoolAndResident(user: ReturnType<typeof userEvent.setup>) {
  const poolTrigger = (await screen.findByText('Select a pool')).closest('[role="combobox"]') as HTMLElement;
  await user.click(poolTrigger);
  await user.click(await screen.findByRole('option', { name: 'Main Pool' }));

  const residentTrigger = screen.getByText(/search by resident name or mobile/i).closest('[role="combobox"]') as HTMLElement;
  await user.click(residentTrigger);
  await user.type(screen.getByPlaceholderText('Search by name or mobile…'), 'Karim');
  await user.click(await screen.findByText('Karim Ahmed'));
}

describe('PoolAccessPage', () => {
  it('denies check-in at capacity and lists the reason, requiring an override', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/facilities`, () => HttpResponse.json({ items: [pool], page: 1, pageSize: 100, total: 1 })),
      http.get(`${API_BASE}/api/v1/residents`, () => HttpResponse.json({ items: [resident], page: 1, pageSize: 20, total: 1 })),
      http.get(`${API_BASE}/api/v1/swimming-pool/sessions`, () => HttpResponse.json(emptySessions(10))), // at capacity (10/10)
      http.post(`${API_BASE}/api/v1/swimming-pool/sessions`, () =>
        HttpResponse.json(
          { status: 403, title: 'Forbidden', detail: 'Cannot check in: capacity (10) reached. An override reason is required to proceed.' },
          { status: 403 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<PoolAccessPage />, { auth: { user: operatorUser, isInitialized: true } });

    await choosePoolAndResident(user);
    await user.click(screen.getByRole('checkbox', { name: /safety rules acknowledged/i }));
    await user.click(await screen.findByRole('button', { name: /check in/i }));

    expect(await screen.findByText('capacity (10) reached')).toBeInTheDocument();
    expect(screen.getByLabelText(/override reason/i)).toBeInTheDocument();
  }, 15000);

  it('denies a child check-in without an accompanying adult — caught client-side by the same rule the backend enforces, before any request is sent', async () => {
    let checkInCalled = false;
    server.use(
      http.get(`${API_BASE}/api/v1/facilities`, () => HttpResponse.json({ items: [pool], page: 1, pageSize: 100, total: 1 })),
      http.get(`${API_BASE}/api/v1/residents`, () => HttpResponse.json({ items: [resident], page: 1, pageSize: 20, total: 1 })),
      http.get(`${API_BASE}/api/v1/swimming-pool/sessions`, () => HttpResponse.json(emptySessions(0))),
      http.post(`${API_BASE}/api/v1/swimming-pool/sessions`, () => {
        checkInCalled = true;
        return HttpResponse.json(
          {
            status: 403,
            title: 'Forbidden',
            detail: 'Cannot check in: child not accompanied by a currently checked-in adult from the same flat. An override reason is required to proceed.',
          },
          { status: 403 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<PoolAccessPage />, { auth: { user: operatorUser, isInitialized: true } });

    await choosePoolAndResident(user);

    // "Adult" also matches a hidden native <option> Radix's Select renders for form semantics —
    // find the one that's actually inside the combobox trigger.
    const ageCategoryTrigger = screen
      .getAllByText('Adult')
      .map((el) => el.closest('[role="combobox"]'))
      .find((el): el is HTMLElement => el !== null)!;
    await user.click(ageCategoryTrigger);
    await user.click(await screen.findByRole('option', { name: 'Child' }));

    await user.click(screen.getByRole('checkbox', { name: /safety rules acknowledged/i }));
    await user.click(await screen.findByRole('button', { name: /check in/i }));

    // poolCheckInSchema's own refine mirrors this exact backend rule (Slice G plan's schema mirrors
    // CheckInPoolSessionCommandHandler's eligibility check) — it fires first, so the request never
    // reaches the server for this specific case.
    expect(
      await screen.findByText('A child must be accompanied by a checked-in adult, or an override reason provided.'),
    ).toBeInTheDocument();
    expect(checkInCalled).toBe(false);
  }, 15000);

  it('shows an already-checked-in resident with a Check Out action instead of the check-in form (no duplicate check-in)', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/facilities`, () => HttpResponse.json({ items: [pool], page: 1, pageSize: 100, total: 1 })),
      http.get(`${API_BASE}/api/v1/residents`, () => HttpResponse.json({ items: [resident], page: 1, pageSize: 20, total: 1 })),
      http.get(`${API_BASE}/api/v1/swimming-pool/sessions`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('flatId') === 'flat-1') {
          return HttpResponse.json({
            items: [
              {
                poolSessionId: 'session-1',
                facilityId: 'pool-1',
                flatId: 'flat-1',
                personType: 'Resident',
                ageCategory: 'Adult',
                accompaniedBySessionId: null,
                entryAtUtc: new Date().toISOString(),
                exitAtUtc: null,
                guestFeeAmount: null,
                safetyAcknowledgedAtUtc: new Date().toISOString(),
                checkedInBy: 'user-1',
                checkedOutBy: null,
                overrideReason: null,
                status: 'CheckedIn',
              },
            ],
            page: 1,
            pageSize: 10,
            total: 1,
          });
        }
        return HttpResponse.json(emptySessions(1));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<PoolAccessPage />, { auth: { user: operatorUser, isInitialized: true } });

    await choosePoolAndResident(user);

    expect(await screen.findByText('Karim Ahmed is currently checked in')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check out/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^check in$/i })).not.toBeInTheDocument();
  });

  it('checks out an already-checked-in resident', async () => {
    let checkOutCalled = false;
    server.use(
      http.get(`${API_BASE}/api/v1/facilities`, () => HttpResponse.json({ items: [pool], page: 1, pageSize: 100, total: 1 })),
      http.get(`${API_BASE}/api/v1/residents`, () => HttpResponse.json({ items: [resident], page: 1, pageSize: 20, total: 1 })),
      http.get(`${API_BASE}/api/v1/swimming-pool/sessions`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('flatId') === 'flat-1') {
          return HttpResponse.json({
            items: [
              {
                poolSessionId: 'session-1',
                facilityId: 'pool-1',
                flatId: 'flat-1',
                personType: 'Resident',
                ageCategory: 'Adult',
                accompaniedBySessionId: null,
                entryAtUtc: new Date().toISOString(),
                exitAtUtc: null,
                guestFeeAmount: null,
                safetyAcknowledgedAtUtc: new Date().toISOString(),
                checkedInBy: 'user-1',
                checkedOutBy: null,
                overrideReason: null,
                status: 'CheckedIn',
              },
            ],
            page: 1,
            pageSize: 10,
            total: 1,
          });
        }
        return HttpResponse.json(emptySessions(1));
      }),
      http.post(`${API_BASE}/api/v1/swimming-pool/sessions/session-1/check-out`, () => {
        checkOutCalled = true;
        return HttpResponse.json({});
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<PoolAccessPage />, { auth: { user: operatorUser, isInitialized: true } });

    await choosePoolAndResident(user);
    await screen.findByText('Karim Ahmed is currently checked in');
    await user.click(screen.getByRole('button', { name: /check out/i }));

    await waitFor(() => expect(checkOutCalled).toBe(true));
  });
});
