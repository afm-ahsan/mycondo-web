import { MenuConfig } from '@/config/types';

// Drops any item (and, recursively, its children) `canView` rejects — a UX convenience so admin-only
// links don't clutter the sidebar for users who'd just hit "Access denied" (the route guard is what
// actually enforces this; the backend enforces it for real). A group whose children are entirely
// filtered out is dropped too — it would otherwise render as an empty, clickless accordion group —
// unless it also has its own `path`, i.e. it's a real destination and not just a container. A
// `heading` marker left with no surviving group beneath it is dropped as well, so a section title
// never appears over nothing.
//
// Auth-agnostic by design: callers supply `canView`, e.g. `(p) => hasPermission(user, p)` for tenant
// menus or `(p) => hasPlatformPermission(user, p)` for Platform menus.
export function filterMenuByPermission(
  items: MenuConfig,
  canView: (permission: string) => boolean,
): MenuConfig {
  const filtered = items
    .filter((item) => !item.permission || canView(item.permission))
    .map((item) =>
      item.children ? { ...item, children: filterMenuByPermission(item.children, canView) } : item,
    )
    .filter((item) => !item.children || item.children.length > 0 || item.path);

  return filtered.filter((item, index) => {
    if (!item.heading) return true;
    const next = filtered[index + 1];
    return next !== undefined && !next.heading;
  });
}
