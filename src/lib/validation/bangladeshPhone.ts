import { z } from 'zod';

const LOCAL_MOBILE_LENGTH = 10;
const CANONICAL_REGEX = /^\+8801[3-9][0-9]{8}$/;

function stripFormatting(raw: string): string {
  return raw.replace(/[\s\-()]/g, '');
}

/**
 * Reduces arbitrary typed/pasted input down to at most the 10-digit local mobile portion
 * (`1XXXXXXXXX`): strips spaces/hyphens/parentheses, recognizes and removes a `+880`/`880` country
 * code or a domestic trunk `0` prefix if present, then drops any remaining non-digit characters.
 * Mirrors the backend's `BangladeshMobileNumber` normalizer so client and server agree on the same
 * shape — this is UX sanitization only, the backend remains authoritative for validation.
 */
export function toLocalMobileDigits(raw: string): string {
  const cleaned = stripFormatting(raw);
  let digits = cleaned;
  if (digits.startsWith('+880')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('880') && digits.length > 10) {
    digits = digits.slice(3);
  } else if (digits.startsWith('+')) {
    digits = digits.slice(1);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.replace(/\D/g, '').slice(0, LOCAL_MOBILE_LENGTH);
}

/** Local 10-digit portion → canonical `+8801XXXXXXXXX` (or `''` when empty). */
export function toCanonicalBangladeshMobile(localDigits: string): string {
  return localDigits ? `+880${localDigits}` : '';
}

/** Canonical (or loosely-formatted legacy) value → the local digits `BangladeshPhoneInput` displays. */
export function localMobileDigitsFromValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.startsWith('+880') ? value.slice(4) : toLocalMobileDigits(value);
}

export function isValidCanonicalBangladeshMobile(value: string): boolean {
  return CANONICAL_REGEX.test(value);
}

const INVALID_MESSAGE = 'Enter a valid Bangladesh mobile number.';

/** Validates the canonical `+8801XXXXXXXXX` string `BangladeshPhoneInput` produces. Required variant —
 * use {@link optionalBangladeshMobileSchema} for optional phone fields. */
export const bangladeshMobileSchema = z
  .string()
  .trim()
  .min(1, { message: 'Phone number is required.' })
  .refine((value) => CANONICAL_REGEX.test(value), { message: INVALID_MESSAGE });

export const optionalBangladeshMobileSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || CANONICAL_REGEX.test(value), { message: INVALID_MESSAGE });
