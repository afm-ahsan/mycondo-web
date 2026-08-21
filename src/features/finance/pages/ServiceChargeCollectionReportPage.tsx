import { HandCoins, Printer, Receipt, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTitle, CardToolbar } from '@/components/ui/card';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useServiceChargeCollectionReport } from '../api/reportsApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { fromDate: firstDayOfMonth(), toDate: today() };

/**
 * Period-scoped Billed/Collected/Waived for service-charge invoices. Billed and Collected are kept
 * as separate KPI cards with distinct tones (Template 5's "Permanent Financial Distinctions" rule —
 * Billed/Earned and Collected must never be merged into one figure).
 */
export function ServiceChargeCollectionReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useServiceChargeCollectionReport({
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
        title="Service Charge Collection"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Service Charge Collection' }]}
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
            onFromDateChange={(v) => setFilters({ fromDate: v })}
            onToDateChange={(v) => setFilters({ toDate: v })}
          />
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the service charge collection report." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-medium">
            {data ? `${formatDate(data.metadata.fromDate ?? filters.fromDate)} – ${formatDate(data.metadata.toDate ?? filters.toDate)}` : '…'}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Billed"
              value={<MoneyDisplay amount={data?.billed} />}
              caption={data ? `${data.billedInvoiceCount} invoice(s)` : undefined}
              icon={Receipt}
              isLoading={isFetching}
            />
            <KpiCard
              label="Collected"
              value={<MoneyDisplay amount={data?.collected} />}
              icon={HandCoins}
              isLoading={isFetching}
              tone="success"
            />
            <KpiCard
              label="Waived"
              value={<MoneyDisplay amount={data?.waived} />}
              icon={Undo2}
              isLoading={isFetching}
              tone="warning"
            />
          </div>
        </div>
      )}
    </>
  );
}
