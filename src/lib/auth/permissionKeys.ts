/**
 * Literal permission strings the backend seeds for these features (see mycondo-api's
 * `Seed_Security_Permissions` migration). Route guards, menu items, and page-level
 * `RequirePermission` checks should reference this module instead of scattering string
 * literals — new feature slices should add their own section here rather than inlining
 * `"resource.action"` strings, matching the `resource.action` naming already used by
 * `user.view`/`tenant.manage`/etc. elsewhere in the app.
 */
export const PERMISSIONS = {
  visitor: {
    create: 'visitor.create',
    view: 'visitor.view',
    blockManage: 'visitor.block.manage',
    checkin: 'visitor.checkin',
    checkout: 'visitor.checkout',
  },
  report: {
    securityView: 'report.security.view',
  },
} as const;
