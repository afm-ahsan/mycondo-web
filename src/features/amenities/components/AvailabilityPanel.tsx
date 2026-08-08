import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBdt } from '@/lib/helpers';
import type { FacilityDto } from '@/api/generated/mycondoApi';

/**
 * Shows a Facility's own configuration (capacity, buffers, charge, deposit, cancellation policy) as a
 * static preview when a hall is selected on the booking form. This is NOT a live per-slot
 * availability check — mycondo-api has no separate "check availability" endpoint; actual
 * booking-conflict detection only happens inside the create submit itself (409 on overlap). See
 * mycondo-web Slice G plan, "Backend contract gaps identified" §1.
 */
export function AvailabilityPanel({ facility }: { facility: FacilityDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Facility configuration</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Capacity" value={`${facility.capacity} guests`} />
        <Field
          label="Operating hours"
          value={
            facility.operatingHoursStart && facility.operatingHoursEnd
              ? `${facility.operatingHoursStart}–${facility.operatingHoursEnd}`
              : '24 hours'
          }
        />
        <Field label="Booking charge" value={formatBdt(facility.bookingChargeAmount)} />
        <Field label="Deposit" value={formatBdt(facility.depositAmount)} />
        <Field
          label="Cancellation policy"
          value={`Full refund up to ${facility.cancellationDeadlineHours}h before; ${facility.cancellationDeductionPercentage}% forfeited within that window`}
        />
        <Field label="Approval required" value={facility.requiresApproval ? 'Yes' : 'No'} />
        <p className="col-span-2 text-xs text-muted-foreground">
          This is the facility&apos;s standing configuration, not a live availability check — a
          scheduling conflict is only detected when the booking is actually submitted.
        </p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
