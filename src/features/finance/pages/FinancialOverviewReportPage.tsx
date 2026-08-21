import { Banknote, Landmark, PiggyBank, Printer, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useFinancialOverviewReport } from '../api/reportsApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { asOfDate: today(), fromDate: firstDayOfMonth(), toDate: today() };

/**
 * The flagship Core/Management report — Income, Expenses, Surplus/Deficit, Receivables, Cash & Bank,
 * Fixed Deposits, Collection Performance, and Expense Composition kept as clearly separate figures
 * (Template 5's "Permanent Financial Distinctions" rule: never show an ambiguous "Total In-Hand").
 * Income/Expense/Surplus/Receivables/Cash/FD-principal are cumulative as-of `asOfDate`; Collection
 * Performance and Expense Composition are independently period-scoped by `fromDate`/`toDate` — two
 * different questions, not a duplicate truth, so they're labeled and filtered separately below.
 */
export function FinancialOverviewReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useFinancialOverviewReport({
    asOfDate: filters.asOfDate,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
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
        title="Financial Overview"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Financial Overview' }]}
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
          <DateRangeFilter
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onFromDateChange={(v) => setFilters({ fromDate: v })}
            onToDateChange={(v) => setFilters({ toDate: v })}
            fromLabel="Collection period from"
            toLabel="Collection period to"
          />
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the financial overview." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">
              Cumulative as of {data ? formatDate(data.metadata.asOfDate ?? filters.asOfDate) : '…'}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Income" value={<MoneyDisplay amount={data?.incomeTotal} />} icon={TrendingUp} isLoading={isFetching} tone="success" />
              <KpiCard label="Expenses" value={<MoneyDisplay amount={data?.expenseTotal} />} icon={TrendingDown} isLoading={isFetching} tone="destructive" />
              <KpiCard
                label="Surplus / Deficit"
                value={<MoneyDisplay amount={data?.surplusDeficit} emphasizeNegative />}
                icon={Wallet}
                isLoading={isFetching}
              />
              <KpiCard label="Receivables" value={<MoneyDisplay amount={data?.receivables} />} icon={Receipt} isLoading={isFetching} tone="warning" />
            </div>
          </div>

          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Cash, bank &amp; investments</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Cash in Hand" value={<MoneyDisplay amount={data?.cashPosition.cashInHand} />} icon={Banknote} isLoading={isFetching} />
              <KpiCard label="Bank Balance" value={<MoneyDisplay amount={data?.cashPosition.bankBalance} />} icon={Landmark} isLoading={isFetching} />
              <KpiCard
                label="Available Liquid Funds"
                value={<MoneyDisplay amount={data?.cashPosition.availableLiquidFunds} />}
                icon={Wallet}
                isLoading={isFetching}
                tone="success"
              />
              <KpiCard
                label="Fixed Deposit Principal"
                value={<MoneyDisplay amount={data?.fixedDepositPrincipal} />}
                icon={PiggyBank}
                isLoading={isFetching}
              />
            </div>
          </div>

          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">
              Collection performance
              {data ? ` (${formatDate(data.collectionPeriodFromDate)} – ${formatDate(data.collectionPeriodToDate)})` : ''}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <KpiCard label="Billed" value={<MoneyDisplay amount={data?.collectionPerformance.billed} />} isLoading={isFetching} />
              <KpiCard
                label="Collected"
                value={<MoneyDisplay amount={data?.collectionPerformance.collected} />}
                isLoading={isFetching}
                tone="success"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Expense composition</CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>% of total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.expenseComposition ?? []).map((line) => (
                      <TableRow key={line.expenseCategoryId ?? line.categoryName}>
                        <TableCell>{line.categoryName}</TableCell>
                        <TableCell>
                          <MoneyDisplay amount={line.amount} />
                        </TableCell>
                        <TableCell>{Number(line.percentageOfTotal).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
          </Card>
        </div>
      )}
    </>
  );
}
