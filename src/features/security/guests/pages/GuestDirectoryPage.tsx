import { useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { LogIn, Plus, Search, Users as UsersIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useBlockGuest, useGuests, useUnblockGuest } from '../api/guestsApi';
import type { GuestProfileDto } from '@/api/generated/mycondoApi';

const statusToneMap: StatusBadgeMap<'Active' | 'Blocked'> = {
  Active: { label: 'Active', variant: 'success' },
  Blocked: { label: 'Blocked', variant: 'destructive' },
};

export function GuestDirectoryPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [blockTarget, setBlockTarget] = useState<GuestProfileDto | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const { data, isFetching } = useGuests({
    search: search || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
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
      header: '',
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
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
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
              <CardTitle>Guest Register</CardTitle>
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search by name or mobile…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                  className="ps-9 w-64"
                />
                {search.length > 0 && (
                  <Button
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearch('')}
                  >
                    <X />
                  </Button>
                )}
              </div>
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
                <Button asChild>
                  <Link to="/security/guests/new">
                    <Plus /> New Guest
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
    </>
  );
}
