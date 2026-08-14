import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { Container } from '@/components/common/container';
import { PlatformGlobalSearch } from '@/features/platform/components/PlatformGlobalSearch';
import { PlatformQuickLinksMenu } from '@/features/platform/components/PlatformQuickLinksMenu';
import { PlatformUserMenu } from '@/features/platform/components/PlatformUserMenu';
import { PlatformSidebarMenu } from './sidebar-menu';

export function PlatformHeader() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);

  const { pathname } = useLocation();
  const mobileMode = useIsMobile();

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <Container className="flex justify-between items-stretch lg:gap-4">
        <div className="flex gap-1 lg:hidden items-center gap-2.5">
          <Link to="/platform/dashboard" className="shrink-0">
            <img src={toAbsoluteUrl('/media/app/mini-logo.svg')} className="h-[25px] w-full" alt="mini-logo" />
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

        <div className="flex items-center gap-1.5">
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
