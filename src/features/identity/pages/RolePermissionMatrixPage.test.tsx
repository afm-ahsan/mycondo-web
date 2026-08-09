import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { RolePermissionMatrixPage } from './RolePermissionMatrixPage';

const API_BASE = 'https://localhost:7219';

const roleManagerUser: AuthUser = {
  id: 'user-1',
  email: 'owner@example.com',
  name: 'Owner',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['role.manage', 'role.view'],
  buildingIds: [],
  buildingPermissions: [],
};

const permissionCatalogue = [
  { id: 'perm-1', name: 'complaint.view', description: 'View complaints', module: 'complaint', isBuildingScopable: true },
  { id: 'perm-2', name: 'complaint.manage', description: 'Manage complaints', module: 'complaint', isBuildingScopable: true },
];

function setUpMocks() {
  // Grants start empty; the POST handler flips `granted` to true so the refetch after grant reflects
  // the change — this is what actually proves the checkbox is wired to the real mutation+refetch flow,
  // not just rendering static mock data.
  let granted = false;

  server.use(
    http.get(`${API_BASE}/api/v1/roles`, () =>
      HttpResponse.json([
        { roleId: 'role-1', name: 'BuildingAdmin', description: '', isSystem: false, code: null, requiresBuildingScope: null },
      ]),
    ),
    http.get(`${API_BASE}/api/v1/permissions`, () => HttpResponse.json(permissionCatalogue)),
    http.get(`${API_BASE}/api/v1/roles/role-1/permissions`, () =>
      HttpResponse.json(granted ? [permissionCatalogue[1]] : []),
    ),
    http.get(`${API_BASE}/api/v1/roles/role-1/assignments`, () => HttpResponse.json([])),
    http.get(`${API_BASE}/api/v1/users`, () => HttpResponse.json([])),
    http.post(`${API_BASE}/api/v1/roles/role-1/permissions`, () => {
      granted = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );
}

describe('RolePermissionMatrixPage', () => {
  it('grants a permission to a role and reflects it as checked', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<RolePermissionMatrixPage />, { auth: { user: roleManagerUser, isInitialized: true } });

    await user.click(await screen.findByRole('button', { name: /buildingadmin/i }));

    const complaintGroup = await screen.findByText('complaint');
    const panel = complaintGroup.closest('div')!.parentElement!;
    const checkbox = within(panel).getByText('complaint.manage').closest('label')!.querySelector(
      '[role="checkbox"]',
    ) as HTMLElement;

    expect(checkbox).toHaveAttribute('data-state', 'unchecked');

    await user.click(checkbox);

    await waitFor(() => {
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });
  });

  it('shows a Building-scoped badge and picker for a condominium-scoped role, and an Organization-wide badge with no picker otherwise', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/roles`, () =>
        HttpResponse.json([
          { roleId: 'role-condo', name: 'CondoAdmin', description: '', isSystem: true, code: 'condominium.admin', requiresBuildingScope: true },
          { roleId: 'role-org', name: 'OrganizationAdmin', description: '', isSystem: true, code: 'organization.admin', requiresBuildingScope: false },
        ]),
      ),
      http.get(`${API_BASE}/api/v1/permissions`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/v1/roles/:id/permissions`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/v1/roles/:id/assignments`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/v1/users`, () => HttpResponse.json([])),
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<RolePermissionMatrixPage />, { auth: { user: roleManagerUser, isInitialized: true } });

    await user.click(await screen.findByRole('button', { name: /condoadmin/i }));
    expect(await screen.findByText('Building-scoped')).toBeInTheDocument();
    expect(await screen.findByText(/select a building/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^assign$/i })).toBeDisabled();

    await user.click(await screen.findByRole('button', { name: /organizationadmin/i }));
    expect(await screen.findByText('Organization-wide')).toBeInTheDocument();
    expect(screen.queryByText(/select a building/i)).not.toBeInTheDocument();
  });
});
