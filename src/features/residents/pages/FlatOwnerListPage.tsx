import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { FlatOwnerRegisterDto } from '@/api/generated/mycondoApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { UserSelect, type UserSelectValue } from '@/components/shared/UserSelect';
import { ErrorState } from '@/components/feedback/ErrorState';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import {
  useCreateFlatOwnership,
  useEndFlatOwnership,
  useFlatOwners,
  useFlatOwnershipsForUser,
} from '../api/residentsApi';

const OWNERS_FILTER_DEFAULTS = { search: '', status: 'Active', page: '1', pageSize: '10' };

export function FlatOwnerListPage() {
  const [filters, setFilters] = useUrlFilters(OWNERS_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const { data, isFetching, isError, error, refetch } = useFlatOwners({
    search: debouncedSearch || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<FlatOwnerRegisterDto | null>(null);
  const [endTarget, setEndTarget] = useState<FlatOwnerRegisterDto | null>(null);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setFilters({ search: value, page: '1' });
  }

  const columns: ColumnDef<FlatOwnerRegisterDto>[] = [
    {
      id: 'owner',
      header: 'Owner',
      cell: ({ row }) => (
        <button type="button" className="text-primary hover:underline text-left" onClick={() => setDetailTarget(row.original)}>
          {row.original.ownerFullName}
        </button>
      ),
    },
    { id: 'email', header: 'Email', cell: ({ row }) => row.original.ownerEmail },
    {
      id: 'flat',
      header: 'Flat',
      cell: ({ row }) => `${row.original.flatNumber} — ${row.original.buildingName}`,
    },
    { id: 'startDate', header: 'Since', cell: ({ row }) => row.original.startDate },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'Active' ? 'success' : 'secondary'} appearance="light">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.status === 'Active' ? (
          <RequirePermission permission="ownership.manage">
            <Button variant="outline" size="sm" onClick={() => setEndTarget(row.original)}>
              End ownership
            </Button>
          </RequirePermission>
        ) : null,
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
        title="Flat Owners"
        description="The formal ownership register — who legally owns which flat. Separate from occupancy/tenant registration."
        crumbs={[{ label: 'Resident Management' }, { label: 'Flat Owners' }]}
        primaryAction={
          <RequirePermission permission="ownership.manage">
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Add Owner
            </Button>
          </RequirePermission>
        }
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No flat owners match these filters.">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Ownership register</CardTitle>
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by owner name or email…"
                  isSearching={isSearchPending}
                  className="w-64"
                />
              </CardHeading>
              <CardToolbar>
                <Select value={filters.status} onValueChange={(v) => setFilters({ status: v, page: '1' })}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </CardToolbar>
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

      <CreateFlatOwnershipDialog open={createOpen} onOpenChange={setCreateOpen} />
      {detailTarget && (
        <FlatOwnerDetailDialog owner={detailTarget} open onOpenChange={(open) => !open && setDetailTarget(null)} />
      )}
      {endTarget && (
        <EndOwnershipDialog ownership={endTarget} open onOpenChange={(open) => !open && setEndTarget(null)} />
      )}
    </>
  );
}

const createOwnershipSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  flatId: z.string().min(1, { message: 'Flat is required.' }),
  startDate: z.string().min(1, { message: 'Start date is required.' }),
});
type CreateOwnershipSchemaType = z.infer<typeof createOwnershipSchema>;

function CreateFlatOwnershipDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [createOwnership, { isLoading }] = useCreateFlatOwnership();
  const [selectedUser, setSelectedUser] = useState<UserSelectValue | null>(null);

  const form = useForm<CreateOwnershipSchemaType>({
    resolver: zodResolver(createOwnershipSchema),
    defaultValues: { buildingId: '', flatId: '', startDate: new Date().toISOString().slice(0, 10) },
  });
  const buildingId = form.watch('buildingId');

  async function onSubmit(values: CreateOwnershipSchemaType) {
    if (!selectedUser) {
      toast.error('Select the owner\'s user account first.');
      return;
    }
    try {
      await createOwnership({
        createFlatOwnershipCommand: { userId: selectedUser.userId, flatId: values.flatId, startDate: values.startDate },
      }).unwrap();
      toast.success(`Ownership granted to ${selectedUser.fullName}.`);
      form.reset();
      setSelectedUser(null);
      onOpenChange(false);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Owner</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Owner</label>
            <UserSelect value={selectedUser} onChange={setSelectedUser} />
            <p className="text-xs text-muted-foreground">
              The owner must already have a MyCondo account. If they don&apos;t yet, create one first
              from Administration &gt; Users.
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="buildingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <FormControl>
                      <BuildingSelect value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="flatId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flat</FormLabel>
                    <FormControl>
                      <FlatSelect buildingId={buildingId} value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ownership effective date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isLoading || !selectedUser}>
                  {isLoading ? 'Granting…' : 'Grant ownership'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FlatOwnerDetailDialog({
  owner,
  open,
  onOpenChange,
}: {
  owner: FlatOwnerRegisterDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: ownerships, isLoading } = useFlatOwnershipsForUser({ userId: owner.userId }, { skip: !open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{owner.ownerFullName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <dl className="grid grid-cols-3 gap-y-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="col-span-2">{owner.ownerEmail}</dd>
          </dl>

          <div>
            <p className="text-muted-foreground mb-1.5">Flats owned</p>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <InlineSpinner /> Loading...
              </div>
            ) : (
              <div className="space-y-1.5">
                {ownerships?.map((o) => (
                  <div key={o.flatOwnershipId} className="flex items-center justify-between border-b py-1.5">
                    <span>
                      {o.flatNumber} — {o.buildingName}
                      <span className="text-muted-foreground"> (since {o.startDate})</span>
                    </span>
                    <Badge variant={o.status === 'Active' ? 'success' : 'secondary'} appearance="light">
                      {o.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EndOwnershipDialog({
  ownership,
  open,
  onOpenChange,
}: {
  ownership: FlatOwnerRegisterDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [endOwnership, { isLoading }] = useEndFlatOwnership();
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  async function handleConfirm() {
    try {
      await endOwnership({ id: ownership.flatOwnershipId, endDate }).unwrap();
      toast.success('Ownership ended.');
      onOpenChange(false);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End this ownership?</AlertDialogTitle>
          <AlertDialogDescription>
            {ownership.ownerFullName} will no longer be recorded as the owner of {ownership.flatNumber} after
            the end date below. This preserves history — it does not delete the record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5 px-1">
          <label htmlFor="end-ownership-date" className="text-sm font-medium">
            End date
          </label>
          <Input id="end-ownership-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            End ownership
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
