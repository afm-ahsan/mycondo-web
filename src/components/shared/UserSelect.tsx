import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useGetApiV1UsersQuery } from '@/api/generated/mycondoApi';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
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

export interface UserSelectValue {
  userId: string;
  fullName: string;
  email: string;
}

interface UserSelectProps {
  value: UserSelectValue | null;
  onChange: (user: UserSelectValue | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Search-first user picker (`GET /api/v1/users?searchText=`), mirroring `ResidentSelect`'s combobox
 * pattern — a tenant can have many users, so this searches by name/email rather than listing every
 * one in a plain `Select`.
 */
export function UserSelect({ value, onChange, disabled, placeholder = 'Search by name or email…' }: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebouncedValue(inputValue.trim());

  const { data, isFetching } = useGetApiV1UsersQuery(
    debouncedSearch.length >= 2 ? { searchText: debouncedSearch, isActive: true, page: 1, pageSize: 20 } : skipToken,
  );

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
          className="w-full"
        >
          {value ? (
            <span className="truncate">
              {value.fullName} ({value.email})
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput value={inputValue} onValueChange={setInputValue} placeholder="Search by name or email…" />
          <CommandList>
            {inputValue.trim().length < 2 ? (
              <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
            ) : isFetching ? (
              <CommandEmpty>Searching…</CommandEmpty>
            ) : (
              <CommandEmpty>No user found.</CommandEmpty>
            )}
            <CommandGroup>
              {data?.items.map((user) => (
                <CommandItem
                  key={user.userId}
                  value={user.userId}
                  onSelect={() => {
                    onChange({ userId: user.userId, fullName: user.fullName, email: user.email });
                    setOpen(false);
                  }}
                >
                  <span className="flex flex-col">
                    <span>{user.fullName}</span>
                    <span className="text-muted-foreground text-xs">{user.email}</span>
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
