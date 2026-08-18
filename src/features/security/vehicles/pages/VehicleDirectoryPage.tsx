import { useEffect, useRef, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { Car, LogIn, Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DATA_GRID_COLUMN_ALIGN_CENTER, DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { VehicleFormDialog } from '../components/VehicleFormDialog';
import { useBlockVehicle, useUnblockVehicle, useVehicles } from '../api/vehiclesApi';
import type { VehicleDto } from '@/api/generated/mycondoApi';

const statusToneMap: StatusBadgeMap<'Active' | 'Blocked'> = {
  Active: { label: 'Active', variant: 'success' },
  Blocked: { label: 'Blocked', variant: 'destructive' },
};

const VEHICLE_DIRECTORY_FILTER_DEFAULTS = { search: '', page: '1', pageSize: '10' };

export function VehicleDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true);
      setSearchParams(
        (params) => {
          params.delete('create');
          return params;
        },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only once on mount to consume the deep-link flag
  }, []);

  const [filters, setFilters] = useUrlFilters(VEHICLE_DIRECTORY_FILTER_DEFAULTS);
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

  const [blockTarget, setBlockTarget] = useState<VehicleDto | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const { data, isFetching, isError, error, refetch } = useVehicles({
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const isSearchPending = search !== debouncedSearch;
  const [blockVehicle, { isLoading: isBlocking }] = useBlockVehicle();
  const [unblockVehicle, { isLoading: isUnblocking }] = useUnblockVehicle();

  async function handleUnblock(vehicleId: string) {
    try {
      await unblockVehicle({ id: vehicleId }).unwrap();
      toast.success('Vehicle unblocked.');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function handleConfirmBlock() {
    if (!blockTarget) return;
    try {
      await blockVehicle({ id: blockTarget.vehicleId, blockVehicleRequest: { reason: blockReason } }).unwrap();
      toast.success('Vehicle blocked.');
      setBlockTarget(null);
      setBlockReason('');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  // Not memoized: the block/unblock cell closures need up-to-date isBlocking/isUnblocking each render.
  const columns: ColumnDef<VehicleDto>[] = [
    {
      id: 'registrationNumber',
      accessorFn: (row) => row.registrationNumber,
      header: ({ column }) => <DataGridColumnHeader title="Registration" column={column} />,
      size: DATA_GRID_COLUMN_SIZE.flexible,
      cell: ({ row }) => <span className="font-medium">{row.original.registrationNumber}</span>,
    },
    {
      id: 'vehicleType',
      header: 'Type',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => row.original.vehicleType,
    },
    {
      id: 'makeModelColor',
      header: 'Make / model / color',
      size: DATA_GRID_COLUMN_SIZE.flexible,
      cell: ({ row }) => {
        const parts = [row.original.make, row.original.model, row.original.color].filter(Boolean);
        return parts.length > 0 ? parts.join(' / ') : '—';
      },
    },
    {
      id: 'ownershipCategory',
      header: 'Ownership',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => row.original.ownershipCategory,
    },
    {
      id: 'status',
      header: 'Status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => (
        <StatusBadge status={row.original.isBlocked ? 'Blocked' : 'Active'} toneMap={statusToneMap} />
      ),
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => (
        <RequirePermission permission={PERMISSIONS.vehicle.blockManage}>
          <div className="flex justify-center">
            {row.original.isBlocked ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isUnblocking}
                onClick={() => handleUnblock(row.original.vehicleId)}
              >
                Unblock
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                disabled={isBlocking}
                onClick={() => setBlockTarget(row.original)}
              >
                Block
              </Button>
            )}
          </div>
        </RequirePermission>
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
    // No sort parameter on this query — see the UX-1 discovery report's Table Convention section.
    enableSorting: false,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Vehicle Directory"
        crumbs={[{ label: 'Security & Access' }, { label: 'Vehicle Access' }, { label: 'Directory' }]}
      />
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
              icon={<Car className="size-8" aria-hidden="true" />}
              title="No vehicles found"
              description={
                debouncedSearch ? 'No vehicles match the current search.' : 'No vehicles have been registered yet.'
              }
            />
          }
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Vehicles</CardTitle>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by registration number…"
                  isSearching={isSearchPending}
                  className="w-64"
                />
              </CardHeading>
              <CardToolbar>
                <Button variant="outline" asChild>
                  <Link to="/security/vehicles/currently-inside">
                    <Car /> Currently inside
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/security/vehicles/checkin-out">
                    <LogIn /> Check in / out
                  </Link>
                </Button>
                <RequirePermission permission={PERMISSIONS.vehicle.create}>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus /> Register Vehicle
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
      )}

      <Dialog open={blockTarget !== null} onOpenChange={(open) => !open && setBlockTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {blockTarget?.registrationNumber}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="vehicle-block-reason">Reason</Label>
            <Input
              id="vehicle-block-reason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Reported for unauthorized parking"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isBlocking || blockReason.trim().length === 0}
              onClick={handleConfirmBlock}
            >
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VehicleFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
