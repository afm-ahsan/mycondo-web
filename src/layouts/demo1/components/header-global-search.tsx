import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { hasPermission } from '@/lib/auth/permissions';
import { useAppSelector } from '@/store/hooks';
import { useResidents } from '@/features/residents/api/residentsApi';

const SEARCH_PAGE_SIZE = 8;

/**
 * Tenant global search — scoped to Residents today, the only tenant list backed by a real `search`
 * query param (GET /api/v1/residents) with an existing filterable list page to land on. Other
 * directories (Buildings/Flats, Visitors, etc.) don't expose a comparable text-search endpoint yet;
 * widen this once they do rather than simulating search over client-loaded data.
 */
export function HeaderGlobalSearch() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebouncedValue(inputValue.trim());

  const { data, isFetching } = useResidents(
    debouncedSearch.length >= 2 ? { search: debouncedSearch, page: 1, pageSize: SEARCH_PAGE_SIZE } : skipToken,
  );

  if (!hasPermission(user, 'resident.view')) {
    return null;
  }

  function go(resident: { fullName: string }) {
    setOpen(false);
    setInputValue('');
    navigate(`/residents?search=${encodeURIComponent(resident.fullName)}`);
  }

  return (
    <>
      <Button variant="ghost" mode="icon" aria-label="Search residents" onClick={() => setOpen(true)}>
        <Search className="text-muted-foreground/70" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <DialogTitle className="hidden" />
          {/* shouldFilter=false: results are already server-filtered by search text, and cmdk's
              default client-side filter matches against `value` (the resident GUID here), which
              would hide every result. */}
          <Command shouldFilter={false}>
            <CommandInput value={inputValue} onValueChange={setInputValue} placeholder="Search residents…" />
            <CommandList>
              {debouncedSearch.length < 2 ? (
                <CommandEmpty>Type at least 2 characters to search residents.</CommandEmpty>
              ) : isFetching ? (
                <CommandEmpty>Searching…</CommandEmpty>
              ) : (
                <CommandEmpty>No residents found.</CommandEmpty>
              )}
              <CommandGroup heading="Residents">
                {data?.items.map((resident) => (
                  <CommandItem key={resident.residentId} value={resident.residentId} onSelect={() => go(resident)}>
                    <span className="flex flex-col">
                      <span>{resident.fullName}</span>
                      {resident.phone && <span className="text-muted-foreground text-xs">{resident.phone}</span>}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
