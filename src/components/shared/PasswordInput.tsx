import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PasswordInputProps extends Omit<ComponentProps<typeof Input>, 'type'> {
  /** Used in the show/hide button's accessible name, e.g. "current password". Defaults to "password". */
  label?: string;
}

/** Password `Input` with a built-in show/hide toggle — the reusable version of the eye-icon pattern
 * every password field in this app used to hand-roll. */
export function PasswordInput({ label = 'password', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} {...props} />
      <Button
        type="button"
        variant="ghost"
        mode="icon"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        aria-pressed={visible}
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
      >
        {visible ? <EyeOff className="text-muted-foreground" /> : <Eye className="text-muted-foreground" />}
      </Button>
    </div>
  );
}
