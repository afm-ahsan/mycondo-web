import { useEffect, useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { DATA_GRID_COLUMN_ALIGN_CENTER, DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { toUserMessage } from '@/api/errors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { RecordPaymentDialog } from '../components/RecordPaymentDialog';
import { usePayments } from '../api/paymentsApi';
import { PAYMENT_METHODS } from '../lib/constants';
import { PAYMENT_STATUSES, paymentStatusToneMap, type PaymentStatus } from '../lib/paymentStatus';
import type { PaymentDto } from '@/api/generated/mycondoApi';

const PAYMENT_LIST_FILTER_DEFAULTS = {
  status: '',
  paymentMethod: '',
  fromDate: '',
  toDate: '',
  page: '1',
  pageSize: '10',
};

export function PaymentListPage() {
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

  const [filters, setFilters] = useUrlFilters(PAYMENT_LIST_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, error, refetch } = usePayments({
    status: filters.status || undefined,
    paymentMethod: filters.paymentMethod || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const columns: ColumnDef<PaymentDto>[] = [
    {
      id: 'flatId',
      header: 'Flat',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.flatId}</span>,
    },
    {
      id: 'amount',
      header: 'Amount',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => <MoneyDisplay amount={row.original.amount} className="font-medium" />,
    },
    {
      id: 'paymentMethod',
      header: 'Method',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => row.original.paymentMethod,
    },
    {
      id: 'referenceNumber',
      header: 'Reference',
      size: DATA_GRID_COLUMN_SIZE.medium,
      cell: ({ row }) => row.original.referenceNumber ?? '—',
    },
    {
      id: 'businessDate',
      accessorFn: (row) => row.businessDate,
      header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => row.original.businessDate,
    },
    {
      id: 'status',
      header: 'Status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => <StatusBadge status={row.original.status as PaymentStatus} toneMap={paymentStatusToneMap} />,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/billing/payments/${row.original.paymentId}`}>View</Link>
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
      <PageHeader title="Payments" crumbs={[{ label: 'Finance' }, { label: 'Payments' }]} />
      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid
          table={table}
          recordCount={total}
          isLoading={isFetching}
          emptyMessage="No payments for the selected filters."
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader className="flex-wrap gap-3">
              <CardHeading>
                <CardTitle>Payments</CardTitle>
              </CardHeading>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(v) => setFilters({ status: v === 'all' ? '' : v, page: '1' })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {paymentStatusToneMap[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Method</Label>
                  <Select
                    value={filters.paymentMethod || 'all'}
                    onValueChange={(v) => setFilters({ paymentMethod: v === 'all' ? '' : v, page: '1' })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All methods</SelectItem>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payments-from-date" className="text-xs">From</Label>
                  <Input
                    id="payments-from-date"
                    type="date"
                    className="w-40"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ fromDate: e.target.value, page: '1' })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payments-to-date" className="text-xs">To</Label>
                  <Input
                    id="payments-to-date"
                    type="date"
                    className="w-40"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ toDate: e.target.value, page: '1' })}
                  />
                </div>
                {(filters.status || filters.paymentMethod || filters.fromDate || filters.toDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ status: '', paymentMethod: '', fromDate: '', toDate: '', page: '1' })}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
              <CardToolbar>
                <RequirePermission permission={PERMISSIONS.payment.record}>
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus /> Record Payment
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

      <RecordPaymentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
