import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Check, LogOut, MessageSquareWarning } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { RequestCorrectionDialog } from '../components/RequestCorrectionDialog';
import { StaffMemberPicker } from '../components/StaffMemberPicker';
import { useApproveCorrection, useAttendanceRegister, useClockOut } from '../api/staffAttendanceApi';
import { formatOvertimeMinutes, formatShift, formatTimeOfDay, formatWorkedDuration } from '../lib/format';
import type { AttendanceRegisterEntryDto } from '@/api/generated/mycondoApi';

const REGISTER_FILTER_DEFAULTS = { workDate: '', staffMemberId: '', page: '1', pageSize: '20' };

export function AttendanceRegisterPage() {
  const [filters, setFilters] = useUrlFilters(REGISTER_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 20,
  };
  // Not URL-persisted: no GetById lookup exists for a staff member, so a shared/bookmarked link that
  // already carries ?staffMemberId= falls back to showing the raw ID until a returned row (which
  // carries staffMemberFullName) or a fresh pick resolves the display name.
  const [staffMemberLabel, setStaffMemberLabel] = useState('');
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceRegisterEntryDto | null>(null);
  const [clockOutTarget, setClockOutTarget] = useState<AttendanceRegisterEntryDto | null>(null);
  const [approveTarget, setApproveTarget] = useState<AttendanceRegisterEntryDto | null>(null);
  const [clockOut, { isLoading: isClockingOut }] = useClockOut();
  const [approveCorrection, { isLoading: isApproving }] = useApproveCorrection();

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, error, refetch } = useAttendanceRegister({
    workDate: filters.workDate || undefined,
    staffMemberId: filters.staffMemberId || undefined,
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

  async function handleConfirmApprove() {
    if (!approveTarget) return;
    try {
      await approveCorrection({ id: approveTarget.attendanceRecordId }).unwrap();
      toast.success('Correction approved.');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setApproveTarget(null);
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
      accessorFn: (row) => row.workDate,
      header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
      cell: ({ row }) => row.original.workDate,
    },
    {
      id: 'shift',
      header: 'Shift',
      cell: ({ row }) => formatShift(row.original.scheduledStartUtc, row.original.scheduledEndUtc),
    },
    {
      id: 'checkIn',
      header: 'First in',
      cell: ({ row }) => formatTimeOfDay(row.original.checkInUtc),
    },
    {
      id: 'checkOut',
      header: 'Last out',
      cell: ({ row }) =>
        row.original.checkOutUtc ? (
          formatTimeOfDay(row.original.checkOutUtc)
        ) : (
          <Badge variant="info" appearance="light">
            Open
          </Badge>
        ),
    },
    {
      id: 'worked',
      header: 'Worked',
      cell: ({ row }) => formatWorkedDuration(row.original.checkInUtc, row.original.checkOutUtc),
    },
    {
      id: 'overtime',
      header: 'Overtime',
      cell: ({ row }) => formatOvertimeMinutes(row.original.overtimeMinutes),
    },
    {
      id: 'flags',
      header: 'Flags',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.isLateArrival && (
            <Badge variant="warning" appearance="light" size="sm">
              Late
            </Badge>
          )}
          {row.original.isEarlyDeparture && (
            <Badge variant="warning" appearance="light" size="sm">
              Early departure
            </Badge>
          )}
          {row.original.correctionRequested && (
            <Badge variant={row.original.approvedBy ? 'success' : 'destructive'} appearance="light" size="sm">
              {row.original.approvedBy ? 'Correction approved' : 'Correction requested'}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex justify-end gap-1.5">
            {!record.checkOutUtc && (
              <RequirePermission permission={PERMISSIONS.staffAttendance.manage}>
                <Button size="sm" variant="outline" onClick={() => setClockOutTarget(record)} disabled={isClockingOut}>
                  <LogOut /> Clock Out
                </Button>
              </RequirePermission>
            )}
            {!record.correctionRequested && (
              <RequirePermission permission={PERMISSIONS.staffAttendance.correct}>
                <Button size="sm" variant="outline" onClick={() => setCorrectionTarget(record)}>
                  <MessageSquareWarning /> Correct
                </Button>
              </RequirePermission>
            )}
            {record.correctionRequested && !record.approvedBy && (
              <RequirePermission permission={PERMISSIONS.staffAttendance.approve}>
                <Button size="sm" onClick={() => setApproveTarget(record)} disabled={isApproving}>
                  <Check /> Approve
                </Button>
              </RequirePermission>
            )}
          </div>
        );
      },
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
        title="Attendance Register"
        crumbs={[{ label: 'Security & Access' }, { label: 'Staff Attendance' }, { label: 'Register' }]}
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
          emptyMessage="No attendance records for the selected filters."
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader className="flex-wrap gap-3">
              <CardHeading>
                <CardTitle>Attendance Records</CardTitle>
              </CardHeading>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    className="w-40"
                    value={filters.workDate}
                    onChange={(e) => setFilters({ workDate: e.target.value, page: '1' })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Employee</Label>
                  <StaffMemberPicker
                    value={filters.staffMemberId}
                    label={staffMemberLabel}
                    onChange={(id, label) => {
                      setStaffMemberLabel(label);
                      setFilters({ staffMemberId: id, page: '1' });
                    }}
                    onClear={() => {
                      setStaffMemberLabel('');
                      setFilters({ staffMemberId: '', page: '1' });
                    }}
                  />
                </div>
                {(filters.workDate || filters.staffMemberId) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStaffMemberLabel('');
                      setFilters({ workDate: '', staffMemberId: '', page: '1' });
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
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

      <RequestCorrectionDialog record={correctionTarget} onOpenChange={(open) => !open && setCorrectionTarget(null)} />

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

      <ConfirmActionDialog
        open={approveTarget !== null}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve this attendance correction?"
        description={
          approveTarget && (
            <>
              {approveTarget.staffMemberFullName} — {approveTarget.correctionReason ?? 'no reason given'}
            </>
          )
        }
        confirmLabel="Approve"
        loadingLabel="Approving..."
        isLoading={isApproving}
        onConfirm={handleConfirmApprove}
      />
    </>
  );
}
