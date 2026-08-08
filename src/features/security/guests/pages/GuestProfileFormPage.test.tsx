import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { GuestProfileFormPage } from './GuestProfileFormPage';

const API_BASE = 'https://localhost:7219';

const guardUser: AuthUser = {
  id: 'user-1',
  email: 'guard@example.com',
  name: 'Gate Guard',
  tenantId: 'tenant-1',
  roles: ['SecurityGuard'],
  permissions: ['visitor.create'],
  buildingIds: [],
  buildingPermissions: [],
};

describe('GuestProfileFormPage', () => {
  it('maps a backend validation error onto the matching form field', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/guests`, () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Validation failed',
            errors: { Phone: ['Phone number is already registered to another guest.'] },
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<GuestProfileFormPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByLabelText('Full name'), 'Karim Ahmed');
    await user.type(screen.getByLabelText('Mobile number'), '01711000000');
    await user.click(screen.getByRole('button', { name: /add guest/i }));

    expect(
      await screen.findByText('Phone number is already registered to another guest.'),
    ).toBeInTheDocument();
  });

  it('has no detectable axe violations', async () => {
    const { container } = renderWithProviders(<GuestProfileFormPage />, {
      auth: { user: guardUser, isInitialized: true },
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
