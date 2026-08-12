import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { FlatDto } from '@/api/generated/mycondoApi';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { useBuilding, useCreateFlat, useDeactivateFlat, useFlatsForBuilding, useUpdateFlat } from '../api/propertyApi';

const FLATS_FILTER_DEFAULTS = { search: '', page: '1', pageSize: '10' };

const FLAT_TYPES = ['Residential', 'Commercial', 'Other'] as const;

export function FlatListPage() {
  const { buildingId } = useParams<{ buildingId: string }>();
  const [filters, setFilters] = useUrlFilters(FLATS_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const { data: building } = useBuilding({ id: buildingId! }, { skip: !buildingId });

  const { data, isFetching, isError, error, refetch } = useFlatsForBuilding(
    {
      buildingId: buildingId!,
      search: debouncedSearch || undefined,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    },
    { skip: !buildingId },
  );

  const [deactivateFlat, { isLoading: isDeactivating }] = useDeactivateFlat();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FlatDto | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<FlatDto | null>(null);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setFilters({ search: value, page: '1' });
  }

  async function handleDeactivate() {
    if (!deactivateTarget || !buildingId) return;
    try {
      await deactivateFlat({ buildingId, flatId: deactivateTarget.flatId }).unwrap();
      toast.success(`Flat "${deactivateTarget.flatNumber}" deactivated.`);
      setDeactivateTarget(null);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  const columns: ColumnDef<FlatDto>[] = [
    { id: 'flatNumber', header: 'Flat', cell: ({ row }) => row.original.flatNumber },
    { id: 'floorNumber', header: 'Floor', cell: ({ row }) => row.original.floorNumber ?? '—' },
    { id: 'flatType', header: 'Type', cell: ({ row }) => row.original.flatType },
    { id: 'areaSqFt', header: 'Area (sq ft)', cell: ({ row }) => row.original.areaSqFt ?? '—' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <RequirePermission permission="property.update" buildingId={buildingId}>
            <Button variant="outline" size="sm" onClick={() => setEditTarget(row.original)}>
              Edit
            </Button>
          </RequirePermission>
          <RequirePermission permission="property.delete" buildingId={buildingId}>
            <Button variant="outline" size="sm" onClick={() => setDeactivateTarget(row.original)}>
              Deactivate
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
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!buildingId) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={building ? `Flats — ${building.name}` : 'Flats'}
        description="Manage the flats belonging to this building."
        crumbs={[{ label: 'Administration' }, { label: 'Buildings', path: '/admin/buildings' }, { label: 'Flats' }]}
        primaryAction={
          <RequirePermission permission="property.create" buildingId={buildingId}>
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Add Flat
            </Button>
          </RequirePermission>
        }
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No flats match these filters.">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Flats</CardTitle>
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by flat number…"
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

      <FlatFormDialog buildingId={buildingId} open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <FlatFormDialog
          buildingId={buildingId}
          flat={editTarget}
          open
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}

      <ConfirmActionDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate this flat?"
        description={
          deactivateTarget && (
            <>
              Deactivating flat <strong>{deactivateTarget.flatNumber}</strong> removes it from the active register. This
              cannot be undone from here.
            </>
          )
        }
        confirmLabel="Deactivate"
        loadingLabel="Deactivating…"
        isLoading={isDeactivating}
        onConfirm={handleDeactivate}
      />
    </>
  );
}

const flatSchema = z.object({
  flatNumber: z.string().min(1, { message: 'Flat number is required.' }).max(50),
  floorNumber: z.string().optional().or(z.literal('')),
  flatType: z.enum(FLAT_TYPES, { message: 'Select a flat type.' }),
});
type FlatSchemaType = z.infer<typeof flatSchema>;

function FlatFormDialog({
  buildingId,
  flat,
  open,
  onOpenChange,
}: {
  buildingId: string;
  flat?: FlatDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [createFlat, { isLoading: isCreating }] = useCreateFlat();
  const [updateFlat, { isLoading: isUpdating }] = useUpdateFlat();
  const isEditing = Boolean(flat);
  const isLoading = isCreating || isUpdating;

  const form = useForm<FlatSchemaType>({
    resolver: zodResolver(flatSchema),
    defaultValues: {
      flatNumber: flat?.flatNumber ?? '',
      floorNumber: flat?.floorNumber != null ? String(flat.floorNumber) : '',
      flatType: (flat?.flatType as FlatSchemaType['flatType']) ?? 'Residential',
    },
  });

  async function onSubmit(values: FlatSchemaType) {
    const floorNumber = values.floorNumber ? Number(values.floorNumber) : null;
    try {
      if (flat) {
        await updateFlat({
          buildingId,
          flatId: flat.flatId,
          updateFlatRequest: { flatNumber: values.flatNumber, floorNumber, flatType: values.flatType },
        }).unwrap();
        toast.success('Flat updated.');
      } else {
        await createFlat({
          buildingId,
          createFlatRequest: { flatNumber: values.flatNumber, floorNumber, flatType: values.flatType },
        }).unwrap();
        toast.success(`Flat "${values.flatNumber}" created.`);
      }
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError, {
        conflictField: 'flatNumber',
        conflictMessage: 'A flat with this number already exists in this building.',
      });
      if (!handled) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Flat' : 'Add Flat'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="flatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. A-101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="floorNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="flatType"
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
                      {FLAT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : isEditing ? 'Save changes' : 'Create flat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
