import { type LucideIcon, Building, Landmark, ShieldUser, UserCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { ExecutiveSummarySection } from '../components/ExecutiveSummarySection';
import { FacilitiesSummarySection } from '../components/FacilitiesSummarySection';
import { FinancialSummarySection } from '../components/FinancialSummarySection';
import { OperationsSummarySection } from '../components/OperationsSummarySection';
import { SecuritySummarySection } from '../components/SecuritySummarySection';
import { UtilitiesSummarySection } from '../components/UtilitiesSummarySection';
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
 * rendered at `/`. As of UX-5, a real KPI dashboard: every number below comes from a backend
 * aggregation endpoint designed for that purpose (Financial/Security/Facilities/Utilities/Operations
 * summary reports) — never from re-aggregating a paginated page or a browser-side calculation. Each
 * module section is independently permission-gated (a widget never fetches when the viewer lacks the
 * underlying permission) and independently fails (one section's load error never blanks the others —
 * see DashboardPage.test.tsx). Executive Summary is a frontend composition reading the same RTK Query
 * cache entries the sections below it use, not its own endpoint. Quick Actions (below) is kept as the
 * permission-filtered navigation grid this page always had.
 */
export function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const visibleSections = SECTIONS.filter((section) => hasPermission(user, section.permission));

  return (
    <>
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name}` : ''}`}
        description="Jump into what you work with most."
        crumbs={[{ label: 'Dashboard' }]}
      />

      <div className="space-y-4 mb-6">
        <ExecutiveSummarySection />
        <FinancialSummarySection />
        <SecuritySummarySection />
        <FacilitiesSummarySection />
        <UtilitiesSummarySection />
        <OperationsSummarySection />
      </div>

      <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
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
