import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PASSWORD_REQUIREMENTS } from '@/lib/validation/password';

interface PasswordRequirementsChecklistProps {
  value: string;
  className?: string;
}

/** Live checklist of the password policy, shown while the user types — each requirement flips
 * between met/unmet as `value` changes. Callers should only render this once the field has been
 * interacted with, so it doesn't show all-red before the user has typed anything. */
export function PasswordRequirementsChecklist({ value, className }: PasswordRequirementsChecklistProps) {
  return (
    <ul className={cn('grid gap-1 text-xs', className)}>
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const met = requirement.test(value);
        return (
          <li
            key={requirement.key}
            className={cn(
              'flex items-center gap-1.5',
              met ? 'text-[var(--color-success,var(--color-green-600))]' : 'text-muted-foreground',
            )}
          >
            {met ? <Check className="size-3.5 shrink-0" /> : <X className="size-3.5 shrink-0" />}
            <span>{requirement.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
