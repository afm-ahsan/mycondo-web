import { ReactNode, useState } from 'react';
import { ChevronRight, Globe, Moon, TriangleAlert, UserRound } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';

interface AccountMenuProps {
  trigger: ReactNode;
  displayName: string;
  displayEmail: string;
  avatarUrl: string;
  /** Small badge next to the name — e.g. "Platform" to indicate scope. Omit for the tenant menu. */
  contextLabel?: string;
  /** Route to the caller's My Profile page. Identity header renders as a plain block (not a link)
   * when omitted — Platform has no profile page of its own yet. */
  profileHref?: string;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

/**
 * Auth-agnostic dropdown menu content (identity block, language, dark mode, logout) shared between
 * the tenant `UserDropdownMenu` and Platform's `PlatformUserMenu` — neither reads/dispatches auth
 * state in here; callers supply identity data and an `onLogout` callback using their own auth slice.
 */
export function AccountMenu({
  trigger,
  displayName,
  displayEmail,
  avatarUrl,
  contextLabel,
  profileHref,
  onLogout,
  isLoggingOut,
}: AccountMenuProps) {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleLogoutClick = () => {
    // Close the dropdown first so it doesn't float behind the confirmation dialog.
    setMenuOpen(false);
    setConfirmLogoutOpen(true);
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" side="bottom" align="end">
          {/* Identity display — not a link itself; "My Profile" below is the dedicated affordance for
              navigating there, so the header stays a plain summary block. */}
          <div className="flex items-center gap-2 p-3">
            <img className="size-9 rounded-full border-2 border-green-500" src={avatarUrl} alt="User avatar" />
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 text-sm text-mono font-semibold">
                {displayName}
                {contextLabel && (
                  <Badge variant="outline" size="sm">
                    {contextLabel}
                  </Badge>
                )}
              </span>
              <a href={`mailto:${displayEmail}`} className="text-xs text-muted-foreground hover:text-primary">
                {displayEmail}
              </a>
            </div>
          </div>

          <DropdownMenuSeparator />

          {profileHref && (
            <>
              <DropdownMenuItem asChild className="flex items-center gap-2">
                <Link to={profileHref}>
                  <UserRound />
                  <span className="grow">My Profile</span>
                  <ChevronRight className="size-3.5 opacity-60" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Language — fixed to English for MVP-1; no localization infrastructure exists yet, so this
              is a static row, not an interactive control. */}
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
            <Globe className="opacity-60 size-4 shrink-0" />
            <span className="flex items-center justify-between gap-2 grow">
              Language
              <Badge variant="outline">English</Badge>
            </span>
          </div>

          <DropdownMenuSeparator />

          {/* Footer */}
          <DropdownMenuItem className="flex items-center gap-2" onSelect={(event) => event.preventDefault()}>
            <Moon />
            <div className="flex items-center gap-2 justify-between grow">
              Dark Mode
              <Switch size="sm" checked={theme === 'dark'} onCheckedChange={handleThemeToggle} />
            </div>
          </DropdownMenuItem>
          <div className="p-2 mt-1">
            <Button variant="destructive" size="sm" className="w-full" onClick={handleLogoutClick} disabled={isLoggingOut}>
              Logout
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmActionDialog
        open={confirmLogoutOpen}
        onOpenChange={setConfirmLogoutOpen}
        title="Are you sure you want to log out?"
        description="You will need to log in again to continue using your account."
        confirmLabel="Yes, Log Out"
        loadingLabel="Logging out…"
        isLoading={Boolean(isLoggingOut)}
        onConfirm={onLogout}
        confirmVariant="destructive"
        icon={
          <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-warning-soft,var(--color-yellow-50))] dark:bg-[var(--color-warning-soft,var(--color-yellow-950))]">
            <TriangleAlert className="size-6 text-[var(--color-warning-foreground,var(--color-yellow-600))]" />
          </div>
        }
      />
    </>
  );
}
