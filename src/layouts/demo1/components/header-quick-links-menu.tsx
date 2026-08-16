import { CalendarPlus, Package, Rocket, ShieldUser, UserPlus, Wallet, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { hasPermission } from '@/lib/auth/permissions';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useAppSelector } from '@/store/hooks';

interface QuickLink {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  /** Gates the card the same way its destination route's RequirePermission does — a UX
   * convenience, not a security boundary; the route itself enforces the real check. */
  permission: string;
}

// Shortcut launcher, not a duplicate of the sidebar or the dashboard's Quick Actions: those link to
// functional areas (e.g. "Security & Access"), these are direct shortcuts straight to a single
// specific "new"/"create" screen — the handful of most common day-to-day creation actions across
// Front Desk/Security, Leasing, Finance, and Facilities. Each is gated by the same permission its
// destination route (and full sidebar entry) already uses — see app-routing-setup.tsx / menu.config.tsx.
const QUICK_LINKS: QuickLink[] = [
  {
    title: 'New Guest',
    description: 'Register visitor',
    icon: ShieldUser,
    path: '/security/guests/new',
    permission: PERMISSIONS.visitor.create,
  },
  {
    title: 'Receive Parcel',
    description: 'Record delivery',
    icon: Package,
    path: '/security/parcels/new',
    permission: PERMISSIONS.parcel.receive,
  },
  {
    title: 'Record Payment',
    description: 'Add payment',
    icon: Wallet,
    path: '/billing/payments/new',
    permission: PERMISSIONS.payment.record,
  },
  {
    title: 'New Tenant',
    description: 'Register tenant',
    icon: UserPlus,
    path: '/leasing/tenant-registrations/new',
    permission: PERMISSIONS.occupancyRegistration.create,
  },
  {
    title: 'Facility Booking',
    description: 'Book facility',
    icon: CalendarPlus,
    path: '/facilities/community-hall/bookings/new',
    permission: PERMISSIONS.facility.bookingCreate,
  },
];

export function HeaderQuickLinksMenu() {
  const user = useAppSelector((s) => s.auth.user);
  const visibleLinks = QUICK_LINKS.filter((link) => hasPermission(user, link.permission));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" mode="icon" aria-label="Quick links">
          <Rocket className="text-muted-foreground/70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-80 p-3" side="bottom" align="end">
        <DropdownMenuLabel className="p-0 text-sm font-medium text-foreground">Quick Links</DropdownMenuLabel>
        <p className="mt-0.5 mb-3 text-xs text-muted-foreground">Frequently used actions</p>
        {visibleLinks.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">No quick actions available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {visibleLinks.map((link) => (
              <DropdownMenuItem
                key={link.path}
                asChild
                className="flex-col items-stretch gap-1 rounded-lg border border-border p-2.5 transition-colors hover:border-primary/50 hover:bg-accent/40"
              >
                <Link to={link.path}>
                  <span className="flex items-center gap-2">
                    <link.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-xs font-medium text-foreground">{link.title}</span>
                  </span>
                  <span className="pl-6 text-[11px] text-muted-foreground">{link.description}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
