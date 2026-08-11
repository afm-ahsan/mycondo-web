import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Link2, PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { ResidentDto } from '@/api/generated/mycondoApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { useCreateResident, useDisableResident, useLinkResidentToUser, useResidents, useUpdateResident } from '../api/residentsApi';

const RESIDENTS_FILTER_DEFAULTS = { search: '', page: '1', pageSize: '10' };

const RESIDENT_TYPE_LABELS: Record<string, string> = {
  Owner: 'Owner',
  Occupant: 'Occupant',
  FamilyMember: 'Family Member',
};

export function ResidentListPage() {
  const [filters, setFilters] = useUrlFilters(RESIDENTS_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const { data, isFetching, isError, error, refetch } = useResidents({
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const [disableResident] = useDisableResident();
  const [editTarget, setEditTarget] = useState<ResidentDto | null>(null);
  const [linkTarget, setLinkTarget] = useState<ResidentDto | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setFilters({ search: value, page: '1' });
  }

  async function handleDisable(residentId: string) {
    try {
      await disableResident({ id: residentId }).unwrap();
      toast.success('Resident disabled.');
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  const columns: ColumnDef<ResidentDto>[] = [
    { id: 'fullName', header: 'Full name', cell: ({ row }) => row.original.fullName },
    { id: 'phone', header: 'Mobile', cell: ({ row }) => row.original.phone ?? '—' },
    { id: 'email', header: 'Email', cell: ({ row }) => row.original.email ?? '—' },
    {
      id: 'residentType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary" appearance="light">
          {RESIDENT_TYPE_LABELS[row.original.residentType] ?? row.original.residentType}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <RequirePermission permission="resident.update">
              <DropdownMenuItem onClick={() => setEditTarget(row.original)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLinkTarget(row.original)}>
                <Link2 className="me-1" /> Link to user
              </DropdownMenuItem>
            </RequirePermission>
            <RequirePermission permission="resident.disable">
              <DropdownMenuItem variant="destructive" onClick={() => handleDisable(row.original.residentId)}>
                Disable
              </DropdownMenuItem>
            </RequirePermission>
          </DropdownMenuContent>
        </DropdownMenu>
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
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Residents"
        description="Everyone registered against a flat — owners, occupants, and family members."
        crumbs={[{ label: 'Resident Management' }, { label: 'Residents' }]}
        primaryAction={
          <RequirePermission permission="resident.create">
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Add Resident
            </Button>
          </RequirePermission>
        }
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No residents match these filters.">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>All residents</CardTitle>
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by name or mobile…"
                  isSearching={isSearchPending}
                  className="w-64"
                />
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

      <CreateResidentDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <EditResidentDialog resident={editTarget} open onOpenChange={(open) => !open && setEditTarget(null)} />
      )}
      {linkTarget && (
        <LinkResidentToUserDialog resident={linkTarget} open onOpenChange={(open) => !open && setLinkTarget(null)} />
      )}
    </>
  );
}

const createResidentSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  flatId: z.string().min(1, { message: 'Flat is required.' }),
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().max(256).email({ message: 'Enter a valid email address.' }).optional().or(z.literal('')),
  residentType: z.enum(['Owner', 'Occupant', 'FamilyMember']),
});
type CreateResidentSchemaType = z.infer<typeof createResidentSchema>;

function CreateResidentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [createResident, { isLoading }] = useCreateResident();

  const form = useForm<CreateResidentSchemaType>({
    resolver: zodResolver(createResidentSchema),
    defaultValues: { buildingId: '', flatId: '', fullName: '', phone: '', email: '', residentType: 'Owner' },
  });
  const buildingId = form.watch('buildingId');

  async function onSubmit(values: CreateResidentSchemaType) {
    try {
      await createResident({
        createResidentCommand: {
          flatId: values.flatId,
          fullName: values.fullName,
          phone: values.phone || null,
          email: values.email || null,
          residentType: values.residentType,
        },
      }).unwrap();
      toast.success(`Resident "${values.fullName}" added.`);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      if (!applyApiErrorToForm(form, apiError)) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Resident</DialogTitle>
        </DialogHeader>
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
              name="residentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Owner">Owner</SelectItem>
                      <SelectItem value="Occupant">Occupant</SelectItem>
                      <SelectItem value="FamilyMember">Family Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile (optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
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
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding…' : 'Add resident'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const editResidentSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required.' }).max(200),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().max(256).email({ message: 'Enter a valid email address.' }).optional().or(z.literal('')),
});
type EditResidentSchemaType = z.infer<typeof editResidentSchema>;

function EditResidentDialog({
  resident,
  open,
  onOpenChange,
}: {
  resident: ResidentDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [updateResident, { isLoading }] = useUpdateResident();

  const form = useForm<EditResidentSchemaType>({
    resolver: zodResolver(editResidentSchema),
    defaultValues: {
      fullName: resident.fullName,
      phone: resident.phone ?? '',
      email: resident.email ?? '',
    },
  });

  async function onSubmit(values: EditResidentSchemaType) {
    try {
      await updateResident({
        id: resident.residentId,
        updateResidentRequest: { fullName: values.fullName, phone: values.phone || null, email: values.email || null },
      }).unwrap();
      toast.success('Resident updated.');
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      if (!applyApiErrorToForm(form, apiError)) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Resident</DialogTitle>
        </DialogHeader>
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
                  <FormLabel>Mobile</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
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
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function LinkResidentToUserDialog({
  resident,
  open,
  onOpenChange,
}: {
  resident: ResidentDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [linkUser, { isLoading }] = useLinkResidentToUser();
  const [selectedUser, setSelectedUser] = useState<UserSelectValue | null>(null);

  async function handleLink() {
    if (!selectedUser) return;
    try {
      await linkUser({ id: resident.residentId, linkResidentToUserRequest: { userId: selectedUser.userId } }).unwrap();
      toast.success(`Linked to ${selectedUser.fullName}'s account.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link {resident.fullName} to a user account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Search for the MyCondo account that belongs to this resident. This does not guess a match
            by name — pick the account explicitly.
          </p>
          <UserSelect value={selectedUser} onChange={setSelectedUser} />
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <InlineSpinner /> Linking…
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleLink} disabled={!selectedUser || isLoading}>
            Link account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
