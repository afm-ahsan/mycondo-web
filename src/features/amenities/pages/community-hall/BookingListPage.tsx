import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
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
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate } from '@/lib/helpers';
import { useBookings } from '../../api/bookingsApi';
import { useFacilities } from '../../api/facilitiesApi';
import { BookingStatusBadge } from '../../components/BookingStatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PaymentStatusBadge } from '../../components/PaymentStatusBadge';
import { formatBdt, formatTimeOfDay } from '../../lib/format';
import { bookingStatusToneMap, type BookingStatus } from '../../lib/bookingStatus';
import type { BookingDto } from '@/api/generated/mycondoApi';

const ALL = '__all__';

/**
 * List columns/filters per Slice G plan §5. `GetBookingsQuery` only accepts `facilityId`/`flatId`/
 * `status` server-side — Building/Event type/Payment status are applied client-side on the current
 * page only, disclosed as a known limitation rather than extending the backend query in this frontend
 * slice.
 */
export function BookingListPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [facilityId, setFacilityId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [buildingId, setBuildingId] = useState<string | undefined>();
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | undefined>();

  const { data, isFetching, isError } = useBookings({
    facilityId,
    status: statusFilter,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const { data: facilitiesData } = useFacilities({ facilityType: 'CommunityHall', page: 1, pageSize: 100 });

  const facilityNameById = useMemo(
    () => Object.fromEntries((facilitiesData?.items ?? []).map((f) => [f.facilityId, f.name])),
    [facilitiesData],
  );

  const filteredItems = useMemo(() => {
    let items = data?.items ?? [];
    if (buildingId) items = items.filter((b) => b.buildingId === buildingId);
    if (eventTypeFilter.trim()) {
      const needle = eventTypeFilter.trim().toLowerCase();
      items = items.filter((b) => b.eventType.toLowerCase().includes(needle));
    }
    if (paymentStatusFilter) {
      items = items.filter((b) => derivePaymentStatusLabel(b) === paymentStatusFilter);
    }
    return items;
  }, [data, buildingId, eventTypeFilter, paymentStatusFilter]);

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
    { id: 'charge', header: 'Charge', cell: ({ row }) => formatBdt(row.original.bookingChargeAmount) },
    { id: 'deposit', header: 'Deposit', cell: ({ row }) => formatBdt(row.original.depositAmount) },
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
      header: '',
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
    data: filteredItems,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    // The API has no sort parameter on this query — DataGridColumnHeader would otherwise show a
    // clickable sort arrow that updates but never actually reorders rows (no getSortedRowModel).
    enableSorting: false,
    state: { pagination },
    onPaginationChange: setPagination,
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

      {isError && (
        <p className="text-destructive text-sm mb-2">Failed to load bookings. Please try again.</p>
      )}

      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isFetching}
        emptyMessage="No bookings yet."
        tableLayout={{ cellBorder: true }}
      >
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Bookings</CardTitle>
            </CardHeading>
            <CardToolbar className="flex flex-wrap gap-2">
              <FacilitySelect
                facilityType="CommunityHall"
                value={facilityId}
                onValueChange={(id) => {
                  setFacilityId(id);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
                placeholder="All halls"
              />
              <BuildingSelect value={buildingId} onValueChange={setBuildingId} placeholder="All buildings" />
              <Input
                placeholder="Event type…"
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-40"
              />
              <Select
                value={statusFilter ?? ALL}
                onValueChange={(v) => {
                  setStatusFilter(v === ALL ? undefined : v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
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
              <Select value={paymentStatusFilter ?? ALL} onValueChange={(v) => setPaymentStatusFilter(v === ALL ? undefined : v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All payment statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All payment statuses</SelectItem>
                  <SelectItem value="Not Required">Not Required</SelectItem>
                  <SelectItem value="Awaiting Payment">Awaiting Payment</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
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
    </>
  );
}

function derivePaymentStatusLabel(booking: BookingDto): string {
  if (!booking.paymentRequired) return 'Not Required';
  if (booking.invoiceId || booking.depositCollectionPostingId) return 'Paid';
  return 'Awaiting Payment';
}
