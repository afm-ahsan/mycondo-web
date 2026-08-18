import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { RowActionsMenu } from '@/components/ui/data-grid-row-actions';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/status-badge';
import { DATA_GRID_COLUMN_ALIGN_CENTER, DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { toUserMessage } from '@/api/errors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useInvoices } from '../api/invoicesApi';
import { formatBillingPeriod } from '../lib/billingPeriod';
import { invoiceStatusToneMap, type InvoiceStatus } from '../lib/invoiceStatus';
import type { InvoiceDto } from '@/api/generated/mycondoApi';

const OUTSTANDING_FILTER_DEFAULTS = { buildingId: '', flatId: '', status: 'Issued', page: '1', pageSize: '10' };

// No aggregate "total outstanding" endpoint exists — this is a filtered Invoice List view (Issued /
// Partially Paid), not a report. Per-invoice `balance` is server-computed and shown as-is; there is
// deliberately no summed total anywhere on this page, since that would mean fabricating a KPI from
// only the current paginated page. See UX-3 plan §6.
export function OutstandingInvoicesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useUrlFilters(OUTSTANDING_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };
  const [buildingId, setBuildingId] = useState(filters.buildingId);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, error, refetch } = useInvoices({
    buildingId: filters.buildingId || undefined,
    flatId: filters.flatId || undefined,
    status: filters.status,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const columns: ColumnDef<InvoiceDto>[] = [
    {
      id: 'invoiceNumber',
      accessorFn: (row) => row.invoiceNumber,
      header: ({ column }) => <DataGridColumnHeader title="Invoice #" column={column} />,
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.invoiceNumber}</div>
          <div className="text-muted-foreground text-xs">{row.original.source}</div>
        </div>
      ),
    },
    {
      id: 'period',
      header: 'Billing period',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => formatBillingPeriod(row.original.periodStart, row.original.periodEnd),
    },
    {
      id: 'flatId',
      header: 'Flat',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.flatId}</span>,
    },
    {
      id: 'dueDate',
      accessorFn: (row) => row.dueDate,
      header: ({ column }) => <DataGridColumnHeader title="Due date" column={column} />,
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => row.original.dueDate,
    },
    {
      id: 'totalAmount',
      header: 'Total',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => <MoneyDisplay amount={row.original.totalAmount} />,
    },
    {
      id: 'balance',
      header: 'Outstanding',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => <MoneyDisplay amount={row.original.balance} className="font-semibold" />,
    },
    {
      id: 'status',
      header: 'Status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => <StatusBadge status={row.original.status as InvoiceStatus} toneMap={invoiceStatusToneMap} />,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.action,
      cell: ({ row }) => (
        <RowActionsMenu
          ariaLabel={`Actions for invoice ${row.original.invoiceId}`}
          actions={[{ key: 'view', label: 'View', icon: <Eye />, onClick: () => navigate(`/billing/invoices/${row.original.invoiceId}`) }]}
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
    enableSorting: false,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader title="Outstanding Invoices" crumbs={[{ label: 'Finance' }, { label: 'Outstanding Invoices' }]} />
      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid
          table={table}
          recordCount={total}
          isLoading={isFetching}
          emptyMessage="No outstanding invoices for the selected filters."
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader className="flex-wrap gap-3">
              <CardHeading>
                <CardTitle>Outstanding Invoices</CardTitle>
              </CardHeading>
              <div className="flex flex-wrap items-end gap-3">
                <Tabs value={filters.status} onValueChange={(v) => setFilters({ status: v, page: '1' })}>
                  <TabsList>
                    <TabsTrigger value="Issued">Issued</TabsTrigger>
                    <TabsTrigger value="PartiallyPaid">Partially Paid</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="space-y-1.5">
                  <Label className="text-xs">Building</Label>
                  <BuildingSelect
                    value={buildingId}
                    onValueChange={(v) => {
                      setBuildingId(v);
                      setFilters({ buildingId: v, flatId: '', page: '1' });
                    }}
                    placeholder="Any building"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Flat</Label>
                  <FlatSelect
                    buildingId={buildingId}
                    value={filters.flatId}
                    onValueChange={(v) => setFilters({ flatId: v, page: '1' })}
                    disabled={!buildingId}
                    placeholder="Any flat"
                  />
                </div>
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
