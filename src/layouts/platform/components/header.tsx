import { useEffect, useLayoutEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { Container } from '@/components/common/container';
import { HeaderBreadcrumb } from '@/components/shared/HeaderBreadcrumb';
import { usePageHeaderContext } from '@/providers/page-header-provider';
import { PlatformGlobalSearch } from '@/features/platform/components/PlatformGlobalSearch';
import { PlatformQuickLinksMenu } from '@/features/platform/components/PlatformQuickLinksMenu';
import { PlatformUserMenu } from '@/features/platform/components/PlatformUserMenu';
import { PlatformSidebarMenu } from './sidebar-menu';

export function PlatformHeader() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);

  const { pathname } = useLocation();
  const mobileMode = useIsMobile();
  const { setCrumbs } = usePageHeaderContext();

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  // See the tenant header's identical effect for why this must precede <Outlet> in the tree and use
  // useLayoutEffect (both matter for correct ordering against PageHeader's own crumb-publish effect).
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
      {/* width="fluid" — must match PlatformLayout's page-content Container (also "fluid"); see the
          tenant header's identical comment for why a mismatched width misaligns the header's
          breadcrumb/avatar against the page content below it. */}
      <Container width="fluid" className="flex items-stretch lg:gap-4">
        <div className="flex gap-1 lg:hidden items-center gap-2.5">
          <Link to="/platform/dashboard" className="shrink-0">
            <img src={toAbsoluteUrl('/media/app/condobd-logo.png')} className="h-7 w-auto max-w-none" alt="CondoBD" />
          </Link>
          {mobileMode && (
            <Sheet open={isSidebarSheetOpen} onOpenChange={setIsSidebarSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" mode="icon">
                  <Menu className="text-muted-foreground/70" />
                </Button>
              </SheetTrigger>
              <SheetContent className="p-0 gap-0 w-[275px]" side="left" close={false}>
                <SheetHeader className="p-0 space-y-0" />
                <SheetBody className="p-0 overflow-y-auto">
                  <PlatformSidebarMenu />
                </SheetBody>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* HeaderContext — see the tenant header's identical block. */}
        <div className="hidden min-w-0 flex-1 items-center lg:flex">
          <HeaderBreadcrumb />
        </div>

        {/* ms-auto (not justify-between on the parent) pushes this to the end regardless of
            whether the lg:hidden logo block above is visible — see the tenant header's identical
            fix for why justify-between alone collapsed this to flex-start on desktop. */}
        <div className="flex items-center gap-1.5 ms-auto">
          <PlatformGlobalSearch />
          <PlatformQuickLinksMenu />
          <div className="ms-1.5">
            <PlatformUserMenu />
          </div>
        </div>
      </Container>
    </header>
  );
}
