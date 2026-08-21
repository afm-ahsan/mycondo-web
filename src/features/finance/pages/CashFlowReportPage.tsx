import { ArrowDownRight, ArrowUpRight, Landmark, Printer, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTitle, CardToolbar } from '@/components/ui/card';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useCashFlowReport } from '../api/reportsApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { fromDate: firstDayOfMonth(), toDate: today() };

/**
 * Pure KPI-card cash flow statement — Opening balance, Operating activities, Investing activities,
 * Net change, and Closing balance, each its own labeled section (same sectioned-grid pattern as
 * FinancialOverviewReportPage). No row-level table, so no CSV export.
 */
export function CashFlowReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useCashFlowReport({
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

      <PageHeader title="Cash Flow" crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Cash Flow' }]} />

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
            onFromDateChange={(v) => setFilters({ fromDate: v })}
            onToDateChange={(v) => setFilters({ toDate: v })}
          />
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the cash flow report." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-medium">
            {data ? `${formatDate(data.metadata.fromDate ?? filters.fromDate)} – ${formatDate(data.metadata.toDate ?? filters.toDate)}` : '…'}
          </h3>

          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Opening balance</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Opening Cash Balance" value={<MoneyDisplay amount={data?.openingCashBalance} />} icon={Wallet} isLoading={isFetching} />
            </div>
          </div>

          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Operating activities</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Inflow" value={<MoneyDisplay amount={data?.operatingInflow} />} icon={ArrowUpRight} isLoading={isFetching} tone="success" />
              <KpiCard label="Outflow" value={<MoneyDisplay amount={data?.operatingOutflow} />} icon={ArrowDownRight} isLoading={isFetching} tone="destructive" />
              <KpiCard label="Net Operating" value={<MoneyDisplay amount={data?.netOperating} emphasizeNegative />} icon={TrendingUp} isLoading={isFetching} />
            </div>
          </div>

          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Investing activities</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Inflow" value={<MoneyDisplay amount={data?.investingInflow} />} icon={ArrowUpRight} isLoading={isFetching} tone="success" />
              <KpiCard label="Outflow" value={<MoneyDisplay amount={data?.investingOutflow} />} icon={ArrowDownRight} isLoading={isFetching} tone="destructive" />
              <KpiCard label="Net Investing" value={<MoneyDisplay amount={data?.netInvesting} emphasizeNegative />} icon={TrendingDown} isLoading={isFetching} />
            </div>
          </div>

          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">Net change &amp; closing balance</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Net Change in Cash" value={<MoneyDisplay amount={data?.netChangeInCash} emphasizeNegative />} icon={Wallet} isLoading={isFetching} />
              <KpiCard label="Closing Cash Balance" value={<MoneyDisplay amount={data?.closingCashBalance} />} icon={Landmark} isLoading={isFetching} tone="success" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
