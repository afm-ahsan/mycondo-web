import { describe, expect, it } from 'vitest';
import { calculateAge, isFutureDate } from './age';

const NOW = new Date('2026-08-16T00:00:00');

describe('calculateAge', () => {
  it('returns null for a blank date', () => {
    expect(calculateAge('', NOW)).toBeNull();
    expect(calculateAge(null, NOW)).toBeNull();
    expect(calculateAge(undefined, NOW)).toBeNull();
  });

  it('returns null for a future date', () => {
    expect(calculateAge('2026-08-17', NOW)).toBeNull();
  });

  it('computes age when the birthday has already occurred this year', () => {
    expect(calculateAge('1990-06-15', NOW)).toBe(36);
  });

  it('computes age when the birthday is later this year (not yet occurred)', () => {
    expect(calculateAge('1990-12-15', NOW)).toBe(35);
  });

  it('computes age correctly on the exact birthday', () => {
    expect(calculateAge('1990-08-16', NOW)).toBe(36);
  });

  it('computes age correctly the day before the birthday', () => {
    expect(calculateAge('1990-08-17', NOW)).toBe(35);
  });
});

describe('isFutureDate', () => {
  it('is false for a blank date', () => {
    expect(isFutureDate('', NOW)).toBe(false);
  });

  it('is true for a date after today', () => {
    expect(isFutureDate('2026-08-17', NOW)).toBe(true);
  });

  it('is false for today', () => {
    expect(isFutureDate('2026-08-16', NOW)).toBe(false);
  });

  it('is false for a past date', () => {
    expect(isFutureDate('1990-01-01', NOW)).toBe(false);
  });
});
