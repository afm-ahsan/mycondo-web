import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { PlatformAuthUser } from '@/store/slices/platformAuthSlice';
import { PlatformDashboardPage } from './PlatformDashboardPage';

const API_BASE = 'https://localhost:7219';

const superAdmin: PlatformAuthUser = {
  id: 'platform-user-1',
  email: 'sadmin@mycondo.com',
  displayName: 'Platform SuperAdmin',
  roles: ['SuperAdmin'],
  permissions: [
    'platform.organization.read',
    'platform.organization.create',
    'platform.organization.suspend',
    'platform.organization.activate',
    'platform.organization.reactivate',
  ],
};

function organization(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    tenantId: 'tenant-1',
    name: 'Akter Residence Park',
    code: 'ARP',
    slug: 'arp',
    status: 'Active',
    primaryAdministratorFullName: 'Admin',
    primaryAdministratorEmail: 'admin@mycondo.com',
    createdAtUtc: '2026-08-01T00:00:00Z',
    enabledModuleCount: 5,
    ...overrides,
  };
}

function mockDashboard(organizations = [organization()]) {
  server.use(
    http.get(`${API_BASE}/api/v1/platform/organizations/stats`, () =>
      HttpResponse.json({ total: organizations.length, active: 1, suspended: 0, pendingActivation: 0, recentlyCreated: 1 }),
    ),
    http.get(`${API_BASE}/api/v1/platform/organizations`, () =>
      HttpResponse.json({ items: organizations, page: 1, pageSize: 20, total: organizations.length }),
    ),
  );
}

describe('PlatformDashboardPage', () => {
  it('renders summary stats and recently added organizations', async () => {
    mockDashboard();
    renderWithProviders(<PlatformDashboardPage />, { platformAuth: { user: superAdmin, isInitialized: true } });

    expect(await screen.findByText('Akter Residence Park')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Organization' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all organizations' })).toBeInTheDocument();
  });

  it('hides the New Organization action without platform.organization.create', async () => {
    mockDashboard();
    const readOnlyAdmin: PlatformAuthUser = { ...superAdmin, permissions: ['platform.organization.read'] };
    renderWithProviders(<PlatformDashboardPage />, { platformAuth: { user: readOnlyAdmin, isInitialized: true } });

    await screen.findByText('Akter Residence Park');
    expect(screen.queryByRole('link', { name: 'New Organization' })).not.toBeInTheDocument();
  });
});
