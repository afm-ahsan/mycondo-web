import { Flame, Zap } from 'lucide-react';
import { Card, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatNumber } from '@/lib/helpers';
import { useConsumptionSummaryReport } from '../api/reportsApi';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { buildingId: '', fromDate: firstDayOfMonth(), toDate: today() };

/**
 * Tenant-wide (optionally building-scoped) Electricity + Gas consumption for the chosen period, from
 * finalized/billed readings only — the shared consumption-summary aggregate, not a per-meter drill-
 * down (see ConsumptionHistoryReportPage for that).
 */
export function ConsumptionSummaryReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useConsumptionSummaryReport({
    buildingId: filters.buildingId || undefined,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  const electricity = data?.find((l) => l.utilityType === 'Electricity');
  const gas = data?.find((l) => l.utilityType === 'Gas');

  return (
    <>
      <PageHeader
        title="Consumption Summary"
        crumbs={[{ label: 'Billing & Collections' }, { label: 'Utilities' }, { label: 'Reports' }, { label: 'Consumption Summary' }]}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
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
        <ErrorState description="Couldn't load the consumption summary." onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiCard
            label="Electricity consumed"
            value={`${formatNumber(electricity?.totalConsumptionUnits ?? 0, 0)} kWh`}
            icon={Zap}
            isLoading={isFetching}
            caption={electricity ? `${electricity.readingCount} finalized/billed readings` : '0 readings'}
          />
          <KpiCard
            label="Gas consumed"
            value={formatNumber(gas?.totalConsumptionUnits ?? 0, 0)}
            icon={Flame}
            isLoading={isFetching}
            caption={gas ? `${gas.readingCount} finalized/billed readings` : '0 readings'}
          />
        </div>
      )}
    </>
  );
}
