import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Crumb {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  crumbs: Crumb[];
  actions?: React.ReactNode;
}

/** Shared page-header (breadcrumb + title + actions) for every Slice H page — mirrors
 * amenities/components/PageHeader.tsx exactly (feature-local by the same precedent, not promoted to
 * shared since it has no Operations-specific logic to justify cross-feature reuse yet). */
export function PageHeader({ title, crumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
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
        <h1 className="text-xl font-semibold mt-1">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
