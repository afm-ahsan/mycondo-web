import { skipToken } from '@reduxjs/toolkit/query/react';
import { Printer } from 'lucide-react';
import { useGetApiV1FinanceAccountsQuery } from '@/api/generated/mycondoApi';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useAccountLedgerReport } from '../api/reportsApi';

const FILTER_DEFAULTS = { chartOfAccountId: '', fromDate: '', toDate: '', page: '1' };
const PAGE_SIZE = 50;

/**
 * Single-account ledger with a running balance column. Nothing renders until an account is
 * chosen — `skipToken` (same pattern as ResidentFinancialStatementReportPage's flat picker) keeps
 * the query from firing without a `chartOfAccountId`.
 */
export function AccountLedgerReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const { data: accounts } = useGetApiV1FinanceAccountsQuery();

  const page = Number(filters.page) || 1;

  const { data, isFetching, isError, refetch } = useAccountLedgerReport(
    filters.chartOfAccountId
      ? {
          chartOfAccountId: filters.chartOfAccountId,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          page,
          pageSize: PAGE_SIZE,
        }
      : skipToken,
  );

  const totalPages = data ? Math.max(1, Math.ceil(Number(data.total) / PAGE_SIZE)) : 1;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { position: absolute; inset: 0; width: 100%; margin: 0; padding: 0; }
          #print-hide-on-print { display: none !important; }
        }
      `}</style>

      <PageHeader
        title="Account Ledger"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Account Ledger' }]}
      />

      <Card className="mb-4" id="print-hide-on-print">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer /> Print
            </Button>
          </CardToolbar>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
          <div className="space-y-1 w-full sm:w-64">
            <Label>Chart of account</Label>
            <Select
              value={filters.chartOfAccountId || undefined}
              onValueChange={(v) => setFilters({ chartOfAccountId: v, page: '1' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((account) => (
                  <SelectItem key={account.chartOfAccountId} value={account.chartOfAccountId}>
                    {account.code} — {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DateRangeFilter
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onFromDateChange={(v) => setFilters({ fromDate: v, page: '1' })}
            onToDateChange={(v) => setFilters({ toDate: v, page: '1' })}
          />
        </div>
      </Card>

      {!filters.chartOfAccountId ? (
        <EmptyState title="Choose an account" description="Select a chart of account to view its ledger." />
      ) : isError ? (
        <ErrorState description="Couldn't load the account ledger." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">
              {data ? `${data.chartOfAccountCode} — ${data.chartOfAccountName}` : '…'}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <KpiCard label="Opening balance" value={<MoneyDisplay amount={data?.openingBalance} />} isLoading={isFetching} />
              <KpiCard label="Closing balance" value={<MoneyDisplay amount={data?.closingBalance} />} isLoading={isFetching} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Ledger entries</CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.lines.length === 0 ? (
                <EmptyState title="No activity" description="No ledger activity in this period." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Running balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching && !data ? (
                        <TableSkeleton columns={6} />
                      ) : (
                        (data?.lines ?? []).map((line) => (
                          <TableRow key={line.postingId}>
                            <TableCell>{formatDate(line.businessDate)}</TableCell>
                            <TableCell>{line.description}</TableCell>
                            <TableCell>{line.referenceType ?? '—'}</TableCell>
                            <TableCell>{line.direction}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.amount} />
                            </TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.runningBalance} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium" colSpan={5}>
                          Closing balance
                        </TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.closingBalance} />
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardTable>
            {data && Number(data.total) > 0 && (
              <div className="flex items-center justify-between gap-4 p-4" id="print-hide-on-print">
                <span className="text-muted-foreground text-sm">
                  Page {data.page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setFilters({ page: String(page - 1) })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setFilters({ page: String(page + 1) })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
