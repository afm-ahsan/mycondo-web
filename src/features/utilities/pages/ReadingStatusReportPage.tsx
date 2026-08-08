import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useReadingStatusSummaryReport } from '../api/reportsApi';
import type { UtilityType } from '../lib/constants';
import { readingStatusToneMap, type ReadingStatus } from '../lib/readingStatus';

interface ReadingStatusReportPageProps {
  utilityType: UtilityType;
}

const ALL_STATUSES: ReadingStatus[] = ['Draft', 'Reviewed', 'Finalized', 'Billed', 'Corrected'];
const FILTER_DEFAULTS = { buildingId: '' };

/**
 * Tenant-wide (optionally building-scoped) breakdown of every reading's current status, from the
 * backend's GetReadingStatusSummaryReport aggregate — no meter selection required. Previously this
 * page could only show one meter at a time (GET /api/v1/readings had no buildingId/utilityType
 * aggregate of its own); UX-5 closed that gap for this report specifically.
 */
export function ReadingStatusReportPage({ utilityType }: ReadingStatusReportPageProps) {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useReadingStatusSummaryReport({
    buildingId: filters.buildingId || undefined,
    utilityType,
  });

  const countByStatus = new Map((data ?? []).map((line) => [line.status, line.count]));
  const total = [...countByStatus.values()].reduce((sum, c) => sum + c, 0);
  const billed = countByStatus.get('Billed') ?? 0;
  const unbilled = total - billed;

  return (
    <>
      <PageHeader
        title={`${utilityType} — Reading Status`}
        crumbs={[{ label: 'Billing & Collections' }, { label: utilityType }, { label: 'Reports' }, { label: 'Reading Status' }]}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
          <div className="space-y-1.5 w-full sm:w-56">
            <Label className="text-xs">Building</Label>
            <BuildingSelect
              value={filters.buildingId || undefined}
              onValueChange={(v) => setFilters({ buildingId: v })}
              placeholder="All buildings"
            />
          </div>
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the reading status report." onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="flex items-center justify-between py-1.5 border-b border-border text-sm">
                <span className="text-muted-foreground">Total readings</span>
                <span className="font-medium tabular-nums">{total}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border text-sm">
                <StatusBadge status="Billed" toneMap={readingStatusToneMap} />
                <span className="font-medium tabular-nums">{billed}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted-foreground">Unbilled (Total − Billed)</span>
                <span className="font-medium tabular-nums">{unbilled}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By status</CardTitle>
            </CardHeader>
            <CardContent>
              {ALL_STATUSES.map((status) => (
                <div key={status} className="flex items-center justify-between py-1.5 border-b border-border last:border-0 text-sm">
                  <StatusBadge status={status} toneMap={readingStatusToneMap} />
                  <span className="font-medium tabular-nums">{countByStatus.get(status) ?? 0}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
