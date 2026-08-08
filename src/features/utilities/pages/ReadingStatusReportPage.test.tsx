import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ReadingStatusReportPage } from './ReadingStatusReportPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Utility Admin',
  tenantId: 'tenant-1',
  roles: ['UtilityAdmin'],
  permissions: ['utility.reading.view'],
  buildingIds: [],
  buildingPermissions: [],
};

function mockBuildingsAndMeters() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({
        items: [{ buildingId: 'bld-1', name: 'Tower A', code: 'A', address: null }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
    http.get(`${API_BASE}/api/v1/meters`, () =>
      HttpResponse.json({
        items: [{ meterId: 'meter-1', buildingId: 'bld-1', utilityType: 'Electricity', meterNumber: 'ELEC-001', status: 'Active', replacesMeterId: null }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
  );
}

const READING_TOTALS_BY_STATUS: Record<string, number> = {
  Draft: 2,
  Reviewed: 1,
  Finalized: 1,
  Billed: 5,
  Corrected: 0,
};

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('ReadingStatusReportPage', () => {
  it('derives Unbilled as the exact difference between two authoritative server totals, and shows the per-status breakdown', async () => {
    mockBuildingsAndMeters();
    server.use(
      http.get(`${API_BASE}/api/v1/readings`, ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        const total = status ? (READING_TOTALS_BY_STATUS[status] ?? 0) : 9;
        return HttpResponse.json({ items: [], page: 1, pageSize: 1, total });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ReadingStatusReportPage utilityType="Electricity" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select a meter', 'ELEC-001 (Active)');

    await waitFor(() => expect(screen.getByText('9')).toBeInTheDocument()); // Total
    expect(screen.getByText('5')).toBeInTheDocument(); // Billed
    expect(screen.getByText('4')).toBeInTheDocument(); // Unbilled = 9 - 5
  }, 15000);
});
