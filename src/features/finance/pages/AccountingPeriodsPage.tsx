import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, LockOpen, PlusIcon, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { AccountingPeriodDto } from '@/api/generated/mycondoApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RowActionsMenu } from '@/components/ui/data-grid-row-actions';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { formatDate } from '@/lib/helpers';
import { useUrlFilters } from '@/hooks/use-url-filters';
import {
  useAccountingPeriods,
  useCloseAccountingPeriod,
  useCreateAccountingPeriod,
  useFinancialYears,
  useReopenAccountingPeriod,
  useSoftCloseAccountingPeriod,
} from '../api/governanceApi';

const statusVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
  Open: 'success',
  SoftClosed: 'warning',
  Closed: 'secondary',
};

/**
 * Template 6 — Open → SoftClosed → Closed governance for a Financial Year's periods.
 * SoftClosed blocks new/original charges but still admits privileged adjustments (reversals/voids/
 * waivers); Closed blocks everything — see AccountingPeriod's own doc comment. Reopen is privileged
 * and audited (Finance Audit Log).
 */
export function AccountingPeriodsPage() {
  const [filters, setFilters] = useUrlFilters({ financialYearId: '' });
  const { data: financialYears, isFetching: isFetchingYears } = useFinancialYears();

  useEffect(() => {
    if (!filters.financialYearId && financialYears && financialYears.length > 0) {
      setFilters({ financialYearId: financialYears[0].financialYearId });
    }
  }, [filters.financialYearId, financialYears, setFilters]);

  const { data, isFetching, isError, error, refetch } = useAccountingPeriods(
    { financialYearId: filters.financialYearId },
    { skip: !filters.financialYearId },
  );

  const [softClosePeriod, { isLoading: isSoftClosing }] = useSoftCloseAccountingPeriod();
  const [closePeriod, { isLoading: isClosing }] = useCloseAccountingPeriod();
  const [reopenPeriod, { isLoading: isReopening }] = useReopenAccountingPeriod();
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    { period: AccountingPeriodDto; action: 'soft-close' | 'close' | 'reopen' } | null
  >(null);

  async function runConfirmedAction() {
    if (!confirmAction) return;
    const { period, action } = confirmAction;
    try {
      if (action === 'soft-close') {
        await softClosePeriod({ id: period.accountingPeriodId }).unwrap();
        toast.success(`"${period.name}" soft-closed.`);
      } else if (action === 'close') {
        await closePeriod({ id: period.accountingPeriodId }).unwrap();
        toast.success(`"${period.name}" closed.`);
      } else {
        await reopenPeriod({ id: period.accountingPeriodId }).unwrap();
        toast.success(`"${period.name}" reopened.`);
      }
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setConfirmAction(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Accounting Periods"
        description="Open, soft-close, close, and reopen the periods new Finance postings are attributed to."
        crumbs={[{ label: 'Finance' }, { label: 'Accounting Periods' }]}
        primaryAction={
          <RequirePermission permission="finance.period.manage">
            <Button onClick={() => setCreateOpen(true)} disabled={!financialYears?.length}>
              <PlusIcon /> Add Period
            </Button>
          </RequirePermission>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Financial Year</label>
            <Select
              value={filters.financialYearId}
              onValueChange={(v) => setFilters({ financialYearId: v })}
              disabled={isFetchingYears || !financialYears?.length}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select a financial year" />
              </SelectTrigger>
              <SelectContent>
                {financialYears?.map((y) => (
                  <SelectItem key={y.financialYearId} value={y.financialYearId}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Periods</CardTitle>
            </CardHeading>
            <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
          </CardHeader>
          <CardTable>
            {!isFetching && data?.length === 0 ? (
              <EmptyState title="No periods yet" description="Add the first period for this financial year." />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching && !data ? (
                      <TableSkeleton columns={5} />
                    ) : (
                      (data ?? []).map((period) => (
                        <TableRow key={period.accountingPeriodId}>
                          <TableCell className="font-medium">{period.name}</TableCell>
                          <TableCell>{formatDate(period.startDate)}</TableCell>
                          <TableCell>{formatDate(period.endDate)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[period.status] ?? 'secondary'} appearance="light">
                              {period.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <RowActionsMenu
                              ariaLabel={`Actions for ${period.name}`}
                              actions={[
                                {
                                  key: 'soft-close',
                                  label: 'Soft close',
                                  icon: <ShieldAlert />,
                                  onClick: () => setConfirmAction({ period, action: 'soft-close' }),
                                  permission: 'finance.period.close',
                                  hidden: period.status !== 'Open',
                                },
                                {
                                  key: 'close',
                                  label: 'Close',
                                  icon: <Lock />,
                                  onClick: () => setConfirmAction({ period, action: 'close' }),
                                  permission: 'finance.period.close',
                                  hidden: period.status === 'Closed',
                                  variant: 'destructive',
                                },
                                {
                                  key: 'reopen',
                                  label: 'Reopen',
                                  icon: <LockOpen />,
                                  onClick: () => setConfirmAction({ period, action: 'reopen' }),
                                  permission: 'finance.period.reopen',
                                  hidden: period.status === 'Open',
                                },
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardTable>
        </Card>
      )}

      <CreatePeriodDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        financialYearId={filters.financialYearId}
      />

      {confirmAction && (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={
            confirmAction.action === 'reopen'
              ? 'Reopen this period?'
              : confirmAction.action === 'close'
                ? 'Close this period?'
                : 'Soft-close this period?'
          }
          description={
            confirmAction.action === 'reopen'
              ? 'This is a privileged, audited action — normal posting will resume for this period.'
              : confirmAction.action === 'close'
                ? 'No further postings — not even reversals or corrections — will be accepted for this period.'
                : 'New/original charges will be blocked; reversals, voids, and waivers already in flight will still be accepted.'
          }
          confirmLabel={confirmAction.action === 'close' ? 'Close period' : 'Confirm'}
          loadingLabel="Working…"
          isLoading={isSoftClosing || isClosing || isReopening}
          confirmVariant={confirmAction.action === 'close' ? 'destructive' : 'primary'}
          onConfirm={runConfirmedAction}
        />
      )}
    </>
  );
}

const periodSchema = z
  .object({
    name: z.string().min(1, { message: 'Name is required.' }).max(100),
    startDate: z.string().min(1, { message: 'Start date is required.' }),
    endDate: z.string().min(1, { message: 'End date is required.' }),
  })
  .refine((v) => v.endDate > v.startDate, { message: 'End date must be after start date.', path: ['endDate'] });
type PeriodSchemaType = z.infer<typeof periodSchema>;

function CreatePeriodDialog({
  open,
  onOpenChange,
  financialYearId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  financialYearId: string;
}) {
  const [createPeriod, { isLoading }] = useCreateAccountingPeriod();

  const form = useForm<PeriodSchemaType>({
    resolver: zodResolver(periodSchema),
    defaultValues: { name: '', startDate: '', endDate: '' },
  });

  async function onSubmit(values: PeriodSchemaType) {
    try {
      await createPeriod({
        createAccountingPeriodCommand: {
          financialYearId,
          name: values.name,
          startDate: values.startDate,
          endDate: values.endDate,
        },
      }).unwrap();
      toast.success(`Accounting period "${values.name}" created.`);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Accounting Period</DialogTitle>
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
                    <Input placeholder="e.g. 2026-09" {...field} />
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
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : 'Create period'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
