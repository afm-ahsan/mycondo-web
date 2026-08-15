import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { MyProfilePage } from './MyProfilePage';

const API_BASE = 'https://localhost:7219';

const authUser: AuthUser = {
  id: 'user-1',
  email: 'jane@example.com',
  name: 'Jane Doe',
  tenantId: 'tenant-1',
  roles: ['ResidentOwner'],
  permissions: [],
  buildingIds: [],
  buildingPermissions: [],
  avatarUrl: null,
};

const baseProfile = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'jane@example.com',
  fullName: 'Jane Doe',
  phoneNumber: '01700000000',
  createdAtUtc: '2026-01-01T00:00:00Z',
  lastLoginAtUtc: null,
  roles: ['ResidentOwner'],
  permissions: [],
  avatarUrl: null as string | null,
};

function setUpProfileMock(overrides: Partial<typeof baseProfile> = {}) {
  const profile = { ...baseProfile, ...overrides };
  server.use(http.get(`${API_BASE}/api/v1/auth/me`, () => HttpResponse.json(profile)));
  return profile;
}

function renderPage(preloadedUser: AuthUser = authUser) {
  return renderWithProviders(<MyProfilePage />, { auth: { user: preloadedUser, isInitialized: true } });
}

describe('MyProfilePage', () => {
  it('loads and displays the current profile', async () => {
    setUpProfileMock();
    renderPage();

    expect(await screen.findByDisplayValue('Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('01700000000')).toBeInTheDocument();
  });

  it('disables Save Changes until the form is dirty, then submits the update', async () => {
    setUpProfileMock();
    let capturedBody: unknown;
    server.use(
      http.put(`${API_BASE}/api/v1/auth/me`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...baseProfile, fullName: 'Jane Renamed' });
      }),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByDisplayValue('Jane Doe');
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();

    const nameInput = screen.getByLabelText('Full Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Renamed');
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    await waitFor(() => {
      expect(capturedBody).toMatchObject({ fullName: 'Jane Renamed', phoneNumber: '01700000000' });
    });
    // A successful save resets the form to the new values, so Save Changes goes back to disabled.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
    });
  });

  it('maps a validation error from the server onto the Full Name field', async () => {
    setUpProfileMock();
    server.use(
      http.put(
        `${API_BASE}/api/v1/auth/me`,
        () =>
          HttpResponse.json(
            { title: 'Validation failed', status: 400, errors: { FullName: ['Full name is required.'] } },
            { status: 400 },
          ),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    const nameInput = await screen.findByLabelText('Full Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'X');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();
  });

  it('uploads a selected avatar and shows Remove Photo afterward with no confirmation dialog', async () => {
    // Stateful mock: the real app relies on cache-tag invalidation causing GET /me to refetch after
    // the upload, so the mocked GET handler must reflect the mocked POST's effect, not a fixed value.
    let currentProfile = { ...baseProfile };
    server.use(
      http.get(`${API_BASE}/api/v1/auth/me`, () => HttpResponse.json(currentProfile)),
      http.post(`${API_BASE}/api/v1/auth/me/avatar`, () => {
        currentProfile = { ...currentProfile, avatarUrl: '/api/v1/auth/me/avatar' };
        return HttpResponse.json(currentProfile);
      }),
      http.get(`${API_BASE}/api/v1/auth/me/avatar`, () => new HttpResponse('fake-bytes', { headers: { 'Content-Type': 'image/png' } })),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByDisplayValue('Jane Doe');
    expect(screen.queryByRole('button', { name: /remove photo/i })).not.toBeInTheDocument();

    const file = new File(['fake-bytes'], 'avatar.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Choose a new profile photo');
    await user.upload(fileInput, file);

    expect(await screen.findByRole('button', { name: /remove photo/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('removes the avatar without showing a confirmation dialog', async () => {
    let currentProfile: typeof baseProfile = { ...baseProfile, avatarUrl: '/api/v1/auth/me/avatar' };
    server.use(
      http.get(`${API_BASE}/api/v1/auth/me`, () => HttpResponse.json(currentProfile)),
      http.get(`${API_BASE}/api/v1/auth/me/avatar`, () => new HttpResponse('fake-bytes', { headers: { 'Content-Type': 'image/png' } })),
      http.delete(`${API_BASE}/api/v1/auth/me/avatar`, () => {
        currentProfile = { ...currentProfile, avatarUrl: null };
        return HttpResponse.json(currentProfile);
      }),
    );
    const user = userEvent.setup();
    renderPage();

    const removeButton = await screen.findByRole('button', { name: /remove photo/i });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /remove photo/i })).not.toBeInTheDocument();
    });
  });

  it('blocks submission client-side when the new password confirmation does not match', async () => {
    setUpProfileMock();
    const user = userEvent.setup();
    renderPage();

    await screen.findByDisplayValue('Jane Doe');
    await user.type(screen.getByLabelText('Current Password'), 'Correct-Horse-Battery-9');
    await user.type(screen.getByLabelText('New Password'), 'Even-Better-Horse-9');
    await user.type(screen.getByLabelText('Confirm New Password'), 'Different-Horse-9');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('shows a field error when the current password is incorrect', async () => {
    setUpProfileMock();
    server.use(
      http.post(
        `${API_BASE}/api/v1/auth/change-password`,
        () => HttpResponse.json({ title: 'Forbidden', status: 403, detail: 'Current password is incorrect.' }, { status: 403 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByDisplayValue('Jane Doe');
    await user.type(screen.getByLabelText('Current Password'), 'Wrong-Password-9');
    await user.type(screen.getByLabelText('New Password'), 'Even-Better-Horse-9');
    await user.type(screen.getByLabelText('Confirm New Password'), 'Even-Better-Horse-9');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    expect(await screen.findByText('Current password is incorrect.')).toBeInTheDocument();
  });
});
