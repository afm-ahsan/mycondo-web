import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ConsumptionSummaryReportPage } from './ConsumptionSummaryReportPage';

const API_BASE = 'https://localhost:7219';

const user: AuthUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['utility.report'],
  buildingIds: [],
  buildingPermissions: [],
};

function mockBuildings() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 }),
    ),
  );
}

describe('ConsumptionSummaryReportPage', () => {
  it('shows Electricity and Gas totals from the tenant-wide consumption-summary aggregate', async () => {
    mockBuildings();
    server.use(
      http.get(`${API_BASE}/api/v1/reports/utilities/consumption-summary`, () =>
        HttpResponse.json([
          { utilityType: 'Electricity', totalConsumptionUnits: 4200, readingCount: 12 },
          { utilityType: 'Gas', totalConsumptionUnits: 800, readingCount: 8 },
        ]),
      ),
    );

    renderWithProviders(<ConsumptionSummaryReportPage />, { auth: { user, isInitialized: true } });

    await waitFor(() => expect(screen.getByText('4200 kWh')).toBeInTheDocument());
    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText('12 finalized/billed readings')).toBeInTheDocument();
    expect(screen.getByText('8 finalized/billed readings')).toBeInTheDocument();
  });

  it('shows a zero state per utility type when no readings exist yet', async () => {
    mockBuildings();
    server.use(
      http.get(`${API_BASE}/api/v1/reports/utilities/consumption-summary`, () => HttpResponse.json([])),
    );

    renderWithProviders(<ConsumptionSummaryReportPage />, { auth: { user, isInitialized: true } });

    await waitFor(() => expect(screen.getAllByText('0 readings')).toHaveLength(2));
  });
});
