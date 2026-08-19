export const throttle = (
  func: (...args: unknown[]) => void,
  limit: number,
): ((...args: unknown[]) => void) => {
  let lastFunc: ReturnType<typeof setTimeout> | null = null;
  let lastRan: number | null = null;

  return function (this: unknown, ...args: unknown[]) {
    if (lastRan === null) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      if (lastFunc !== null) {
        clearTimeout(lastFunc);
      }
      lastFunc = setTimeout(
        () => {
          if (Date.now() - (lastRan as number) >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        },
        limit - (Date.now() - (lastRan as number)),
      );
    }
  };
};

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function uid(): string {
  return (Date.now() + Math.floor(Math.random() * 1000)).toString();
}

/** `crypto.randomUUID()` only exists in secure contexts (HTTPS/localhost) — on a plain-HTTP origin
 * it's `undefined`, which broke login in production (TypeError in RTK Query's prepareHeaders). Falls
 * back to `crypto.getRandomValues` (available in all contexts, unlike randomUUID) to build an RFC 4122
 * v4 UUID; use this instead of calling `crypto.randomUUID()` directly anywhere in the app. */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getInitials(
  name: string | null | undefined,
  count?: number,
): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase());

  return count && count > 0
    ? initials.slice(0, count).join('')
    : initials.join('');
}

export function toAbsoluteUrl(pathname: string): string {
  const baseUrl = import.meta.env.BASE_URL;

  if (baseUrl && baseUrl !== '/') {
    return import.meta.env.BASE_URL + pathname;
  } else {
    return pathname;
  }
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((now.getTime() - inputDate.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600)
    return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) > 1 ? 's' : ''} ago`;
  if (diff < 86400)
    return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  if (diff < 604800)
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  if (diff < 2592000)
    return `${Math.floor(diff / 604800)} week${Math.floor(diff / 604800) > 1 ? 's' : ''} ago`;
  if (diff < 31536000)
    return `${Math.floor(diff / 2592000)} month${Math.floor(diff / 2592000) > 1 ? 's' : ''} ago`;

  return `${Math.floor(diff / 31536000)} year${Math.floor(diff / 31536000) > 1 ? 's' : ''} ago`;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Parses a bare "YYYY-MM-DD" string as local midnight rather than UTC midnight, so calendar-day
 * reads (getFullYear/getMonth/getDate) and display never shift backward/forward depending on the
 * viewer's timezone offset from UTC. Non-date-only input passes straight to `new Date(...)`. Use this
 * (not `new Date(...)` directly) anywhere a date-only value needs calendar-day arithmetic, not just
 * final display — formatDate below is the display-only convenience wrapper around it. */
export function parseDateOnly(input: Date | string | number): Date {
  return typeof input === 'string' && DATE_ONLY_PATTERN.test(input) ? new Date(`${input}T00:00:00`) : new Date(input);
}

/** Standard MyCondo date-only display, e.g. "August 18, 2026". Safe against null/undefined/invalid input. */
export function formatDate(input: Date | string | number | null | undefined): string {
  if (input === null || input === undefined || input === '') return '—';
  const date = parseDateOnly(input);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// MyCondo currently operates in a single property timezone (Akter Residence Park, Bangladesh).
// There is no org/property-level timezone setting in the API contract yet, so this is pinned here
// rather than left to the viewer's device — a UTC instant must read as the same wall-clock business
// time for every viewer regardless of where their browser happens to be set.
const BUSINESS_TIME_ZONE = 'Asia/Dhaka';

/** Standard MyCondo date-time display, e.g. "August 18, 2026 at 5:56 AM" — no seconds. Safe against
 * null/undefined/invalid input. Renders in the fixed MyCondo business timezone, not the viewer's
 * device timezone, so a UTC instant displays identically for every viewer. */
export function formatDateTime(input: Date | string | number | null | undefined): string {
  if (input === null || input === undefined || input === '') return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
}

// Centralized here per UX-3 — previously duplicated byte-for-byte in amenities/lib/format.ts and
// operations/lib/format.ts, each anticipating this exact consolidation once Billing/Payments got a
// frontend slice.
const bdtFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BDT',
  currencyDisplay: 'symbol',
});

export function formatBdt(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  return Number.isFinite(numeric) ? bdtFormatter.format(numeric) : '—';
}

export function formatNumber(value: number | string | null | undefined, fractionDigits = 2): string {
  if (value === null || value === undefined) return '—';
  const numeric = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numeric) ? numeric.toFixed(fractionDigits) : '—';
}

/** Turns a backend PascalCase/camelCase enum or status member (e.g. "AwaitingCollection") into a
 * human-readable label ("Awaiting Collection"). A value with no lowercase letters is left untouched —
 * that covers business codes/acronyms (e.g. "AISHA", "NID", "INV-2026-0012") that must not be split.
 * Prefer an explicit label map for business-vocabulary statuses; use this as the generic fallback. */
export function formatLabel(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  if (!/[a-z]/.test(value)) return value;

  const spaced = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();

  return spaced
    .split(' ')
    .filter(Boolean)
    .map((word) => (/[a-z]/.test(word) ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}
