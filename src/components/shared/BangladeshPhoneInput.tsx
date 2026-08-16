import * as React from 'react';
import { Input, InputAddon, InputGroup } from '@/components/ui/input';
import {
  localMobileDigitsFromValue,
  toCanonicalBangladeshMobile,
  toLocalMobileDigits,
} from '@/lib/validation/bangladeshPhone';

export interface BangladeshPhoneInputProps
  extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'maxLength'> {
  value?: string | null;
  onChange?: (value: string) => void;
}

/**
 * Fixed, non-editable `+880` country-code prefix beside a 10-digit editable local mobile portion.
 * The controlled value/onChange contract is the canonical `+8801XXXXXXXXX` string (or `''`) — the
 * same shape ultimately submitted to the API — so it drops into `<FormField>` exactly like the
 * plain `Input` it replaces: `<BangladeshPhoneInput {...field} />`. Typing or pasting any common
 * variant (with/without country code, domestic trunk `0`, spaces/hyphens/parentheses) is sanitized
 * immediately to the local digits; the fixed `+880` addon is never part of the editable value.
 */
export function BangladeshPhoneInput({
  value,
  onChange,
  onPaste,
  placeholder = 'e.g. 1300000000',
  ...props
}: BangladeshPhoneInputProps) {
  const localDigits = localMobileDigitsFromValue(value);

  function emit(nextLocalDigits: string) {
    onChange?.(toCanonicalBangladeshMobile(nextLocalDigits));
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    emit(toLocalMobileDigits(event.target.value));
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text');
    if (!pasted) {
      return;
    }

    event.preventDefault();
    emit(toLocalMobileDigits(pasted));
    onPaste?.(event);
  }

  return (
    <InputGroup>
      <InputAddon>+880</InputAddon>
      <Input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={10}
        placeholder={placeholder}
        value={localDigits}
        onChange={handleChange}
        onPaste={handlePaste}
        {...props}
      />
    </InputGroup>
  );
}
