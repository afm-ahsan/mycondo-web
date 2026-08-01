import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { RolePermissionMatrixPage } from './RolePermissionMatrixPage';

const API_BASE = 'http://localhost:5000';

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
      HttpResponse.json([{ roleId: 'role-1', name: 'BuildingAdmin', description: '', isSystem: false }]),
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
});
