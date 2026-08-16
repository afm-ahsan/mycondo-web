import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { type buttonVariants } from '@/components/ui/button';
import { type VariantProps } from 'class-variance-authority';

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  onConfirm: () => void;
  /** Visual weight of the confirm button. Defaults to `destructive`, this component's original and
   * still most common use (Deactivate/Delete); pass `primary` for reversible confirmations like
   * re-enabling something. */
  confirmVariant?: VariantProps<typeof buttonVariants>['variant'];
  /** Optional icon rendered above the title, centered (e.g. a warning glyph in a soft-colored circle). */
  icon?: React.ReactNode;
}

/**
 * Lightweight confirm-before-mutating step, built on the app's existing AlertDialog convention (see
 * UsersPage's Disable confirmation) — not a new dialog framework. The confirm button calls
 * `event.preventDefault()` to stop Radix's default close-on-click, so the dialog stays open and shows
 * the loading state while the mutation is in flight; the caller closes it (via `onOpenChange(false)`)
 * once the mutation settles. Promoted here from payroll (UX-2) once a second feature (utilities,
 * UX-3) needed the identical pattern — feature-local status/domain logic stays in each feature; this
 * component itself has none.
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  loadingLabel,
  isLoading,
  onConfirm,
  confirmVariant = 'destructive',
  icon,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {icon && <div className="mx-auto">{icon}</div>}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={confirmVariant}
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {isLoading ? loadingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
