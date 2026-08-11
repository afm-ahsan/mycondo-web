import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ResidentSelect, type ResidentSelectValue } from '@/components/shared/ResidentSelect';
import { ErrorState } from '@/components/feedback/ErrorState';
import { toUserMessage } from '@/api/errors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useAccountBalance, useLedgerEntries } from '../api/paymentsApi';
import { LEDGER_REFERENCE_TYPES, ledgerReferenceTypeLabel } from '../lib/ledgerReferenceType';
import type { LedgerEntryDto } from '@/api/generated/mycondoApi';

const LEDGER_FILTER_DEFAULTS = { flatId: '', fromDate: '', toDate: '', referenceType: '', page: '1', pageSize: '20' };

export function ResidentLedgerPage() {
  const [filters, setFilters] = useUrlFilters(LEDGER_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 20,
  };
  // Not URL-persisted: no GetById-style lookup exists to resolve a resident's display name from a
  // bare flatId, so a bookmarked link falls back to showing the raw id until a fresh pick resolves it
  // — same limitation already documented for the Attendance Register's employee filter.
  const [residentLabel, setResidentLabel] = useState('');

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data: balance, isFetching: isBalanceFetching } = useAccountBalance(
    { flatId: filters.flatId },
    { skip: !filters.flatId },
  );

  const { data, isFetching, isError, error, refetch } = useLedgerEntries(
    {
      flatId: filters.flatId,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      referenceType: filters.referenceType || undefined,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    },
    { skip: !filters.flatId },
  );

  const columns: ColumnDef<LedgerEntryDto>[] = [
    {
      id: 'businessDate',
      accessorFn: (row) => row.businessDate,
      header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
      cell: ({ row }) => row.original.businessDate,
    },
    {
      id: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <Badge variant="secondary" appearance="light">
          {ledgerReferenceTypeLabel(row.original.referenceType)}
        </Badge>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description,
    },
    {
      id: 'debit',
      header: 'Debit',
      cell: ({ row }) => (row.original.direction === 'Debit' ? <MoneyDisplay amount={row.original.amount} /> : '—'),
    },
    {
      id: 'credit',
      header: 'Credit',
      cell: ({ row }) => (row.original.direction === 'Credit' ? <MoneyDisplay amount={row.original.amount} /> : '—'),
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
      <PageHeader title="Resident Ledger" crumbs={[{ label: 'Finance' }, { label: 'Resident Ledger' }]} />

      <div className="space-y-4">
        <Card className="max-w-xl">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Resident</Label>
              <ResidentSelect
                value={filters.flatId ? { residentId: '', flatId: filters.flatId, fullName: residentLabel, phone: null } : null}
                onChange={(picked: ResidentSelectValue | null) => {
                  setResidentLabel(picked?.fullName ?? '');
                  setFilters({ flatId: picked?.flatId ?? '', page: '1' });
                }}
              />
            </div>
            {filters.flatId && (
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <span className="text-sm text-muted-foreground">Current balance (authoritative, server-computed)</span>
                {isBalanceFetching ? (
                  <span className="text-muted-foreground text-sm">Loading…</span>
                ) : (
                  <MoneyDisplay
                    amount={balance?.balance}
                    emphasizeNegative
                    className="text-lg font-semibold"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {filters.flatId && (
          isError ? (
            <Card>
              <ErrorState description={toUserMessage(error)} onRetry={refetch} />
            </Card>
          ) : (
            <DataGrid
              table={table}
              recordCount={total}
              isLoading={isFetching}
              emptyMessage="No ledger entries for the selected filters."
              tableLayout={{ cellBorder: true }}
            >
              <Card>
                <CardHeader className="flex-wrap gap-3">
                  <CardHeading>
                    <CardTitle>Ledger Entries</CardTitle>
                  </CardHeading>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ledger-from-date" className="text-xs">From</Label>
                      <Input
                        id="ledger-from-date"
                        type="date"
                        className="w-40"
                        value={filters.fromDate}
                        onChange={(e) => setFilters({ fromDate: e.target.value, page: '1' })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ledger-to-date" className="text-xs">To</Label>
                      <Input
                        id="ledger-to-date"
                        type="date"
                        className="w-40"
                        value={filters.toDate}
                        onChange={(e) => setFilters({ toDate: e.target.value, page: '1' })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={filters.referenceType || 'all'}
                        onValueChange={(v) => setFilters({ referenceType: v === 'all' ? '' : v, page: '1' })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All types</SelectItem>
                          {LEDGER_REFERENCE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {ledgerReferenceTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(filters.fromDate || filters.toDate || filters.referenceType) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({ fromDate: '', toDate: '', referenceType: '', page: '1' })}
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
          )
        )}
      </div>
    </>
  );
}
