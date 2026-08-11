import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
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
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { toUserMessage } from '@/api/errors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useInvoices } from '../api/invoicesApi';
import { formatBillingPeriod } from '../lib/billingPeriod';
import { INVOICE_SOURCES } from '../lib/constants';
import { INVOICE_STATUSES, invoiceStatusToneMap, type InvoiceStatus } from '../lib/invoiceStatus';
import type { InvoiceDto } from '@/api/generated/mycondoApi';

const INVOICE_LIST_FILTER_DEFAULTS = { buildingId: '', flatId: '', status: '', source: '', page: '1', pageSize: '10' };

export function InvoiceListPage() {
  const [filters, setFilters] = useUrlFilters(INVOICE_LIST_FILTER_DEFAULTS);
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
    status: filters.status || undefined,
    source: filters.source || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const columns: ColumnDef<InvoiceDto>[] = [
    {
      id: 'invoiceNumber',
      accessorFn: (row) => row.invoiceNumber,
      header: ({ column }) => <DataGridColumnHeader title="Invoice #" column={column} />,
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
      cell: ({ row }) => formatBillingPeriod(row.original.periodStart, row.original.periodEnd),
    },
    {
      id: 'flatId',
      header: 'Flat',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.flatId}</span>,
    },
    {
      id: 'invoiceDate',
      accessorFn: (row) => row.invoiceDate,
      header: ({ column }) => <DataGridColumnHeader title="Invoice date" column={column} />,
      cell: ({ row }) => row.original.invoiceDate,
    },
    {
      id: 'dueDate',
      header: 'Due date',
      cell: ({ row }) => row.original.dueDate,
    },
    {
      id: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => <MoneyDisplay amount={row.original.totalAmount} />,
    },
    {
      id: 'amountPaid',
      header: 'Paid',
      cell: ({ row }) => <MoneyDisplay amount={row.original.amountPaid} />,
    },
    {
      id: 'balance',
      header: 'Outstanding',
      cell: ({ row }) => <MoneyDisplay amount={row.original.balance} className="font-medium" />,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status as InvoiceStatus} toneMap={invoiceStatusToneMap} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="outline" asChild>
          <Link to={`/billing/invoices/${row.original.invoiceId}`}>View</Link>
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
      <PageHeader title="Invoices" crumbs={[{ label: 'Finance' }, { label: 'Invoices' }]} />
      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid
          table={table}
          recordCount={total}
          isLoading={isFetching}
          emptyMessage="No invoices for the selected filters."
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader className="flex-wrap gap-3">
              <CardHeading>
                <CardTitle>Invoices</CardTitle>
              </CardHeading>
              <div className="flex flex-wrap items-end gap-3">
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
                      {INVOICE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {invoiceStatusToneMap[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Source</Label>
                  <Select
                    value={filters.source || 'all'}
                    onValueChange={(v) => setFilters({ source: v === 'all' ? '' : v, page: '1' })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      {INVOICE_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(filters.buildingId || filters.flatId || filters.status || filters.source) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBuildingId('');
                      setFilters({ buildingId: '', flatId: '', status: '', source: '', page: '1' });
                    }}
                  >
                    Clear filters
                  </Button>
                )}
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
