import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { FlatOwnerListPage } from './FlatOwnerListPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  tenantId: 'tenant-1',
  roles: ['SuperAdmin'],
  permissions: ['ownership.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

const viewOnlyUser: AuthUser = { ...adminUser, permissions: [] };

const baseOwners = [
  {
    flatOwnershipId: 'own-1', residentId: 'resident-1', ownerFullName: 'Jane Owner', ownerEmail: 'jane.owner@example.com',
    ownerPhone: '01700000000', flatId: 'flat-1', flatNumber: 'A-101', buildingId: 'b-1', buildingName: 'Tower A',
    status: 'Active', startDate: '2026-01-01', endDate: null,
  },
];

function setUpMocks() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/flat-ownerships`, () =>
      HttpResponse.json({ items: baseOwners, page: 1, pageSize: 10, total: baseOwners.length }),
    ),
    http.delete(`${API_BASE}/api/v1/properties/flat-ownerships/:id`, () => new HttpResponse(null, { status: 204 })),
    http.get(`${API_BASE}/api/v1/properties/owners/:residentId/ownerships`, () =>
      HttpResponse.json([
        { flatOwnershipId: 'own-1', flatId: 'flat-1', flatNumber: 'A-101', buildingId: 'b-1', buildingName: 'Tower A', status: 'Active', startDate: '2026-01-01', endDate: null },
      ]),
    ),
    http.put(`${API_BASE}/api/v1/residents/:id`, () =>
      HttpResponse.json({
        residentId: 'resident-1', flatId: 'flat-1', fullName: 'Jane Owner Updated', phone: '01700000000',
        email: 'jane.owner@example.com', residentType: 'Owner', alternatePhone: null,
        nationalIdNumberMasked: '****3210', passportNumberMasked: null, dateOfBirth: null, gender: null,
        presentAddress: null, permanentAddress: null, fatherName: null, motherName: null, maritalStatus: null,
        profession: null, employer: null, officeAddress: null, emergencyContactName: null,
        emergencyContactPhone: null, bloodGroup: null, religion: null, nationality: null,
      }),
    ),
  );
}

describe('FlatOwnerListPage', () => {
  it('renders the ownership register', async () => {
    setUpMocks();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    expect(await screen.findByText('Jane Owner')).toBeInTheDocument();
    expect(screen.getByText('A-101 — Tower A')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('hides Add Owner and End ownership for a user without ownership.manage', async () => {
    setUpMocks();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    expect(screen.queryByRole('link', { name: /add owner/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /end ownership/i })).not.toBeInTheDocument();
  });

  it('links Add Owner to the registration wizard', async () => {
    setUpMocks();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    const addOwnerLink = screen.getByRole('link', { name: /add owner/i });
    expect(addOwnerLink).toHaveAttribute('href', '/residents/flat-owners/new');
  });

  it('opens the owner detail dialog showing every flat they own', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    await user.click(screen.getByText('Jane Owner'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('jane.owner@example.com')).toBeInTheDocument();
    expect(await within(dialog).findByText(/A-101 — Tower A/)).toBeInTheDocument();
  });

  it('edits the owner profile from the detail dialog, sending only name/phone/email', async () => {
    setUpMocks();
    let requestBody: unknown;
    server.use(
      http.put(`${API_BASE}/api/v1/residents/:id`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({
          residentId: 'resident-1', flatId: 'flat-1', fullName: 'Jane Owner Updated', phone: '01700000000',
          email: 'jane.owner@example.com', residentType: 'Owner', alternatePhone: null,
          nationalIdNumberMasked: '****3210', passportNumberMasked: null, dateOfBirth: null, gender: null,
          presentAddress: null, permanentAddress: null, fatherName: null, motherName: null, maritalStatus: null,
          profession: null, employer: null, officeAddress: null, emergencyContactName: null,
          emergencyContactPhone: null, bloodGroup: null, religion: null, nationality: null,
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    await user.click(screen.getByText('Jane Owner'));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /edit profile/i }));
    await user.clear(within(dialog).getByLabelText('Full name'));
    await user.type(within(dialog).getByLabelText('Full name'), 'Jane Owner Updated');
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(within(dialog).queryByLabelText('Full name')).not.toBeInTheDocument();
    });
    // This lightweight editor must never submit the full-profile fields (address, profession, etc.)
    // it doesn't show — that's exactly what caused the 400 this test guards against.
    expect(requestBody).toEqual({ fullName: 'Jane Owner Updated', phone: '01700000000', email: 'jane.owner@example.com' });
  });

  it('refreshes the Ownership Register list and the open dialog after a successful edit, with no page reload', async () => {
    let updated = false;
    server.use(
      http.get(`${API_BASE}/api/v1/properties/flat-ownerships`, () =>
        HttpResponse.json({
          items: updated ? [{ ...baseOwners[0], ownerFullName: 'Jane Owner Updated' }] : baseOwners,
          page: 1,
          pageSize: 10,
          total: baseOwners.length,
        }),
      ),
      http.put(`${API_BASE}/api/v1/residents/:id`, () => {
        updated = true;
        return HttpResponse.json({
          residentId: 'resident-1', flatId: 'flat-1', fullName: 'Jane Owner Updated', phone: '01700000000',
          email: 'jane.owner@example.com', residentType: 'Owner', alternatePhone: null,
          nationalIdNumberMasked: '****3210', passportNumberMasked: null, dateOfBirth: null, gender: null,
          presentAddress: null, permanentAddress: null, fatherName: null, motherName: null, maritalStatus: null,
          profession: null, employer: null, officeAddress: null, emergencyContactName: null,
          emergencyContactPhone: null, bloodGroup: null, religion: null, nationality: null,
        });
      }),
      http.get(`${API_BASE}/api/v1/properties/owners/resident-1/ownerships`, () =>
        HttpResponse.json([
          { flatOwnershipId: 'own-1', flatId: 'flat-1', flatNumber: 'A-101', buildingId: 'b-1', buildingName: 'Tower A', status: 'Active', startDate: '2026-01-01', endDate: null },
        ]),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    await user.click(screen.getByText('Jane Owner'));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /edit profile/i }));
    await user.clear(within(dialog).getByLabelText('Full name'));
    await user.type(within(dialog).getByLabelText('Full name'), 'Jane Owner Updated');
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

    // The still-open dialog reflects the new name (it derives from the refetched list, not a stale
    // snapshot captured when the row was first clicked).
    expect(await within(dialog).findByText('Jane Owner Updated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));

    // The background Ownership Register table shows the new name too — no manual refresh needed, and
    // the old name is gone (not just a duplicate row).
    expect(await screen.findByText('Jane Owner Updated')).toBeInTheDocument();
    expect(screen.queryByText('Jane Owner')).not.toBeInTheDocument();
  });

  it('links Edit full profile to the wizard in edit mode', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    await user.click(screen.getByText('Jane Owner'));

    const dialog = await screen.findByRole('dialog');
    const editFullProfileLink = await within(dialog).findByRole('link', { name: /edit full profile/i });
    expect(editFullProfileLink).toHaveAttribute('href', '/residents/flat-owners/resident-1/edit');
  });

  it('disables Grant ownership and explains why when the selected flat is already actively owned', async () => {
    setUpMocks();
    server.use(
      http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
        HttpResponse.json({ items: [{ buildingId: 'b-1', name: 'Tower A', code: 'TA' }], page: 1, pageSize: 100, total: 1 }),
      ),
      http.get(`${API_BASE}/api/v1/properties/buildings/b-1/flats`, () =>
        HttpResponse.json({
          items: [{ flatId: 'flat-1', buildingId: 'b-1', flatNumber: 'A-101', floorNumber: 1, flatType: 'Residential', areaSqFt: null }],
          page: 1,
          pageSize: 100,
          total: 1,
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    await user.click(screen.getByText('Jane Owner'));

    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText(/A-101 — Tower A/);
    await user.click(within(dialog).getByRole('button', { name: /add flat/i }));

    await user.click((await within(dialog).findByText('Select a building')).closest('button')!);
    await user.click(await screen.findByRole('option', { name: 'Tower A (TA)' }));
    await user.click((await within(dialog).findByText('Select a flat')).closest('button')!);
    await user.click(await screen.findByRole('option', { name: 'A-101' }));

    expect(
      await within(dialog).findByText('This owner already has active ownership of this flat.'),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /grant ownership/i })).not.toBeInTheDocument();
  });

  it('ends an active ownership with a confirmation and an end date', async () => {
    setUpMocks();
    const user = userEvent.setup();
    renderWithProviders(<FlatOwnerListPage />, { auth: { user: adminUser, isInitialized: true } });

    await screen.findByText('Jane Owner');
    await user.click(screen.getByRole('button', { name: /actions for jane owner/i }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: /end ownership/i }));

    const alert = await screen.findByRole('alertdialog');
    expect(within(alert).getByText(/end this ownership\?/i)).toBeInTheDocument();

    await user.click(within(alert).getByRole('button', { name: /^end ownership$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
