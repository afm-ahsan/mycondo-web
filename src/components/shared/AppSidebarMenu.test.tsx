import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppSidebarMenu } from './AppSidebarMenu';
import type { MenuConfig } from '@/config/types';

// Mirrors the real Residents group shape: one leaf ('/residents') is a route-prefix of a sibling
// leaf ('/residents/flat-owners'). This is exactly the shape that made both items show active
// together before the fix.
const MENU: MenuConfig = [
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
});
