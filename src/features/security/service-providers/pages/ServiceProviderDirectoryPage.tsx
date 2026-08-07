import { useEffect, useRef, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { LogIn, Plus, Users as UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { ProviderManageDialog } from '../components/ProviderManageDialog';
import { useServiceProviders } from '../api/serviceProvidersApi';
import type { ServiceProviderProfileDto } from '@/api/generated/mycondoApi';

const statusToneMap: StatusBadgeMap<'Active' | 'Suspended' | 'Blocked'> = {
  Active: { label: 'Active', variant: 'success' },
  Suspended: { label: 'Suspended', variant: 'warning' },
  Blocked: { label: 'Blocked', variant: 'destructive' },
};

const DIRECTORY_FILTER_DEFAULTS = { search: '', page: '1', pageSize: '10' };

export function ServiceProviderDirectoryPage() {
  const [filters, setFilters] = useUrlFilters(DIRECTORY_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setFilters({ search: debouncedSearch, page: '1' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the settled search should retrigger this, not every filters/setFilters identity change
  }, [debouncedSearch]);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const [manageTarget, setManageTarget] = useState<ServiceProviderProfileDto | null>(null);

  const { data, isFetching } = useServiceProviders({
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const isSearchPending = search !== debouncedSearch;

  const columns: ColumnDef<ServiceProviderProfileDto>[] = [
    {
      id: 'fullName',
      accessorFn: (row) => row.fullName,
      header: ({ column }) => <DataGridColumnHeader title="Name" column={column} />,
      cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
    },
    {
      id: 'phone',
      accessorFn: (row) => row.phone,
      header: ({ column }) => <DataGridColumnHeader title="Mobile" column={column} />,
      cell: ({ row }) => row.original.phone,
    },
    {
      id: 'providerType',
      header: 'Type',
      cell: ({ row }) => row.original.providerType,
    },
    {
      id: 'serviceDescription',
      header: 'Service',
      cell: ({ row }) => row.original.serviceDescription ?? '—',
    },
    {
      id: 'verificationStatus',
      header: 'Verification',
      cell: ({ row }) => row.original.verificationStatus,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status as 'Active' | 'Suspended' | 'Blocked'} toneMap={statusToneMap} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => setManageTarget(row.original)}>
          Manage
        </Button>
      ),
    },
  ];

  const total = data ? Number(data.total) : 0;
  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    enableSorting: false,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Service Provider Directory"
        crumbs={[{ label: 'Security & Access' }, { label: 'Service Providers' }, { label: 'Directory' }]}
      />
      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isFetching}
        emptyMessage="No service providers yet."
        tableLayout={{ cellBorder: true }}
      >
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Service Providers</CardTitle>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by name or mobile…"
                isSearching={isSearchPending}
                className="w-64"
              />
            </CardHeading>
            <CardToolbar>
              <Button variant="outline" asChild>
                <Link to="/security/service-providers/currently-inside">
                  <UsersIcon /> Currently inside
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/security/service-providers/checkin-out">
                  <LogIn /> Check in / out
                </Link>
              </Button>
              <RequirePermission permission={PERMISSIONS.serviceProvider.manage}>
                <Button asChild>
                  <Link to="/security/service-providers/new">
                    <Plus /> Register Provider
                  </Link>
                </Button>
              </RequirePermission>
            </CardToolbar>
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <ProviderManageDialog provider={manageTarget} onOpenChange={(open) => !open && setManageTarget(null)} />
    </>
  );
}
