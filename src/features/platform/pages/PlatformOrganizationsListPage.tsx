import { useState } from 'react';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import type { OrganizationListItemDto } from '@/api/generated/mycondoApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate } from '@/lib/helpers';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { PLATFORM_PERMISSIONS } from '@/lib/auth/platformPermissionKeys';
import { RequirePlatformPermission } from '@/lib/auth/RequirePlatformPermission';
import {
  useActivateOrganizationMutation,
  useListOrganizationsQuery,
  useReactivateOrganizationMutation,
  useSuspendOrganizationMutation,
} from '../api/platformOrganizationsApi';
import { organizationStatusToneMap, type OrganizationStatus } from '../lib/organizationStatus';

const ORGANIZATIONS_FILTER_DEFAULTS = { search: '', status: 'all', page: '1', pageSize: '10' };

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'PendingActivation', label: 'Provisioning' },
  { value: 'Suspended', label: 'Suspended' },
];

type PendingAction =
  | { type: 'suspend' | 'activate' | 'reactivate'; organizationId: string; organizationName: string }
  | null;

export function PlatformOrganizationsListPage() {
  const [filters, setFilters] = useUrlFilters(ORGANIZATIONS_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const { data, isFetching, isError, error, refetch } = useListOrganizationsQuery({
    search: debouncedSearch || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const [suspendOrganization, { isLoading: isSuspending }] = useSuspendOrganizationMutation();
  const [activateOrganization, { isLoading: isActivating }] = useActivateOrganizationMutation();
  const [reactivateOrganization, { isLoading: isReactivating }] = useReactivateOrganizationMutation();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const isMutating = isSuspending || isActivating || isReactivating;

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setFilters({ search: value, page: '1' });
  }

  function handleStatusChange(value: string) {
    setFilters({ status: value, page: '1' });
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    try {
      if (pendingAction.type === 'suspend') {
        await suspendOrganization(pendingAction.organizationId).unwrap();
        toast.success(`${pendingAction.organizationName} suspended.`);
      } else if (pendingAction.type === 'activate') {
        await activateOrganization(pendingAction.organizationId).unwrap();
        toast.success(`${pendingAction.organizationName} activated.`);
      } else {
        await reactivateOrganization(pendingAction.organizationId).unwrap();
        toast.success(`${pendingAction.organizationName} reactivated.`);
      }
      setPendingAction(null);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  const columns: ColumnDef<OrganizationListItemDto>[] = [
    {
      id: 'name',
      header: 'Organization',
      cell: ({ row }) => (
        <>
          <Link to={`/platform/organizations/${row.original.tenantId}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
          {row.original.code && <span className="text-muted-foreground ml-1.5 text-xs">({row.original.code})</span>}
        </>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status as OrganizationStatus} toneMap={organizationStatusToneMap} />,
    },
    {
      id: 'administrator',
      header: 'Administrator',
      cell: ({ row }) =>
        row.original.primaryAdministratorFullName ? (
          <div className="text-sm">
            <div>{row.original.primaryAdministratorFullName}</div>
            <div className="text-muted-foreground text-xs">{row.original.primaryAdministratorEmail}</div>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      id: 'createdAtUtc',
      header: 'Created',
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.createdAtUtc)}</span>,
    },
    {
      id: 'modules',
      header: 'Modules',
      cell: ({ row }) => (
        <Badge variant="secondary" appearance="light">
          {row.original.enabledModuleCount}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const org = row.original;
        const hasAction = org.status === 'Active' || org.status === 'PendingActivation' || org.status === 'Suspended';
        if (!hasAction) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {org.status === 'Active' && (
                <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.suspend}>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setPendingAction({ type: 'suspend', organizationId: org.tenantId, organizationName: org.name })}
                  >
                    Suspend
                  </DropdownMenuItem>
                </RequirePlatformPermission>
              )}
              {org.status === 'PendingActivation' && (
                <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.activate}>
                  <DropdownMenuItem
                    onClick={() => setPendingAction({ type: 'activate', organizationId: org.tenantId, organizationName: org.name })}
                  >
                    Activate
                  </DropdownMenuItem>
                </RequirePlatformPermission>
              )}
              {org.status === 'Suspended' && (
                <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.reactivate}>
                  <DropdownMenuItem
                    onClick={() => setPendingAction({ type: 'reactivate', organizationId: org.tenantId, organizationName: org.name })}
                  >
                    Reactivate
                  </DropdownMenuItem>
                </RequirePlatformPermission>
              )}
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
        title="Organizations"
        description="Every organization provisioned on the platform."
        crumbs={[{ label: 'Dashboard', path: '/platform/dashboard' }, { label: 'Organizations' }]}
        primaryAction={
          <RequirePlatformPermission permission={PLATFORM_PERMISSIONS.organization.create}>
            <Button asChild>
              <Link to="/platform/organizations/new">
                <PlusIcon /> New Organization
              </Link>
            </Button>
          </RequirePlatformPermission>
        }
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No organizations match these filters.">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>All organizations</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filters.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search by name or code…"
                    isSearching={isSearchPending}
                    className="w-64"
                  />
                </div>
              </CardHeading>
            </CardHeader>
            <CardTable>
              <DataGridTable />
            </CardTable>
            <CardFooter>
              <DataGridPagination />
            </CardFooter>
          </Card>
        </DataGrid>
      )}

      <ConfirmActionDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={
          pendingAction?.type === 'suspend'
            ? 'Suspend this organization?'
            : pendingAction?.type === 'activate'
              ? 'Activate this organization?'
              : 'Reactivate this organization?'
        }
        description={
          pendingAction?.type === 'suspend'
            ? `${pendingAction.organizationName}'s users will no longer be able to sign in. Its data is preserved and this can be reversed with Reactivate.`
            : `${pendingAction?.organizationName ?? 'This organization'} will become Active and its users will be able to sign in.`
        }
        confirmLabel={pendingAction?.type === 'suspend' ? 'Suspend' : pendingAction?.type === 'activate' ? 'Activate' : 'Reactivate'}
        loadingLabel="Working…"
        isLoading={isMutating}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}
