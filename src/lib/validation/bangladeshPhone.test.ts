import { describe, expect, it } from 'vitest';
import {
  bangladeshMobileSchema,
  isValidCanonicalBangladeshMobile,
  localMobileDigitsFromValue,
  optionalBangladeshMobileSchema,
  toCanonicalBangladeshMobile,
  toLocalMobileDigits,
} from './bangladeshPhone';

describe('toLocalMobileDigits', () => {
  it.each([
    ['1323993388', '1323993388'],
    ['01323993388', '1323993388'],
    ['8801323993388', '1323993388'],
    ['+8801323993388', '1323993388'],
    ['+880 1323 993 388', '1323993388'],
    ['+880-1323-993-388', '1323993388'],
    ['01323 993 388', '1323993388'],
    ['01323-993-388', '1323993388'],
    ['(01323) 993388', '1323993388'],
  ])('normalizes %s to the local digits %s', (input, expected) => {
    expect(toLocalMobileDigits(input)).toBe(expected);
  });

  it('caps the result at 10 digits', () => {
    expect(toLocalMobileDigits('13239933888')).toBe('1323993388');
  });

  it('drops non-digit characters instead of silently keeping them', () => {
    expect(toLocalMobileDigits('abcdefghij')).toBe('');
  });

  it('does not double-prefix a pasted +880 number', () => {
    expect(toLocalMobileDigits('+8801323993388')).toBe('1323993388');
    expect(toCanonicalBangladeshMobile(toLocalMobileDigits('+8801323993388'))).toBe('+8801323993388');
  });
});

describe('toCanonicalBangladeshMobile / localMobileDigitsFromValue', () => {
  it('round-trips local digits through the canonical value', () => {
    const canonical = toCanonicalBangladeshMobile('1323993388');
    expect(canonical).toBe('+8801323993388');
    expect(localMobileDigitsFromValue(canonical)).toBe('1323993388');
  });

  it('returns an empty string for empty/null/undefined input', () => {
    expect(toCanonicalBangladeshMobile('')).toBe('');
    expect(localMobileDigitsFromValue(null)).toBe('');
    expect(localMobileDigitsFromValue(undefined)).toBe('');
  });
});

describe('isValidCanonicalBangladeshMobile', () => {
  it.each(['+8801323993388', '+8801712345678', '+8801812345678', '+8801912345678'])(
    'accepts %s',
    (value) => {
      expect(isValidCanonicalBangladeshMobile(value)).toBe(true);
    },
  );

  it.each(['+880132399338', '+88013239933888', '01323993388', '+880', ''])('rejects %s', (value) => {
    expect(isValidCanonicalBangladeshMobile(value)).toBe(false);
  });
});

describe('bangladeshMobileSchema (required)', () => {
  it('accepts a canonical value', () => {
    expect(bangladeshMobileSchema.safeParse('+8801323993388').success).toBe(true);
  });

  it('rejects an empty value', () => {
    const result = bangladeshMobileSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects a non-canonical value', () => {
    const result = bangladeshMobileSchema.safeParse('01323993388');
    expect(result.success).toBe(false);
  });
});

describe('optionalBangladeshMobileSchema', () => {
  it('accepts an empty value', () => {
    expect(optionalBangladeshMobileSchema.safeParse('').success).toBe(true);
  });

  it('accepts a canonical value', () => {
    expect(optionalBangladeshMobileSchema.safeParse('+8801323993388').success).toBe(true);
  });

  it('rejects a non-canonical value', () => {
    expect(optionalBangladeshMobileSchema.safeParse('123').success).toBe(false);
  });
});
