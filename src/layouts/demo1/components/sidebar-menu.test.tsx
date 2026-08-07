import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { SidebarMenu } from './sidebar-menu';

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

// "Facilities" renders twice when the group is visible — once as the `{ heading: 'Facilities' }`
// section label, once as the group's own accordion trigger title (same MENU_SIDEBAR shape as the
// pre-existing "Security & Access" group) — so this counts occurrences rather than using getByText,
// which throws on more than one match.
function facilitiesCount() {
  return screen.queryAllByText('Facilities').length;
}

// Nested accordion sub-content unmounts from the DOM while collapsed (Radix's Presence behavior, not
// a bug) — only the top-level trigger's own label is always rendered. Expanding is required before a
// second-level item like "Community Hall"/"Swimming Pool" can be found at all.
async function expandGroup(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name }));
}

describe('SidebarMenu — Facilities group (Slice G)', () => {
  it('shows the full Facilities tree when the user holds every relevant permission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SidebarMenu />, {
      auth: {
        user: makeUser(['facility.booking.view', 'facility.booking.create', 'pool.checkin', 'pool.view', 'facility.manage']),
        isInitialized: true,
      },
    });

    expect(facilitiesCount()).toBe(2);

    await expandGroup(user, 'Facilities');
    expect(screen.getByText('Community Hall')).toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();

    await expandGroup(user, 'Community Hall');
    expect(screen.getByText('Booking Calendar')).toBeInTheDocument();
    expect(screen.getByText('Booking List')).toBeInTheDocument();
    expect(screen.getByText('New Booking')).toBeInTheDocument();

    await expandGroup(user, 'Swimming Pool');
    expect(screen.getByText('Pool Access')).toBeInTheDocument();
    expect(screen.getByText('Current Users')).toBeInTheDocument();
    expect(screen.getByText('Usage History')).toBeInTheDocument();
    expect(screen.getByText('Closures / Settings')).toBeInTheDocument();
  });

  it('hides individual items the user lacks permission for, but keeps the group when siblings remain visible', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SidebarMenu />, {
      // Holds facility.booking.view (Booking Calendar + Booking List) but not facility.booking.create
      // (New Booking) or anything pool-related.
      auth: { user: makeUser(['facility.booking.view']), isInitialized: true },
    });

    expect(facilitiesCount()).toBe(2);

    await expandGroup(user, 'Facilities');
    expect(screen.getByText('Community Hall')).toBeInTheDocument();
    expect(screen.queryByText('Swimming Pool')).not.toBeInTheDocument();

    await expandGroup(user, 'Community Hall');
    expect(screen.getByText('Booking Calendar')).toBeInTheDocument();
    expect(screen.getByText('Booking List')).toBeInTheDocument();
    expect(screen.queryByText('New Booking')).not.toBeInTheDocument();
  });

  it('hides the entire Facilities group (and its "Facilities" heading) when the user holds none of its permissions', () => {
    renderWithProviders(<SidebarMenu />, {
      auth: { user: makeUser(['visitor.view']), isInitialized: true },
    });

    expect(facilitiesCount()).toBe(0);
    // A different, unrelated group still renders — proves this isn't a global "hide everything" bug.
    expect(screen.getAllByText('Security & Access').length).toBeGreaterThan(0);
  });

  it('shows only the Swimming Pool branch when the user holds only pool permissions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SidebarMenu />, {
      auth: { user: makeUser(['pool.checkin', 'pool.view']), isInitialized: true },
    });

    expect(facilitiesCount()).toBe(2);

    await expandGroup(user, 'Facilities');
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    expect(screen.queryByText('Community Hall')).not.toBeInTheDocument();

    await expandGroup(user, 'Swimming Pool');
    expect(screen.getByText('Pool Access')).toBeInTheDocument();
    expect(screen.getByText('Current Users')).toBeInTheDocument();
    expect(screen.getByText('Usage History')).toBeInTheDocument();
    expect(screen.queryByText('Closures / Settings')).not.toBeInTheDocument();
  });
});

function operationsCount() {
  return screen.queryAllByText('Operations').length;
}

describe('SidebarMenu — Operations group (Slice H)', () => {
  it('shows the full Operations tree when the user holds every relevant permission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SidebarMenu />, {
      auth: {
        user: makeUser([
          'generator.operation.manage',
          'generator.fuel.manage',
          'generator.maintenance.manage',
          'generator.report',
          'gascylinder.purchase.manage',
          'gascylinder.stock.manage',
          'gascylinder.report',
        ]),
        isInitialized: true,
      },
    });

    expect(operationsCount()).toBe(2);

    await expandGroup(user, 'Operations');
    expect(screen.getByText('Generator')).toBeInTheDocument();
    expect(screen.getByText('Gas Cylinders')).toBeInTheDocument();

    await expandGroup(user, 'Generator');
    expect(screen.getByText('Operation Log')).toBeInTheDocument();
    expect(screen.getByText('Fuel Log')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();

    await expandGroup(user, 'Gas Cylinders');
    expect(screen.getByText('Purchases')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Consumption')).toBeInTheDocument();
    expect(screen.getByText('Supplier Comparison')).toBeInTheDocument();
  });

  it('hides the Generator branch but keeps Gas Cylinders when the user holds only gas-cylinder permissions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SidebarMenu />, {
      auth: { user: makeUser(['gascylinder.purchase.manage', 'gascylinder.report']), isInitialized: true },
    });

    expect(operationsCount()).toBe(2);

    await expandGroup(user, 'Operations');
    expect(screen.queryByText('Generator')).not.toBeInTheDocument();
    expect(screen.getByText('Gas Cylinders')).toBeInTheDocument();
  });

  it('hides the entire Operations group when the user holds none of its permissions', () => {
    renderWithProviders(<SidebarMenu />, {
      auth: { user: makeUser(['visitor.view']), isInitialized: true },
    });

    expect(operationsCount()).toBe(0);
  });
});
