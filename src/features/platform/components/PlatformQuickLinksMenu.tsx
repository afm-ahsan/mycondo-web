import { Building2, PlusCircle, Rocket } from 'lucide-react';
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
import { PLATFORM_PERMISSIONS } from '@/lib/auth/platformPermissionKeys';
import { RequirePlatformPermission } from '@/lib/auth/RequirePlatformPermission';

// Shortcut launcher, not a duplicate of the sidebar — kept to the handful of Platform actions that
// genuinely exist today (see MENU_SIDEBAR_PLATFORM's doc comment for what's real vs. deferred).
export function PlatformQuickLinksMenu() {
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
        <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.read}>
          <DropdownMenuItem asChild>
            <Link to="/platform/organizations" className="flex items-center gap-2">
              <Building2 /> Organizations
            </Link>
          </DropdownMenuItem>
        </RequirePlatformPermission>
        <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.create}>
          <DropdownMenuItem asChild>
            <Link to="/platform/organizations/new" className="flex items-center gap-2">
              <PlusCircle /> Add Organization
            </Link>
          </DropdownMenuItem>
        </RequirePlatformPermission>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
