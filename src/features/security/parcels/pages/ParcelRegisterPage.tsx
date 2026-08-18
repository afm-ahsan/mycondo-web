import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Package, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { toUserMessage } from '@/api/errors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDateTime, formatLabel } from '@/lib/helpers';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useParcels } from '../api/parcelsApi';
import { PARCEL_STATUSES } from '../lib/constants';
import type { ParcelDto } from '@/api/generated/mycondoApi';

type ParcelStatus = (typeof PARCEL_STATUSES)[number];

const statusToneMap: StatusBadgeMap<ParcelStatus> = {
  Received: { label: 'Received', variant: 'info' },
  ResidentNotified: { label: 'Notified', variant: 'info' },
  AwaitingCollection: { label: 'Awaiting Collection', variant: 'warning' },
  Collected: { label: 'Collected', variant: 'success' },
  Returned: { label: 'Returned', variant: 'secondary' },
  Rejected: { label: 'Rejected', variant: 'destructive' },
  Damaged: { label: 'Damaged', variant: 'destructive' },
  LostOrEscalated: { label: 'Lost / Escalated', variant: 'destructive' },
};

const REGISTER_FILTER_DEFAULTS = { status: '', recipientFlatId: '', page: '1', pageSize: '10' };

export function ParcelRegisterPage() {
  const [filters, setFilters] = useUrlFilters(REGISTER_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };
  // Not URL-persisted: the flat filter is set via a Building→Flat cascade, and re-deriving the
  // building from a bare recipientFlatId in the URL would need an extra lookup this page doesn't do.
  const [buildingId, setBuildingId] = useState('');

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, error, refetch } = useParcels({
    status: filters.status || undefined,
    recipientFlatId: filters.recipientFlatId || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const columns: ColumnDef<ParcelDto>[] = [
    {
      id: 'reference',
      header: 'Reference / Tracking',
      cell: ({ row }) => {
        const reference = row.original.parcelReference ?? row.original.trackingNumber ?? '—';
        return (
          <div className="min-w-0">
            <div className="font-medium truncate" title={reference}>
              {reference}
            </div>
            {row.original.courierProvider && (
              <div className="text-muted-foreground truncate text-xs" title={row.original.courierProvider}>
                {row.original.courierProvider}
              </div>
            )}
          </div>
        );
      },
      size: DATA_GRID_COLUMN_SIZE.flexible,
    },
    {
      id: 'senderName',
      header: 'Sender',
      cell: ({ row }) => {
        const sender = row.original.senderName;
        return sender ? <span title={sender}>{sender}</span> : '—';
      },
      size: DATA_GRID_COLUMN_SIZE.flexible,
      meta: { cellClassName: 'truncate' },
    },
    {
      id: 'recipientFlatId',
      header: 'Flat',
      cell: ({ row }) => row.original.recipientFlatDisplayName,
      size: DATA_GRID_COLUMN_SIZE.medium,
    },
    {
      id: 'parcelType',
      header: 'Type',
      cell: ({ row }) => `${formatLabel(row.original.parcelType)} (${row.original.packageCount})`,
      size: DATA_GRID_COLUMN_SIZE.compact,
    },
    {
      id: 'receivedAtUtc',
      accessorFn: (row) => row.receivedAtUtc,
      header: ({ column }) => <DataGridColumnHeader title="Received" column={column} />,
      cell: ({ row }) => formatDateTime(row.original.receivedAtUtc),
      size: DATA_GRID_COLUMN_SIZE.compact,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status as ParcelStatus} toneMap={statusToneMap} />,
      size: DATA_GRID_COLUMN_SIZE.compact,
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/security/parcels/${row.original.parcelId}`}>View</Link>
          </Button>
        </div>
      ),
      size: DATA_GRID_COLUMN_SIZE.compact,
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
      <PageHeader title="Parcel Register" crumbs={[{ label: 'Front Desk' }, { label: 'Parcels' }]} />
      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid
          table={table}
          recordCount={total}
          isLoading={isFetching}
          emptyMessage={
            <EmptyState
              icon={<Package className="size-8" aria-hidden="true" />}
              title="No parcels found"
              description={
                filters.status || filters.recipientFlatId
                  ? 'No parcels match the current filters.'
                  : 'No parcels have been logged yet.'
              }
            />
          }
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader className="flex-wrap gap-3">
              <CardHeading>
                <CardTitle>Parcels</CardTitle>
              </CardHeading>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(v) => setFilters({ status: v === 'all' ? '' : v, page: '1' })}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {PARCEL_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusToneMap[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Building</Label>
                  <BuildingSelect
                    value={buildingId}
                    onValueChange={(v) => {
                      setBuildingId(v);
                      setFilters({ recipientFlatId: '', page: '1' });
                    }}
                    placeholder="Any building"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Flat</Label>
                  <FlatSelect
                    buildingId={buildingId}
                    value={filters.recipientFlatId}
                    onValueChange={(v) => setFilters({ recipientFlatId: v, page: '1' })}
                    disabled={!buildingId}
                    placeholder="Any flat"
                  />
                </div>
                <RequirePermission permission={PERMISSIONS.parcel.receive}>
                  <Button asChild>
                    <Link to="/security/parcels/new">
                      <Plus /> Receive Parcel
                    </Link>
                  </Button>
                </RequirePermission>
              </div>
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
      )}
    </>
  );
}
