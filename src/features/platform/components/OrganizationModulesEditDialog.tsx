import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MODULE_CATALOGUE } from '../lib/moduleKeys';

interface OrganizationModulesEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialModuleKeys: string[];
  isSubmitting: boolean;
  onSubmit: (moduleKeys: string[]) => void;
}

export function OrganizationModulesEditDialog({
  open,
  onOpenChange,
  initialModuleKeys,
  isSubmitting,
  onSubmit,
}: OrganizationModulesEditDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialModuleKeys));

  useEffect(() => {
    if (open) setSelected(new Set(initialModuleKeys));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when the dialog (re)opens
  }, [open]);

  function toggle(key: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enabled Modules</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {MODULE_CATALOGUE.map((module) => (
            <label key={module.key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.has(module.key)}
                onCheckedChange={(checked) => toggle(module.key, checked === true)}
              />
              {module.label}
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => onSubmit([...selected])}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
