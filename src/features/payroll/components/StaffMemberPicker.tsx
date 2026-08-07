import { useState } from 'react';
import { Button, ButtonArrow } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useStaffMembers } from '../api/staffAttendanceApi';

interface StaffMemberPickerProps {
  value: string;
  label: string;
  onChange: (staffMemberId: string, label: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Search-first staff-member picker for the attendance register's employee filter. Mirrors
 * WorkerSelect's pattern, but there is no GetById endpoint for StaffMember, so the caller must also
 * hold on to the display label it selected (see AttendanceRegisterPage's staffMemberLabel state) —
 * a fresh page load from a URL that already has ?staffMemberId= falls back to showing the ID until a
 * row of register data (which carries staffMemberFullName) or a fresh pick resolves the name.
 */
export function StaffMemberPicker({ value, label, onChange, onClear, disabled }: StaffMemberPickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebouncedValue(inputValue.trim());

  const { data, isFetching } = useStaffMembers({ search: debouncedSearch || undefined, page: 1, pageSize: 20 });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          mode="input"
          placeholder={!value}
          aria-expanded={open}
          disabled={disabled}
          className="w-full sm:w-64"
        >
          {value ? <span className="truncate">{label || value}</span> : <span>Filter by employee…</span>}
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput value={inputValue} onValueChange={setInputValue} placeholder="Search by name…" />
          <CommandList>
            {isFetching ? (
              <CommandEmpty>Searching…</CommandEmpty>
            ) : (
              <CommandEmpty>No staff member found.</CommandEmpty>
            )}
            {value && (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onClear();
                    setOpen(false);
                  }}
                >
                  Clear filter
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {data?.items.map((staffMember) => (
                <CommandItem
                  key={staffMember.staffMemberId}
                  value={staffMember.staffMemberId}
                  onSelect={() => {
                    onChange(staffMember.staffMemberId, staffMember.fullName);
                    setOpen(false);
                  }}
                >
                  <span className="flex flex-col">
                    <span>
                      {staffMember.fullName} ({staffMember.role})
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
