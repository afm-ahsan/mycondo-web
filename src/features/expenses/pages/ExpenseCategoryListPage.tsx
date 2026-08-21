import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Ban, CheckCircle2, Pencil, PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { ExpenseCategoryDto } from '@/api/generated/mycondoApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import {
  useActivateExpenseCategory,
  useCreateExpenseCategory,
  useDeactivateExpenseCategory,
  useExpenseCategories,
  useUpdateExpenseCategory,
} from '../api/expensesApi';

const CATEGORIES_FILTER_DEFAULTS = { search: '', status: 'all', page: '1', pageSize: '10' };

export function ExpenseCategoryListPage() {
  const [filters, setFilters] = useUrlFilters(CATEGORIES_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const isSearchPending = search !== debouncedSearch;

  const { data, isFetching, isError, error, refetch } = useExpenseCategories({
    search: debouncedSearch || undefined,
    isActive: filters.status === 'all' ? undefined : filters.status === 'active',
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const [deactivateCategory] = useDeactivateExpenseCategory();
  const [activateCategory] = useActivateExpenseCategory();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseCategoryDto | null>(null);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setFilters({ search: value, page: '1' });
  }

  async function handleToggleActive(category: ExpenseCategoryDto) {
    try {
      if (category.isActive) {
        await deactivateCategory({ id: category.expenseCategoryId }).unwrap();
        toast.success(`"${category.name}" deactivated.`);
      } else {
        await activateCategory({ id: category.expenseCategoryId }).unwrap();
        toast.success(`"${category.name}" activated.`);
      }
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  const columns: ColumnDef<ExpenseCategoryDto>[] = [
    { id: 'name', header: 'Name', size: DATA_GRID_COLUMN_SIZE.flexible, cell: ({ row }) => row.original.name },
    { id: 'code', header: 'Code', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.code },
    {
      id: 'description',
      header: 'Description',
      size: DATA_GRID_COLUMN_SIZE.flexible,
      meta: { cellClassName: 'truncate' },
      cell: ({ row }) => <span title={row.original.description ?? undefined}>{row.original.description ?? '—'}</span>,
    },
    { id: 'displayOrder', header: 'Order', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.displayOrder },
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
            { key: 'edit', label: 'Edit', icon: <Pencil />, onClick: () => setEditTarget(row.original), permission: 'expensecategory.manage' },
            row.original.isActive
              ? {
                  key: 'deactivate',
                  label: 'Deactivate',
                  icon: <Ban />,
                  onClick: () => handleToggleActive(row.original),
                  permission: 'expensecategory.manage',
                  variant: 'destructive',
                }
              : {
                  key: 'activate',
                  label: 'Activate',
                  icon: <CheckCircle2 />,
                  onClick: () => handleToggleActive(row.original),
                  permission: 'expensecategory.manage',
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
        title="Expense Categories"
        description="The top-level expense grouping tenant Expense Types are classified under."
        crumbs={[{ label: 'Finance' }, { label: 'Expense Categories' }]}
        primaryAction={
          <RequirePermission permission="expensecategory.manage">
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Add Expense Category
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
          emptyMessage="No expense categories match these filters."
          tableLayout={{ cellBorder: true }}
        >
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

      <ExpenseCategoryFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <ExpenseCategoryFormDialog
          category={editTarget}
          open
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}
    </>
  );
}

const expenseCategorySchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(100),
  code: z.string().min(1, { message: 'Code is required.' }).max(20),
  description: z.string().max(500).optional().or(z.literal('')),
  displayOrder: z.string().min(1, { message: 'Display order is required.' }).refine(
    (v) => Number.isInteger(Number(v)) && Number(v) >= 0,
    { message: 'Display order must be a non-negative whole number.' },
  ),
});
type ExpenseCategorySchemaType = z.infer<typeof expenseCategorySchema>;

function ExpenseCategoryFormDialog({
  category,
  open,
  onOpenChange,
}: {
  category?: ExpenseCategoryDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [createExpenseCategory, { isLoading: isCreating }] = useCreateExpenseCategory();
  const [updateExpenseCategory, { isLoading: isUpdating }] = useUpdateExpenseCategory();
  const isEditing = Boolean(category);
  const isLoading = isCreating || isUpdating;

  const form = useForm<ExpenseCategorySchemaType>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: {
      name: category?.name ?? '',
      code: category?.code ?? '',
      description: category?.description ?? '',
      displayOrder: String(category?.displayOrder ?? 0),
    },
  });

  async function onSubmit(values: ExpenseCategorySchemaType) {
    try {
      if (category) {
        await updateExpenseCategory({
          id: category.expenseCategoryId,
          updateExpenseCategoryRequest: {
            name: values.name, code: values.code, description: values.description || null,
            displayOrder: Number(values.displayOrder),
          },
        }).unwrap();
        toast.success('Expense category updated.');
      } else {
        await createExpenseCategory({
          createExpenseCategoryCommand: {
            name: values.name, code: values.code, description: values.description || null,
            displayOrder: Number(values.displayOrder),
          },
        }).unwrap();
        toast.success(`Expense category "${values.name}" created.`);
      }
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError, {
        conflictField: 'code',
        conflictMessage: 'An expense category with this code or name already exists.',
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
          <DialogTitle>{isEditing ? 'Edit Expense Category' : 'Add Expense Category'}</DialogTitle>
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
                    <Input placeholder="e.g. Maintenance" {...field} />
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
                    <Input placeholder="e.g. MAINT" {...field} />
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
                {isLoading ? 'Saving…' : isEditing ? 'Save changes' : 'Create expense category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
