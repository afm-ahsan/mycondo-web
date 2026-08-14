import { useMemo } from 'react';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { AppSidebarMenu } from '@/components/shared/AppSidebarMenu';
import { filterMenuByPermission } from '@/lib/menu/filterMenuByPermission';
import { hasPermission } from '@/lib/auth/permissions';
import { useAppSelector } from '@/store/hooks';

export function SidebarMenu() {
  const user = useAppSelector((s) => s.auth.user);

  const visibleMenu = useMemo(
    () => filterMenuByPermission(MENU_SIDEBAR, (permission) => hasPermission(user, permission)),
    [user],
  );

  return <AppSidebarMenu menu={visibleMenu} />;
}
