import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/helpers';
import type { BookingDto } from '@/api/generated/mycondoApi';

export function InspectionPanel({ booking }: { booking: BookingDto }) {
  if (!booking.inspectedAtUtc) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Post-event inspection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-muted-foreground text-xs">Inspected {formatDateTime(booking.inspectedAtUtc)}</div>
        {booking.inspectionNotes && <p>{booking.inspectionNotes}</p>}
        {booking.damageDeductionReason && (
          <p className="text-destructive">Damage deduction: {booking.damageDeductionReason}</p>
        )}
      </CardContent>
    </Card>
  );
}
