import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { useAttendanceRegister, useClockOut } from '../api/staffAttendanceApi';
import { formatShift, formatTimeOfDay } from '../lib/format';
import type { AttendanceRegisterEntryDto } from '@/api/generated/mycondoApi';

const CURRENTLY_PRESENT_FILTER_DEFAULTS = { page: '1', pageSize: '20' };

export function CurrentlyPresentStaffPage() {
  const [filters, setFilters] = useUrlFilters(CURRENTLY_PRESENT_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 20,
  };
  const [clockOut, { isLoading: isClockingOut }] = useClockOut();
  const [clockOutTarget, setClockOutTarget] = useState<AttendanceRegisterEntryDto | null>(null);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, error, refetch } = useAttendanceRegister({
    onlyOpen: true,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  async function handleConfirmClockOut() {
    if (!clockOutTarget) return;
    try {
      await clockOut({ id: clockOutTarget.attendanceRecordId }).unwrap();
      toast.success('Clocked out.');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setClockOutTarget(null);
    }
  }

  const columns: ColumnDef<AttendanceRegisterEntryDto>[] = [
    {
      id: 'staffMember',
      accessorFn: (row) => row.staffMemberFullName,
      header: ({ column }) => <DataGridColumnHeader title="Employee" column={column} />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.staffMemberFullName}</div>
          <div className="text-muted-foreground text-xs">{row.original.staffMemberRole}</div>
        </div>
      ),
    },
    {
      id: 'workDate',
      header: 'Date',
      cell: ({ row }) => row.original.workDate,
    },
    {
      id: 'shift',
      header: 'Shift',
      cell: ({ row }) => formatShift(row.original.scheduledStartUtc, row.original.scheduledEndUtc),
    },
    {
      id: 'checkIn',
      header: 'Clocked in at',
      cell: ({ row }) => formatTimeOfDay(row.original.checkInUtc),
    },
    {
      id: 'workLocation',
      header: 'Location',
      cell: ({ row }) => row.original.workLocation ?? '—',
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => (
        <Badge variant="info" appearance="light">
          Present
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RequirePermission permission={PERMISSIONS.staffAttendance.manage}>
          <Button size="sm" variant="outline" onClick={() => setClockOutTarget(row.original)} disabled={isClockingOut}>
            <LogOut /> Clock Out
          </Button>
        </RequirePermission>
      ),
    },
  ];

  const total = data ? Number(data.total) : 0;
  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    enableSorting: false,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Staff Currently Present"
        crumbs={[{ label: 'Security & Access' }, { label: 'Staff Attendance' }, { label: 'Currently Present' }]}
      />
      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid
          table={table}
          recordCount={total}
          isLoading={isFetching}
          emptyMessage="No staff currently clocked in."
          tableLayout={{ cellBorder: true }}
        >
          <Card>
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

      <ConfirmActionDialog
        open={clockOutTarget !== null}
        onOpenChange={(open) => !open && setClockOutTarget(null)}
        title="Clock out this staff member?"
        description={
          clockOutTarget && (
            <>
              {clockOutTarget.staffMemberFullName} — clocked in at {formatTimeOfDay(clockOutTarget.checkInUtc)} on{' '}
              {clockOutTarget.workDate}.
            </>
          )
        }
        confirmLabel="Clock Out"
        loadingLabel="Clocking out..."
        isLoading={isClockingOut}
        onConfirm={handleConfirmClockOut}
      />
    </>
  );
}
