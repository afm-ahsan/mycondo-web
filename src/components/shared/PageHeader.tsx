import { useLayoutEffect, type ReactNode } from 'react';
import { usePageHeaderContext, type PageHeaderCrumb } from '@/providers/page-header-provider';

interface PageHeaderProps {
  title: string;
  description?: string;
  crumbs?: PageHeaderCrumb[];
  /** The single main call-to-action for this page (e.g. "New Booking"). */
  primaryAction?: ReactNode;
  /** Lower-emphasis actions shown alongside the primary action (e.g. "Export", "Refresh"). */
  secondaryActions?: ReactNode;
}

/**
 * Standard page shell header: title, optional description, and an action area. The breadcrumb
 * itself renders in the global app header (see HeaderBreadcrumb) — passing `crumbs` here publishes
 * them to that shared context rather than rendering them in page content, so the trail and the
 * header utility cluster share one row instead of the breadcrumb floating below the header.
 * Wrap an individual action in `RequirePermission` (`@/lib/auth/RequirePermission`) at the call
 * site to hide it for users who lack the permission — this component stays permission-agnostic.
 */
export function PageHeader({
  title,
  description,
  crumbs,
  primaryAction,
  secondaryActions,
}: PageHeaderProps) {
  const hasActions = Boolean(primaryAction || secondaryActions);
  const { setCrumbs } = usePageHeaderContext();

  useLayoutEffect(() => {
    setCrumbs(crumbs ?? []);
  }, [crumbs, setCrumbs]);

  return (
    <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold truncate">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {hasActions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
