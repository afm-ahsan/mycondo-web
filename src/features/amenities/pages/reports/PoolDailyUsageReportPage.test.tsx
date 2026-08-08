import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { PoolDailyUsageReportPage } from './PoolDailyUsageReportPage';

const API_BASE = 'https://localhost:7219';

const viewerUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Manager',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['report.facility'],
  buildingIds: [],
  buildingPermissions: [],
};

function mockPools() {
  server.use(
    http.get(`${API_BASE}/api/v1/facilities`, () =>
      HttpResponse.json({
        items: [{ facilityId: 'pool-1', buildingId: 'bld-1', name: 'Main Pool', facilityType: 'SwimmingPool', capacity: 50, operatingHoursStart: null, operatingHoursEnd: null, requiresApproval: false, bookingChargeAmount: null, depositAmount: null, cancellationDeadlineHours: 0, cancellationDeductionPercentage: 0, guestFeeAmount: null, minimumAgeUnaccompanied: null, requiresSafetyAcknowledgement: false, blocksEntryIfAccountOverdue: false, isActive: true }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
  );
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('PoolDailyUsageReportPage', () => {
  it('does not fetch until a pool is selected, then shows the server-computed daily counts', async () => {
    mockPools();
    let requested = false;
    server.use(
      http.get(`${API_BASE}/api/v1/reports/facilities/pool-daily-usage`, () => {
        requested = true;
        return HttpResponse.json({
          date: '2026-08-08',
          totalEntries: 24,
          residentEntries: 18,
          guestEntries: 6,
          adultEntries: 20,
          childEntries: 4,
          peakConcurrentOccupancy: 9,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<PoolDailyUsageReportPage />, { auth: { user: viewerUser, isInitialized: true } });

    expect(screen.getByText('No pool selected')).toBeInTheDocument();
    expect(requested).toBe(false);

    await chooseOption(user, 'Select a pool', 'Main Pool');

    await waitFor(() => expect(requested).toBe(true));
    expect(await screen.findByText('24')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });
});
