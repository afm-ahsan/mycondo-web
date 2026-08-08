import { AlertTriangle, FileClock, FileWarning, Printer, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTitle, CardToolbar } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useFinancialSummaryReport } from '../api/reportsApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { buildingId: '', fromDate: firstDayOfMonth(), toDate: today() };

/**
 * Billed/Collected are period-flow figures strictly within [fromDate, toDate]. Outstanding and the
 * three invoice counts are a current snapshot as of the server's AsOfDate — deliberately not
 * recomputed when the date filters change, per the backend contract (see FinancialSummaryDto).
 */
export function FinancialSummaryReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useFinancialSummaryReport({
    buildingId: filters.buildingId || undefined,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  return (
    <>
      {/* Print-only: everything outside #print-root (sidebar, header, filter inputs) is hidden via
          this page-local override — same pattern as TenantRegistrationPrintPage. No PDF library or
          export architecture involved, just the browser's own print pipeline. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { position: absolute; inset: 0; width: 100%; margin: 0; padding: 0; }
          #print-hide-on-print { display: none !important; }
        }
      `}</style>

      <PageHeader
        title="Financial Summary"
        crumbs={[{ label: 'Billing & Collections' }, { label: 'Reports' }, { label: 'Financial Summary' }]}
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
          <div className="space-y-1 w-full sm:w-56">
            <Label>Building</Label>
            <BuildingSelect
              value={filters.buildingId || undefined}
              onValueChange={(v) => setFilters({ buildingId: v })}
              placeholder="All buildings"
            />
          </div>
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={filters.fromDate} onChange={(e) => setFilters({ fromDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={filters.toDate} onChange={(e) => setFilters({ toDate: e.target.value })} />
          </div>
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the financial summary." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">
              This period ({formatDate(filters.fromDate)} – {formatDate(filters.toDate)})
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <KpiCard label="Total billed" value={<MoneyDisplay amount={data?.totalBilled} />} icon={Receipt} isLoading={isFetching} />
              <KpiCard
                label="Total collected"
                value={<MoneyDisplay amount={data?.totalCollected} />}
                icon={TrendingUp}
                isLoading={isFetching}
                tone="success"
              />
            </div>
          </div>

          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">
              Current snapshot{data ? ` (as of ${formatDate(data.asOfDate)})` : ''} — not limited to the period above
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Total outstanding"
                value={<MoneyDisplay amount={data?.totalOutstanding} />}
                icon={Wallet}
                isLoading={isFetching}
                tone="warning"
              />
              <KpiCard
                label="Unpaid invoices"
                value={data?.unpaidInvoiceCount ?? 0}
                icon={FileClock}
                isLoading={isFetching}
              />
              <KpiCard
                label="Partially paid invoices"
                value={data?.partiallyPaidInvoiceCount ?? 0}
                icon={FileWarning}
                isLoading={isFetching}
              />
              <KpiCard
                label="Overdue invoices"
                value={data?.overdueInvoiceCount ?? 0}
                icon={AlertTriangle}
                isLoading={isFetching}
                tone={data && Number(data.overdueInvoiceCount) > 0 ? 'destructive' : 'primary'}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
