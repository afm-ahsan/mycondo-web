import * as React from 'react';
import { Input } from '@/components/ui/input';
import { calculateAge } from '@/lib/date/age';

export interface DateOfBirthWithAgeProps extends Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange'> {
  value?: string | null;
  onChange?: (value: string) => void;
}

/**
 * Date-of-birth input with a live-calculated "Age: N years" caption underneath — age is always
 * derived from DOB (never independently entered or persisted), so it can't drift out of sync. Renders
 * nothing for the age line when the date is blank; the browser's native date input already blocks
 * malformed values, and future-date rejection is enforced separately by form/API validation.
 */
export function DateOfBirthWithAge({ value, onChange, ...props }: DateOfBirthWithAgeProps) {
  const age = calculateAge(value);

  return (
    <div className="space-y-1">
      <Input
        type="date"
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        max={new Date().toISOString().slice(0, 10)}
        {...props}
      />
      {age !== null && <p className="text-muted-foreground text-xs">Age: {age} years</p>}
    </div>
  );
}
