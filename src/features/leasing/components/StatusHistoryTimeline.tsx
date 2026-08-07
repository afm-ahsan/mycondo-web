import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/helpers';
import { useTenantRegistrationStatusHistory } from '../api/leasingApi';
import { tenantRegistrationStatusToneMap, type TenantRegistrationStatus } from '../lib/status';
import { StatusBadge } from '@/components/ui/status-badge';

/**
 * Renders the real, backend-persisted `OccupancyRegistrationStatusHistory` — unlike
 * `ApprovalTimeline` (Amenities), which reconstructs a timeline from lifecycle timestamp fields
 * because no audit table exists there, this feature has genuine append-only history rows to render
 * directly (see `OccupancyRegistrationStatusHistory`'s doc comment on the backend).
 */
export function StatusHistoryTimeline({ registrationId }: { registrationId: string }) {
  const { data: history, isLoading } = useTenantRegistrationStatusHistory({ id: registrationId });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Status History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : !history || history.length === 0 ? (
          <p className="text-muted-foreground text-sm">No status changes yet.</p>
        ) : (
          <ol className="space-y-3">
            {history.map((entry) => (
              <li key={entry.occupancyRegistrationStatusHistoryId} className="border-border flex flex-col border-s-2 ps-3">
                <span className="flex items-center gap-2">
                  {entry.fromStatus && (
                    <>
                      <StatusBadge
                        status={entry.fromStatus as TenantRegistrationStatus}
                        toneMap={tenantRegistrationStatusToneMap}
                      />
                      <span className="text-muted-foreground text-xs">→</span>
                    </>
                  )}
                  <StatusBadge status={entry.toStatus as TenantRegistrationStatus} toneMap={tenantRegistrationStatusToneMap} />
                </span>
                <span className="text-muted-foreground text-xs">{formatDateTime(entry.changedAtUtc)}</span>
                {entry.reason && <span className="text-xs">{entry.reason}</span>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
