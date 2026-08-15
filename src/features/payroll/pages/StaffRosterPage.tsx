import { useEffect, useRef, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { ClipboardList, LogIn, Plus, Users as UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { ClockInDialog } from '../components/ClockInDialog';
import { useStaffMembers } from '../api/staffAttendanceApi';
import type { StaffMemberDto } from '@/api/generated/mycondoApi';

const activeToneMap: StatusBadgeMap<'Active' | 'Inactive'> = {
  Active: { label: 'Active', variant: 'success' },
  Inactive: { label: 'Inactive', variant: 'secondary' },
};

const ROSTER_FILTER_DEFAULTS = { search: '', page: '1', pageSize: '10' };

export function StaffRosterPage() {
  const [filters, setFilters] = useUrlFilters(ROSTER_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setFilters({ search: debouncedSearch, page: '1' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the settled search should retrigger this, not every filters/setFilters identity change
  }, [debouncedSearch]);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const [clockInTarget, setClockInTarget] = useState<StaffMemberDto | null>(null);

  const { data, isFetching } = useStaffMembers({
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const isSearchPending = search !== debouncedSearch;

  const columns: ColumnDef<StaffMemberDto>[] = [
    {
      id: 'fullName',
      accessorFn: (row) => row.fullName,
      header: ({ column }) => <DataGridColumnHeader title="Name" column={column} />,
      cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
    },
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }) => row.original.role,
    },
    {
      id: 'phone',
      accessorFn: (row) => row.phone,
      header: ({ column }) => <DataGridColumnHeader title="Mobile" column={column} />,
      cell: ({ row }) => row.original.phone ?? '—',
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'Active' : 'Inactive'} toneMap={activeToneMap} />
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <RequirePermission permission={PERMISSIONS.staffAttendance.view}>
            <Button size="sm" variant="outline" asChild>
              <Link to={`/security/staff-attendance/records?staffMemberId=${row.original.staffMemberId}`}>
                Records
              </Link>
            </Button>
          </RequirePermission>
          <RequirePermission permission={PERMISSIONS.staffAttendance.manage}>
            <Button size="sm" onClick={() => setClockInTarget(row.original)} disabled={!row.original.isActive}>
              <LogIn /> Clock In
            </Button>
          </RequirePermission>
        </div>
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
        title="Staff Roster"
        crumbs={[{ label: 'Security & Access' }, { label: 'Staff Attendance' }, { label: 'Roster' }]}
      />
      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isFetching}
        emptyMessage="No staff members registered yet."
        tableLayout={{ cellBorder: true }}
      >
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Staff Members</CardTitle>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by name…"
                isSearching={isSearchPending}
                className="w-64"
              />
            </CardHeading>
            <CardToolbar>
              <Button variant="outline" asChild>
                <Link to="/security/staff-attendance/currently-present">
                  <UsersIcon /> Currently present
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/security/staff-attendance/records">
                  <ClipboardList /> Attendance register
                </Link>
              </Button>
              <RequirePermission permission={PERMISSIONS.staffAttendance.manage}>
                <Button asChild>
                  <Link to="/security/staff-attendance/new">
                    <Plus /> Register Staff Member
                  </Link>
                </Button>
              </RequirePermission>
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

      <ClockInDialog staffMember={clockInTarget} onOpenChange={(open) => !open && setClockInTarget(null)} />
    </>
  );
}
