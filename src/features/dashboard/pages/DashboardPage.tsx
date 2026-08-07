import { type LucideIcon, Building, Landmark, ShieldUser, UserCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { hasPermission } from '@/lib/auth/permissions';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useAppSelector } from '@/store/hooks';

interface DashboardSection {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  /** Gates the card the same way its sidebar entry-point is gated — a UX convenience, not a
   * security boundary; the destination route enforces the real check via RequirePermission. */
  permission: string;
}

const SECTIONS: DashboardSection[] = [
  {
    title: 'Security & Access',
    description: 'Guest register, check-in/out, and current visitors.',
    icon: ShieldUser,
    path: '/security/guests',
    permission: PERMISSIONS.visitor.view,
  },
  {
    title: 'Tenant Registration',
    description: 'Resident onboarding, approvals, and the security directory.',
    icon: UserCheck,
    path: '/leasing/tenant-registrations',
    permission: PERMISSIONS.occupancyRegistration.view,
  },
  {
    title: 'Facilities',
    description: 'Community hall bookings and swimming pool access.',
    icon: Landmark,
    path: '/facilities/community-hall/calendar',
    permission: PERMISSIONS.facility.bookingView,
  },
  {
    title: 'Operations',
    description: 'Generator logs, fuel, and gas cylinder stock.',
    icon: Zap,
    path: '/operations/generator/log',
    permission: PERMISSIONS.generator.operationManage,
  },
  {
    title: 'Administration',
    description: 'Users, roles and permissions, and tenant setup.',
    icon: Building,
    path: '/admin/users',
    permission: 'user.view',
  },
];

/**
 * The MyCondo landing page — replaces the Metronic e-commerce demo dashboard that previously
 * rendered at `/`. Deliberately just a permission-aware set of entry points into what's actually
 * built, not a KPI dashboard: every number on a card here would either be fabricated in the browser
 * or need a backend aggregation endpoint that doesn't exist yet (see the UX-0 discovery report's API
 * Gap Analysis). Real KPI/trend cards belong in UX-5, once those endpoints exist.
 */
export function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const visibleSections = SECTIONS.filter((section) => hasPermission(user, section.permission));

  return (
    <>
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name}` : ''}`}
        description="Jump into what you work with most."
      />
      {visibleSections.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nothing to show yet — ask your administrator for access to a module.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 max-w-5xl">
          {visibleSections.map((section) => (
            <Link key={section.path} to={section.path}>
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/40">
                <CardContent className="flex items-start gap-3 py-5">
                  <section.icon className="text-primary size-5 shrink-0" aria-hidden="true" />
                  <div>
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">{section.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
