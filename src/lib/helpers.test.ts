import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './helpers';

// Pin a fixed, known offset (Asia/Dhaka, UTC+6, no DST) so hour-sensitive assertions below are
// deterministic regardless of the timezone of the machine/CI running the suite.
let originalTz: string | undefined;
beforeEach(() => {
  originalTz = process.env.TZ;
  process.env.TZ = 'Asia/Dhaka';
});
afterEach(() => {
  process.env.TZ = originalTz;
});

describe('formatDate', () => {
  it('formats a date-only ISO string as "Month D, YYYY"', () => {
    expect(formatDate('2026-08-18')).toBe('August 18, 2026');
  });

  it('does not shift a date-only value to the previous/next day in a behind-UTC timezone', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(formatDate('2026-08-18')).toBe('August 18, 2026');
  });

  it('formats a full timestamp string down to its calendar date', () => {
    expect(formatDate('2026-08-18T05:56:11Z')).toBe('August 18, 2026');
  });

  it('returns the placeholder for null/undefined/empty input', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('returns the placeholder instead of "Invalid Date" for an unparsable value', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('formats a timestamp as "Month D, YYYY at h:mm AM/PM" with no seconds', () => {
    expect(formatDateTime('2026-08-18T05:56:11Z')).toBe('August 18, 2026 at 11:56 AM');
  });

  it('formats a PM timestamp correctly', () => {
    expect(formatDateTime('2026-08-18T13:30:00Z')).toBe('August 18, 2026 at 7:30 PM');
  });

  it('never includes seconds', () => {
    expect(formatDateTime('2026-08-18T05:56:11Z')).not.toMatch(/:\d{2}:\d{2}/);
  });

  it('returns the placeholder for null/undefined/empty input', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('')).toBe('—');
  });

  it('returns the placeholder instead of "Invalid Date" for an unparsable value', () => {
    expect(formatDateTime('not-a-date')).toBe('—');
  });

  it('always renders in the MyCondo business timezone (Asia/Dhaka), regardless of the viewer device timezone', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(formatDateTime('2026-08-18T05:56:11Z')).toBe('August 18, 2026 at 11:56 AM');
  });
});
