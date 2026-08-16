import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type ColumnDef,
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { CalendarDays, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { SearchInput } from '@/components/shared/SearchInput';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate } from '@/lib/helpers';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useBookings } from '../../api/bookingsApi';
import { useFacilities } from '../../api/facilitiesApi';
import { BookingStatusBadge } from '../../components/BookingStatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PaymentStatusBadge } from '../../components/PaymentStatusBadge';
import { formatTimeOfDay } from '../../lib/format';
import { bookingStatusToneMap, paymentStatusToneMap, type BookingStatus, type PaymentStatus } from '../../lib/bookingStatus';
import type { BookingDto } from '@/api/generated/mycondoApi';

const ALL = '__all__';

const BOOKING_LIST_FILTER_DEFAULTS = {
  facilityId: '',
  buildingId: '',
  eventType: '',
  status: '',
  paymentStatus: '',
  page: '1',
  pageSize: '10',
};

/**
 * Every filter shown here (Hall, Building, Event type, Status, Payment status) is applied server-side
 * by `GetBookingsQuery` before pagination — the DataGrid's row count, page count, and result range all
 * describe the exact same filtered set. Event type uses the same debounced-search convention as every
 * other list page (see ServiceChargeRuleDirectoryPage).
 */
export function BookingListPage() {
  const [filters, setFilters] = useUrlFilters(BOOKING_LIST_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [eventType, setEventType] = useState(filters.eventType);
  const debouncedEventType = useDebouncedValue(eventType);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setFilters({ eventType: debouncedEventType, page: '1' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the settled event type should retrigger this
  }, [debouncedEventType]);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = functionalUpdate(updater, pagination);
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, refetch } = useBookings({
    facilityId: filters.facilityId || undefined,
    buildingId: filters.buildingId || undefined,
    eventType: debouncedEventType || undefined,
    status: filters.status || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const { data: facilitiesData } = useFacilities({ facilityType: 'CommunityHall', page: 1, pageSize: 100 });

  const facilityNameById = useMemo(
    () => Object.fromEntries((facilitiesData?.items ?? []).map((f) => [f.facilityId, f.name])),
    [facilitiesData],
  );

  const columns: ColumnDef<BookingDto>[] = [
    {
      id: 'reference',
      header: ({ column }) => <DataGridColumnHeader title="Reference" column={column} />,
      cell: ({ row }) => (
        <Link to={row.original.bookingId} className="font-mono text-xs text-primary hover:underline">
          {row.original.bookingId.slice(0, 8)}
        </Link>
      ),
    },
    {
      id: 'hall',
      header: 'Hall',
      cell: ({ row }) => facilityNameById[row.original.facilityId] ?? '—',
    },
    {
      id: 'eventDate',
      header: ({ column }) => <DataGridColumnHeader title="Event date" column={column} />,
      cell: ({ row }) => formatDate(row.original.startAtUtc),
    },
    {
      id: 'time',
      header: 'Start / End',
      cell: ({ row }) => `${formatTimeOfDay(row.original.startAtUtc)} – ${formatTimeOfDay(row.original.endAtUtc)}`,
    },
    { id: 'eventType', header: 'Event type', cell: ({ row }) => row.original.eventType },
    { id: 'guests', header: 'Guests', cell: ({ row }) => row.original.expectedGuestCount },
    { id: 'charge', header: 'Charge', cell: ({ row }) => <MoneyDisplay amount={row.original.bookingChargeAmount} /> },
    { id: 'deposit', header: 'Deposit', cell: ({ row }) => <MoneyDisplay amount={row.original.depositAmount} /> },
    {
      id: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => <PaymentStatusBadge booking={row.original} />,
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <BookingStatusBadge status={row.original.status as BookingStatus} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button size="sm" variant="outline" asChild>
          <Link to={row.original.bookingId}>View</Link>
        </Button>
      ),
    },
  ];

  const total = data ? Number(data.total) : 0;
  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    // The API has no sort parameter on this query — DataGridColumnHeader would otherwise show a
    // clickable sort arrow that updates but never actually reorders rows (no getSortedRowModel).
    enableSorting: false,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Community Hall Bookings"
        crumbs={[{ label: 'Facilities' }, { label: 'Community Hall' }, { label: 'Booking List' }]}
        primaryAction={
          <>
            <Button variant="outline" asChild>
              <Link to="../calendar">
                <CalendarDays /> Calendar
              </Link>
            </Button>
            <RequirePermission permission={PERMISSIONS.facility.bookingCreate}>
              <Button asChild>
                <Link to="new">
                  <Plus /> New Booking
                </Link>
              </Button>
            </RequirePermission>
          </>
        }
      />

      {isError ? (
        <Card>
          <ErrorState description="Failed to load bookings. Please try again." onRetry={refetch} />
        </Card>
      ) : (
      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isFetching}
        emptyMessage={
          <EmptyState
            icon={<CalendarDays className="size-8" aria-hidden="true" />}
            title="No bookings found"
            description={
              filters.facilityId || filters.buildingId || debouncedEventType || filters.status || filters.paymentStatus
                ? 'No bookings match the current filters.'
                : 'No community hall bookings have been made yet.'
            }
          />
        }
        tableLayout={{ cellBorder: true }}
      >
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle as="h2">Bookings</CardTitle>
            </CardHeading>
            <CardToolbar className="flex flex-wrap gap-2">
              <FacilitySelect
                facilityType="CommunityHall"
                value={filters.facilityId || undefined}
                onValueChange={(id) => setFilters({ facilityId: id, page: '1' })}
                placeholder="All halls"
              />
              <BuildingSelect
                value={filters.buildingId || undefined}
                onValueChange={(id) => setFilters({ buildingId: id, page: '1' })}
                placeholder="All buildings"
              />
              <SearchInput
                value={eventType}
                onChange={setEventType}
                placeholder="Event type…"
                isSearching={eventType !== debouncedEventType}
                className="w-40"
              />
              <Select
                value={filters.status || ALL}
                onValueChange={(v) => setFilters({ status: v === ALL ? '' : v, page: '1' })}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {Object.keys(bookingStatusToneMap).map((status) => (
                    <SelectItem key={status} value={status}>
                      {bookingStatusToneMap[status as BookingStatus].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.paymentStatus || ALL}
                onValueChange={(v) => setFilters({ paymentStatus: v === ALL ? '' : v, page: '1' })}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All payment statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All payment statuses</SelectItem>
                  {Object.keys(paymentStatusToneMap).map((status) => (
                    <SelectItem key={status} value={status}>
                      {paymentStatusToneMap[status as PaymentStatus].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardToolbar>
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>
      )}
    </>
  );
}
