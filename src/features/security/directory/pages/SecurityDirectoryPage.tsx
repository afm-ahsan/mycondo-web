import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardHeading, CardTitle, CardToolbar } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { SearchInput } from '@/components/shared/SearchInput';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { toUserMessage } from '@/api/errors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useSecurityDirectory } from '../api/securityDirectoryApi';
import { ResidentCard } from '../components/ResidentCard';
import { ResidentDetailModal } from '../components/ResidentDetailModal';

const FILTER_DEFAULTS = { search: '', buildingId: '', flatId: '', accessStatus: '' };

/**
 * Permission-aware resident access verification for security staff — merges active Owner
 * (FlatOwnership) and Tenant (OccupancyRegistration) entries into one directory. Every request goes
 * through the dedicated `security.directory.*`-gated endpoints, which return only the sections the
 * caller's granular permissions authorize (see SecurityDirectoryDetailDto on the backend) — the modal
 * simply renders whatever it receives, it never decides what's visible.
 */
export function SecurityDirectoryPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const [selected, setSelected] = useState<{ entryId: string; residentType: string } | null>(null);

  const { data, isFetching, isError, error, refetch } = useSecurityDirectory({
    search: debouncedSearch || undefined,
    buildingId: filters.buildingId || undefined,
    flatId: filters.flatId || undefined,
    accessStatus: filters.accessStatus || undefined,
    page: 1,
    pageSize: 50,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setFilters({ search: value });
  }

  return (
    <>
      <PageHeader
        title="Security Directory"
        description="Resident access verification — owners and tenants currently on file."
        crumbs={[{ label: 'Security Directory' }]}
      />

      <Card>
        <CardHeader>
          <CardHeading className="w-full">
            <CardTitle>Security directory</CardTitle>
          </CardHeading>
          <CardToolbar className="w-full flex-wrap gap-2.5">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, flat, or mobile…"
              isSearching={isSearchPending}
              className="min-w-[200px] flex-1"
            />
            <div className="w-44 shrink-0">
              <BuildingSelect
                value={filters.buildingId || undefined}
                onValueChange={(id) => setFilters({ buildingId: id ?? '', flatId: '' })}
                placeholder="All buildings"
              />
            </div>
            <div className="w-44 shrink-0">
              <FlatSelect
                buildingId={filters.buildingId || undefined}
                value={filters.flatId || undefined}
                onValueChange={(id) => setFilters({ flatId: id ?? '' })}
                placeholder="All flats"
              />
            </div>
            <div className="w-40 shrink-0">
              <Select
                value={filters.accessStatus || 'all'}
                onValueChange={(v) => setFilters({ accessStatus: v === 'all' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Access status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All access statuses</SelectItem>
                  <SelectItem value="Authorized">Authorized</SelectItem>
                  <SelectItem value="Revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardToolbar>
        </CardHeader>
        <CardContent>
          {isError ? (
            <ErrorState description={toUserMessage(error)} onRetry={refetch} />
          ) : isFetching && !data ? (
            <LoadingSpinner />
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              icon={<UserRound className="size-8" aria-hidden="true" />}
              title="No residents found"
              description={
                debouncedSearch || filters.buildingId || filters.flatId || filters.accessStatus
                  ? 'No residents match the current search and filters.'
                  : 'No owners or tenants currently have active access in this property.'
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((entry) => (
                <ResidentCard
                  key={entry.entryId}
                  entry={entry}
                  onClick={() => setSelected({ entryId: entry.entryId, residentType: entry.residentType })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ResidentDetailModal
        entryId={selected?.entryId ?? null}
        residentType={selected?.residentType ?? null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}
