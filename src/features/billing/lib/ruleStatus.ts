import type { ServiceChargeRuleDto } from '@/api/generated/mycondoApi';

/**
 * Client-side-derived DISPLAY label only — never used to gate the Deactivate/End-Effective-Period
 * actions (those are gated purely by `isActive`, matching backend truth exactly). Mirrors the
 * `isAssignmentExpired` precedent from UX-2's Domestic Worker assignments: a rule whose
 * `effectiveTo` has passed is still `isActive: true` server-side until someone deactivates it: this
 * only affects whether NEW invoices apply it (via `AppliesToPeriod`), not this label.
 */
export function ruleDisplayStatus(rule: ServiceChargeRuleDto): 'Active' | 'Ended' | 'Inactive' {
  if (!rule.isActive) return 'Inactive';
  if (rule.effectiveTo && rule.effectiveTo < new Date().toISOString().slice(0, 10)) return 'Ended';
  return 'Active';
}
