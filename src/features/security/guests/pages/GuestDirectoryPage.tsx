import { useEffect, useRef, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { LogIn, Plus, Users as UsersIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { GuestFormDialog } from '../components/GuestFormDialog';
import { useBlockGuest, useGuests, useUnblockGuest } from '../api/guestsApi';
import type { GuestProfileDto } from '@/api/generated/mycondoApi';

const statusToneMap: StatusBadgeMap<'Active' | 'Blocked'> = {
  Active: { label: 'Active', variant: 'success' },
  Blocked: { label: 'Blocked', variant: 'destructive' },
};

const GUEST_DIRECTORY_FILTER_DEFAULTS = { search: '', page: '1', pageSize: '10' };

export function GuestDirectoryPage() {
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

  const [filters, setFilters] = useUrlFilters(GUEST_DIRECTORY_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip on mount — the debounced value on first render is whatever the URL already had, and
    // committing it here would wipe out an existing `?page=` from a shared/refreshed link.
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

  const [blockTarget, setBlockTarget] = useState<GuestProfileDto | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const { data, isFetching } = useGuests({
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const isSearchPending = search !== debouncedSearch;
  const [blockGuest, { isLoading: isBlocking }] = useBlockGuest();
  const [unblockGuest, { isLoading: isUnblocking }] = useUnblockGuest();

  async function handleUnblock(guestProfileId: string) {
    try {
      await unblockGuest({ id: guestProfileId }).unwrap();
      toast.success('Guest unblocked.');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  async function handleConfirmBlock() {
    if (!blockTarget) return;
    try {
      await blockGuest({ id: blockTarget.guestProfileId, blockGuestProfileRequest: { reason: blockReason } }).unwrap();
      toast.success('Guest blocked.');
      setBlockTarget(null);
      setBlockReason('');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  // Not memoized: the block/unblock cell closures need up-to-date `isBlocking`/`isUnblocking`
  // and handlers each render; the column definitions are cheap enough to rebuild every time.
  const columns: ColumnDef<GuestProfileDto>[] = [
    {
      id: 'fullName',
      accessorFn: (row) => row.fullName,
      header: ({ column }) => <DataGridColumnHeader title="Guest name" column={column} />,
      cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
    },
    {
      id: 'phone',
      accessorFn: (row) => row.phone,
      header: ({ column }) => <DataGridColumnHeader title="Mobile" column={column} />,
      cell: ({ row }) => row.original.phone,
    },
    {
      id: 'identity',
      header: 'Identity document',
      cell: ({ row }) =>
        row.original.identityDocumentType
          ? `${row.original.identityDocumentType}: ${row.original.identityDocumentNumberMasked ?? '—'}`
          : '—',
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.isBlocked ? 'Blocked' : 'Active'} toneMap={statusToneMap} />
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <RequirePermission permission={PERMISSIONS.visitor.blockManage}>
          {row.original.isBlocked ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isUnblocking}
              onClick={() => handleUnblock(row.original.guestProfileId)}
            >
              Unblock
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              disabled={isBlocking}
              onClick={() => setBlockTarget(row.original)}
            >
              Block
            </Button>
          )}
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
        title="Guest Register"
        crumbs={[
          { label: 'Security & Access' },
          { label: 'Visitor Management' },
          { label: 'Guest Register' },
        ]}
      />
      <DataGrid
        table={table}
        recordCount={total}
        isLoading={isFetching}
        emptyMessage="No guests yet."
        tableLayout={{ cellBorder: true }}
      >
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle as="h2">Guest Register</CardTitle>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by name or mobile…"
                isSearching={isSearchPending}
                className="w-64"
              />
            </CardHeading>
            <CardToolbar>
              <Button variant="outline" asChild>
                <Link to="/security/guests/currently-inside">
                  <UsersIcon /> Currently inside
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/security/guests/checkin-out">
                  <LogIn /> Check in / out
                </Link>
              </Button>
              <RequirePermission permission={PERMISSIONS.visitor.create}>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus /> New Guest
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

      <Dialog open={blockTarget !== null} onOpenChange={(open) => !open && setBlockTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {blockTarget?.fullName}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="block-reason">Reason</Label>
            <Input
              id="block-reason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Reported by resident for unauthorized access"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isBlocking || blockReason.trim().length === 0}
              onClick={handleConfirmBlock}
            >
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GuestFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
