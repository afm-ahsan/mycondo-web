import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Card, CardFooter, CardTable } from '@/components/ui/card';
import { formatDateTime } from '@/lib/helpers';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toUserMessage } from '@/api/errors';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useCurrentlyInsideAccessSessions } from '../api/guestsApi';
import type { AccessSessionDto } from '@/api/generated/mycondoApi';

const CURRENTLY_INSIDE_FILTER_DEFAULTS = { page: '1', pageSize: '10' };

const columns: ColumnDef<AccessSessionDto>[] = [
  {
    id: 'hostFlatId',
    accessorFn: (row) => row.hostFlatId,
    header: ({ column }) => <DataGridColumnHeader title="Host flat" column={column} />,
    size: DATA_GRID_COLUMN_SIZE.medium,
    cell: ({ row }) => row.original.hostFlatId ?? '—',
  },
  {
    id: 'purposeOfVisit',
    accessorFn: (row) => row.purposeOfVisit,
    header: ({ column }) => <DataGridColumnHeader title="Purpose" column={column} />,
    size: DATA_GRID_COLUMN_SIZE.flexible,
    cell: ({ row }) => row.original.purposeOfVisit ?? '—',
  },
  {
    id: 'entryGateId',
    header: 'Entry gate',
    size: DATA_GRID_COLUMN_SIZE.medium,
    cell: ({ row }) => row.original.entryGateId,
  },
  {
    id: 'entryAtUtc',
    accessorFn: (row) => row.entryAtUtc,
    header: ({ column }) => <DataGridColumnHeader title="Entry time" column={column} />,
    size: DATA_GRID_COLUMN_SIZE.compact,
    cell: ({ row }) => formatDateTime(row.original.entryAtUtc),
  },
  {
    id: 'checkedInBy',
    header: 'Checked in by',
    size: DATA_GRID_COLUMN_SIZE.medium,
    cell: ({ row }) => row.original.checkedInBy ?? '—',
  },
];

export function CurrentlyInsideGuestsPage() {
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
    category: 'Guest',
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const total = data ? Number(data.total) : 0;
  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    // The API has no sort parameter on this query — DataGridColumnHeader would otherwise show a
    // clickable sort arrow that updates but never actually reorders rows (no getSortedRowModel).
    enableSorting: false,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Guests Currently Inside"
        crumbs={[
          { label: 'Security & Access' },
          { label: 'Visitor Management' },
          { label: 'Current Visitors' },
        ]}
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
          emptyMessage="No guests currently inside."
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
