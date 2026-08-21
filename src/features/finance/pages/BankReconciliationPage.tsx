import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Ban, CheckCircle2, Link2, PlusIcon, Wand2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { BankStatementLineDto } from '@/api/generated/mycondoApi';
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
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { formatDate } from '@/lib/helpers';
import { useUrlFilters } from '@/hooks/use-url-filters';
import {
  useAddBankStatementLine,
  useAddReconciliationAdjustment,
  useBankReconciliation,
  useBankReconciliations,
  useCompleteBankReconciliation,
  useExcludeStatementLine,
  useFinancialAccountsForReconciliation,
  useMatchStatementLine,
  useStartBankReconciliation,
} from '../api/governanceApi';

const reconciliationStatusVariant: Record<string, 'warning' | 'success'> = {
  InProgress: 'warning',
  Reconciled: 'success',
};

const lineStatusVariant: Record<string, 'secondary' | 'success' | 'outline' | 'info'> = {
  Unmatched: 'secondary',
  Matched: 'success',
  Excluded: 'outline',
  Adjusted: 'info',
};

const OTHER_SIDE_ROLES = [
  { value: 'OperatingExpense', label: 'Bank charge (Operating Expense)' },
  { value: 'AssociationRevenue', label: 'Bank credit (Association Revenue)' },
  { value: 'FDInterestIncome', label: 'Interest earned (FD Interest Income)' },
  { value: 'InterestDeductionExpense', label: 'Interest tax/deduction (Interest Deduction Expense)' },
];

/**
 * Template 6 — manual-entry MVP: start a reconciliation against a Financial Account's statement
 * balance, add statement lines, resolve each as Matched (by ledger entry id — see the Account Ledger
 * report for ids)/Excluded/Adjusted, then complete once every line is resolved and the resulting
 * ledger balance ties out exactly. No CSV import, no cross-period outstanding-item carry-forward — see
 * BankReconciliation's own doc comment for why.
 */
export function BankReconciliationPage() {
  const [filters, setFilters] = useUrlFilters({ financialAccountId: '', reconciliationId: '' });
  const { data: accounts, isFetching: isFetchingAccounts } = useFinancialAccountsForReconciliation();

  const { data: reconciliations, isFetching, isError, error, refetch } = useBankReconciliations(
    { financialAccountId: filters.financialAccountId },
    { skip: !filters.financialAccountId },
  );

  const [startOpen, setStartOpen] = useState(false);

  if (filters.reconciliationId) {
    return (
      <BankReconciliationDetail
        reconciliationId={filters.reconciliationId}
        onBack={() => setFilters({ reconciliationId: '' })}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Bank Reconciliation"
        description="Reconcile a Financial Account's ledger balance against its monthly bank statement."
        crumbs={[{ label: 'Finance' }, { label: 'Bank Reconciliation' }]}
        primaryAction={
          <RequirePermission permission="finance.reconciliation.manage">
            <Button onClick={() => setStartOpen(true)} disabled={!filters.financialAccountId}>
              <PlusIcon /> Start Reconciliation
            </Button>
          </RequirePermission>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Financial Account</label>
            <Select
              value={filters.financialAccountId}
              onValueChange={(v) => setFilters({ financialAccountId: v })}
              disabled={isFetchingAccounts || !accounts?.length}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a financial account" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((a) => (
                  <SelectItem key={a.financialAccountId} value={a.financialAccountId}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {!filters.financialAccountId ? (
        <Card>
          <EmptyState title="Select a Financial Account" description="Choose an account above to see its reconciliation history." />
        </Card>
      ) : isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Reconciliations</CardTitle>
            </CardHeading>
            <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
          </CardHeader>
          <CardTable>
            {!isFetching && reconciliations?.length === 0 ? (
              <EmptyState title="No reconciliations yet" description="Start the first reconciliation for this account." />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statement Date</TableHead>
                      <TableHead>Statement Balance</TableHead>
                      <TableHead>Opening Ledger Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching && !reconciliations ? (
                      <TableSkeleton columns={5} />
                    ) : (
                      (reconciliations ?? []).map((r) => (
                        <TableRow
                          key={r.bankReconciliationId}
                          className="cursor-pointer"
                          onClick={() => setFilters({ reconciliationId: r.bankReconciliationId })}
                        >
                          <TableCell>{formatDate(r.statementDate)}</TableCell>
                          <TableCell>
                            <MoneyDisplay amount={r.statementBalance} />
                          </TableCell>
                          <TableCell>
                            <MoneyDisplay amount={r.openingLedgerBalance} />
                          </TableCell>
                          <TableCell>
                            <Badge variant={reconciliationStatusVariant[r.status] ?? 'secondary'} appearance="light">
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
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

      <StartReconciliationDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        financialAccountId={filters.financialAccountId}
        onStarted={(id) => setFilters({ reconciliationId: id })}
      />
    </>
  );
}

const startSchema = z.object({
  statementDate: z.string().min(1, { message: 'Statement date is required.' }),
  statementBalance: z.string().min(1, { message: 'Statement balance is required.' }),
});
type StartSchemaType = z.infer<typeof startSchema>;

function StartReconciliationDialog({
  open,
  onOpenChange,
  financialAccountId,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  financialAccountId: string;
  onStarted: (reconciliationId: string) => void;
}) {
  const [startReconciliation, { isLoading }] = useStartBankReconciliation();
  const form = useForm<StartSchemaType>({
    resolver: zodResolver(startSchema),
    defaultValues: { statementDate: '', statementBalance: '' },
  });

  async function onSubmit(values: StartSchemaType) {
    try {
      const result = await startReconciliation({
        startBankReconciliationCommand: {
          financialAccountId,
          statementDate: values.statementDate,
          statementBalance: values.statementBalance,
        },
      }).unwrap();
      toast.success('Bank reconciliation started.');
      form.reset();
      onOpenChange(false);
      onStarted(result.bankReconciliationId);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) toast.error(toUserMessage(apiError ?? err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Bank Reconciliation</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="statementDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statement date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="statementBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statement balance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Starting…' : 'Start reconciliation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BankReconciliationDetail({ reconciliationId, onBack }: { reconciliationId: string; onBack: () => void }) {
  const { data, isFetching, isError, error, refetch } = useBankReconciliation({ id: reconciliationId });
  const [completeReconciliation, { isLoading: isCompleting }] = useCompleteBankReconciliation();
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [matchTarget, setMatchTarget] = useState<BankStatementLineDto | null>(null);
  const [excludeTarget, setExcludeTarget] = useState<BankStatementLineDto | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<BankStatementLineDto | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);

  async function handleComplete() {
    if (!data) return;
    try {
      await completeReconciliation({ id: data.reconciliation.bankReconciliationId }).unwrap();
      toast.success('Bank reconciliation completed.');
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setConfirmComplete(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Bank Reconciliation"
        crumbs={[{ label: 'Finance' }, { label: 'Bank Reconciliation' }]}
        primaryAction={
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft /> Back to list
          </Button>
        }
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : !data ? (
        <Card>
          <div className="bg-muted h-32 animate-pulse rounded-md" />
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
              <div>
                <div className="text-muted-foreground text-sm">Statement Date</div>
                <div className="font-medium">{formatDate(data.reconciliation.statementDate)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Statement Balance</div>
                <div className="font-medium">
                  <MoneyDisplay amount={data.reconciliation.statementBalance} />
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Opening Ledger Balance</div>
                <div className="font-medium">
                  <MoneyDisplay amount={data.reconciliation.openingLedgerBalance} />
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Status</div>
                <Badge variant={reconciliationStatusVariant[data.reconciliation.status] ?? 'secondary'} appearance="light">
                  {data.reconciliation.status}
                </Badge>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Statement Lines</CardTitle>
              </CardHeading>
              <CardToolbar>
                {data.reconciliation.status === 'InProgress' && (
                  <>
                    <RequirePermission permission="finance.reconciliation.manage">
                      <Button variant="outline" size="sm" onClick={() => setAddLineOpen(true)}>
                        <PlusIcon /> Add Line
                      </Button>
                    </RequirePermission>
                    <RequirePermission permission="finance.reconciliation.reconcile">
                      <Button size="sm" onClick={() => setConfirmComplete(true)} disabled={isFetching}>
                        <CheckCircle2 /> Complete
                      </Button>
                    </RequirePermission>
                  </>
                )}
              </CardToolbar>
            </CardHeader>
            <CardTable>
              {data.lines.length === 0 ? (
                <EmptyState title="No statement lines yet" description="Add each line from the bank statement to begin matching." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.lines.map((line) => (
                        <TableRow key={line.bankStatementLineId}>
                          <TableCell>{formatDate(line.transactionDate)}</TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell>
                            <MoneyDisplay amount={line.amount} emphasizeNegative />
                          </TableCell>
                          <TableCell>
                            <Badge variant={lineStatusVariant[line.status] ?? 'secondary'} appearance="light">
                              {line.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <RowActionsMenu
                              ariaLabel={`Actions for statement line dated ${formatDate(line.transactionDate)}`}
                              actions={[
                                {
                                  key: 'match',
                                  label: 'Match to ledger entry',
                                  icon: <Link2 />,
                                  onClick: () => setMatchTarget(line),
                                  permission: 'finance.reconciliation.manage',
                                  hidden: line.status !== 'Unmatched',
                                },
                                {
                                  key: 'adjust',
                                  label: 'Post adjustment',
                                  icon: <Wand2 />,
                                  onClick: () => setAdjustTarget(line),
                                  permission: 'finance.reconciliation.manage',
                                  hidden: line.status !== 'Unmatched',
                                },
                                {
                                  key: 'exclude',
                                  label: 'Exclude',
                                  icon: <Ban />,
                                  onClick: () => setExcludeTarget(line),
                                  permission: 'finance.reconciliation.manage',
                                  hidden: line.status !== 'Unmatched',
                                  variant: 'destructive',
                                },
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardTable>
          </Card>
        </div>
      )}

      <AddStatementLineDialog open={addLineOpen} onOpenChange={setAddLineOpen} reconciliationId={reconciliationId} />
      <MatchStatementLineDialog line={matchTarget} onOpenChange={(open) => !open && setMatchTarget(null)} />
      <ExcludeStatementLineDialog line={excludeTarget} onOpenChange={(open) => !open && setExcludeTarget(null)} />
      <AdjustStatementLineDialog line={adjustTarget} onOpenChange={(open) => !open && setAdjustTarget(null)} />

      <ConfirmActionDialog
        open={confirmComplete}
        onOpenChange={setConfirmComplete}
        title="Complete this reconciliation?"
        description="The resulting ledger balance must tie out exactly to the statement balance — if it doesn't, this will be rejected and nothing changes."
        confirmLabel="Complete"
        loadingLabel="Completing…"
        isLoading={isCompleting}
        confirmVariant="primary"
        onConfirm={handleComplete}
      />
    </>
  );
}

const lineSchema = z.object({
  transactionDate: z.string().min(1, { message: 'Date is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
  amount: z.string().min(1, { message: 'Amount is required.' }).refine((v) => Number(v) !== 0, {
    message: 'Amount cannot be zero.',
  }),
});
type LineSchemaType = z.infer<typeof lineSchema>;

function AddStatementLineDialog({
  open,
  onOpenChange,
  reconciliationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliationId: string;
}) {
  const [addLine, { isLoading }] = useAddBankStatementLine();
  const form = useForm<LineSchemaType>({
    resolver: zodResolver(lineSchema),
    defaultValues: { transactionDate: '', description: '', amount: '' },
  });

  async function onSubmit(values: LineSchemaType) {
    try {
      await addLine({
        addBankStatementLineCommand: {
          bankReconciliationId: reconciliationId,
          transactionDate: values.transactionDate,
          description: values.description,
          amount: values.amount,
        },
      }).unwrap();
      toast.success('Statement line added.');
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) toast.error(toUserMessage(apiError ?? err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Statement Line</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="As it appears on the statement" {...field} />
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
                    <Input type="number" step="0.01" placeholder="Positive = deposit, negative = withdrawal/charge" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding…' : 'Add line'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const matchSchema = z.object({ ledgerEntryId: z.string().min(1, { message: 'Ledger entry id is required.' }) });
type MatchSchemaType = z.infer<typeof matchSchema>;

function MatchStatementLineDialog({
  line,
  onOpenChange,
}: {
  line: BankStatementLineDto | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [matchLine, { isLoading }] = useMatchStatementLine();
  const form = useForm<MatchSchemaType>({ resolver: zodResolver(matchSchema), defaultValues: { ledgerEntryId: '' } });

  async function onSubmit(values: MatchSchemaType) {
    if (!line) return;
    try {
      await matchLine({
        id: line.bankStatementLineId,
        matchStatementLineLedgerEntryRequest: { ledgerEntryId: values.ledgerEntryId },
      }).unwrap();
      toast.success('Statement line matched.');
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) toast.error(toUserMessage(apiError ?? err));
    }
  }

  return (
    <Dialog open={line !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Match "{line?.description}"</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ledgerEntryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ledger entry id</FormLabel>
                  <FormControl>
                    <Input placeholder="Find it via the Account Ledger report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Matching…' : 'Match'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const excludeSchema = z.object({ reason: z.string().min(1, { message: 'A reason is required.' }).max(500) });
type ExcludeSchemaType = z.infer<typeof excludeSchema>;

function ExcludeStatementLineDialog({
  line,
  onOpenChange,
}: {
  line: BankStatementLineDto | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [excludeLine, { isLoading }] = useExcludeStatementLine();
  const form = useForm<ExcludeSchemaType>({ resolver: zodResolver(excludeSchema), defaultValues: { reason: '' } });

  async function onSubmit(values: ExcludeSchemaType) {
    if (!line) return;
    try {
      await excludeLine({
        id: line.bankStatementLineId,
        excludeStatementLineReasonRequest: { reason: values.reason },
      }).unwrap();
      toast.success('Statement line excluded.');
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) toast.error(toUserMessage(apiError ?? err));
    }
  }

  return (
    <Dialog open={line !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exclude "{line?.description}"</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. bank-side duplicate entry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Excluding…' : 'Exclude'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const adjustSchema = z.object({
  otherSideRole: z.string().min(1, { message: 'Select where the other side of this entry posts.' }),
  description: z.string().min(1, { message: 'Description is required.' }).max(500),
});
type AdjustSchemaType = z.infer<typeof adjustSchema>;

function AdjustStatementLineDialog({
  line,
  onOpenChange,
}: {
  line: BankStatementLineDto | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [addAdjustment, { isLoading }] = useAddReconciliationAdjustment();
  const form = useForm<AdjustSchemaType>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { otherSideRole: '', description: line?.description ?? '' },
  });

  async function onSubmit(values: AdjustSchemaType) {
    if (!line) return;
    try {
      await addAdjustment({
        id: line.bankStatementLineId,
        addReconciliationAdjustmentRequest: { otherSideRole: values.otherSideRole, description: values.description },
      }).unwrap();
      toast.success('Adjustment posted.');
      form.reset();
      onOpenChange(false);
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) toast.error(toUserMessage(apiError ?? err));
    }
  }

  return (
    <Dialog open={line !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post Adjustment for "{line?.description}"</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="otherSideRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post the other side to</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an account role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OTHER_SIDE_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
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
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Posting…' : 'Post adjustment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
