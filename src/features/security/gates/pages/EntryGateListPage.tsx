import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Ban, CheckCircle2, Pencil, PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { toUserMessage } from '@/api/errors';
import type { GateDto } from '@/api/generated/mycondoApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DATA_GRID_COLUMN_ALIGN_CENTER, DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
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
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useActivateGate, useCreateGate, useDeactivateGate, useGates, useUpdateGate } from '../api/gatesApi';

const FILTER_DEFAULTS = { buildingId: '' };

/** `GetGatesForBuilding` is unpaginated — a building has a handful of gates, not pages of them — so
 * this renders the full list client-side rather than following the server-paginated list convention. */
export function EntryGateListPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const [deactivateGate] = useDeactivateGate();
  const [activateGate] = useActivateGate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GateDto | null>(null);

  const { data, isFetching, isError, error, refetch } = useGates(
    filters.buildingId ? { buildingId: filters.buildingId, activeOnly: false } : skipToken,
  );

  async function handleToggleActive(gate: GateDto) {
    try {
      if (gate.isActive) {
        await deactivateGate({ buildingId: gate.buildingId, gateId: gate.gateId }).unwrap();
        toast.success(`"${gate.name}" deactivated.`);
      } else {
        await activateGate({ buildingId: gate.buildingId, gateId: gate.gateId }).unwrap();
        toast.success(`"${gate.name}" activated.`);
      }
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  const columns: ColumnDef<GateDto>[] = [
    { id: 'name', header: 'Name', size: DATA_GRID_COLUMN_SIZE.flexible, cell: ({ row }) => row.original.name },
    { id: 'code', header: 'Code', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.code },
    {
      id: 'entry',
      header: 'Entry',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => (
        <Badge variant={row.original.isEntryAllowed ? 'success' : 'secondary'} appearance="light">
          {row.original.isEntryAllowed ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'exit',
      header: 'Exit',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => (
        <Badge variant={row.original.isExitAllowed ? 'success' : 'secondary'} appearance="light">
          {row.original.isExitAllowed ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'secondary'} appearance="light">
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
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
              key: 'edit',
              label: 'Edit',
              icon: <Pencil />,
              onClick: () => setEditTarget(row.original),
              permission: PERMISSIONS.gate.manage,
            },
            {
              key: 'toggle-active',
              label: row.original.isActive ? 'Deactivate' : 'Activate',
              icon: row.original.isActive ? <Ban /> : <CheckCircle2 />,
              onClick: () => handleToggleActive(row.original),
              permission: PERMISSIONS.gate.manage,
              variant: row.original.isActive ? 'destructive' : undefined,
            },
          ]}
        />
      ),
    },
  ];

  const gates = data ?? [];
  const total = gates.length;
  const table = useReactTable({
    columns,
    data: gates,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Entry Gates"
        description="Configure entry and exit points used for visitor, vehicle and security operations."
        crumbs={[{ label: 'Security & Access' }, { label: 'Entry Gates' }]}
        primaryAction={
          <RequirePermission permission={PERMISSIONS.gate.manage}>
            <Button disabled={!filters.buildingId} onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Add Gate
            </Button>
          </RequirePermission>
        }
      />

      <div className="space-y-4">
        <div className="space-y-1.5 w-full sm:w-64">
          <Label className="text-xs">Building</Label>
          <BuildingSelect
            value={filters.buildingId}
            onValueChange={(v) => setFilters({ buildingId: v })}
            placeholder="Select a building"
          />
        </div>

        {isError ? (
          <Card>
            <ErrorState description={toUserMessage(error)} onRetry={refetch} />
          </Card>
        ) : (
          <DataGrid
            table={table}
            recordCount={total}
            isLoading={isFetching}
            emptyMessage={filters.buildingId ? 'No entry gates configured for this building yet.' : 'Select a building to view its gates.'}
            tableLayout={{ cellBorder: true }}
          >
            <Card>
              <CardHeader>
                <CardHeading>
                  <CardTitle>Gates</CardTitle>
                </CardHeading>
                <CardToolbar />
              </CardHeader>
              <CardTable>
                <ScrollArea>
                  <DataGridTable />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardTable>
            </Card>
          </DataGrid>
        )}
      </div>

      {filters.buildingId && (
        <>
          <GateFormDialog open={createOpen} buildingId={filters.buildingId} onOpenChange={setCreateOpen} />
          {editTarget && (
            <GateFormDialog
              gate={editTarget}
              buildingId={filters.buildingId}
              open
              onOpenChange={(open) => !open && setEditTarget(null)}
            />
          )}
        </>
      )}
    </>
  );
}

const gateSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(100),
  code: z.string().min(1, { message: 'Code is required.' }).max(20),
  description: z.string().max(500).optional().or(z.literal('')),
  isEntryAllowed: z.boolean(),
  isExitAllowed: z.boolean(),
  displayOrder: z.string().min(1, { message: 'Display order is required.' }).refine(
    (v) => Number.isInteger(Number(v)) && Number(v) >= 0,
    { message: 'Display order must be a non-negative whole number.' },
  ),
});
type GateSchemaType = z.infer<typeof gateSchema>;

function GateFormDialog({
  gate,
  buildingId,
  open,
  onOpenChange,
}: {
  gate?: GateDto;
  buildingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [createGate, { isLoading: isCreating }] = useCreateGate();
  const [updateGate, { isLoading: isUpdating }] = useUpdateGate();
  const isEditing = Boolean(gate);
  const isLoading = isCreating || isUpdating;

  const form = useForm<GateSchemaType>({
    resolver: zodResolver(gateSchema),
    defaultValues: {
      name: gate?.name ?? '',
      code: gate?.code ?? '',
      description: gate?.description ?? '',
      isEntryAllowed: gate?.isEntryAllowed ?? true,
      isExitAllowed: gate?.isExitAllowed ?? true,
      displayOrder: String(gate?.displayOrder ?? 0),
    },
  });

  async function onSubmit(values: GateSchemaType) {
    try {
      if (gate) {
        await updateGate({
          buildingId,
          gateId: gate.gateId,
          updateGateRequest: {
            name: values.name,
            code: values.code,
            description: values.description || null,
            isEntryAllowed: values.isEntryAllowed,
            isExitAllowed: values.isExitAllowed,
            displayOrder: Number(values.displayOrder),
          },
        }).unwrap();
        toast.success('Gate updated.');
      } else {
        await createGate({
          buildingId,
          createGateRequest: {
            name: values.name,
            code: values.code,
            description: values.description || null,
            isEntryAllowed: values.isEntryAllowed,
            isExitAllowed: values.isExitAllowed,
            displayOrder: Number(values.displayOrder),
          },
        }).unwrap();
        toast.success(`Gate "${values.name}" created.`);
      }
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError, {
        conflictField: 'code',
        conflictMessage: 'A gate with this code or name already exists for this building.',
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
          <DialogTitle>{isEditing ? 'Edit Entry Gate' : 'Add Entry Gate'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gate Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Gate" {...field} />
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
                    <Input placeholder="e.g. MAIN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="isEntryAllowed"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Entry Allowed</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isExitAllowed"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Exit Allowed</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display order</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : isEditing ? 'Save changes' : 'Save Gate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
