import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { MeterSelect } from '../components/MeterSelect';
import { useReadings } from '../api/readingsApi';
import type { UtilityType } from '../lib/constants';
import { readingStatusToneMap, type ReadingStatus } from '../lib/readingStatus';

interface ReadingStatusReportPageProps {
  utilityType: UtilityType;
}

const UNBILLED_STATUSES: ReadingStatus[] = ['Draft', 'Reviewed', 'Finalized', 'Corrected'];
const FILTER_DEFAULTS = { buildingId: '', meterId: '' };

function StatusCountRow({ meterId, status }: { meterId: string; status: ReadingStatus }) {
  const { data, isFetching } = useReadings({ meterId, status, page: 1, pageSize: 1 });
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0 text-sm">
      <StatusBadge status={status} toneMap={readingStatusToneMap} />
      <span className="font-medium tabular-nums">{isFetching ? '…' : Number(data?.total ?? 0)}</span>
    </div>
  );
}

/**
 * Every count on this page comes directly from the server's own `total` for that exact filter — the
 * only client-side arithmetic is "Unbilled = Total − Billed", which is an exact identity over two
 * unpaginated, authoritative totals (not an approximation from a single page), never a financial
 * calculation.
 */
export function ReadingStatusReportPage({ utilityType }: ReadingStatusReportPageProps) {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const [buildingId, setBuildingId] = useState(filters.buildingId);

  const { data: totalData, isFetching: isTotalFetching } = useReadings(
    filters.meterId ? { meterId: filters.meterId, page: 1, pageSize: 1 } : skipToken,
  );
  const { data: billedData, isFetching: isBilledFetching } = useReadings(
    filters.meterId ? { meterId: filters.meterId, status: 'Billed', page: 1, pageSize: 1 } : skipToken,
  );

  const total = totalData ? Number(totalData.total) : null;
  const billed = billedData ? Number(billedData.total) : null;
  const unbilled = total !== null && billed !== null ? total - billed : null;
  const isSummaryLoading = isTotalFetching || isBilledFetching;

  return (
    <>
      <PageHeader
        title={`${utilityType} — Billed vs Unbilled Readings`}
        crumbs={[{ label: 'Billing & Collections' }, { label: utilityType }, { label: 'Reports' }, { label: 'Billed vs Unbilled' }]}
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

        {!filters.meterId ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Select a meter to see its billed/unbilled reading breakdown.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex items-center justify-between py-1.5 border-b border-border text-sm">
                  <span className="text-muted-foreground">Total readings</span>
                  <span className="font-medium tabular-nums">{isSummaryLoading ? '…' : total}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border text-sm">
                  <StatusBadge status="Billed" toneMap={readingStatusToneMap} />
                  <span className="font-medium tabular-nums">{isSummaryLoading ? '…' : billed}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-muted-foreground">Unbilled (Total − Billed)</span>
                  <span className="font-medium tabular-nums">{isSummaryLoading ? '…' : unbilled}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unbilled breakdown by status</CardTitle>
              </CardHeader>
              <CardContent>
                {UNBILLED_STATUSES.map((status) => (
                  <StatusCountRow key={status} meterId={filters.meterId} status={status} />
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
