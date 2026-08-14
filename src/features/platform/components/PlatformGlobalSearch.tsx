import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { hasPlatformPermission } from '@/lib/auth/platformPermissions';
import { PLATFORM_PERMISSIONS } from '@/lib/auth/platformPermissionKeys';
import { useAppSelector } from '@/store/hooks';
import { useListOrganizationsQuery } from '../api/platformOrganizationsApi';

const SEARCH_PAGE_SIZE = 8;

/**
 * Platform-scoped global search — the only searchable Platform resource today is Organizations (see
 * MENU_SIDEBAR_PLATFORM's doc comment for what mycondo-api actually exposes). Reuses the Organizations
 * list search filter the API already supports rather than a bespoke search subsystem.
 */
export function PlatformGlobalSearch() {
  const user = useAppSelector((s) => s.platformAuth.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const debouncedSearch = useDebouncedValue(inputValue.trim());

  const { data, isFetching } = useListOrganizationsQuery(
    debouncedSearch.length >= 2 ? { page: 1, pageSize: SEARCH_PAGE_SIZE, search: debouncedSearch } : skipToken,
  );

  if (!hasPlatformPermission(user, PLATFORM_PERMISSIONS.organization.read)) {
    return null;
  }

  function go(tenantId: string) {
    setOpen(false);
    setInputValue('');
    navigate(`/platform/organizations/${tenantId}`);
  }

  return (
    <>
      <Button variant="ghost" mode="icon" aria-label="Search organizations" onClick={() => setOpen(true)}>
        <Search className="text-muted-foreground/70" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <DialogTitle className="hidden" />
          {/* shouldFilter=false: results are already server-filtered by search text, and cmdk's
              default client-side filter matches against `value` (the tenant GUID here), which would
              hide every result. */}
          <Command shouldFilter={false}>
            <CommandInput value={inputValue} onValueChange={setInputValue} placeholder="Search organizations…" />
            <CommandList>
              {debouncedSearch.length < 2 ? (
                <CommandEmpty>Type at least 2 characters to search organizations.</CommandEmpty>
              ) : isFetching ? (
                <CommandEmpty>Searching…</CommandEmpty>
              ) : (
                <CommandEmpty>No organizations found.</CommandEmpty>
              )}
              <CommandGroup heading="Organizations">
                {data?.items.map((org) => (
                  <CommandItem key={org.tenantId} value={org.tenantId} onSelect={() => go(org.tenantId)}>
                    <span className="flex flex-col">
                      <span>{org.name}</span>
                      {org.code && <span className="text-muted-foreground text-xs">{org.code}</span>}
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
