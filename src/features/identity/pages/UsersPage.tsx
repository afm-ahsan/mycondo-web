import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { toUserMessage } from '@/api/errors';
import type { UserSummaryDto } from '@/api/generated/mycondoApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { CreateUserDialog } from '../components/CreateUserDialog';
import { EditUserDialog } from '../components/EditUserDialog';
import { ManageUserRolesDialog } from '../components/ManageUserRolesDialog';
import { ViewUserDialog } from '../components/ViewUserDialog';
import { useDisableUser, useEnableUser, useRoles, useUsers } from '../api/identityApi';

const USERS_FILTER_DEFAULTS = { search: '', roleId: 'all', status: 'all', page: '1', pageSize: '10' };

const userStatusToneMap: StatusBadgeMap<'Active' | 'Disabled'> = {
  Active: { label: 'Active', variant: 'success' },
  Disabled: { label: 'Disabled', variant: 'destructive' },
};

type PendingStatusChange = { userId: string; fullName: string; type: 'enable' | 'disable' };
type DialogTarget = { userId: string; fullName: string };

export function UsersPage() {
  const [filters, setFilters] = useUrlFilters(USERS_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const { data: roles } = useRoles();
  const { data, isFetching, isError, error, refetch } = useUsers({
    searchText: debouncedSearch || undefined,
    roleId: filters.roleId === 'all' ? undefined : filters.roleId,
    isActive: filters.status === 'all' ? undefined : filters.status === 'active',
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const [disableUser, { isLoading: isDisabling }] = useDisableUser();
  const [enableUser, { isLoading: isEnabling }] = useEnableUser();
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
  const [viewTarget, setViewTarget] = useState<DialogTarget | null>(null);
  const [editTarget, setEditTarget] = useState<DialogTarget | null>(null);
  const [rolesTarget, setRolesTarget] = useState<DialogTarget | null>(null);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setFilters({ search: value, page: '1' });
  }

  async function handleConfirmStatusChange() {
    if (!pendingStatusChange) return;
    try {
      if (pendingStatusChange.type === 'disable') {
        await disableUser({ id: pendingStatusChange.userId }).unwrap();
        toast.success('User disabled.');
      } else {
        await enableUser({ id: pendingStatusChange.userId }).unwrap();
        toast.success('User enabled.');
      }
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setPendingStatusChange(null);
    }
  }

  const columns: ColumnDef<UserSummaryDto>[] = [
    { id: 'fullName', header: 'Full name', cell: ({ row }) => row.original.fullName },
    { id: 'email', header: 'Email', cell: ({ row }) => row.original.email },
    { id: 'phoneNumber', header: 'Mobile', cell: ({ row }) => row.original.phoneNumber ?? '—' },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isActive ? 'Active' : 'Disabled'} toneMap={userStatusToneMap} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        const target: DialogTarget = { userId: user.userId, fullName: user.fullName };
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" mode="icon" size="sm" aria-label={`Actions for ${user.fullName}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewTarget(target)}>View</DropdownMenuItem>
              <RequirePermission permission="user.update">
                <DropdownMenuItem onClick={() => setEditTarget(target)}>Edit</DropdownMenuItem>
              </RequirePermission>
              <DropdownMenuItem onClick={() => setRolesTarget(target)}>Roles / Permissions</DropdownMenuItem>
              <RequirePermission permission="user.disable">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() =>
                    setPendingStatusChange({
                      userId: user.userId,
                      fullName: user.fullName,
                      type: user.isActive ? 'disable' : 'enable',
                    })
                  }
                >
                  {user.isActive ? 'Disable' : 'Enable'}
                </DropdownMenuItem>
              </RequirePermission>
            </DropdownMenuContent>
          </DropdownMenu>
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
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone with an account in this tenant."
        crumbs={[{ label: 'Administration' }, { label: 'Users' }]}
        primaryAction={
          <RequirePermission permission="user.create">
            <CreateUserDialog />
          </RequirePermission>
        }
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No users match these filters.">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>All users</CardTitle>
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by name or email…"
                  isSearching={isSearchPending}
                  className="w-64"
                />
              </CardHeading>
              <CardToolbar>
                <Select value={filters.roleId} onValueChange={(v) => setFilters({ roleId: v, page: '1' })}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {roles?.map((role) => (
                      <SelectItem key={role.roleId} value={role.roleId}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(v) => setFilters({ status: v, page: '1' })}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </CardToolbar>
            </CardHeader>

            <div className="hidden md:block">
              <CardTable>
                <ScrollArea>
                  <DataGridTable />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardTable>
            </div>
            <div className="divide-border divide-y md:hidden">
              {(data?.items ?? []).map((user) => (
                <UserCard
                  key={user.userId}
                  user={user}
                  onView={() => setViewTarget({ userId: user.userId, fullName: user.fullName })}
                  onEdit={() => setEditTarget({ userId: user.userId, fullName: user.fullName })}
                  onManageRoles={() => setRolesTarget({ userId: user.userId, fullName: user.fullName })}
                  onToggleStatus={() =>
                    setPendingStatusChange({
                      userId: user.userId,
                      fullName: user.fullName,
                      type: user.isActive ? 'disable' : 'enable',
                    })
                  }
                />
              ))}
            </div>

            <CardFooter>
              <DataGridPagination />
            </CardFooter>
          </Card>
        </DataGrid>
      )}

      <ConfirmActionDialog
        open={pendingStatusChange !== null}
        onOpenChange={(open) => !open && setPendingStatusChange(null)}
        title={pendingStatusChange?.type === 'disable' ? 'Disable this user?' : 'Enable this user?'}
        description={
          pendingStatusChange?.type === 'disable'
            ? `${pendingStatusChange.fullName} will no longer be able to sign in.`
            : `${pendingStatusChange?.fullName} will be able to sign in again.`
        }
        confirmLabel={pendingStatusChange?.type === 'disable' ? 'Disable' : 'Enable'}
        loadingLabel="Saving…"
        isLoading={isDisabling || isEnabling}
        onConfirm={handleConfirmStatusChange}
        confirmVariant={pendingStatusChange?.type === 'disable' ? 'destructive' : 'primary'}
      />

      {viewTarget && (
        <ViewUserDialog
          userId={viewTarget.userId}
          open={viewTarget !== null}
          onOpenChange={(open) => !open && setViewTarget(null)}
        />
      )}
      {editTarget && (
        <EditUserDialog
          userId={editTarget.userId}
          open={editTarget !== null}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}
      {rolesTarget && (
        <ManageUserRolesDialog
          userId={rolesTarget.userId}
          userFullName={rolesTarget.fullName}
          open={rolesTarget !== null}
          onOpenChange={(open) => !open && setRolesTarget(null)}
        />
      )}
    </>
  );
}

function UserCard({
  user,
  onView,
  onEdit,
  onManageRoles,
  onToggleStatus,
}: {
  user: UserSummaryDto;
  onView: () => void;
  onEdit: () => void;
  onManageRoles: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{user.fullName}</span>
        <StatusBadge status={user.isActive ? 'Active' : 'Disabled'} toneMap={userStatusToneMap} />
      </div>
      <div className="text-muted-foreground text-xs">{user.email}</div>
      <div className="flex items-center gap-3 pt-1">
        <Button variant="primary" mode="link" size="sm" className="h-auto p-0" onClick={onView}>
          View
        </Button>
        <RequirePermission permission="user.update">
          <Button variant="primary" mode="link" size="sm" className="h-auto p-0" onClick={onEdit}>
            Edit
          </Button>
        </RequirePermission>
        <Button variant="primary" mode="link" size="sm" className="h-auto p-0" onClick={onManageRoles}>
          Roles
        </Button>
        <RequirePermission permission="user.disable">
          <Button variant="primary" mode="link" size="sm" className="h-auto p-0" onClick={onToggleStatus}>
            {user.isActive ? 'Disable' : 'Enable'}
          </Button>
        </RequirePermission>
      </div>
    </div>
  );
}
