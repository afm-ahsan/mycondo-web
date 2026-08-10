import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LoginPage } from './LoginPage';

const API_BASE = 'https://localhost:7219';

function mockAuthenticatedTenant() {
  server.use(
    http.get(`${API_BASE}/api/v1/tenants/by-slug/:slug`, ({ params }) => {
      const requested = decodeURIComponent(String(params.slug));
      if (requested.trim().toLowerCase() !== 'akter residence park' && requested.trim() !== 'arp') {
        return HttpResponse.json(
          { title: 'Resource not found', status: 404, detail: `Tenant '${requested}' was not found.` },
          { status: 404 },
        );
      }
      return HttpResponse.json({
        tenantId: 'tenant-1',
        name: 'Akter Residence Park',
        slug: 'arp',
        status: 'Active',
      });
    }),
    http.post(`${API_BASE}/api/v1/auth/login`, () =>
      HttpResponse.json({
        accessToken: 'fake-access-token',
        accessTokenExpiresAtUtc: new Date().toISOString(),
        user: {
          userId: 'user-1',
          tenantId: 'tenant-1',
          email: 'admin@mycondo.com',
          fullName: 'ARP Admin',
          roles: ['OrganizationAdmin'],
          permissions: ['role.manage'],
          buildingIds: [],
          buildingPermissions: [],
        },
      }),
    ),
  );
}

describe('LoginPage — organization resolution by display name', () => {
  it('signs in when the Organization field contains the tenant display name (with surrounding whitespace)', async () => {
    mockAuthenticatedTenant();
    const user = userEvent.setup();
    const { store } = renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/organization/i), '  Akter Residence Park  ');
    await user.type(screen.getByLabelText(/^email$/i), 'admin@mycondo.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Admin@1357#');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(store.getState().auth.user?.email).toBe('admin@mycondo.com');
    });
  });

  it('shows "Organization not found" for a genuinely unknown organization', async () => {
    mockAuthenticatedTenant();
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/organization/i), 'Nonexistent Org');
    await user.type(screen.getByLabelText(/^email$/i), 'admin@mycondo.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Admin@1357#');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Organization not found.')).toBeInTheDocument();
  });
});

describe('LoginPage — accessibility smoke', () => {
  it('has no detectable axe violations', async () => {
    const { container } = renderWithProviders(<LoginPage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('LoginPage — password toggle accessible name', () => {
  it('names the toggle by its action and updates the name when toggled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');

    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });
});
