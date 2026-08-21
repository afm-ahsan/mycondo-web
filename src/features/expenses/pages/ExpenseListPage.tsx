import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ColumnDef, getCoreRowModel, type PaginationState, type Updater, useReactTable } from '@tanstack/react-table';
import { Ban, Pencil, PlusIcon, Receipt } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import { useGetApiV1FinanceFundsQuery, type ExpenseDto } from '@/api/generated/mycondoApi';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGrid } from '@/components/ui/data-grid';
import { DATA_GRID_COLUMN_ALIGN_CENTER, DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { RowActionsMenu } from '@/components/ui/data-grid-row-actions';
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
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, type StatusBadgeMap } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { useActiveExpenseTypes, useCreateExpense, useExpenses, useUpdateExpense, useVoidExpense } from '../api/expensesApi';

const EXPENSES_FILTER_DEFAULTS = {
  buildingId: '', expenseTypeId: 'all', status: 'all', page: '1', pageSize: '10',
};

const expenseStatusToneMap: StatusBadgeMap<'Recorded' | 'Voided'> = {
  Recorded: { label: 'Recorded', variant: 'success' },
  Voided: { label: 'Voided', variant: 'secondary' },
};

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'BankTransfer', label: 'Bank Transfer' },
  { value: 'MobileMoney', label: 'Mobile Money' },
  { value: 'Other', label: 'Other' },
];

export function ExpenseListPage() {
  const [filters, setFilters] = useUrlFilters(EXPENSES_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  const { data: activeTypes } = useActiveExpenseTypes();
  const { data, isFetching, isError, error, refetch } = useExpenses({
    buildingId: filters.buildingId || undefined,
    expenseTypeId: filters.expenseTypeId === 'all' ? undefined : filters.expenseTypeId,
    status: filters.status === 'all' ? undefined : filters.status,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseDto | null>(null);
  const [voidTarget, setVoidTarget] = useState<ExpenseDto | null>(null);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater;
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const columns: ColumnDef<ExpenseDto>[] = [
    { id: 'expenseDate', header: 'Date', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.expenseDate },
    { id: 'expenseType', header: 'Type', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.expenseTypeName },
    {
      id: 'description',
      header: 'Description',
      size: DATA_GRID_COLUMN_SIZE.flexible,
      meta: { cellClassName: 'truncate' },
      cell: ({ row }) => <span title={row.original.description}>{row.original.description}</span>,
    },
    { id: 'payee', header: 'Payee', size: DATA_GRID_COLUMN_SIZE.flexible, cell: ({ row }) => row.original.payee ?? '—' },
    { id: 'amount', header: 'Amount', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => <MoneyDisplay amount={row.original.amount} /> },
    {
      id: 'status',
      header: 'Status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
      cell: ({ row }) => (
        <StatusBadge status={row.original.status as 'Recorded' | 'Voided'} toneMap={expenseStatusToneMap} />
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.action,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
      cell: ({ row }) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${row.original.description}`}
          actions={[
            {
              key: 'edit',
              label: 'Edit',
              icon: <Pencil />,
              onClick: () => setEditTarget(row.original),
              permission: 'expense.manage',
              hidden: row.original.status !== 'Recorded',
            },
            {
              key: 'void',
              label: 'Void',
              icon: <Ban />,
              onClick: () => setVoidTarget(row.original),
              permission: 'expense.manage',
              variant: 'destructive',
              hidden: row.original.status !== 'Recorded',
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
        title="Expenses"
        description="The operational expense register for this tenant."
        crumbs={[{ label: 'Finance' }, { label: 'Expenses' }]}
        primaryAction={
          <RequirePermission permission="expense.manage">
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Add Expense
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
              icon={<Receipt className="size-8" aria-hidden="true" />}
              title="No expenses found"
              description={
                filters.buildingId || filters.expenseTypeId !== 'all' || filters.status !== 'all'
                  ? 'No expenses match the current filters.'
                  : 'No expenses have been recorded yet.'
              }
            />
          }
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader className="flex-wrap gap-3">
              <CardHeading>
                <CardTitle>Expense register</CardTitle>
              </CardHeading>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Building</Label>
                  <BuildingSelect
                    value={filters.buildingId || undefined}
                    onValueChange={(v) => setFilters({ buildingId: v, page: '1' })}
                    placeholder="All buildings"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={filters.expenseTypeId} onValueChange={(v) => setFilters({ expenseTypeId: v, page: '1' })}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {activeTypes?.map((t) => (
                        <SelectItem key={t.expenseTypeId} value={t.expenseTypeId}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={filters.status} onValueChange={(v) => setFilters({ status: v, page: '1' })}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="Recorded">Recorded</SelectItem>
                      <SelectItem value="Voided">Voided</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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

      <ExpenseFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <ExpenseFormDialog expense={editTarget} open onOpenChange={(open) => !open && setEditTarget(null)} />
      )}
      {voidTarget && (
        <VoidExpenseDialog expense={voidTarget} open onOpenChange={(open) => !open && setVoidTarget(null)} />
      )}
    </>
  );
}

const expenseSchema = z.object({
  buildingId: z.string().min(1, { message: 'Building is required.' }),
  expenseTypeId: z.string().min(1, { message: 'Expense type is required.' }),
  fundId: z.string().optional().or(z.literal('')),
  expenseDate: z.string().min(1, { message: 'Expense date is required.' }),
  accountingDate: z.string().optional().or(z.literal('')),
  description: z.string().min(1, { message: 'Description is required.' }).max(500),
  payee: z.string().max(200).optional().or(z.literal('')),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
  amount: z.string().min(1, { message: 'Amount is required.' }).refine(
    (v) => !Number.isNaN(Number(v)) && Number(v) > 0,
    { message: 'Amount must be greater than zero.' },
  ),
  isPaid: z.boolean(),
  paymentMethod: z.enum(['Cash', 'Cheque', 'BankTransfer', 'MobileMoney', 'Other']),
  notes: z.string().max(1000).optional().or(z.literal('')),
});
type ExpenseSchemaType = z.infer<typeof expenseSchema>;

function ExpenseFormDialog({
  expense,
  open,
  onOpenChange,
}: {
  expense?: ExpenseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [createExpense, { isLoading: isCreating }] = useCreateExpense();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpense();
  const { data: activeTypes } = useActiveExpenseTypes();
  const { data: funds } = useGetApiV1FinanceFundsQuery();
  const isEditing = Boolean(expense);
  const isLoading = isCreating || isUpdating;

  const form = useForm<ExpenseSchemaType>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      buildingId: expense?.buildingId ?? '',
      expenseTypeId: expense?.expenseTypeId ?? '',
      fundId: expense?.fundId ?? '',
      expenseDate: expense?.expenseDate ?? new Date().toISOString().slice(0, 10),
      accountingDate: expense?.accountingDate ?? '',
      description: expense?.description ?? '',
      payee: expense?.payee ?? '',
      referenceNumber: expense?.referenceNumber ?? '',
      amount: expense ? String(expense.amount) : '',
      isPaid: expense?.isPaid ?? false,
      paymentMethod: (expense?.paymentMethod as ExpenseSchemaType['paymentMethod']) ?? 'Cash',
      notes: expense?.notes ?? '',
    },
  });

  async function onSubmit(values: ExpenseSchemaType) {
    const payload = {
      buildingId: values.buildingId,
      expenseTypeId: values.expenseTypeId,
      fundId: values.fundId || null,
      expenseDate: values.expenseDate,
      accountingDate: values.accountingDate || null,
      description: values.description,
      payee: values.payee || null,
      referenceNumber: values.referenceNumber || null,
      amount: Number(values.amount),
      isPaid: values.isPaid,
      paymentMethod: values.paymentMethod,
      notes: values.notes || null,
    };

    try {
      if (expense) {
        await updateExpense({ id: expense.expenseId, updateExpenseRequest: payload }).unwrap();
        toast.success('Expense updated.');
      } else {
        await createExpense({ createExpenseRequest: payload }).unwrap();
        toast.success('Expense recorded.');
      }
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      if (!applyApiErrorToForm(form, apiError)) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  const buildingId = form.watch('buildingId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
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
              name="expenseTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!buildingId}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeTypes?.map((t) => (
                        <SelectItem key={t.expenseTypeId} value={t.expenseTypeId}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fundId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fund (optional)</FormLabel>
                  <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No fund</SelectItem>
                      {funds?.filter((f) => f.isActive).map((f) => (
                        <SelectItem key={f.fundId} value={f.fundId}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accounting date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Defaults to the expense date. Set this to post the expense into a different ledger
                    period (e.g. a voucher dated in a closed period).
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payee (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference / voucher number (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="font-normal">Paid immediately</FormLabel>
                    <p className="text-muted-foreground text-xs">
                      Leave unchecked to record this as an unpaid payable (Accounts Payable) until settled.
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : isEditing ? 'Save changes' : 'Record expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function VoidExpenseDialog({
  expense,
  open,
  onOpenChange,
}: {
  expense: ExpenseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [voidExpense, { isLoading }] = useVoidExpense();
  const [reason, setReason] = useState('');

  async function handleConfirm() {
    if (!reason.trim()) {
      toast.error('A reason is required to void an expense.');
      return;
    }
    try {
      await voidExpense({ id: expense.expenseId, voidExpenseRequest: { reason } }).unwrap();
      toast.success('Expense voided.');
      onOpenChange(false);
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void this expense?</AlertDialogTitle>
          <AlertDialogDescription>
            This preserves the record for audit purposes — it will no longer count as an active
            expense. This cannot be undone; to correct a mistake, void this one and record a new one.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5 px-1">
          <label htmlFor="void-expense-reason" className="text-sm font-medium">
            Reason
          </label>
          <Textarea
            id="void-expense-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Recorded in error"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            Void expense
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
