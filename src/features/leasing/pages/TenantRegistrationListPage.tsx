import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, useReactTable } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { toUserMessage } from '@/api/errors';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import type { OccupancyRegistrationDto } from '@/api/generated/mycondoApi';
import { useTenantRegistrations } from '../api/leasingApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { tenantRegistrationStatusToneMap, type TenantRegistrationStatus } from '../lib/status';

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
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [status, setStatus] = useState<string>('all');

  const { data, isFetching, isError, error, refetch } = useTenantRegistrations({
    status: status === 'all' ? undefined : status,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const columns: ColumnDef<OccupancyRegistrationDto>[] = [
    {
      id: 'primaryFullName',
      header: 'Primary occupant',
      cell: ({ row }) => (
        <Link
          to={
            row.original.status === 'Draft' || row.original.status === 'CorrectionsRequested'
              ? `/leasing/tenant-registrations/${row.original.occupancyRegistrationId}/edit`
              : `/leasing/tenant-registrations/${row.original.occupancyRegistrationId}`
          }
          className="text-primary hover:underline"
        >
          {row.original.primaryFullName}
        </Link>
      ),
    },
    { id: 'occupancyType', header: 'Type', cell: ({ row }) => row.original.occupancyType },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status as TenantRegistrationStatus} toneMap={tenantRegistrationStatusToneMap} />
      ),
    },
    { id: 'moveIn', header: 'Expected move-in', cell: ({ row }) => row.original.moveInExpectedDate ?? '—' },
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
        crumbs={[{ label: 'Tenant Registrations' }]}
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
              <CardHeading>
                <CardTitle>Registrations</CardTitle>
              </CardHeading>
              <CardToolbar>
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
            </CardHeader>

            {/* Below `md`, a table forces horizontal scroll — this feature's list is narrow enough
                (4 columns) that a stacked card per row reads better than a scrolling table. */}
            <div className="hidden md:block">
              <CardTable>
                <DataGridTable />
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

function RegistrationCard({ registration }: { registration: OccupancyRegistrationDto }) {
  const href =
    registration.status === 'Draft' || registration.status === 'CorrectionsRequested'
      ? `/leasing/tenant-registrations/${registration.occupancyRegistrationId}/edit`
      : `/leasing/tenant-registrations/${registration.occupancyRegistrationId}`;

  return (
    <Link to={href} className="hover:bg-accent/50 flex flex-col gap-1 px-5 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{registration.primaryFullName}</span>
        <StatusBadge status={registration.status as TenantRegistrationStatus} toneMap={tenantRegistrationStatusToneMap} />
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{registration.occupancyType}</span>
        <span>{registration.moveInExpectedDate ? `Move-in ${registration.moveInExpectedDate}` : ''}</span>
      </div>
    </Link>
  );
}
