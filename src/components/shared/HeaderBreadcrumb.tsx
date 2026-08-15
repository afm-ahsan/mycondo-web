import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePageHeaderContext } from '@/providers/page-header-provider';

/**
 * Renders the current page's breadcrumb (set via <PageHeader crumbs={...}>) in the global header's
 * left-side context slot. The caller is responsible for the `hidden lg:flex` responsive wrapper —
 * at narrower widths the header has no room for both the breadcrumb trail and the utility cluster,
 * and the page title (always in page content) already orients the user.
 */
export function HeaderBreadcrumb() {
  const { crumbs } = usePageHeaderContext();

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className={isLast ? 'min-w-0' : 'shrink-0'}>
                {crumb.path ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
