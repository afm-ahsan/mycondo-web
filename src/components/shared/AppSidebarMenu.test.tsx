import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

// Stubs a `DOMRect`-shaped return so the component's own visibility math (compared against the
// scroll container's rect) can be driven deterministically — jsdom never lays elements out, so
// every `getBoundingClientRect()` is zero by default.
function mockRect(target: Element, rect: { top: number; bottom: number }) {
  vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
    top: rect.top,
    bottom: rect.bottom,
    left: 0,
    right: 0,
    width: 0,
    height: rect.bottom - rect.top,
    x: 0,
    y: rect.top,
    toJSON: () => {},
  } as DOMRect);
}

describe('AppSidebarMenu — keeps the active item visible inside the sidebar scroll container', () => {
  it('scrolls the sidebar container (not the page) when the newly active item starts below the visible area', async () => {
    const user = userEvent.setup();
    renderAt('/residents');

    const scrollContainer = screen
      .getByRole('link', { name: 'Resident Directory' })
      .closest('.kt-scrollable-y-hover') as HTMLElement;
    mockRect(scrollContainer, { top: 0, bottom: 400 });
    mockRect(screen.getByRole('link', { name: 'Flat Owners' }), { top: 450, bottom: 470 });
    const scrollBySpy = vi.fn();
    scrollContainer.scrollBy = scrollBySpy;

    await user.click(screen.getByRole('link', { name: 'Flat Owners' }));

    expect(scrollBySpy).toHaveBeenCalledTimes(1);
    // Container bottom (400) minus the 8px margin (392) vs. the active item's bottom (470).
    expect(scrollBySpy).toHaveBeenCalledWith({ top: 78, behavior: 'smooth' });
  });

  it('does not scroll when the newly active item is already fully visible', async () => {
    const user = userEvent.setup();
    renderAt('/residents');

    const scrollContainer = screen
      .getByRole('link', { name: 'Resident Directory' })
      .closest('.kt-scrollable-y-hover') as HTMLElement;
    mockRect(scrollContainer, { top: 0, bottom: 400 });
    mockRect(screen.getByRole('link', { name: 'Flat Owners' }), { top: 100, bottom: 120 });
    const scrollBySpy = vi.fn();
    scrollContainer.scrollBy = scrollBySpy;

    await user.click(screen.getByRole('link', { name: 'Flat Owners' }));

    expect(scrollBySpy).not.toHaveBeenCalled();
  });
});

// Reproduces "Sidebar Scroll Reproduce Exact Accordion Interaction": clicking an unrelated,
// currently-collapsed group's header (no route change) used to unconditionally re-scroll to the
// current active route on the group's open animationend — jumping the sidebar away from the group
// the user just opened and toward a page they weren't navigating to.
const MENU_WITH_UNRELATED_GROUP: MenuConfig = [
  { title: 'Dashboard', path: '/' },
  {
    title: 'Residents',
    children: [
      { title: 'Flat Owners', path: '/residents/flat-owners' },
      { title: 'Resident Directory', path: '/residents' },
    ],
  },
  {
    title: 'Operations',
    children: [{ title: 'Utilities', path: '/operations/utilities' }],
  },
];

describe('AppSidebarMenu — manual accordion toggles never re-scroll toward an unrelated active route', () => {
  it('reveals the manually expanded group instead of jumping back to the (off-screen) active item', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/residents/flat-owners']}>
        {<AppSidebarMenu menu={MENU_WITH_UNRELATED_GROUP} />}
      </MemoryRouter> as ReactNode,
    );

    const scrollContainer = screen
      .getByRole('link', { name: 'Flat Owners' })
      .closest('.kt-scrollable-y-hover') as HTMLElement;
    mockRect(scrollContainer, { top: 0, bottom: 400 });
    // Active item is currently scrolled out of view above the container — exactly the state that
    // triggered the bug (any accordion open animation unconditionally re-scrolled here).
    mockRect(screen.getByRole('link', { name: 'Flat Owners' }), { top: -80, bottom: -60 });

    const scrollBySpy = vi.fn();
    scrollContainer.scrollBy = scrollBySpy;

    // "Utilities" isn't in the DOM yet — Operations starts collapsed (Radix Presence).
    expect(screen.queryByRole('link', { name: 'Utilities' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Operations' }));

    const content = screen
      .getByRole('link', { name: 'Utilities' })
      .closest('[data-slot="accordion-menu-sub-content"]') as HTMLElement;
    // The group's own trigger sits in the DOM right before its content — mocked here, not on the
    // button, since that's what the component actually reads to avoid scrolling the trigger itself
    // out of view.
    mockRect(content.previousElementSibling as Element, { top: 350, bottom: 370 });
    mockRect(content, { top: 370, bottom: 500 });

    fireEvent.animationEnd(content);

    // Scrolls down just enough to reveal the newly expanded content (container bottom 400 minus the
    // 8px margin (392) vs. the content's bottom (500)) — never up toward "Flat Owners".
    expect(scrollBySpy).toHaveBeenCalledTimes(1);
    expect(scrollBySpy).toHaveBeenCalledWith({ top: 108, behavior: 'smooth' });
  });
});
