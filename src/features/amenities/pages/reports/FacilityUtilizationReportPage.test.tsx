import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { FacilityUtilizationReportPage } from './FacilityUtilizationReportPage';

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

describe('FacilityUtilizationReportPage', () => {
  it('renders server-computed utilization counts without recalculating them', async () => {
    const receivedRangeRef: { current: { fromDate: string | null; toDate: string | null } | null } = { current: null };
    server.use(
      http.get(`${API_BASE}/api/v1/reports/facilities/utilization`, ({ request }) => {
        const url = new URL(request.url);
        receivedRangeRef.current = { fromDate: url.searchParams.get('fromDate'), toDate: url.searchParams.get('toDate') };
        return HttpResponse.json([
          { facilityId: 'fac-1', facilityName: 'Main Hall', totalBookings: 12, completedBookings: 9, cancelledBookings: 2, noShowBookings: 1 },
        ]);
      }),
      http.get(`${API_BASE}/api/v1/facilities`, () => HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 })),
    );

    renderWithProviders(<FacilityUtilizationReportPage />, { auth: { user: viewerUser, isInitialized: true } });

    await waitFor(() => expect(receivedRangeRef.current).not.toBeNull());
    expect(receivedRangeRef.current?.fromDate).toBeTruthy();
    expect(receivedRangeRef.current?.toDate).toBeTruthy();

    expect(await screen.findByText('Main Hall')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('shows an empty state when there is no activity in the selected period', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/reports/facilities/utilization`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/v1/facilities`, () => HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 })),
    );

    renderWithProviders(<FacilityUtilizationReportPage />, { auth: { user: viewerUser, isInitialized: true } });

    expect(await screen.findByText('No bookings in this period')).toBeInTheDocument();
  });
});
