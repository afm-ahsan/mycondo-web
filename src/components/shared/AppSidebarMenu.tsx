'use client';

import { JSX, useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MenuConfig, MenuItem } from '@/config/types';
import { cn } from '@/lib/utils';
import {
  AccordionMenu,
  AccordionMenuClassNames,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
} from '@/components/ui/accordion-menu';
import { Badge } from '@/components/ui/badge';

const classNames: AccordionMenuClassNames = {
  root: 'lg:ps-1 space-y-3',
  group: 'gap-px',
  label: 'uppercase text-xs font-medium text-muted-foreground/70 pt-2.25 pb-px',
  separator: '',
  item: 'h-8 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium',
  sub: '',
  subTrigger:
    'h-8 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium',
  subContent: 'py-0',
  indicator: '',
};

/**
 * Renders an already permission-filtered `MenuConfig` as an accordion sidebar menu. Auth-agnostic —
 * shared between the tenant sidebar (`layouts/demo1/components/sidebar-menu.tsx`) and the Platform
 * sidebar (`layouts/platform/components/sidebar-menu.tsx`), each of which filters against its own
 * auth slice before passing `menu` in here.
 */
/** Strips a trailing slash (except the root `/` itself) so equivalent routes compare equal. */
function normalizeRoute(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/** Collects every navigable `path` in the menu tree, including nested children. */
function collectPaths(items: MenuConfig, acc: string[] = []): string[] {
  for (const item of items) {
    if (item.path) acc.push(normalizeRoute(item.path));
    if (item.children) collectPaths(item.children, acc);
  }
  return acc;
}

export function AppSidebarMenu({ menu }: { menu: MenuConfig }) {
  const { pathname } = useLocation();
  const currentPath = normalizeRoute(pathname);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Route is the single source of truth for active state. Rather than matching each menu item's
  // path against the current route independently (which made `/residents` — Resident Directory —
  // match as a *prefix* of `/residents/flat-owners`, activating both), find the one menu path that
  // owns the current route: the longest registered path that is either an exact match or an
  // ancestor of it (segment-bounded, so `/residents` never matches `/residents-foo`). Detail/
  // create/edit routes not present in the menu (e.g. `/residents/flat-owners/123/edit`) still
  // resolve to their nearest registered ancestor (`/residents/flat-owners`) via the same rule.
  const activePath = useMemo(() => {
    const paths = collectPaths(menu);
    let best: string | undefined;
    for (const path of paths) {
      const matches = path === currentPath || (path.length > 1 && currentPath.startsWith(`${path}/`));
      if (matches && (!best || path.length > best.length)) {
        best = path;
      }
    }
    return best;
  }, [menu, currentPath]);

  const matchPath = useCallback((path: string): boolean => path === activePath, [activePath]);

  // Keeps the active leaf visible inside the sidebar's own scroll container whenever the route
  // changes — Quick Actions/Links, browser back/forward, direct URL, and refresh all land here
  // since they all funnel through `activePath`. Runs once immediately (covers same-level
  // navigation and initial mount, where `AccordionMenu`'s active chain is already expanded) and
  // again on the accordion's own open-animation completion — a just-expanded parent's content is
  // unmounted until then (Radix Presence), so its final position isn't known any earlier, and
  // there's no arbitrary delay involved.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scrollActiveIntoView = () => {
      const active = container.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active) return;

      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const margin = 8;

      let delta = 0;
      if (activeRect.top < containerRect.top + margin) {
        delta = activeRect.top - containerRect.top - margin;
      } else if (activeRect.bottom > containerRect.bottom - margin) {
        delta = activeRect.bottom - containerRect.bottom + margin;
      }
      if (delta !== 0) {
        if (typeof container.scrollBy === 'function') {
          container.scrollBy({ top: delta, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        } else {
          container.scrollTop += delta;
        }
      }
    };

    scrollActiveIntoView();

    const handleAnimationEnd = (event: AnimationEvent) => {
      if ((event.target as HTMLElement).getAttribute('data-state') === 'open') {
        scrollActiveIntoView();
      }
    };
    container.addEventListener('animationend', handleAnimationEnd);
    return () => container.removeEventListener('animationend', handleAnimationEnd);
  }, [activePath]);

  const buildMenu = (items: MenuConfig): JSX.Element[] => {
    return items.map((item: MenuItem, index: number) => {
      if (item.heading) {
        return buildMenuHeading(item, index);
      } else if (item.disabled) {
        return buildMenuItemRootDisabled(item, index);
      } else {
        return buildMenuItemRoot(item, index);
      }
    });
  };

  const buildMenuItemRoot = (item: MenuItem, index: number): JSX.Element => {
    if (item.children) {
      return (
        <AccordionMenuSub key={index} value={item.path || `root-${index}`}>
          <AccordionMenuSubTrigger className="text-sm font-medium">
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <span data-slot="accordion-menu-title">{item.title}</span>
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `root-${index}`}
            className="ps-6"
          >
            <AccordionMenuGroup>{buildMenuItemChildren(item.children, 1)}</AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      return (
        <AccordionMenuItem key={index} value={item.path || ''} className="text-sm font-medium" asChild>
          <Link to={item.path || '#'}>
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <span data-slot="accordion-menu-title">{item.title}</span>
          </Link>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemRootDisabled = (item: MenuItem, index: number): JSX.Element => {
    return (
      <AccordionMenuItem
        key={index}
        value={`disabled-${index}`}
        className="text-sm font-medium"
        disabled
        aria-disabled="true"
      >
        {item.icon && <item.icon data-slot="accordion-menu-icon" />}
        <span data-slot="accordion-menu-title">{item.title}</span>
        {item.disabled && (
          <Badge variant="secondary" size="sm" className="ms-auto me-[-10px]">
            Soon
          </Badge>
        )}
      </AccordionMenuItem>
    );
  };

  const buildMenuItemChildren = (items: MenuConfig, level: number = 0): JSX.Element[] => {
    return items.map((item: MenuItem, index: number) => {
      if (item.disabled) {
        return buildMenuItemChildDisabled(item, index, level);
      } else {
        return buildMenuItemChild(item, index, level);
      }
    });
  };

  const buildMenuItemChild = (item: MenuItem, index: number, level: number = 0): JSX.Element => {
    if (item.children) {
      return (
        <AccordionMenuSub key={index} value={item.path || `child-${level}-${index}`}>
          <AccordionMenuSubTrigger className="text-[13px]">
            {item.collapse ? (
              <span className="text-muted-foreground">
                <span className="hidden [[data-state=open]>span>&]:inline">{item.collapseTitle}</span>
                <span className="inline [[data-state=open]>span>&]:hidden">{item.expandTitle}</span>
              </span>
            ) : (
              item.title
            )}
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `child-${level}-${index}`}
            className={cn('ps-4', !item.collapse && 'relative', !item.collapse && (level > 0 ? '' : ''))}
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(item.children, item.collapse ? level : level + 1)}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      return (
        <AccordionMenuItem key={index} value={item.path || ''} className="text-[13px]" asChild>
          <Link to={item.path || '#'}>{item.title}</Link>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemChildDisabled = (item: MenuItem, index: number, level: number = 0): JSX.Element => {
    return (
      <AccordionMenuItem
        key={index}
        value={`disabled-child-${level}-${index}`}
        className="text-[13px]"
        disabled
        aria-disabled="true"
      >
        <span data-slot="accordion-menu-title">{item.title}</span>
        {item.disabled && (
          <Badge variant="secondary" size="sm" className="ms-auto me-[-10px]">
            Soon
          </Badge>
        )}
      </AccordionMenuItem>
    );
  };

  const buildMenuHeading = (item: MenuItem, index: number): JSX.Element => {
    return <AccordionMenuLabel key={index}>{item.heading}</AccordionMenuLabel>;
  };

  return (
    <div
      ref={scrollContainerRef}
      className="kt-scrollable-y-hover flex grow shrink-0 py-5 px-5 lg:max-h-[calc(100vh-5.5rem)]"
    >
      <AccordionMenu
        selectedValue={pathname}
        matchPath={matchPath}
        type="single"
        collapsible
        classNames={classNames}
      >
        {buildMenu(menu)}
      </AccordionMenu>
    </div>
  );
}
