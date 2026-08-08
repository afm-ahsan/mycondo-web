import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import type { BookingDto } from '@/api/generated/mycondoApi';

export function DepositSummaryPanel({ booking }: { booking: BookingDto }) {
  if (Number(booking.depositAmount) <= 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Deposit</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground text-xs">Held</div>
          <div className="font-medium"><MoneyDisplay amount={booking.depositAmount} /></div>
        </div>
        {booking.depositCollectionPostingId && (
          <div>
            <div className="text-muted-foreground text-xs">Collected</div>
            <div className="font-medium">Yes</div>
          </div>
        )}
        {booking.depositRefundedAmount !== null && booking.depositRefundedAmount !== undefined && (
          <div>
            <div className="text-muted-foreground text-xs">Refunded</div>
            <div className="font-medium"><MoneyDisplay amount={booking.depositRefundedAmount} /></div>
          </div>
        )}
        {booking.depositDeductedAmount !== null && booking.depositDeductedAmount !== undefined && (
          <div>
            <div className="text-muted-foreground text-xs">Deducted</div>
            <div className="font-medium"><MoneyDisplay amount={booking.depositDeductedAmount} /></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
