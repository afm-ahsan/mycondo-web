import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Badge } from '@/components/ui/badge';
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
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { MeterSelect } from '../components/MeterSelect';
import { useReadings } from '../api/readingsApi';
import { READING_STATUSES, type UtilityType } from '../lib/constants';
import { readingStatusToneMap, type ReadingStatus } from '../lib/readingStatus';
import type { ReadingDto } from '@/api/generated/mycondoApi';

interface ReadingRegisterPageProps {
  utilityType: UtilityType;
}

const READING_FILTER_DEFAULTS = { buildingId: '', meterId: '', status: '', page: '1', pageSize: '20' };

/**
 * Meter-scoped by design — GET /readings has no buildingId/utilityType filter of its own (confirmed
 * against the backend contract), only meterId/flatId/status. Pick a building to load that utility's
 * meters, then a meter, to see its register — matches how the Meter Directory's own "Readings" link
 * already arrives here with a meterId pre-filled.
 */
export function ReadingRegisterPage({ utilityType }: ReadingRegisterPageProps) {
  const [filters, setFilters] = useUrlFilters(READING_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 20,
  };
  const [buildingId, setBuildingId] = useState(filters.buildingId);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching } = useReadings(
    filters.meterId
      ? { meterId: filters.meterId, status: filters.status || undefined, page: pagination.pageIndex + 1, pageSize: pagination.pageSize }
      : skipToken,
  );

  const columns: ColumnDef<ReadingDto>[] = [
    {
      id: 'period',
      header: 'Period',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => `${row.original.periodStart} – ${row.original.periodEnd}`,
    },
    {
      id: 'readings',
      header: 'Previous → Present',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => `${row.original.previousReading} → ${row.original.presentReading}`,
    },
    {
      id: 'consumption',
      header: 'Consumption',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="tabular-nums">{row.original.consumptionUnits}</span>
          {row.original.isAbnormalConsumption && (
            <Badge variant="destructive" appearance="light" size="sm">
              Abnormal
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'readingDate',
      header: 'Reading date',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => row.original.readingDate,
    },
    {
      id: 'status',
      header: 'Status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => <StatusBadge status={row.original.status as ReadingStatus} toneMap={readingStatusToneMap} />,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/utilities/${utilityType.toLowerCase()}/readings/${row.original.readingId}`}>View</Link>
          </Button>
        </div>
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
    enableSorting: false,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title={`${utilityType} Reading Register`}
        crumbs={[{ label: 'Finance' }, { label: utilityType }, { label: 'Readings' }]}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 w-full sm:w-56">
            <Label className="text-xs">Building</Label>
            <BuildingSelect
              value={buildingId}
              onValueChange={(v) => {
                setBuildingId(v);
                setFilters({ buildingId: v, meterId: '', page: '1' });
              }}
              placeholder="Select a building"
            />
          </div>
          <div className="space-y-1.5 w-full sm:w-56">
            <Label className="text-xs">Meter</Label>
            <MeterSelect
              buildingId={buildingId}
              utilityType={utilityType}
              value={filters.meterId}
              onValueChange={(v) => setFilters({ meterId: v, page: '1' })}
              disabled={!buildingId}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => setFilters({ status: v === 'all' ? '' : v, page: '1' })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {READING_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {readingStatusToneMap[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataGrid
          table={table}
          recordCount={total}
          isLoading={isFetching}
          emptyMessage={filters.meterId ? 'No readings for this meter yet.' : 'Select a meter to view its reading register.'}
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Readings</CardTitle>
              </CardHeading>
              <CardToolbar>
                <RequirePermission permission={PERMISSIONS.utility.readingRecord}>
                  <Button asChild disabled={!filters.meterId}>
                    <Link to={filters.meterId ? `/utilities/${utilityType.toLowerCase()}/readings/new?meterId=${filters.meterId}` : '#'}>
                      <Plus /> Capture Reading
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
      </div>
    </>
  );
}
