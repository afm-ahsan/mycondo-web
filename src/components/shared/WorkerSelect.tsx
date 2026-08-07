import { useEffect, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useGetApiV1DomesticWorkersQuery } from '@/api/generated/mycondoApi';
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

export interface WorkerSelectValue {
  domesticWorkerProfileId: string;
  fullName: string;
  phone: string;
  workerType: string;
}

interface WorkerSelectProps {
  value: WorkerSelectValue | null;
  onChange: (worker: WorkerSelectValue | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Search-first domestic worker/driver picker (`GET /api/v1/domestic-workers?search=`) — mirrors
 * `ResidentSelect` exactly. A "driver" is a `DomesticWorkerProfile` with `workerType: "Driver"`, not a
 * separate concept, so this one selector covers both maids/cooks/etc. and drivers.
 */
export function WorkerSelect({
  value,
  onChange,
  disabled,
  placeholder = 'Search by worker name or mobile…',
}: WorkerSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(inputValue.trim()), 300);
    return () => clearTimeout(handle);
  }, [inputValue]);

  const { data, isFetching } = useGetApiV1DomesticWorkersQuery(
    debouncedSearch.length >= 2 ? { search: debouncedSearch, page: 1, pageSize: 20 } : skipToken,
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
              {value.fullName} ({value.workerType})
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ButtonArrow />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput value={inputValue} onValueChange={setInputValue} placeholder="Search by name or mobile…" />
          <CommandList>
            {inputValue.trim().length < 2 ? (
              <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
            ) : isFetching ? (
              <CommandEmpty>Searching…</CommandEmpty>
            ) : (
              <CommandEmpty>No worker found.</CommandEmpty>
            )}
            <CommandGroup>
              {data?.items.map((worker) => (
                <CommandItem
                  key={worker.domesticWorkerProfileId}
                  value={worker.domesticWorkerProfileId}
                  onSelect={() => {
                    onChange({
                      domesticWorkerProfileId: worker.domesticWorkerProfileId,
                      fullName: worker.fullName,
                      phone: worker.phone,
                      workerType: worker.workerType,
                    });
                    setOpen(false);
                  }}
                >
                  <span className="flex flex-col">
                    <span>
                      {worker.fullName} ({worker.workerType})
                    </span>
                    <span className="text-muted-foreground text-xs">{worker.phone}</span>
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
