import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/helpers';
import type { BookingDto } from '@/api/generated/mycondoApi';

interface TimelineEntry {
  label: string;
  /** Omitted only for Rejected — `BookingDto` has `rejectedReason` but no `rejectedAtUtc`, a backend
   * gap (no timestamp for that specific transition), disclosed rather than fabricated. */
  atUtc?: string;
  detail?: string;
}

/**
 * Built entirely from the lifecycle timestamp/actor fields already on `BookingDto`
 * (`approvedAtUtc`/`rejectedReason`/`cancelledAtUtc`/...) — mycondo-api has no separate audit-log/
 * event endpoint for a booking, see mycondo-web Slice G plan, "Backend contract gaps identified" §2.
 * This is a lifecycle summary, not a full append-only audit trail.
 */
export function ApprovalTimeline({ booking }: { booking: BookingDto }) {
  const entries: TimelineEntry[] = [];

  if (booking.approvedAtUtc) {
    entries.push({ label: 'Approved', atUtc: booking.approvedAtUtc });
  }
  if (booking.rejectedReason) {
    entries.push({ label: 'Rejected', detail: booking.rejectedReason });
  }
  if (booking.checkedInAtUtc) {
    entries.push({ label: 'Checked in', atUtc: booking.checkedInAtUtc });
  }
  if (booking.completedAtUtc) {
    entries.push({ label: 'Completed', atUtc: booking.completedAtUtc });
  }
  if (booking.inspectedAtUtc) {
    entries.push({ label: 'Inspected', atUtc: booking.inspectedAtUtc });
  }
  if (booking.cancelledAtUtc) {
    entries.push({ label: 'Cancelled', atUtc: booking.cancelledAtUtc, detail: booking.cancelledReason ?? undefined });
  }

  entries.sort((a, b) => new Date(a.atUtc ?? 0).getTime() - new Date(b.atUtc ?? 0).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">History</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No status changes yet.</p>
        ) : (
          <ol className="space-y-3">
            {entries.map((entry, index) => (
              <li key={index} className="flex flex-col border-s-2 border-border ps-3">
                <span className="font-medium text-sm">{entry.label}</span>
                {entry.atUtc && <span className="text-muted-foreground text-xs">{formatDateTime(entry.atUtc)}</span>}
                {entry.detail && <span className="text-xs">{entry.detail}</span>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
