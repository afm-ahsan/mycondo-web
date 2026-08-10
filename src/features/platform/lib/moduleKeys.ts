// Mirrors TenantModuleKeys.cs (mycondo-api Domain/Features/Tenancy) exactly. Accepted duplication —
// same precedent as permissionKeys.ts duplicating the backend permission catalogue; no generated-client
// mechanism shares a bare string[] constant.
export interface ModuleCatalogueEntry {
  key: string;
  label: string;
}

export const MODULE_CATALOGUE: ModuleCatalogueEntry[] = [
  { key: 'property', label: 'Property' },
  { key: 'billing', label: 'Billing' },
  { key: 'payments', label: 'Payments' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'documents', label: 'Documents' },
  { key: 'reporting', label: 'Reporting' },
  { key: 'security', label: 'Security' },
  { key: 'leasing', label: 'Leasing' },
  { key: 'residents', label: 'Residents' },
  { key: 'utilities', label: 'Utilities' },
  { key: 'amenities', label: 'Amenities' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'operations', label: 'Operations' },
];

export const ALL_MODULE_KEYS: string[] = MODULE_CATALOGUE.map((m) => m.key);

export function moduleLabel(key: string): string {
  return MODULE_CATALOGUE.find((m) => m.key === key)?.label ?? key;
}
