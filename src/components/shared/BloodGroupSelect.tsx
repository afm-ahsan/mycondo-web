import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BLOOD_GROUPS } from '@/lib/constants/demographics';

export interface BloodGroupSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function BloodGroupSelect({ value, onChange, placeholder = 'Select (optional)' }: BloodGroupSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {BLOOD_GROUPS.map((g) => (
          <SelectItem key={g} value={g}>
            {g}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
