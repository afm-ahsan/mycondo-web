/**
 * Literal `platform.*` permission strings the backend seeds (PermissionCatalogue.cs). Platform-scope
 * analogue of permissionKeys.ts's PERMISSIONS — kept in a separate module since these are checked
 * against the platformAuth slice, never the tenant auth slice.
 */
export const PLATFORM_PERMISSIONS = {
  organization: {
    read: 'platform.organization.read',
    create: 'platform.organization.create',
    update: 'platform.organization.update',
    suspend: 'platform.organization.suspend',
    activate: 'platform.organization.activate',
    reactivate: 'platform.organization.reactivate',
    featuresManage: 'platform.organization.features.manage',
  },
} as const;
