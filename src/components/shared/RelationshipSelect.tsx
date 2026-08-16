import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RELATIONSHIP_TYPES } from '@/lib/constants/demographics';

export interface RelationshipSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

/** Father/Mother/Spouse/Child selector shared by both Owner and Tenant Household steps. */
export function RelationshipSelect({ value, onChange, placeholder = 'Select relationship' }: RelationshipSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {RELATIONSHIP_TYPES.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
