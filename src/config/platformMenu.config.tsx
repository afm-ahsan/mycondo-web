import { Building2, LayoutGrid } from 'lucide-react';
import { PLATFORM_PERMISSIONS } from '@/lib/auth/platformPermissionKeys';
import { type MenuConfig } from './types';

// Deliberately minimal: Organizations (+ Auth, not a nav destination) is the only Platform capability
// mycondo-api currently exposes (see PlatformOrganizationEndpoints.cs / PlatformAuthEndpoints.cs — no
// Platform Users, Roles, or Feature Management endpoints exist yet despite the domain entities being
// present). Add sections here only as their backing API ships.
export const MENU_SIDEBAR_PLATFORM: MenuConfig = [
  { title: 'Dashboard', icon: LayoutGrid, path: '/platform/dashboard' },
  { heading: 'Platform' },
  {
    title: 'Organizations',
    icon: Building2,
    path: '/platform/organizations',
    permission: PLATFORM_PERMISSIONS.organization.read,
  },
];
