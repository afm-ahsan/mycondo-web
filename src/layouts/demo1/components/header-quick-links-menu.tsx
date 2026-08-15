import { Package, Rocket, ShieldUser, UserPlus, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { RequirePermission } from '@/lib/auth/RequirePermission';

// Shortcut launcher, not a duplicate of the sidebar — a handful of the most common day-to-day
// creation actions across Front Desk/Security and Finance, each gated by the same permission its
// full sidebar entry uses (see menu.config.tsx).
export function HeaderQuickLinksMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" mode="icon" aria-label="Quick links">
          <Rocket className="text-muted-foreground/70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" side="bottom" align="end">
        <DropdownMenuLabel>Quick links</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <RequirePermission permission={PERMISSIONS.visitor.create}>
          <DropdownMenuItem asChild>
            <Link to="/security/guests/new" className="flex items-center gap-2">
              <ShieldUser /> New Guest
            </Link>
          </DropdownMenuItem>
        </RequirePermission>
        <RequirePermission permission={PERMISSIONS.parcel.receive}>
          <DropdownMenuItem asChild>
            <Link to="/security/parcels/new" className="flex items-center gap-2">
              <Package /> Receive Parcel
            </Link>
          </DropdownMenuItem>
        </RequirePermission>
        <RequirePermission permission={PERMISSIONS.payment.record}>
          <DropdownMenuItem asChild>
            <Link to="/billing/payments/new" className="flex items-center gap-2">
              <Wallet /> Record Payment
            </Link>
          </DropdownMenuItem>
        </RequirePermission>
        <RequirePermission permission={PERMISSIONS.occupancyRegistration.create}>
          <DropdownMenuItem asChild>
            <Link to="/leasing/tenant-registrations/new" className="flex items-center gap-2">
              <UserPlus /> New Tenant Registration
            </Link>
          </DropdownMenuItem>
        </RequirePermission>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
