import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, useReactTable } from '@tanstack/react-table';
import { Eye, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DATA_GRID_COLUMN_ALIGN_CENTER, DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { RowActionsMenu } from '@/components/ui/data-grid-row-actions';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { toUserMessage } from '@/api/errors';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate } from '@/lib/helpers';
import type { OccupancyRegistrationListItemDto } from '@/api/generated/mycondoApi';
import { useTenantRegistrations } from '../api/leasingApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { tenantRegistrationStatusToneMap, type TenantRegistrationStatus } from '../lib/status';

function registrationDetailHref(registration: Pick<OccupancyRegistrationListItemDto, 'occupancyRegistrationId' | 'status'>) {
  return registration.status === 'Draft' || registration.status === 'CorrectionsRequested'
    ? `/leasing/tenant-registrations/${registration.occupancyRegistrationId}/edit`
    : `/leasing/tenant-registrations/${registration.occupancyRegistrationId}`;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'OwnerApproved', label: 'Owner Approved' },
  { value: 'CorrectionsRequested', label: 'Corrections Requested' },
  { value: 'ManagementVerified', label: 'Management Verified' },
  { value: 'Active', label: 'Active' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'MovedOut', label: 'Moved Out' },
];

/** Tenant Registration list — every registration for the tenant, filterable by status. Rows link to
 * the wizard (still-editable Draft/CorrectionsRequested) or, for later statuses, the review/detail
 * view (see Frontend M2). */
export function TenantRegistrationListPage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const { data, isFetching, isError, error, refetch } = useTenantRegistrations({
    status: status === 'all' ? undefined : status,
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  function handleSearchChange(value: string) {
    setSearch(value);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  const columns: ColumnDef<OccupancyRegistrationListItemDto>[] = [
    {
      id: 'primaryFullName',
      header: 'Primary Occupant',
      size: DATA_GRID_COLUMN_SIZE.flexible,
      cell: ({ row }) => (
        <Link to={registrationDetailHref(row.original)} className="text-primary hover:underline">
          {row.original.primaryFullName}
        </Link>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      size: DATA_GRID_COLUMN_SIZE.flexible,
      meta: { cellClassName: 'truncate' },
      cell: ({ row }) => row.original.primaryEmail ?? '—',
    },
    {
      id: 'phone',
      header: 'Phone',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => row.original.primaryPhone ?? '—',
    },
    {
      id: 'flat',
      header: 'Flat',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => `${row.original.flatNumber} — ${row.original.buildingName}`,
    },
    { id: 'occupancyType', header: 'Type', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.occupancyType },
    {
      id: 'status',
      header: 'Status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
      cell: ({ row }) => (
        <StatusBadge status={row.original.status as TenantRegistrationStatus} toneMap={tenantRegistrationStatusToneMap} />
      ),
    },
    {
      id: 'moveIn',
      header: 'Expected Move-in',
      size: DATA_GRID_COLUMN_SIZE.medium,
      meta: { headerClassName: 'whitespace-nowrap' },
      cell: ({ row }) => (row.original.moveInExpectedDate ? formatDate(row.original.moveInExpectedDate) : '—'),
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.action,
      cell: ({ row }) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${row.original.primaryFullName}`}
          actions={[
            {
              key: 'view',
              label: 'View',
              icon: <Eye />,
              onClick: () => navigate(registrationDetailHref(row.original)),
            },
          ]}
        />
      ),
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
    },
  ];

  const total = data ? Number(data.total) : 0;
  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Tenant Registrations"
        crumbs={[{ label: 'Residents' }, { label: 'Tenant Registrations' }]}
        primaryAction={
          <RequirePermission permission={PERMISSIONS.occupancyRegistration.create}>
            <Button asChild>
              <Link to="/leasing/tenant-registrations/new">
                <Plus /> New Registration
              </Link>
            </Button>
          </RequirePermission>
        }
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No tenant registrations yet.">
          <Card>
            <CardHeader>
              <CardHeading className="w-full">
                <CardTitle>Registrations</CardTitle>
              </CardHeading>
              <div className="flex w-full items-center gap-2.5">
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by name, email, phone, or flat…"
                  isSearching={isSearchPending}
                  className="flex-1 min-w-0"
                />
                <CardToolbar className="shrink-0">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FILTERS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardToolbar>
              </div>
            </CardHeader>

            {/* Below `md`, a table forces horizontal scroll — a stacked card per row reads better
                than a scrolling table with this many columns. */}
            <div className="hidden md:block">
              <CardTable>
                <ScrollArea>
                  <DataGridTable />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardTable>
            </div>
            <div className="divide-border divide-y md:hidden">
              {(data?.items ?? []).map((item) => (
                <RegistrationCard key={item.occupancyRegistrationId} registration={item} />
              ))}
            </div>

            <CardFooter>
              <DataGridPagination />
            </CardFooter>
          </Card>
        </DataGrid>
      )}
    </>
  );
}

function RegistrationCard({ registration }: { registration: OccupancyRegistrationListItemDto }) {
  return (
    <Link to={registrationDetailHref(registration)} className="hover:bg-accent/50 flex flex-col gap-1 px-5 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{registration.primaryFullName}</span>
        <StatusBadge status={registration.status as TenantRegistrationStatus} toneMap={tenantRegistrationStatusToneMap} />
      </div>
      <div className="text-muted-foreground text-xs">
        {registration.flatNumber} — {registration.buildingName}
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{registration.occupancyType}</span>
        <span>{registration.moveInExpectedDate ? `Move-in ${formatDate(registration.moveInExpectedDate)}` : ''}</span>
      </div>
    </Link>
  );
}
