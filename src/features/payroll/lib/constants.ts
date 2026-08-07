// Mirrors mycondo-api's StaffRole and AttendanceSource enums (Domain/Features/Payroll).
export const STAFF_ROLES = ['Guard', 'Cleaner', 'Technician', 'Gardener', 'Other'] as const;
export const ATTENDANCE_SOURCES = ['Manual', 'Gate', 'Device'] as const;
