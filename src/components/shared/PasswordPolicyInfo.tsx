import { useState } from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PASSWORD_REQUIREMENTS } from '@/lib/validation/password';

/** Info icon beside a password field's label. Opens on mouse hover, keyboard focus, or tap (Radix
 * Popover's trigger already handles click, which mobile browsers fire on tap even without focus). */
export function PasswordPolicyInfo() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Password requirements"
          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          <Info className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-3 text-sm"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <p className="mb-2 font-medium text-foreground">Password must contain at least:</p>
        <ul className="space-y-1 text-muted-foreground">
          {PASSWORD_REQUIREMENTS.map((requirement) => (
            <li key={requirement.key} className="flex items-start gap-1.5">
              <span aria-hidden="true">•</span>
              <span>{requirement.label}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
