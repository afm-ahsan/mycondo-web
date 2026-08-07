import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, List, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useBookings } from '../../api/bookingsApi';
import { useBlackoutDates, useFacilities } from '../../api/facilitiesApi';
import { BookingCalendar } from '../../components/BookingCalendar';
import { PageHeader } from '../../components/PageHeader';

export function BookingCalendarPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [facilityId, setFacilityId] = useState<string | undefined>();

  const { data: facilitiesData } = useFacilities({ facilityType: 'CommunityHall', page: 1, pageSize: 100 });
  const facilityNameById = useMemo(
    () => Object.fromEntries((facilitiesData?.items ?? []).map((f) => [f.facilityId, f.name])),
    [facilitiesData],
  );

  // GetBookingsQuery has no date-range filter server-side (Slice G plan §5) — fetch a generous page
  // and filter to the visible month client-side. Blackout dates are per-facility only (no tenant-wide
  // endpoint), so the closure overlay only shows once a specific hall is selected.
  const { data: bookingsData } = useBookings({ facilityId, page: 1, pageSize: 100 });
  const { data: blackoutDates } = useBlackoutDates(facilityId ? { id: facilityId } : skipToken);

  const monthBookings = (bookingsData?.items ?? []).filter((booking) => {
    const start = new Date(booking.startAtUtc);
    return start >= startOfMonth(month) && start <= endOfMonth(month);
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Booking Calendar"
        crumbs={[{ label: 'Facilities' }, { label: 'Community Hall' }, { label: 'Booking Calendar' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('../bookings')}>
              <List /> List
            </Button>
            <RequirePermission permission={PERMISSIONS.facility.bookingCreate}>
              <Button onClick={() => navigate('../bookings/new')}>
                <Plus /> New Booking
              </Button>
            </RequirePermission>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => setMonth((m) => subMonths(m, 1))}>
            <ChevronLeft />
          </Button>
          <span className="font-medium">{format(month, 'MMMM yyyy')}</span>
          <Button size="icon" variant="outline" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight />
          </Button>
        </div>
        <div className="w-56">
          <FacilitySelect
            facilityType="CommunityHall"
            value={facilityId}
            onValueChange={setFacilityId}
            placeholder="All halls (no closures shown)"
          />
        </div>
      </div>

      <BookingCalendar
        month={month}
        bookings={monthBookings}
        blackoutDates={blackoutDates ?? []}
        facilityNameById={facilityNameById}
        onSelectBooking={(id) => navigate(`../bookings/${id}`)}
      />
    </div>
  );
}
