import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDERS } from '@/lib/constants/demographics';

export interface GenderSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function GenderSelect({ value, onChange, placeholder = 'Select gender' }: GenderSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {GENDERS.map((g) => (
          <SelectItem key={g} value={g}>
            {g}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
