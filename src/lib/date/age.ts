/**
 * Parses an ISO `yyyy-MM-dd` string into a local-midnight `Date` by reading its Y/M/D components
 * directly, rather than `new Date(dateString)` — a date-only string parses as UTC midnight while
 * `new Date(y, m, d)` constructs local midnight, and mixing the two silently shifts the result by the
 * viewer's UTC offset (e.g. a "today" DOB reading as tomorrow for anyone east of UTC, including
 * Bangladesh at UTC+6). Returns `null` for a blank/malformed string.
 */
function parseIsoDateLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Computes whole-years age from an ISO `yyyy-MM-dd` date-of-birth string, accounting for whether the
 * birthday has occurred yet this year (not a naive `currentYear - birthYear`). Returns `null` for a
 * blank/unparsable/future date so callers can render an empty state instead of a bogus age.
 */
export function calculateAge(dateOfBirth: string | null | undefined, now: Date = new Date()): number | null {
  const dob = parseIsoDateLocal(dateOfBirth);
  if (!dob) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (dob.getTime() > today.getTime()) return null;

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

/** True when the given ISO `yyyy-MM-dd` date string is strictly after today. */
export function isFutureDate(dateOfBirth: string | null | undefined, now: Date = new Date()): boolean {
  const dob = parseIsoDateLocal(dateOfBirth);
  if (!dob) return false;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return dob.getTime() > today.getTime();
}
