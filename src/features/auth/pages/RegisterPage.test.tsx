import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { RegisterPage } from './RegisterPage';

const API_BASE = 'https://localhost:7219';

function mockSuccessfulRegistration() {
  server.use(
    http.get(`${API_BASE}/api/v1/tenants/by-slug/:slug`, ({ params }) =>
      HttpResponse.json({
        tenantId: 'tenant-1',
        name: 'ARP Flat Owners',
        slug: params.slug,
        status: 'Active',
      }),
    ),
    http.post(`${API_BASE}/api/v1/auth/register`, () =>
      HttpResponse.json({
        accessToken: 'fake-access-token',
        accessTokenExpiresAtUtc: new Date().toISOString(),
        user: {
          userId: 'user-1',
          tenantId: 'tenant-1',
          email: 'new.owner@example.com',
          fullName: 'New Owner',
          roles: ['SuperAdmin'],
          permissions: ['role.manage'],
          buildingIds: [],
          buildingPermissions: [],
        },
      }),
    ),
  );
}

describe('RegisterPage', () => {
  it('registers a new user and starts a session on success', async () => {
    mockSuccessfulRegistration();
    const user = userEvent.setup();
    const { store } = renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/organization/i), 'arp-flat-owners');
    await user.type(screen.getByLabelText(/full name/i), 'New Owner');
    await user.type(screen.getByLabelText(/^email$/i), 'new.owner@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Correct-Horse-Battery-9');
    await user.type(screen.getByLabelText(/confirm password/i), 'Correct-Horse-Battery-9');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(store.getState().auth.user?.email).toBe('new.owner@example.com');
    });
  });

  it('shows a field error when the email is already registered', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/tenants/by-slug/:slug`, ({ params }) =>
        HttpResponse.json({
          tenantId: 'tenant-1',
          name: 'ARP Flat Owners',
          slug: params.slug,
          status: 'Active',
        }),
      ),
      http.post(`${API_BASE}/api/v1/auth/register`, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, detail: 'Email already exists.' },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/organization/i), 'arp-flat-owners');
    await user.type(screen.getByLabelText(/full name/i), 'New Owner');
    await user.type(screen.getByLabelText(/^email$/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Correct-Horse-Battery-9');
    await user.type(screen.getByLabelText(/confirm password/i), 'Correct-Horse-Battery-9');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });
});
