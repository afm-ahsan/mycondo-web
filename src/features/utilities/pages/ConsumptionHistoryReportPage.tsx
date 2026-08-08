import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/status-badge';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { MeterSelect } from '../components/MeterSelect';
import { useReadings } from '../api/readingsApi';
import type { UtilityType } from '../lib/constants';
import { readingStatusToneMap, type ReadingStatus } from '../lib/readingStatus';

interface ConsumptionHistoryReportPageProps {
  utilityType: UtilityType;
}

const FILTER_DEFAULTS = { buildingId: '', meterId: '' };
const REPORT_PAGE_SIZE = 100;

/**
 * Consumption figures shown here are the server-computed `consumptionUnits` already stored on each
 * `ReadingDto` — nothing is recalculated here. Bar widths are a purely visual, proportional-to-max
 * aid for scanning the trend, not an independently derived metric. Ordering by `periodStart` is
 * display-only client-side sorting of an already-fetched, bounded set — not pagination logic.
 */
export function ConsumptionHistoryReportPage({ utilityType }: ConsumptionHistoryReportPageProps) {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const [buildingId, setBuildingId] = useState(filters.buildingId);

  const { data, isFetching } = useReadings(
    filters.meterId ? { meterId: filters.meterId, page: 1, pageSize: REPORT_PAGE_SIZE } : skipToken,
  );

  const total = data ? Number(data.total) : 0;
  const sortedReadings = useMemo(
    () => [...(data?.items ?? [])].sort((a, b) => a.periodStart.localeCompare(b.periodStart)),
    [data],
  );
  const maxConsumption = useMemo(
    () => sortedReadings.reduce((max, r) => Math.max(max, Number(r.consumptionUnits)), 0),
    [sortedReadings],
  );

  return (
    <>
      <PageHeader
        title={`${utilityType} — Per-Meter Consumption History`}
        crumbs={[{ label: 'Billing & Collections' }, { label: utilityType }, { label: 'Reports' }, { label: 'Consumption History' }]}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 w-full sm:w-56">
            <Label className="text-xs">Building</Label>
            <BuildingSelect
              value={buildingId}
              onValueChange={(v) => {
                setBuildingId(v);
                setFilters({ buildingId: v, meterId: '' });
              }}
              placeholder="Select a building"
            />
          </div>
          <div className="space-y-1.5 w-full sm:w-56">
            <Label className="text-xs">Meter</Label>
            <MeterSelect
              buildingId={buildingId}
              utilityType={utilityType}
              value={filters.meterId}
              onValueChange={(v) => setFilters({ meterId: v })}
              disabled={!buildingId}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Consumption by period</CardTitle>
          </CardHeader>
          <CardContent>
            {!filters.meterId ? (
              <p className="text-sm text-muted-foreground">Select a meter to see its consumption history.</p>
            ) : isFetching ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : sortedReadings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No readings recorded for this meter yet.</p>
            ) : (
              <>
                {total > REPORT_PAGE_SIZE && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Showing the first {REPORT_PAGE_SIZE} of {total} readings.
                  </p>
                )}
                <ScrollArea>
                  <div className="space-y-2 min-w-[480px]">
                    {sortedReadings.map((r) => (
                      <div key={r.readingId} className="flex items-center gap-3 text-sm">
                        <span className="w-40 shrink-0 text-muted-foreground">
                          {r.periodStart} – {r.periodEnd}
                        </span>
                        <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                          <div
                            className={r.isAbnormalConsumption ? 'h-full bg-destructive' : 'h-full bg-primary'}
                            style={{ width: maxConsumption > 0 ? `${(Number(r.consumptionUnits) / maxConsumption) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right tabular-nums font-medium">{r.consumptionUnits}</span>
                        <StatusBadge status={r.status as ReadingStatus} toneMap={readingStatusToneMap} />
                        {r.isAbnormalConsumption && (
                          <Badge variant="destructive" appearance="light" size="sm">
                            Abnormal
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
