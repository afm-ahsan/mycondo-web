import { useEffect, useLayoutEffect, useState } from 'react';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Container } from '@/components/common/container';
import { HeaderBreadcrumb } from '@/components/shared/HeaderBreadcrumb';
import { usePageHeaderContext } from '@/providers/page-header-provider';
import { HeaderGlobalSearch } from './header-global-search';
import { HeaderNotifications } from './header-notifications';
import { HeaderQuickLinksMenu } from './header-quick-links-menu';
import { SidebarMenu } from './sidebar-menu';

export function Header() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);

  const { pathname } = useLocation();
  const mobileMode = useIsMobile();
  const { setCrumbs } = usePageHeaderContext();

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  // Clear the previous page's breadcrumb before the new route's PageHeader (if any) publishes its
  // own — both this and PageHeader's crumb effect are useLayoutEffect, and this component renders
  // before <Outlet> in the tree, so this always commits first within the same navigation, avoiding
  // a stale-breadcrumb flash on routes that don't render a PageHeader.
  useLayoutEffect(() => {
    setCrumbs([]);
  }, [pathname, setCrumbs]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      {/* width="fluid" — must match the page-content Container in Demo1Layout (also "fluid"). The
          default Container width is "fixed" (max-w-[1320px], centered), which would put this
          header's left/right edges at different x-coordinates than the page content below it,
          misaligning the breadcrumb against the page title and the avatar against the page's
          right-side actions. */}
      <Container width="fluid" className="flex items-stretch lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex gap-1 lg:hidden items-center gap-2.5">
          <Link to="/" className="shrink-0">
            <img
              src={toAbsoluteUrl('/media/app/condobd-logo.png')}
              className="h-7 w-auto max-w-none"
              alt="CondoBD"
            />
          </Link>
          {mobileMode && (
            <Sheet
              open={isSidebarSheetOpen}
              onOpenChange={setIsSidebarSheetOpen}
            >
              <SheetTrigger asChild>
                <Button variant="ghost" mode="icon">
                  <Menu className="text-muted-foreground/70" />
                </Button>
              </SheetTrigger>
              <SheetContent
                className="p-0 gap-0 w-[275px]"
                side="left"
                close={false}
              >
                <SheetHeader className="p-0 space-y-0" />
                <SheetBody className="p-0 overflow-y-auto">
                  <SidebarMenu />
                </SheetBody>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* HeaderContext — the current page's breadcrumb (published via <PageHeader crumbs={...}>),
            left-aligned and sharing the header row with the utility cluster instead of floating in
            page content. flex-1 lets it fill the space between the (mobile-only) logo and the
            utilities, truncating rather than wrapping/overflowing on narrower desktop widths. */}
        <div className="hidden min-w-0 flex-1 items-center lg:flex">
          <HeaderBreadcrumb />
        </div>

        {/* HeaderTopbar — ms-auto (not justify-between on the parent) pushes this to the end
            regardless of whether HeaderLogo is visible; justify-between with a single visible
            flex child (HeaderLogo is lg:hidden) collapses to flex-start, which is why the avatar
            previously rendered top-left on desktop. */}
        <div className="flex items-center gap-1.5 ms-auto">
          <HeaderGlobalSearch />
          <HeaderNotifications />
          <HeaderQuickLinksMenu />
          <div className="ms-1.5">
            <UserDropdownMenu
              trigger={
                <img
                  className="size-9 rounded-full border-2 border-green-500 shrink-0 cursor-pointer"
                  src={toAbsoluteUrl('/media/avatars/300-2.png')}
                  alt="User Avatar"
                />
              }
            />
          </div>
        </div>
      </Container>
    </header>
  );
}
