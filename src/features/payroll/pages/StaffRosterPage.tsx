import { useEffect, useRef, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { ClipboardList, History, LogIn, Plus, Users as UsersIcon } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { RowActionsMenu } from '@/components/ui/data-grid-row-actions';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { toUserMessage } from '@/api/errors';
import { ClockInDialog } from '../components/ClockInDialog';
import { StaffMemberFormDialog } from '../components/StaffMemberFormDialog';
import { useStaffMembers } from '../api/staffAttendanceApi';
import type { StaffMemberDto } from '@/api/generated/mycondoApi';

const activeToneMap: StatusBadgeMap<'Active' | 'Inactive'> = {
  Active: { label: 'Active', variant: 'success' },
  Inactive: { label: 'Inactive', variant: 'secondary' },
};

const ROSTER_FILTER_DEFAULTS = { search: '', page: '1', pageSize: '10' };

export function StaffRosterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true);
      setSearchParams(
        (params) => {
          params.delete('create');
          return params;
        },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only once on mount to consume the deep-link flag
  }, []);

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

  const { data, isFetching, isError, error, refetch } = useStaffMembers({
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
      size: DATA_GRID_COLUMN_SIZE.medium,
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
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'Active' : 'Inactive'} toneMap={activeToneMap} />
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.action,
      cell: ({ row }) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${row.original.fullName}`}
          actions={[
            {
              key: 'records',
              label: 'Records',
              icon: <History />,
              onClick: () =>
                navigate(`/security/staff-attendance/records?staffMemberId=${row.original.staffMemberId}`),
              permission: PERMISSIONS.staffAttendance.view,
            },
            {
              key: 'clockIn',
              label: 'Clock In',
              icon: <LogIn />,
              onClick: () => setClockInTarget(row.original),
              permission: PERMISSIONS.staffAttendance.manage,
              disabled: !row.original.isActive,
            },
          ]}
        />
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
      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
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
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus /> Register Staff Member
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
      )}

      <ClockInDialog staffMember={clockInTarget} onOpenChange={(open) => !open && setClockInTarget(null)} />
      <StaffMemberFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
