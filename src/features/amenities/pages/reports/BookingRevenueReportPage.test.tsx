import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { BookingRevenueReportPage } from './BookingRevenueReportPage';

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

describe('BookingRevenueReportPage', () => {
  it('renders server-computed revenue figures using the shared MoneyDisplay formatting', async () => {
    let requested = false;
    server.use(
      http.get(`${API_BASE}/api/v1/reports/facilities/booking-revenue`, () => {
        requested = true;
        return HttpResponse.json([
          { facilityId: 'fac-1', facilityName: 'Main Hall', totalBookingCharges: 15000, totalDepositsForfeited: 1000, billableBookingCount: 30 },
        ]);
      }),
    );

    renderWithProviders(<BookingRevenueReportPage />, { auth: { user: viewerUser, isInitialized: true } });

    await waitFor(() => expect(requested).toBe(true));
    expect(await screen.findByText('Main Hall')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText(/15,000/)).toBeInTheDocument();
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
  });

  it('shows an error state with retry when the report fails to load', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/reports/facilities/booking-revenue`, () =>
        HttpResponse.json({ status: 500, title: 'Server error' }, { status: 500 }),
      ),
    );

    renderWithProviders(<BookingRevenueReportPage />, { auth: { user: viewerUser, isInitialized: true } });

    expect(await screen.findByText(/failed to load the booking revenue report/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
