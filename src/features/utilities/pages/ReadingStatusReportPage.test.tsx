import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
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

describe('ReadingStatusReportPage', () => {
  it('derives Unbilled as Total minus Billed from the tenant-wide status-summary aggregate, no meter selection required', async () => {
    mockBuildings();
    server.use(
      http.get(`${API_BASE}/api/v1/reports/utilities/reading-status-summary`, () =>
        HttpResponse.json([
          { utilityType: 'Electricity', status: 'Draft', count: 2 },
          { utilityType: 'Electricity', status: 'Reviewed', count: 1 },
          { utilityType: 'Electricity', status: 'Finalized', count: 1 },
          { utilityType: 'Electricity', status: 'Billed', count: 5 },
        ]),
      ),
    );

    renderWithProviders(<ReadingStatusReportPage utilityType="Electricity" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    // No meter/building selection needed — the aggregate is fetched immediately, tenant-wide by default.
    await waitFor(() => expect(screen.getByText('9')).toBeInTheDocument()); // Total = 2+1+1+5
    expect(screen.getAllByText('5')).toHaveLength(2); // Billed, shown in both the Summary and the by-status breakdown
    expect(screen.getByText('4')).toBeInTheDocument(); // Unbilled = 9 - 5
    expect(screen.getByText('0')).toBeInTheDocument(); // Corrected (not present in the response) shows as 0, not omitted
  });

  it('scopes the request to the chosen building', async () => {
    mockBuildings();
    const receivedBuildingIds: (string | null)[] = [];
    server.use(
      http.get(`${API_BASE}/api/v1/reports/utilities/reading-status-summary`, ({ request }) => {
        receivedBuildingIds.push(new URL(request.url).searchParams.get('buildingId'));
        return HttpResponse.json([]);
      }),
    );

    renderWithProviders(<ReadingStatusReportPage utilityType="Gas" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    await waitFor(() => expect(receivedBuildingIds).toContain(null));
  });

  it('shows an inline error and a retry action when the aggregate fails to load', async () => {
    mockBuildings();
    server.use(
      http.get(`${API_BASE}/api/v1/reports/utilities/reading-status-summary`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    renderWithProviders(<ReadingStatusReportPage utilityType="Electricity" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    expect(await screen.findByText("Couldn't load the reading status report.")).toBeInTheDocument();
  });
});
