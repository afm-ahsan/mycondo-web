import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { UsersPage } from './UsersPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['user.view', 'user.create', 'user.update', 'user.disable', 'role.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...adminUser, permissions: ['user.view'] };

const baseUsers = [
  { userId: 'user-1', email: 'jane@example.com', fullName: 'Jane Doe', phoneNumber: '+8801000000000', isActive: true, lastLoginAtUtc: null, createdAtUtc: '2026-01-01T00:00:00Z', roleNames: ['BuildingAdmin'] },
  { userId: 'user-2', email: 'john@example.com', fullName: 'John Roe', phoneNumber: null, isActive: false, lastLoginAtUtc: null, createdAtUtc: '2026-01-02T00:00:00Z', roleNames: [] },
];

function setUpMocks(usersOverride = baseUsers) {
  server.use(
    http.get(`${API_BASE}/api/v1/users`, ({ request }) => {
      const url = new URL(request.url);
      const searchText = url.searchParams.get('searchText')?.toLowerCase();
      const isActiveParam = url.searchParams.get('isActive');

      let items = usersOverride;
      if (searchText) {
        items = items.filter(
          (u) => u.fullName.toLowerCase().includes(searchText) || u.email.toLowerCase().includes(searchText),
        );
      }
      if (isActiveParam !== null) {
        items = items.filter((u) => u.isActive === (isActiveParam === 'true'));
      }

      return HttpResponse.json({ items, page: 1, pageSize: 10, total: items.length });
    }),
    http.get(`${API_BASE}/api/v1/roles`, () => HttpResponse.json([])),
    http.post(`${API_BASE}/api/v1/users/:id/disable`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${API_BASE}/api/v1/users/:id/enable`, () => new HttpResponse(null, { status: 204 })),
  );
}

/** DataGrid renders a desktop `<table>` and a `md:hidden` mobile card list at the same time — jsdom
 * doesn't evaluate the CSS that hides one of them, so text like a user's name always matches twice.
 * This resolves to the `<tr>` (desktop table) match specifically, where the row-action tests need it. */
function getTableRowByText(text: string): HTMLElement {
  const matches = screen.getAllByText(text);
  const row = matches.map((el) => el.closest('tr')).find((el): el is HTMLTableRowElement => el !== null);
  if (!row) throw new Error(`No table row found containing text "${text}"`);
  return row;
}

describe('UsersPage', () => {
  it('renders the user list', async () => {
    setUpMocks();
    renderWithProviders(<UsersPage />, { auth: { user: adminUser, isInitialized: true } });

    expect((await screen.findAllByText('Jane Doe')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('John Roe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Disabled').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BuildingAdmin').length).toBeGreaterThan(0);
  });

  it('filters the list by search text', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findAllByText('Jane Doe');

    const searchBox = screen.getByPlaceholderText('Search by name or email…');
    await user.type(searchBox, 'jane');

    await waitFor(() => {
      expect(screen.queryByText('John Roe')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
  });

  it('hides the Add User action for a user without user.create', async () => {
    setUpMocks();
    renderWithProviders(<UsersPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findAllByText('Jane Doe');
    expect(screen.queryByRole('button', { name: /add user/i })).not.toBeInTheDocument();
  });

  it('disables an active user through the row action menu with confirmation', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findAllByText('Jane Doe');

    const row = getTableRowByText('Jane Doe');
    await user.click(within(row).getByRole('button', { name: /actions for jane doe/i }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Disable' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/disable this user\?/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Disable' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('creates a user with a mandatory password and status, defaulting status to Active', async () => {
    setUpMocks();
    let capturedBody: unknown;
    server.use(
      http.post(`${API_BASE}/api/v1/users`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ userId: 'user-new' });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findAllByText('Jane Doe');

    await user.click(screen.getByRole('button', { name: /add user/i }));
    // Required fields render a trailing " *" in the label's accessible text (FormItem `required`),
    // so exact-string label matches fail here — use anchored regexes instead.
    await user.type(await screen.findByLabelText(/^full name/i), 'New Person');
    await user.type(screen.getByLabelText(/^email/i), 'new.person@example.com');
    await user.type(screen.getByLabelText(/^mobile/i), '01711000000');
    // { selector: 'input' } excludes the PasswordPolicyInfo trigger, whose aria-label ("Password
    // requirements") also starts with "Password" and would otherwise make this match ambiguous.
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'Str0ngPassw0rd!');
    await user.type(screen.getByLabelText(/^confirm password/i), 'Str0ngPassw0rd!');

    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(capturedBody).toMatchObject({
      fullName: 'New Person',
      email: 'new.person@example.com',
      phoneNumber: '+8801711000000',
      password: 'Str0ngPassw0rd!',
      isActive: true,
    });
  });

  it('rejects Add User submission when Confirm password does not match', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findAllByText('Jane Doe');

    await user.click(screen.getByRole('button', { name: /add user/i }));
    await user.type(await screen.findByLabelText(/^full name/i), 'New Person');
    await user.type(screen.getByLabelText(/^email/i), 'new.person@example.com');
    await user.type(screen.getByLabelText(/^mobile/i), '01711000000');
    // { selector: 'input' } excludes the PasswordPolicyInfo trigger, whose aria-label ("Password
    // requirements") also starts with "Password" and would otherwise make this match ambiguous.
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'Str0ngPassw0rd!');
    await user.type(screen.getByLabelText(/^confirm password/i), 'Different1!');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });

  it("edits a user's full name and mobile number", async () => {
    setUpMocks();
    server.use(
      http.get(`${API_BASE}/api/v1/users/user-1`, () =>
        HttpResponse.json({
          userId: 'user-1', email: 'jane@example.com', fullName: 'Jane Doe', phoneNumber: '+8801000000000',
          isActive: true, emailConfirmed: true, lastLoginAtUtc: null, createdAtUtc: '2026-01-01T00:00:00Z', updatedAtUtc: null,
        }),
      ),
      http.put(`${API_BASE}/api/v1/users/user-1`, () => new HttpResponse(null, { status: 204 })),
    );
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findAllByText('Jane Doe');
    const row = getTableRowByText('Jane Doe');
    await user.click(within(row).getByRole('button', { name: /actions for jane doe/i }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Edit' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

    const nameInput = await screen.findByDisplayValue('Jane Doe');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Updated');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('assigns a role to a user from the Roles / Permissions action', async () => {
    setUpMocks();
    server.use(
      http.get(`${API_BASE}/api/v1/roles`, () =>
        HttpResponse.json([
          { roleId: 'role-1', name: 'BuildingAdmin', description: '', isSystem: false, code: null, requiresBuildingScope: null },
        ]),
      ),
      http.get(`${API_BASE}/api/v1/users/user-1/roles`, () => HttpResponse.json([])),
      http.post(`${API_BASE}/api/v1/roles/role-1/assignments`, () => new HttpResponse(null, { status: 204 })),
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findAllByText('Jane Doe');
    const row = getTableRowByText('Jane Doe');
    await user.click(within(row).getByRole('button', { name: /actions for jane doe/i }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Roles / Permissions' }));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

    await screen.findByText('No roles assigned yet.');
    // The SelectValue span has `pointer-events: none` by design (shadcn Select) so the trigger
    // <button> gets the click, not the text span itself.
    await user.click(screen.getByText('Select a role').closest('button')!);
    await user.click(await screen.findByRole('option', { name: 'BuildingAdmin' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /^assign$/i })).not.toBeDisabled());
    await user.click(screen.getByRole('button', { name: /^assign$/i }));

    // A successful assign resets the picker (clearing selectedRoleId), which re-disables Assign —
    // that reset, rather than an enabled button, is what proves the mutation actually completed.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^assign$/i })).toBeDisabled();
    });
  });
});
