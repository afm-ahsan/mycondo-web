import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9\s]/;

export interface PasswordRequirement {
  key: string;
  label: string;
  test: (value: string) => boolean;
}

/** Single source of truth for the password policy checklist/tooltip — mirrors the backend's shared
 * `MustBeAStrongPassword` FluentValidation rule (min 6, upper, lower, digit, special char). The
 * backend remains authoritative; this drives client-side UX only. */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { key: 'length', label: `Minimum ${PASSWORD_MIN_LENGTH} characters`, test: (v) => v.length >= PASSWORD_MIN_LENGTH },
  { key: 'uppercase', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'lowercase', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /\d/.test(v) },
  { key: 'special', label: 'One special character (e.g. !@#$%)', test: (v) => SPECIAL_CHAR_REGEX.test(v) },
];

export function isPasswordStrong(value: string): boolean {
  return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(value));
}

/** Required password field — use for every new/changed password. */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` })
  .max(PASSWORD_MAX_LENGTH, { message: 'Password is too long.' })
  .regex(/[A-Z]/, { message: 'Password must include an uppercase letter.' })
  .regex(/[a-z]/, { message: 'Password must include a lowercase letter.' })
  .regex(/\d/, { message: 'Password must include a digit.' })
  .regex(SPECIAL_CHAR_REGEX, { message: 'Password must include a special character (e.g. !@#$%).' });

const STRENGTH_MESSAGE =
  `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include an uppercase letter, ` +
  'a lowercase letter, a number, and a special character.';

/** Optional password field (e.g. "leave blank to auto-generate") — empty string/undefined passes. */
export const optionalPasswordSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || isPasswordStrong(value), { message: STRENGTH_MESSAGE });
