import { useState } from 'react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { GuestFormDialog } from './GuestFormDialog';

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

// Mirrors how a directory page owns the open/close state — needed so a successful submit's
// onOpenChange(false) call actually closes the dialog, the same signal FlatListPage's create-flat
// test asserts on.
function ControlledGuestFormDialog() {
  const [open, setOpen] = useState(true);
  return <GuestFormDialog open={open} onOpenChange={setOpen} />;
}

describe('GuestFormDialog', () => {
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
    renderWithProviders(<ControlledGuestFormDialog />, {
      auth: { user: guardUser, isInitialized: true },
    });

    await user.type(screen.getByLabelText('Full name'), 'Karim Ahmed');
    await user.type(screen.getByLabelText('Mobile number'), '01711000000');
    await user.click(screen.getByRole('button', { name: /add guest/i }));

    expect(
      await screen.findByText('Phone number is already registered to another guest.'),
    ).toBeInTheDocument();
  });

  it('closes the dialog once the guest is created', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/guests`, () =>
        HttpResponse.json({
          guestProfileId: 'guest-1',
          fullName: 'Karim Ahmed',
          phone: '01711000000',
          identityDocumentType: null,
          identityDocumentNumberMasked: null,
          isBlocked: false,
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ControlledGuestFormDialog />, {
      auth: { user: guardUser, isInitialized: true },
    });

    await screen.findByRole('dialog');
    await user.type(screen.getByLabelText('Full name'), 'Karim Ahmed');
    await user.type(screen.getByLabelText('Mobile number'), '01711000000');
    await user.click(screen.getByRole('button', { name: /add guest/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('has no detectable axe violations', async () => {
    const { container } = renderWithProviders(<ControlledGuestFormDialog />, {
      auth: { user: guardUser, isInitialized: true },
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
