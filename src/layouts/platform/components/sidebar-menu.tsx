import { useMemo } from 'react';
import { MENU_SIDEBAR_PLATFORM } from '@/config/platformMenu.config';
import { AppSidebarMenu } from '@/components/shared/AppSidebarMenu';
import { filterMenuByPermission } from '@/lib/menu/filterMenuByPermission';
import { hasPlatformPermission } from '@/lib/auth/platformPermissions';
import { useAppSelector } from '@/store/hooks';

export function PlatformSidebarMenu() {
  const user = useAppSelector((s) => s.platformAuth.user);

  const visibleMenu = useMemo(
    () => filterMenuByPermission(MENU_SIDEBAR_PLATFORM, (permission) => hasPlatformPermission(user, permission)),
    [user],
  );

  return <AppSidebarMenu menu={visibleMenu} />;
}
