import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, List, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useBookings } from '../../api/bookingsApi';
import { useBlackoutDates, useFacilities } from '../../api/facilitiesApi';
import { BookingAgendaList } from '../../components/BookingAgendaList';
import { BookingCalendar } from '../../components/BookingCalendar';
import { PageHeader } from '@/components/shared/PageHeader';

const CALENDAR_FILTER_DEFAULTS = { month: format(new Date(), 'yyyy-MM'), facilityId: '' };

function parseMonth(value: string): Date {
  const parsed = parse(value, 'yyyy-MM', new Date());
  return Number.isNaN(parsed.getTime()) ? startOfMonth(new Date()) : startOfMonth(parsed);
}

export function BookingCalendarPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useUrlFilters(CALENDAR_FILTER_DEFAULTS);
  const month = parseMonth(filters.month);

  const { data: facilitiesData } = useFacilities({ facilityType: 'CommunityHall', page: 1, pageSize: 100 });
  const facilityNameById = useMemo(
    () => Object.fromEntries((facilitiesData?.items ?? []).map((f) => [f.facilityId, f.name])),
    [facilitiesData],
  );

  // The exact range the month grid displays, leading/trailing days from adjacent months included —
  // computed once here and sent to the server so `GetBookingsQuery`'s fromDate/toDate filter matches
  // precisely what's rendered, never a client-side re-filter of an arbitrary large page.
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  const {
    data: bookingsData,
    isFetching: bookingsFetching,
    isError: bookingsError,
    refetch: refetchBookings,
  } = useBookings({
    facilityId: filters.facilityId || undefined,
    fromDate: gridStart.toISOString(),
    toDate: addDays(gridEnd, 1).toISOString(),
    page: 1,
    pageSize: 100,
  });
  const { data: blackoutDates } = useBlackoutDates(filters.facilityId ? { id: filters.facilityId } : skipToken);

  const bookings = bookingsData?.items ?? [];

  function goToMonth(next: Date) {
    setFilters({ month: format(next, 'yyyy-MM') });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Booking Calendar"
        crumbs={[{ label: 'Facilities' }, { label: 'Community Hall' }, { label: 'Booking Calendar' }]}
        primaryAction={
          <>
            <Button variant="outline" onClick={() => navigate('/facilities/community-hall/bookings')}>
              <List /> List
            </Button>
            <RequirePermission permission={PERMISSIONS.facility.bookingCreate}>
              <Button
                onClick={() =>
                  navigate(
                    filters.facilityId
                      ? `/facilities/community-hall/bookings/new?facilityId=${encodeURIComponent(filters.facilityId)}`
                      : '/facilities/community-hall/bookings/new',
                  )
                }
              >
                <Plus /> New Booking
              </Button>
            </RequirePermission>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => goToMonth(addDays(startOfMonth(month), -1))} aria-label="Previous month">
            <ChevronLeft />
          </Button>
          <span className="font-medium">{format(month, 'MMMM yyyy')}</span>
          <Button size="icon" variant="outline" onClick={() => goToMonth(addDays(endOfMonth(month), 1))} aria-label="Next month">
            <ChevronRight />
          </Button>
        </div>
        <div className="w-56">
          <FacilitySelect
            facilityType="CommunityHall"
            value={filters.facilityId || undefined}
            onValueChange={(id) => setFilters({ facilityId: id })}
            placeholder="All halls (no closures shown)"
          />
        </div>
      </div>

      {bookingsError ? (
        <ErrorState description="Failed to load bookings for this month. Please try again." onRetry={refetchBookings} />
      ) : bookingsFetching ? (
        <PageSkeleton />
      ) : (
        <>
          {/* Desktop/tablet-landscape (≥768px): full month grid. Narrower (phones, portrait
              tablets): agenda list — a 7-column grid is unusably cramped below that width. Same
              fetched data, same navigation callback — no separate business logic per breakpoint. */}
          <div className="hidden md:block">
            <BookingCalendar
              month={month}
              bookings={bookings}
              blackoutDates={blackoutDates ?? []}
              facilityNameById={facilityNameById}
              onSelectBooking={(id) => navigate(`/facilities/community-hall/bookings/${id}`)}
            />
          </div>
          <div className="md:hidden">
            <BookingAgendaList
              days={days}
              bookings={bookings}
              blackoutDates={blackoutDates ?? []}
              facilityNameById={facilityNameById}
              onSelectBooking={(id) => navigate(`/facilities/community-hall/bookings/${id}`)}
            />
          </div>
        </>
      )}
    </div>
  );
}
