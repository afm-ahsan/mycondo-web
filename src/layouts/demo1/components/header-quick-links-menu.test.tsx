import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { HeaderQuickLinksMenu } from './header-quick-links-menu';

function makeUser(permissions: string[]): AuthUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    tenantId: 'tenant-1',
    roles: [],
    permissions,
    buildingIds: [],
    buildingPermissions: [],
  };
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Quick links' }));
}

describe('HeaderQuickLinksMenu', () => {
  it('shows only the links the user has permission for, as full-card links to the right route', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderQuickLinksMenu />, {
      auth: { user: makeUser(['visitor.create', 'payment.record']), isInitialized: true },
    });
    await openMenu(user);

    const newGuest = screen.getByRole('menuitem', { name: /New Guest/ });
    expect(newGuest.tagName).toBe('A');
    expect(newGuest).toHaveAttribute('href', '/security/guests/new');
    expect(newGuest).toHaveTextContent('Register visitor');

    expect(screen.getByRole('menuitem', { name: /Record Payment/ })).toHaveAttribute(
      'href',
      '/billing/payments/new',
    );

    expect(screen.queryByRole('menuitem', { name: /Receive Parcel/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /New Tenant/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Facility Booking/ })).not.toBeInTheDocument();
  });

  it('shows every quick link when the user holds every relevant permission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderQuickLinksMenu />, {
      auth: {
        user: makeUser([
          'visitor.create',
          'parcel.receive',
          'payment.record',
          'occupancy-registration.create',
          'facility.booking.create',
        ]),
        isInitialized: true,
      },
    });
    await openMenu(user);

    expect(screen.getAllByRole('menuitem')).toHaveLength(5);
  });

  it('still renders the trigger and shows an empty state, never a broken/placeholder link, when the user holds none of the permissions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderQuickLinksMenu />, {
      auth: { user: makeUser([]), isInitialized: true },
    });

    expect(screen.getByRole('button', { name: 'Quick links' })).toBeInTheDocument();
    await openMenu(user);

    expect(screen.getByText('No quick actions available.')).toBeInTheDocument();
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
  });
});
