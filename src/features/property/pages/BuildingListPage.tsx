import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Ban, Building2, ExternalLink, Pencil, PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { BuildingDto } from '@/api/generated/mycondoApi';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DATA_GRID_COLUMN_ALIGN_CENTER, DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
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
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { BuildingFlatImageField } from '@/components/shared/BuildingFlatImageField';
import {
  useBuildings,
  useCreateBuilding,
  useDeactivateBuilding,
  useSetBuildingPrimaryPhoto,
  useUpdateBuilding,
} from '../api/propertyApi';

const BUILDINGS_FILTER_DEFAULTS = { search: '', page: '1', pageSize: '10' };

export function BuildingListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useUrlFilters(BUILDINGS_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const { data, isFetching, isError, error, refetch } = useBuildings({
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const [deactivateBuilding, { isLoading: isDeactivating }] = useDeactivateBuilding();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BuildingDto | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<BuildingDto | null>(null);

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
      await deactivateBuilding({ id: deactivateTarget.buildingId }).unwrap();
      toast.success(`"${deactivateTarget.name}" deactivated.`);
      setDeactivateTarget(null);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  const columns: ColumnDef<BuildingDto>[] = [
    { id: 'name', header: 'Name', size: DATA_GRID_COLUMN_SIZE.flexible, cell: ({ row }) => row.original.name },
    { id: 'code', header: 'Code', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.code },
    {
      id: 'address',
      header: 'Address',
      size: DATA_GRID_COLUMN_SIZE.flexible,
      meta: { cellClassName: 'truncate' },
      cell: ({ row }) => {
        const address = row.original.address ?? '—';
        return <span title={address}>{address}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.action,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
      cell: ({ row }) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${row.original.name}`}
          actions={[
            {
              key: 'flats',
              label: 'Flats',
              icon: <ExternalLink />,
              onClick: () => navigate(`/admin/buildings/${row.original.buildingId}/flats`),
              permission: 'property.view',
              buildingId: row.original.buildingId,
            },
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

  return (
    <>
      <PageHeader
        title="Buildings"
        description="Manage the buildings in this property portfolio."
        crumbs={[{ label: 'Property' }, { label: 'Buildings' }]}
        primaryAction={
          <RequirePermission permission="property.create">
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Add Building
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
          emptyMessage={
            <EmptyState
              icon={<Building2 className="size-8" aria-hidden="true" />}
              title="No buildings found"
              description={
                debouncedSearch ? 'No buildings match the current search.' : 'No buildings have been added yet.'
              }
            />
          }
        >
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Buildings</CardTitle>
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by name or code…"
                  isSearching={isSearchPending}
                  className="w-64"
                />
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

      <BuildingFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <BuildingFormDialog
          building={editTarget}
          open
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}

      <ConfirmActionDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate this building?"
        description={
          deactivateTarget && (
            <>
              Deactivating <strong>{deactivateTarget.name}</strong> removes it from the active property register. This
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

const buildingSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(200),
  code: z.string().min(1, { message: 'Code is required.' }).max(20),
  address: z.string().max(400).optional().or(z.literal('')),
});
type BuildingSchemaType = z.infer<typeof buildingSchema>;

function BuildingFormDialog({
  building,
  open,
  onOpenChange,
}: {
  building?: BuildingDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [createBuilding, { isLoading: isCreating }] = useCreateBuilding();
  const [updateBuilding, { isLoading: isUpdating }] = useUpdateBuilding();
  const [setBuildingPrimaryPhoto] = useSetBuildingPrimaryPhoto();
  const isEditing = Boolean(building);
  const isLoading = isCreating || isUpdating;

  const form = useForm<BuildingSchemaType>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: building?.name ?? '',
      code: building?.code ?? '',
      address: building?.address ?? '',
    },
  });

  async function onSubmit(values: BuildingSchemaType) {
    try {
      if (building) {
        await updateBuilding({
          id: building.buildingId,
          updateBuildingRequest: { name: values.name, code: values.code, address: values.address || null },
        }).unwrap();
        toast.success('Building updated.');
      } else {
        await createBuilding({
          createBuildingCommand: { name: values.name, code: values.code, address: values.address || null },
        }).unwrap();
        toast.success(`Building "${values.name}" created.`);
      }
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError, {
        conflictField: 'code',
        conflictMessage: 'A building with this name or code already exists.',
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
          <DialogTitle>{isEditing ? 'Edit Building' : 'Add Building'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Aisha Tower" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. AISHA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : isEditing ? 'Save changes' : 'Create building'}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {building && (
          <BuildingFlatImageField
            ownerType="Building"
            ownerId={building.buildingId}
            primaryPhotoAttachmentId={building.primaryPhotoAttachmentId}
            onSetPrimaryPhoto={(attachmentId) =>
              setBuildingPrimaryPhoto({
                id: building.buildingId,
                setPrimaryPhotoRequest: { attachmentId },
              }).unwrap()
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
