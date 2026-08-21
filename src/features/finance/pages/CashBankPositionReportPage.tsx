import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useCashBankPositionReport } from '../api/reportsApi';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { asOfDate: today() };

/**
 * Per-`FinancialAccount` breakdown (cash/bank/MFS instruments from Template 4) as of a given date —
 * the individual accounts behind FinancialOverviewReportPage's aggregated Cash-in-Hand/Bank-Balance
 * KPI figures, not a duplicate of them.
 */
export function CashBankPositionReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useCashBankPositionReport({
    asOfDate: filters.asOfDate,
  });

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
        title="Cash & Bank Position"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Cash & Bank Position' }]}
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
          <div className="space-y-1">
            <Label>As of</Label>
            <Input type="date" value={filters.asOfDate} onChange={(e) => setFilters({ asOfDate: e.target.value })} />
          </div>
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the cash & bank position." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>
                  Cash & Bank Position{data ? ` — as of ${formatDate(data.metadata.asOfDate ?? filters.asOfDate)}` : ''}
                </CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.accounts.length === 0 ? (
                <EmptyState title="No accounts" description="No cash/bank accounts found as of this date." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Bank / Branch</TableHead>
                        <TableHead>Account No.</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching && !data ? (
                        <TableSkeleton columns={5} />
                      ) : (
                        (data?.accounts ?? []).map((account) => (
                          <TableRow key={account.financialAccountId}>
                            <TableCell>{account.name}</TableCell>
                            <TableCell>{account.accountType}</TableCell>
                            <TableCell>
                              {account.bankName || account.branchName
                                ? [account.bankName, account.branchName].filter(Boolean).join(' / ')
                                : '—'}
                            </TableCell>
                            <TableCell>{account.accountNumber ?? '—'}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={account.balance} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium" colSpan={4}>
                          Total
                        </TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.totalBalance} />
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardTable>
          </Card>
        </div>
      )}
    </>
  );
}
