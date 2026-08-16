import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Link, MemoryRouter } from 'react-router-dom';
import { AppSidebarMenu } from './AppSidebarMenu';
import type { MenuConfig } from '@/config/types';

// Mirrors the real Residents group shape: one leaf ('/residents') is a route-prefix of a sibling
// leaf ('/residents/flat-owners'). This is exactly the shape that made both items show active
// together before the fix.
const MENU: MenuConfig = [
  { title: 'Dashboard', path: '/' },
  {
    title: 'Residents',
    children: [
      { title: 'Flat Owners', path: '/residents/flat-owners' },
      { title: 'Resident Directory', path: '/residents' },
    ],
  },
];

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>{<AppSidebarMenu menu={MENU} />}</MemoryRouter> as ReactNode,
  );
}

// Stands in for a header Quick Link / dashboard Quick Action: a navigation trigger that lives
// outside the sidebar entirely, so clicking it never touches sidebar click handlers or state — the
// sidebar must react to the resulting route change alone.
function renderWithExternalNavTrigger(initialPath: string, targetPath: string, label: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Link to={targetPath}>{label}</Link>
      <AppSidebarMenu menu={MENU} />
    </MemoryRouter>,
  );
}

describe('AppSidebarMenu — active state is route-driven and exclusive', () => {
  it('activates only Flat Owners when the route is its prefix-sharing sibling', () => {
    renderAt('/residents/flat-owners');

    expect(screen.getByRole('link', { name: 'Flat Owners' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Resident Directory' })).not.toHaveAttribute('aria-current');
  });

  it('activates only Resident Directory when the route is the shorter sibling path', () => {
    renderAt('/residents');

    expect(screen.getByRole('link', { name: 'Resident Directory' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Flat Owners' })).not.toHaveAttribute('aria-current');
  });

  it('keeps Flat Owners active on an unregistered detail/create route nested under it', () => {
    renderAt('/residents/flat-owners/123/edit');

    expect(screen.getByRole('link', { name: 'Flat Owners' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Resident Directory' })).not.toHaveAttribute('aria-current');
  });

  it('ignores query strings when resolving the active item', () => {
    renderAt('/residents/flat-owners?page=2&search=John');

    expect(screen.getByRole('link', { name: 'Flat Owners' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Resident Directory' })).not.toHaveAttribute('aria-current');
  });

  it('auto-expands the parent group that owns the active route', async () => {
    renderAt('/residents/flat-owners');

    // Sub-content unmounts while collapsed (Radix Presence) — the leaf being queryable at all
    // proves the Residents group auto-expanded from the route alone, with no click.
    expect(screen.getByRole('link', { name: 'Flat Owners' })).toBeInTheDocument();
  });

  it('moves the active item when the route changes via client-side navigation', async () => {
    const user = userEvent.setup();
    renderAt('/residents/flat-owners');

    // Group starts expanded because the active route is inside it, so the sibling link is already
    // reachable without needing to click the trigger first.
    await user.click(screen.getByRole('link', { name: 'Resident Directory' }));

    expect(screen.getByRole('link', { name: 'Resident Directory' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Flat Owners' })).not.toHaveAttribute('aria-current');
  });

  it('expands a currently-collapsed group and activates its leaf when navigation comes from outside the sidebar (Quick Links/Quick Actions), with no remount', async () => {
    const user = userEvent.setup();
    renderWithExternalNavTrigger('/', '/residents/flat-owners', 'Quick Link: New Tenant');

    // Mounted at '/', so Residents owns nothing yet and starts collapsed — Radix Presence unmounts
    // its children while closed.
    expect(screen.queryByRole('link', { name: 'Flat Owners' })).not.toBeInTheDocument();

    // The same AppSidebarMenu instance stays mounted; only the route changes underneath it — this
    // is what a header Quick Link or dashboard Quick Action does, and is exactly the scenario the
    // sidebar previously failed to react to (it only recomputed which group to expand on first
    // mount, e.g. a hard refresh, not on a later in-app navigation).
    await user.click(screen.getByRole('link', { name: 'Quick Link: New Tenant' }));

    const flatOwners = await screen.findByRole('link', { name: 'Flat Owners' });
    expect(flatOwners).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Resident Directory' })).not.toHaveAttribute('aria-current');
  });
});
