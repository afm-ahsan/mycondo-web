import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MODULE_CATALOGUE } from '../lib/moduleKeys';

interface ModuleSelectionStepProps {
  defaultModuleKeys: string[];
  isSubmitting: boolean;
  onSubmit: (moduleKeys: string[]) => void;
  onBack: () => void;
}

export function ModuleSelectionStep({
  defaultModuleKeys,
  isSubmitting,
  onSubmit,
  onBack,
}: ModuleSelectionStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultModuleKeys));

  function toggle(key: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Choose which product modules this organization can use. All are enabled by default; uncheck
        any that don&apos;t apply yet — this can be changed later from the organization&apos;s detail page.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="button" disabled={isSubmitting} onClick={() => onSubmit([...selected])}>
          {isSubmitting ? 'Creating…' : 'Create Organization'}
        </Button>
      </div>
    </div>
  );
}
