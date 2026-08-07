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
  // mycondo-api's Seed_Facility_Pool_Permissions.cs (Slice G) — Community Hall Booking.
  facility: {
    view: 'facility.view',
    manage: 'facility.manage',
    bookingView: 'facility.booking.view',
    bookingCreate: 'facility.booking.create',
    bookingApprove: 'facility.booking.approve',
    bookingCancel: 'facility.booking.cancel',
    bookingRefund: 'facility.booking.refund',
    bookingInspect: 'facility.booking.inspect',
  },
  // mycondo-api's Seed_Facility_Pool_Permissions.cs (Slice G) — Swimming Pool Management.
  // pool.override is checked mid-handler by the backend (a data-dependent bypass decision the
  // endpoint filter can't make in advance), not enforced by any single endpoint's permission
  // attribute — see CheckInPoolSessionCommandHandler. Still listed here so the frontend can gate the
  // "override" UI affordance itself.
  pool: {
    view: 'pool.view',
    manage: 'pool.manage',
    checkin: 'pool.checkin',
    checkout: 'pool.checkout',
    override: 'pool.override',
    incidentManage: 'pool.incident.manage',
  },
  // mycondo-api's Seed_Operations_Permissions.cs (Slice H) — Generator Management.
  generator: {
    view: 'generator.view',
    manage: 'generator.manage',
    operationManage: 'generator.operation.manage',
    fuelManage: 'generator.fuel.manage',
    maintenanceManage: 'generator.maintenance.manage',
    report: 'generator.report',
  },
  // mycondo-api's Seed_Operations_Permissions.cs (Slice H) — Gas Cylinder Management.
  gasCylinder: {
    view: 'gascylinder.view',
    purchaseManage: 'gascylinder.purchase.manage',
    stockManage: 'gascylinder.stock.manage',
    approve: 'gascylinder.approve',
    report: 'gascylinder.report',
  },
  report: {
    securityView: 'report.security.view',
    facility: 'report.facility',
  },
} as const;
