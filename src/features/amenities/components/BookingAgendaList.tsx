import { format, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { CalendarOff } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { BookingStatus } from '../lib/bookingStatus';
import { BookingStatusBadge } from './BookingStatusBadge';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import type { BlackoutDateDto, BookingDto } from '@/api/generated/mycondoApi';

interface BookingAgendaListProps {
  days: Date[];
  bookings: BookingDto[];
  blackoutDates: BlackoutDateDto[];
  facilityNameById: Record<string, string>;
  onSelectBooking: (bookingId: string) => void;
}

/**
 * Mobile fallback for `BookingCalendar` — same `days`/`bookings`/`blackoutDates` the grid uses (one
 * fetch at the page level, two presentation components), just grouped as a scrollable day-by-day
 * agenda instead of a 7-column grid, per UX-4 §8's "genuine responsive calendar experience"
 * requirement. Days with nothing scheduled are skipped entirely rather than shown as empty rows.
 */
export function BookingAgendaList({ days, bookings, blackoutDates, facilityNameById, onSelectBooking }: BookingAgendaListProps) {
  const daysWithContent = days.filter((day) => {
    const hasBooking = bookings.some((b) => isSameDay(parseISO(b.startAtUtc), day));
    const hasBlackout = blackoutDates.some(
      (bd) => bd.isActive && isWithinInterval(day, { start: parseISO(bd.dateFrom), end: parseISO(bd.dateTo) }),
    );
    return hasBooking || hasBlackout;
  });

  if (daysWithContent.length === 0) {
    return (
      <EmptyState
        icon={<CalendarOff className="size-8" />}
        title="Nothing scheduled"
        description="No bookings or closures fall in this month."
      />
    );
  }

  return (
    <div className="space-y-4">
      {daysWithContent.map((day) => {
        const dayBookings = bookings
          .filter((b) => isSameDay(parseISO(b.startAtUtc), day))
          .sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc));
        const dayBlackouts = blackoutDates.filter(
          (bd) => bd.isActive && isWithinInterval(day, { start: parseISO(bd.dateFrom), end: parseISO(bd.dateTo) }),
        );

        return (
          <div key={day.toISOString()}>
            <div className="text-sm font-semibold mb-2">{format(day, 'EEEE, MMM d')}</div>
            <div className="space-y-2">
              {dayBlackouts.map((blackout) => (
                <div key={blackout.blackoutDateId} className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Closed: {blackout.reason}
                </div>
              ))}
              {dayBookings.map((booking) => (
                <button
                  key={booking.bookingId}
                  type="button"
                  onClick={() => onSelectBooking(booking.bookingId)}
                  className="w-full rounded-md border p-3 text-start active:bg-muted/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{facilityNameById[booking.facilityId] ?? 'Facility'}</span>
                    <span className="text-xs text-muted-foreground">{format(parseISO(booking.startAtUtc), 'p')}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{booking.eventType}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <BookingStatusBadge status={booking.status as BookingStatus} />
                    <PaymentStatusBadge booking={booking} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
