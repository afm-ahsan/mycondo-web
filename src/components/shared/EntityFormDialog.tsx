import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** 'sm' for a 3-4 field form; omit for the default (matches the existing Dialog default, max-w-lg). */
  size?: 'sm';
  children: ReactNode;
}

/**
 * Shared chrome for "create/register in a modal" forms — factors out the Dialog/DialogContent/
 * DialogHeader boilerplate that create-modal forms across the app repeat. Does not own form state,
 * submission, or footer buttons: pass the RHF <Form>/<form> (including its own DialogFooter and
 * submit button) as children, same shape as the FlatFormDialog/ExpenseTypeFormDialog precedent.
 */
export function EntityFormDialog({ open, onOpenChange, title, description, size, children }: EntityFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={size === 'sm' ? 'sm:max-w-md' : undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
