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
    // mycondo-api's Seed_Permission_Catalogue.cs — pre-existing, previously unconsumed by any
    // endpoint until UX-5's Financial Summary/Receivables Ageing reports.
    financialView: 'report.financial.view',
  },
  // mycondo-api's Seed_Leasing_Permissions.cs — Tenant Registration. Domain/permission names use
  // "occupancyRegistration" to avoid colliding with this app's own multi-tenancy vocabulary; "Tenant
  // Registration" remains the label used in UI copy and menu titles.
  occupancyRegistration: {
    view: 'occupancy-registration.view',
    create: 'occupancy-registration.create',
    ownerReview: 'occupancy-registration.owner-review',
    verify: 'occupancy-registration.verify',
    moveOut: 'occupancy-registration.move-out',
    securityView: 'occupancy-registration.security-view',
  },
  // mycondo-api's Seed_Security_Permissions.cs — Vehicle Access.
  vehicle: {
    create: 'vehicle.create',
    view: 'vehicle.view',
    blockManage: 'vehicle.block.manage',
    checkin: 'vehicle.checkin',
    checkout: 'vehicle.checkout',
    override: 'vehicle.override',
  },
  // mycondo-api's Seed_DomesticWorker_ServiceProvider_StaffAttendance_SebaVisitor_Permissions.cs.
  // Note: named "domesticworker" (not "domesticstaff") to match what the API actually enforces.
  domesticWorker: {
    manage: 'domesticworker.manage',
    view: 'domesticworker.view',
    assignmentManage: 'domesticworker.assignment.manage',
    checkin: 'domesticworker.checkin',
    checkout: 'domesticworker.checkout',
    override: 'domesticworker.override',
  },
  serviceProvider: {
    manage: 'serviceprovider.manage',
    view: 'serviceprovider.view',
    assignmentManage: 'serviceprovider.assignment.manage',
    checkin: 'serviceprovider.checkin',
    checkout: 'serviceprovider.checkout',
    override: 'serviceprovider.override',
  },
  staffAttendance: {
    manage: 'staffattendance.manage',
    view: 'staffattendance.view',
    correct: 'staffattendance.correct',
    approve: 'staffattendance.approve',
  },
  // mycondo-api's Seed_Parcel_Permissions.cs. The close endpoint (POST /parcels/{id}/close) is gated
  // by parcel.return at the endpoint filter, but CloseParcelCommandHandler additionally requires
  // parcel.escalate when the chosen Outcome is LostOrEscalated (a data-dependent bypass decision the
  // filter can't make in advance) — same pattern as pool.override. Both permissions are needed to
  // escalate; parcel.return alone covers Returned/Rejected outcomes.
  parcel: {
    view: 'parcel.view',
    receive: 'parcel.receive',
    update: 'parcel.update',
    notify: 'parcel.notify',
    handover: 'parcel.handover',
    return: 'parcel.return',
    escalate: 'parcel.escalate',
  },
  // mycondo-api's Seed_Permission_Catalogue.cs — Service Charge Rules + Invoices (billing schema).
  billing: {
    ruleView: 'billing.rule.view',
    ruleManage: 'billing.rule.manage',
    invoiceView: 'billing.invoice.view',
    invoiceGenerate: 'billing.invoice.generate',
    invoiceVoid: 'billing.invoice.void',
  },
  // mycondo-api's Seed_Permission_Catalogue.cs + Seed_Payments_Permissions.cs (payments schema).
  payment: {
    view: 'payment.view',
    record: 'payment.record',
    reverse: 'payment.reverse',
  },
  residentAccount: {
    view: 'residentaccount.view',
    manage: 'residentaccount.manage',
  },
  // mycondo-api's Seed_Utility_Permissions.cs — shared across Electricity/Gas, discriminated by
  // utilityType, not by a separate permission per utility.
  utility: {
    meterView: 'utility.meter.view',
    meterManage: 'utility.meter.manage',
    ratePlanView: 'utility.rateplan.view',
    ratePlanManage: 'utility.rateplan.manage',
    readingView: 'utility.reading.view',
    readingRecord: 'utility.reading.record',
    readingFinalize: 'utility.reading.finalize',
    readingCorrect: 'utility.reading.correct',
    // mycondo-api's Seed_UtilityReport_Permission.cs (UX-5) — gates the 3 tenant-wide consumption/
    // reading-status/meter-status aggregate reports, separate from utility.reading.view (per-meter).
    report: 'utility.report',
  },
} as const;
