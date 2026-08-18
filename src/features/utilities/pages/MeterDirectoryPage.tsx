import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { History, Plus, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query/react';
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
import { DATA_GRID_COLUMN_ALIGN_CENTER, DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { RowActionsMenu } from '@/components/ui/data-grid-row-actions';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/status-badge';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { toUserMessage } from '@/api/errors';
import { InstallMeterDialog } from '../components/InstallMeterDialog';
import { MeterManageDialog } from '../components/MeterManageDialog';
import { useMeters } from '../api/metersApi';
import type { UtilityType } from '../lib/constants';
import { meterStatusToneMap, type MeterStatus } from '../lib/meterStatus';
import type { MeterDto } from '@/api/generated/mycondoApi';

interface MeterDirectoryPageProps {
  utilityType: UtilityType;
}

const METER_FILTER_DEFAULTS = { buildingId: '', page: '1', pageSize: '10' };

/** Shared for Electricity/Gas — the caller (route) fixes utilityType; internal domain components,
 * queries, and dialogs are identical for both. */
export function MeterDirectoryPage({ utilityType }: MeterDirectoryPageProps) {
  const navigate = useNavigate();
  const [filters, setFilters] = useUrlFilters(METER_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const [manageTarget, setManageTarget] = useState<MeterDto | null>(null);
  const [installOpen, setInstallOpen] = useState(false);

  const { data, isFetching, isError, error, refetch } = useMeters(
    filters.buildingId
      ? { buildingId: filters.buildingId, utilityType, page: pagination.pageIndex + 1, pageSize: pagination.pageSize }
      : skipToken,
  );

  const columns: ColumnDef<MeterDto>[] = [
    {
      id: 'meterNumber',
      header: 'Meter number',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => <span className="font-medium">{row.original.meterNumber}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
      cell: ({ row }) => <StatusBadge status={row.original.status as MeterStatus} toneMap={meterStatusToneMap} />,
    },
    {
      id: 'replacesMeterId',
      header: 'Replaces',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => (row.original.replacesMeterId ? <span className="font-mono text-xs">{row.original.replacesMeterId}</span> : '—'),
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.action,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
      cell: ({ row }) => (
        <RowActionsMenu
          ariaLabel={`Actions for meter ${row.original.meterNumber}`}
          actions={[
            {
              key: 'readings',
              label: 'Readings',
              icon: <History />,
              onClick: () => navigate(`/utilities/${utilityType.toLowerCase()}/readings?meterId=${row.original.meterId}`),
            },
            {
              key: 'manage',
              label: 'Manage',
              icon: <Settings2 />,
              onClick: () => setManageTarget(row.original),
            },
          ]}
        />
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
        title={`${utilityType} Meters`}
        crumbs={[{ label: 'Finance' }, { label: utilityType }, { label: 'Meters' }]}
      />

      <div className="space-y-4">
        <div className="space-y-1.5 w-full sm:w-64">
          <Label className="text-xs">Building</Label>
          <BuildingSelect
            value={filters.buildingId}
            onValueChange={(v) => setFilters({ buildingId: v, page: '1' })}
            placeholder="Select a building"
          />
        </div>

        {isError ? (
          <Card>
            <ErrorState description={toUserMessage(error)} onRetry={refetch} />
          </Card>
        ) : (
          <DataGrid
            table={table}
            recordCount={total}
            isLoading={isFetching}
            emptyMessage={filters.buildingId ? `No ${utilityType.toLowerCase()} meters for this building yet.` : 'Select a building to view its meters.'}
            tableLayout={{ cellBorder: true }}
          >
            <Card>
              <CardHeader>
                <CardHeading>
                  <CardTitle>Meters</CardTitle>
                </CardHeading>
                <CardToolbar>
                  <RequirePermission permission={PERMISSIONS.utility.meterManage}>
                    <Button disabled={!filters.buildingId} onClick={() => setInstallOpen(true)}>
                      <Plus /> Install Meter
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
      </div>

      <MeterManageDialog
        meter={manageTarget}
        buildingId={filters.buildingId}
        onOpenChange={(open) => !open && setManageTarget(null)}
      />
      <InstallMeterDialog
        open={installOpen}
        buildingId={filters.buildingId}
        utilityType={utilityType}
        onOpenChange={setInstallOpen}
      />
    </>
  );
}
