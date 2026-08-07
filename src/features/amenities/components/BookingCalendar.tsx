import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { bookingStatusToneMap, type BookingStatus } from '../lib/bookingStatus';
import type { BlackoutDateDto, BookingDto } from '@/api/generated/mycondoApi';

interface BookingCalendarProps {
  month: Date;
  bookings: BookingDto[];
  blackoutDates: BlackoutDateDto[];
  facilityNameById: Record<string, string>;
  onSelectBooking: (bookingId: string) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Custom month-grid, no calendar/scheduler library — see mycondo-web Slice G plan §"Existing
 * conventions confirmed", `react-day-picker` is a date-*picker*, not an event calendar, and adding a
 * new dependency (`@fullcalendar/react`, `react-big-calendar`) would violate the explicit
 * "no new UI framework" constraint. Built from `date-fns` + existing `Badge` styling only.
 */
export function BookingCalendar({
  month,
  bookings,
  blackoutDates,
  facilityNameById,
  onSelectBooking,
}: BookingCalendarProps) {
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function bookingsForDay(day: Date) {
    return bookings.filter((booking) => isSameDay(parseISO(booking.startAtUtc), day));
  }

  function blackoutsForDay(day: Date) {
    return blackoutDates.filter((blackout) =>
      blackout.isActive &&
      isWithinInterval(day, { start: parseISO(blackout.dateFrom), end: parseISO(blackout.dateTo) }),
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayBookings = bookingsForDay(day);
          const dayBlackouts = blackoutsForDay(day);
          const outsideMonth = !isSameMonth(day, month);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-28 border-e border-b p-1.5 last:border-e-0 space-y-1',
                outsideMonth && 'bg-muted/20 text-muted-foreground',
              )}
            >
              <div className="text-xs font-medium">{format(day, 'd')}</div>
              {dayBlackouts.map((blackout) => (
                <div
                  key={blackout.blackoutDateId}
                  title={blackout.reason}
                  className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground truncate"
                >
                  Closed: {blackout.reason}
                </div>
              ))}
              {dayBookings.map((booking) => {
                const tone = bookingStatusToneMap[booking.status as BookingStatus];
                return (
                  <button
                    key={booking.bookingId}
                    type="button"
                    onClick={() => onSelectBooking(booking.bookingId)}
                    title={`${facilityNameById[booking.facilityId] ?? 'Facility'} — ${booking.eventType}`}
                    className={cn(
                      'block w-full truncate rounded px-1.5 py-0.5 text-start text-[10px] font-medium',
                      toneClasses[tone?.variant ?? 'secondary'],
                    )}
                  >
                    {facilityNameById[booking.facilityId] ?? 'Facility'} · {booking.eventType}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Maps the same Badge variant vocabulary used by BookingStatusBadge to plain background/text classes
// for the compact calendar chips (a full <Badge> per cell would be too tall for a month grid).
const toneClasses: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-[var(--color-success-accent,var(--color-green-500))] text-white',
  warning: 'bg-[var(--color-warning-accent,var(--color-yellow-500))] text-white',
  info: 'bg-[var(--color-info-accent,var(--color-violet-500))] text-white',
  destructive: 'bg-destructive text-destructive-foreground',
};
