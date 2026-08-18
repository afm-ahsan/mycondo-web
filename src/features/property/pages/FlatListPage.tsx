import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Ban, Building2, Pencil, PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { FlatDto } from '@/api/generated/mycondoApi';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { RowActionsMenu } from '@/components/ui/data-grid-row-actions';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import {
  useBuilding,
  useBuildings,
  useCreateFlat,
  useDeactivateFlat,
  useFlatsForBuilding,
  useFlatsForTenant,
  useSetFlatPrimaryPhoto,
  useUpdateFlat,
} from '../api/propertyApi';
import { BuildingFlatImageField } from '@/components/shared/BuildingFlatImageField';

const FLATS_FILTER_DEFAULTS = { search: '', buildingId: '', page: '1', pageSize: '10' };

const FLAT_TYPES = ['Residential', 'Commercial', 'Other'] as const;

/**
 * Serves two routes with one component (task: reuse the same underlying APIs/components rather than
 * a parallel model) — `/admin/buildings/:buildingId/flats` (scoped to one building, via
 * `useFlatsForBuilding`) and the global Administration `/admin/flats` directory (via
 * `useFlatsForTenant`, with a Building column/filter). Which mode is active is derived from whether
 * the route supplied a `buildingId` param.
 */
export function FlatListPage() {
  const { buildingId: routeBuildingId } = useParams<{ buildingId: string }>();
  const isGlobal = !routeBuildingId;

  const [filters, setFilters] = useUrlFilters(FLATS_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const { data: building } = useBuilding({ id: routeBuildingId! }, { skip: !routeBuildingId });

  const { data: buildingsForFilter } = useBuildings({ page: 1, pageSize: 100 }, { skip: !isGlobal });
  const buildingNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of buildingsForFilter?.items ?? []) map.set(b.buildingId, b.name);
    return map;
  }, [buildingsForFilter]);

  const scoped = useFlatsForBuilding(
    { buildingId: routeBuildingId!, search: debouncedSearch || undefined, page: pagination.pageIndex + 1, pageSize: pagination.pageSize },
    { skip: isGlobal },
  );
  const global = useFlatsForTenant(
    {
      search: debouncedSearch || undefined,
      buildingId: filters.buildingId || undefined,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    },
    { skip: !isGlobal },
  );
  const { data, isFetching, isError, error, refetch } = isGlobal ? global : scoped;

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
    if (!deactivateTarget) return;
    try {
      await deactivateFlat({ buildingId: deactivateTarget.buildingId, flatId: deactivateTarget.flatId }).unwrap();
      toast.success(`Flat "${deactivateTarget.flatNumber}" deactivated.`);
      setDeactivateTarget(null);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  const columns: ColumnDef<FlatDto>[] = [
    { id: 'flatNumber', header: 'Flat', size: DATA_GRID_COLUMN_SIZE.medium, cell: ({ row }) => row.original.flatNumber },
    ...(isGlobal
      ? [
          {
            id: 'building',
            header: 'Building',
            size: DATA_GRID_COLUMN_SIZE.medium,
            cell: ({ row }: { row: { original: FlatDto } }) =>
              buildingNameById.get(row.original.buildingId) ?? '—',
          } satisfies ColumnDef<FlatDto>,
        ]
      : []),
    { id: 'floorNumber', header: 'Floor', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.floorNumber ?? '—' },
    { id: 'flatType', header: 'Type', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.flatType },
    { id: 'areaSqFt', header: 'Area (sq ft)', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.areaSqFt ?? '—' },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.action,
      cell: ({ row }) => (
        <RowActionsMenu
          ariaLabel={`Actions for flat ${row.original.flatNumber}`}
          actions={[
            {
              key: 'edit',
              label: 'Edit',
              icon: <Pencil />,
              onClick: () => setEditTarget(row.original),
              permission: 'property.update',
              buildingId: row.original.buildingId,
            },
            {
              key: 'deactivate',
              label: 'Deactivate',
              icon: <Ban />,
              onClick: () => setDeactivateTarget(row.original),
              permission: 'property.delete',
              buildingId: row.original.buildingId,
              variant: 'destructive',
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
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!isGlobal && !routeBuildingId) {
    return null;
  }

  const primaryAction = (
    <RequirePermission permission="property.create" buildingId={isGlobal ? undefined : routeBuildingId}>
      <Button onClick={() => setCreateOpen(true)}>
        <PlusIcon /> Add Flat
      </Button>
    </RequirePermission>
  );

  return (
    <>
      <PageHeader
        title={isGlobal ? 'Flats' : building ? `Flats — ${building.name}` : 'Flats'}
        description={isGlobal ? 'Manage the flats across every building.' : 'Manage the flats belonging to this building.'}
        crumbs={
          isGlobal
            ? [{ label: 'Property' }, { label: 'Flats' }]
            : [{ label: 'Property' }, { label: 'Buildings', path: '/admin/buildings' }, { label: 'Flats' }]
        }
        primaryAction={primaryAction}
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
          emptyMessage={
            <EmptyState
              icon={<Building2 className="size-8" aria-hidden="true" />}
              title="No flats found"
              description={
                debouncedSearch || filters.buildingId
                  ? 'No flats match the current search or filters.'
                  : isGlobal
                    ? 'No flats are currently available for this property.'
                    : 'No flats have been added to this building yet.'
              }
            />
          }
        >
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Flats</CardTitle>
                <div className="flex items-center gap-2">
                  {isGlobal && (
                    <Select
                      value={filters.buildingId || 'all'}
                      onValueChange={(value) => setFilters({ buildingId: value === 'all' ? '' : value, page: '1' })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All buildings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All buildings</SelectItem>
                        {buildingsForFilter?.items.map((b) => (
                          <SelectItem key={b.buildingId} value={b.buildingId}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search by flat number…"
                    isSearching={isSearchPending}
                    className="w-64"
                  />
                </div>
              </CardHeading>
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

      <FlatFormDialog buildingId={routeBuildingId} open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <FlatFormDialog
          buildingId={editTarget.buildingId}
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
  /** The building this flat belongs to (edit) or will be created in (create, scoped route). Omitted
   * on the global directory's create flow, where the building is chosen in the dialog instead. */
  buildingId?: string;
  flat?: FlatDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [createFlat, { isLoading: isCreating }] = useCreateFlat();
  const [updateFlat, { isLoading: isUpdating }] = useUpdateFlat();
  const [setFlatPrimaryPhoto] = useSetFlatPrimaryPhoto();
  const isEditing = Boolean(flat);
  const isLoading = isCreating || isUpdating;
  const needsBuildingPicker = !isEditing && !buildingId;
  const [pickedBuildingId, setPickedBuildingId] = useState<string | undefined>(undefined);
  const [buildingError, setBuildingError] = useState<string | null>(null);
  const targetBuildingId = buildingId ?? pickedBuildingId;

  const form = useForm<FlatSchemaType>({
    resolver: zodResolver(flatSchema),
    defaultValues: {
      flatNumber: flat?.flatNumber ?? '',
      floorNumber: flat?.floorNumber != null ? String(flat.floorNumber) : '',
      flatType: (flat?.flatType as FlatSchemaType['flatType']) ?? 'Residential',
    },
  });

  async function onSubmit(values: FlatSchemaType) {
    if (!targetBuildingId) {
      setBuildingError('Select a building.');
      return;
    }
    setBuildingError(null);

    const floorNumber = values.floorNumber ? Number(values.floorNumber) : null;
    try {
      if (flat) {
        await updateFlat({
          buildingId: targetBuildingId,
          flatId: flat.flatId,
          updateFlatRequest: { flatNumber: values.flatNumber, floorNumber, flatType: values.flatType },
        }).unwrap();
        toast.success('Flat updated.');
      } else {
        await createFlat({
          buildingId: targetBuildingId,
          createFlatRequest: { flatNumber: values.flatNumber, floorNumber, flatType: values.flatType },
        }).unwrap();
        toast.success(`Flat "${values.flatNumber}" created.`);
      }
      form.reset();
      setPickedBuildingId(undefined);
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
            {needsBuildingPicker && (
              <FormItem>
                <FormLabel>Building</FormLabel>
                <FormControl>
                  <BuildingSelect value={pickedBuildingId} onValueChange={setPickedBuildingId} />
                </FormControl>
                {buildingError && <p className="text-destructive text-sm">{buildingError}</p>}
              </FormItem>
            )}
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

        {flat && (
          <BuildingFlatImageField
            ownerType="Flat"
            ownerId={flat.flatId}
            primaryPhotoAttachmentId={flat.primaryPhotoAttachmentId}
            onSetPrimaryPhoto={(attachmentId) =>
              setFlatPrimaryPhoto({
                buildingId: flat.buildingId,
                flatId: flat.flatId,
                setPrimaryPhotoRequest: { attachmentId },
              }).unwrap()
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
