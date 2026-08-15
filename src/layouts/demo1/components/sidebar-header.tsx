import { ChevronFirst } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';

export function SidebarHeader() {
  const { settings, storeOption } = useSettings();

  const handleToggleClick = () => {
    storeOption(
      'layouts.demo1.sidebarCollapse',
      !settings.layouts.demo1.sidebarCollapse,
    );
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0">
      <Link to="/" className="flex min-w-0 items-center gap-2.5">
        <img
          src={toAbsoluteUrl('/media/app/condobd-logo.png')}
          className="default-logo h-9 w-auto max-w-none shrink-0"
          alt="CondoBD"
        />
        <img
          src={toAbsoluteUrl('/media/app/condobd-logo.png')}
          className="small-logo h-8 w-auto max-w-none shrink-0"
          alt="CondoBD"
        />
        <span className="default-logo truncate bg-gradient-to-r from-pink-500 via-orange-400 to-blue-500 bg-clip-text text-base font-bold text-transparent">
          CondoBD
        </span>
      </Link>
      <Button
        onClick={handleToggleClick}
        size="sm"
        mode="icon"
        variant="outline"
        className={cn(
          'size-7 absolute start-full top-2/4 rtl:translate-x-2/4 -translate-x-2/4 -translate-y-2/4',
          settings.layouts.demo1.sidebarCollapse
            ? 'ltr:rotate-180'
            : 'rtl:rotate-180',
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}
