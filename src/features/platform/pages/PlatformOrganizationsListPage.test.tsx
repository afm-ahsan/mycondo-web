import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { PlatformAuthUser } from '@/store/slices/platformAuthSlice';
import { PlatformOrganizationsListPage } from './PlatformOrganizationsListPage';

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

function mockList(organizations = [organization()]) {
  server.use(
    http.get(`${API_BASE}/api/v1/platform/organizations`, () =>
      HttpResponse.json({ items: organizations, page: 1, pageSize: 10, total: organizations.length }),
    ),
  );
}

describe('PlatformOrganizationsListPage', () => {
  it('renders the organization list', async () => {
    mockList();
    renderWithProviders(<PlatformOrganizationsListPage />, { platformAuth: { user: superAdmin, isInitialized: true } });

    expect(await screen.findByText('Akter Residence Park')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /new organization/i })).toBeInTheDocument();
  });

  it('suspends an active organization after confirmation', async () => {
    mockList();
    let suspendCalled = false;
    server.use(
      http.post(`${API_BASE}/api/v1/platform/organizations/tenant-1/suspend`, () => {
        suspendCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<PlatformOrganizationsListPage />, { platformAuth: { user: superAdmin, isInitialized: true } });

    await screen.findByText('Akter Residence Park');
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Suspend' }));
    await user.click(await screen.findByRole('button', { name: 'Suspend' }));

    await waitFor(() => expect(suspendCalled).toBe(true));
  });

  it('hides the New Organization action without platform.organization.create', async () => {
    mockList();
    const readOnlyAdmin: PlatformAuthUser = { ...superAdmin, permissions: ['platform.organization.read'] };
    renderWithProviders(<PlatformOrganizationsListPage />, { platformAuth: { user: readOnlyAdmin, isInitialized: true } });

    await screen.findByText('Akter Residence Park');
    expect(screen.queryByRole('link', { name: /new organization/i })).not.toBeInTheDocument();
  });
});
