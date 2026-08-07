import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface PageHeaderCrumb {
  label: string;
  path?: string;
}

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
 * Standard page shell header: breadcrumb, title, optional description, and an action area.
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

  return (
    <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((crumb, index) => (
                <span key={crumb.label} className="flex items-center gap-1.5">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.path ? (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.path}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <h1 className="text-xl font-semibold mt-1 truncate">{title}</h1>
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
