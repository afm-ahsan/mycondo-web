import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Card, CardFooter, CardTable } from '@/components/ui/card';
import { formatDateTime } from '@/lib/helpers';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toUserMessage } from '@/api/errors';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { useCurrentlyInsideAccessSessions } from '../api/serviceProvidersApi';
import type { AccessSessionDto } from '@/api/generated/mycondoApi';

const CURRENTLY_INSIDE_FILTER_DEFAULTS = { page: '1', pageSize: '10' };

const columns: ColumnDef<AccessSessionDto>[] = [
  {
    id: 'hostFlatId',
    accessorFn: (row) => row.hostFlatId,
    header: ({ column }) => <DataGridColumnHeader title="Host flat" column={column} />,
    cell: ({ row }) => row.original.hostFlatId ?? '—',
    size: DATA_GRID_COLUMN_SIZE.medium,
  },
  {
    id: 'entryGateId',
    header: 'Entry gate',
    cell: ({ row }) => row.original.entryGateId,
    size: DATA_GRID_COLUMN_SIZE.medium,
  },
  {
    id: 'entryAtUtc',
    accessorFn: (row) => row.entryAtUtc,
    header: ({ column }) => <DataGridColumnHeader title="Entry time" column={column} />,
    cell: ({ row }) => formatDateTime(row.original.entryAtUtc),
    size: DATA_GRID_COLUMN_SIZE.compact,
  },
  {
    id: 'remarks',
    header: 'Remarks',
    cell: ({ row }) => {
      const remarks = row.original.remarks;
      return remarks ? <span title={remarks}>{remarks}</span> : '—';
    },
    size: DATA_GRID_COLUMN_SIZE.flexible,
    meta: { cellClassName: 'truncate' },
  },
  {
    id: 'checkedInBy',
    header: 'Checked in by',
    cell: ({ row }) => row.original.checkedInBy ?? '—',
    size: DATA_GRID_COLUMN_SIZE.flexible,
  },
];

// See CurrentlyInsideDomesticWorkersPage's note — same AccessSessionDto limitation applies here.
export function CurrentlyInsideServiceProvidersPage() {
  const [filters, setFilters] = useUrlFilters(CURRENTLY_INSIDE_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, error, refetch } = useCurrentlyInsideAccessSessions({
    category: 'ServiceProvider',
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

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
        title="Service Providers Currently Inside"
        crumbs={[{ label: 'Security & Access' }, { label: 'Service Providers' }, { label: 'Currently Inside' }]}
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
          emptyMessage="No service providers currently inside."
          tableLayout={{ cellBorder: true }}
        >
          <Card>
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
