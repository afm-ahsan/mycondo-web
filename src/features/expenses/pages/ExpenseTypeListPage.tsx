import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { ExpenseTypeDto } from '@/api/generated/mycondoApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
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
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { useActivateExpenseType, useCreateExpenseType, useDeactivateExpenseType, useExpenseTypes, useUpdateExpenseType } from '../api/expensesApi';

const TYPES_FILTER_DEFAULTS = { search: '', status: 'all', page: '1', pageSize: '10' };

export function ExpenseTypeListPage() {
  const [filters, setFilters] = useUrlFilters(TYPES_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const { data, isFetching, isError, error, refetch } = useExpenseTypes({
    search: debouncedSearch || undefined,
    isActive: filters.status === 'all' ? undefined : filters.status === 'active',
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const [deactivateType] = useDeactivateExpenseType();
  const [activateType] = useActivateExpenseType();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseTypeDto | null>(null);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setFilters({ search: value, page: '1' });
  }

  async function handleToggleActive(type: ExpenseTypeDto) {
    try {
      if (type.isActive) {
        await deactivateType({ id: type.expenseTypeId }).unwrap();
        toast.success(`"${type.name}" deactivated.`);
      } else {
        await activateType({ id: type.expenseTypeId }).unwrap();
        toast.success(`"${type.name}" activated.`);
      }
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  const columns: ColumnDef<ExpenseTypeDto>[] = [
    { id: 'name', header: 'Name', cell: ({ row }) => row.original.name },
    { id: 'code', header: 'Code', cell: ({ row }) => row.original.code },
    { id: 'description', header: 'Description', cell: ({ row }) => row.original.description ?? '—' },
    { id: 'displayOrder', header: 'Order', cell: ({ row }) => row.original.displayOrder },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'secondary'} appearance="light">
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RequirePermission permission="expensetype.manage">
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditTarget(row.original)}>
              Edit
            </Button>
            <Button
              variant={row.original.isActive ? 'outline' : 'primary'}
              size="sm"
              onClick={() => handleToggleActive(row.original)}
            >
              {row.original.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
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
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Expense Types"
        description="The operational expense category catalogue for this tenant."
        crumbs={[{ label: 'Finance' }, { label: 'Expense Types' }]}
        primaryAction={
          <RequirePermission permission="expensetype.manage">
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Add Expense Type
            </Button>
          </RequirePermission>
        }
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No expense types match these filters.">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Categories</CardTitle>
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by name or code…"
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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

      <ExpenseTypeFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <ExpenseTypeFormDialog
          expenseType={editTarget}
          open
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}
    </>
  );
}

const expenseTypeSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(100),
  code: z.string().min(1, { message: 'Code is required.' }).max(20),
  description: z.string().max(500).optional().or(z.literal('')),
  displayOrder: z.string().min(1, { message: 'Display order is required.' }).refine(
    (v) => Number.isInteger(Number(v)) && Number(v) >= 0,
    { message: 'Display order must be a non-negative whole number.' },
  ),
});
type ExpenseTypeSchemaType = z.infer<typeof expenseTypeSchema>;

function ExpenseTypeFormDialog({
  expenseType,
  open,
  onOpenChange,
}: {
  expenseType?: ExpenseTypeDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [createExpenseType, { isLoading: isCreating }] = useCreateExpenseType();
  const [updateExpenseType, { isLoading: isUpdating }] = useUpdateExpenseType();
  const isEditing = Boolean(expenseType);
  const isLoading = isCreating || isUpdating;

  const form = useForm<ExpenseTypeSchemaType>({
    resolver: zodResolver(expenseTypeSchema),
    defaultValues: {
      name: expenseType?.name ?? '',
      code: expenseType?.code ?? '',
      description: expenseType?.description ?? '',
      displayOrder: String(expenseType?.displayOrder ?? 0),
    },
  });

  async function onSubmit(values: ExpenseTypeSchemaType) {
    try {
      if (expenseType) {
        await updateExpenseType({
          id: expenseType.expenseTypeId,
          updateExpenseTypeRequest: {
            name: values.name, code: values.code, description: values.description || null,
            displayOrder: Number(values.displayOrder),
          },
        }).unwrap();
        toast.success('Expense type updated.');
      } else {
        await createExpenseType({
          createExpenseTypeCommand: {
            name: values.name, code: values.code, description: values.description || null,
            displayOrder: Number(values.displayOrder),
          },
        }).unwrap();
        toast.success(`Expense type "${values.name}" created.`);
      }
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError, {
        conflictField: 'code',
        conflictMessage: 'An expense type with this code or name already exists.',
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
          <DialogTitle>{isEditing ? 'Edit Expense Type' : 'Add Expense Type'}</DialogTitle>
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
                    <Input placeholder="e.g. Cleaning" {...field} />
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
                    <Input placeholder="e.g. CLEAN" {...field} />
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
                {isLoading ? 'Saving…' : isEditing ? 'Save changes' : 'Create expense type'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
