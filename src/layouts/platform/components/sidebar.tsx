import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { SidebarHeader } from '@/layouts/demo1/components/sidebar-header';
import { PlatformSidebarMenu } from './sidebar-menu';

export function PlatformSidebar() {
  const { settings } = useSettings();
  const { pathname } = useLocation();

  return (
    <div
      className={cn(
        'sidebar bg-background lg:border-e lg:border-border lg:fixed lg:top-0 lg:bottom-0 lg:z-20 lg:flex flex-col items-stretch shrink-0',
        (settings.layouts.demo1.sidebarTheme === 'dark' || pathname.includes('dark-sidebar')) && 'dark',
      )}
    >
      <SidebarHeader />
      <div className="overflow-hidden">
        <div className="w-(--sidebar-default-width)">
          <PlatformSidebarMenu />
        </div>
      </div>
    </div>
  );
}
