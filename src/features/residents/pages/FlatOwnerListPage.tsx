import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ErrorState } from '@/components/feedback/ErrorState';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import {
  useCreateFlatOwnership,
  useEndFlatOwnership,
  useFlatOwners,
  useFlatOwnershipsForOwner,
  useUpdateFlatOwnerProfile,
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
    { id: 'contact', header: 'Contact', cell: ({ row }) => row.original.ownerEmail ?? row.original.ownerPhone ?? '—' },
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
      header: 'Action',
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
            <Button asChild>
              <Link to="/residents/flat-owners/new">
                <PlusIcon /> Add Owner
              </Link>
            </Button>
          </RequirePermission>
        }
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
          emptyMessage="No flat owners match these filters."
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Ownership register</CardTitle>
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by owner name, email, or phone…"
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

      {detailTarget && (
        <FlatOwnerDetailDialog owner={detailTarget} open onOpenChange={(open) => !open && setDetailTarget(null)} />
      )}
      {endTarget && (
        <EndOwnershipDialog ownership={endTarget} open onOpenChange={(open) => !open && setEndTarget(null)} />
      )}
    </>
  );
}

const ownerProfileSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email({ message: 'Enter a valid email address.' }).optional().or(z.literal('')),
});
type OwnerProfileSchemaType = z.infer<typeof ownerProfileSchema>;

function FlatOwnerDetailDialog({
  owner,
  open,
  onOpenChange,
}: {
  owner: FlatOwnerRegisterDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: ownerships, isLoading } = useFlatOwnershipsForOwner({ residentId: owner.residentId }, { skip: !open });
  const [updateProfile, { isLoading: isSaving }] = useUpdateFlatOwnerProfile();
  const [createOwnership, { isLoading: isAddingFlat }] = useCreateFlatOwnership();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingFlatOpen, setIsAddingFlatOpen] = useState(false);
  const [addFlatBuildingId, setAddFlatBuildingId] = useState('');
  const [addFlatFlatId, setAddFlatFlatId] = useState('');

  const form = useForm<OwnerProfileSchemaType>({
    resolver: zodResolver(ownerProfileSchema),
    defaultValues: { fullName: owner.ownerFullName, phone: owner.ownerPhone ?? '', email: owner.ownerEmail ?? '' },
  });

  async function onSubmit(values: OwnerProfileSchemaType) {
    try {
      await updateProfile({
        residentId: owner.residentId,
        updateFlatOwnerProfileRequest: {
          fullName: values.fullName,
          phone: values.phone || null,
          email: values.email || null,
          alternatePhone: null,
          nationalIdNumber: null,
          passportNumber: null,
          dateOfBirth: null,
          gender: null,
          presentAddress: null,
          permanentAddress: null,
          fatherName: null,
          motherName: null,
          maritalStatus: null,
          profession: null,
          employer: null,
          officeAddress: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
        },
      }).unwrap();
      toast.success('Owner profile updated.');
      setIsEditing(false);
    } catch (err) {
      const apiError = toApiError(err);
      if (!applyApiErrorToForm(form, apiError)) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  async function handleAddFlat() {
    if (!addFlatFlatId) return;
    try {
      await createOwnership({
        createFlatOwnershipCommand: {
          residentId: owner.residentId,
          flatId: addFlatFlatId,
          startDate: new Date().toISOString().slice(0, 10),
        },
      }).unwrap();
      toast.success('Additional flat ownership granted.');
      setIsAddingFlatOpen(false);
      setAddFlatBuildingId('');
      setAddFlatFlatId('');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{owner.ownerFullName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-y-2">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="col-span-2">{owner.ownerEmail ?? '—'}</dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="col-span-2">{owner.ownerPhone ?? '—'}</dd>
              </dl>
              <RequirePermission permission="ownership.manage">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit profile
                </Button>
              </RequirePermission>
            </>
          )}

          <div className="border-t pt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-muted-foreground">Flats owned</p>
              <RequirePermission permission="ownership.manage">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingFlatOpen((v) => !v)}>
                  {isAddingFlatOpen ? 'Cancel' : '+ Add flat'}
                </Button>
              </RequirePermission>
            </div>

            {isAddingFlatOpen && (
              <div className="mb-3 space-y-2 rounded-md border p-3">
                <BuildingSelect
                  value={addFlatBuildingId}
                  onValueChange={(v) => {
                    setAddFlatBuildingId(v);
                    setAddFlatFlatId('');
                  }}
                />
                <FlatSelect buildingId={addFlatBuildingId} value={addFlatFlatId} onValueChange={setAddFlatFlatId} />
                <Button type="button" size="sm" onClick={handleAddFlat} disabled={!addFlatFlatId || isAddingFlat}>
                  {isAddingFlat ? 'Granting…' : 'Grant ownership'}
                </Button>
              </div>
            )}

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
