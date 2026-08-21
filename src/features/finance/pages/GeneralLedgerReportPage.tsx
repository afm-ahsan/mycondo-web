import { Printer } from 'lucide-react';
import { useGetApiV1FinanceAccountsQuery } from '@/api/generated/mycondoApi';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useGeneralLedgerReport } from '../api/reportsApi';

const FILTER_DEFAULTS = { fromDate: '', toDate: '', chartOfAccountId: '', page: '1' };
const PAGE_SIZE = 50;

/**
 * Tenant-wide cross-account journal browser — every posted ledger line across every chart of
 * account, optionally narrowed to one account. Manually paginated (page/pageSize) like
 * ResidentFinancialStatementReportPage since this can be a very large result set.
 */
export function GeneralLedgerReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const { data: accounts } = useGetApiV1FinanceAccountsQuery();

  const page = Number(filters.page) || 1;

  const { data, isFetching, isError, refetch } = useGeneralLedgerReport({
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    chartOfAccountId: filters.chartOfAccountId || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

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
        title="General Ledger"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'General Ledger' }]}
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
          <DateRangeFilter
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onFromDateChange={(v) => setFilters({ fromDate: v, page: '1' })}
            onToDateChange={(v) => setFilters({ toDate: v, page: '1' })}
          />
          <div className="space-y-1 w-full sm:w-64">
            <Label>Chart of account</Label>
            <Select
              value={filters.chartOfAccountId || 'all'}
              onValueChange={(v) => setFilters({ chartOfAccountId: v === 'all' ? '' : v, page: '1' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts?.map((account) => (
                  <SelectItem key={account.chartOfAccountId} value={account.chartOfAccountId}>
                    {account.code} — {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the general ledger." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>General Ledger</CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.lines.length === 0 ? (
                <EmptyState title="No entries" description="No ledger activity matches these filters." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Amount</TableHead>
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
                            <TableCell>
                              {line.chartOfAccountCode ? `${line.chartOfAccountCode} — ${line.chartOfAccountName}` : '—'}
                            </TableCell>
                            <TableCell>{line.referenceType ?? '—'}</TableCell>
                            <TableCell>{line.direction}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.amount} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
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
