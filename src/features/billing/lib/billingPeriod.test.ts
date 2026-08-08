import { describe, expect, it } from 'vitest';
import { formatBillingPeriod } from './billingPeriod';

describe('formatBillingPeriod', () => {
  it('collapses a full calendar month to "Month Year"', () => {
    expect(formatBillingPeriod('2026-08-01', '2026-08-31')).toBe('August 2026');
  });

  it('handles a full-month February correctly regardless of leap year', () => {
    expect(formatBillingPeriod('2026-02-01', '2026-02-28')).toBe('February 2026');
  });

  it('shows both bounds for a non-full-month range', () => {
    expect(formatBillingPeriod('2026-08-10', '2026-08-20')).toBe('Aug 10 – Aug 20, 2026');
  });

  it('shows both bounds for a single-day range (e.g. a utility reading period)', () => {
    expect(formatBillingPeriod('2026-08-15', '2026-08-15')).toBe('Aug 15 – Aug 15, 2026');
  });
});
