import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Ban, PlusIcon, RefreshCw, Wallet } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { FixedDepositDto } from '@/api/generated/mycondoApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { formatDate } from '@/lib/helpers';
import { useUrlFilters } from '@/hooks/use-url-filters';
import {
  useFinancialAccounts,
  useFixedDeposit,
  useFixedDeposits,
  useFundsForBanking,
  usePlaceFixedDeposit,
  useRecordFixedDepositInterestAccrual,
  useRecordFixedDepositInterestReceipt,
  useRenewFixedDeposit,
  useVoidFixedDeposit,
  useWithdrawFixedDeposit,
} from '../api/bankingApi';

const CALCULATION_METHODS = [
  { value: 'Simple', label: 'Simple' },
  { value: 'Compound', label: 'Compound' },
];

const PAYMENT_FREQUENCIES = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'SemiAnnually', label: 'Semi-annually' },
  { value: 'Annually', label: 'Annually' },
  { value: 'AtMaturity', label: 'At maturity' },
];

const statusVariant: Record<string, 'success' | 'secondary' | 'outline' | 'destructive'> = {
  Active: 'success',
  Renewed: 'secondary',
  Withdrawn: 'outline',
  Voided: 'destructive',
};

const PAGE_SIZE = 20;
const FILTER_DEFAULTS = { status: '', fundId: '', page: '1', fixedDepositId: '' };

/**
 * Template 4 (Banking, Fixed Deposits & Interest) — the Fixed Deposit register: place, renew,
 * withdraw, void, and record interest accrual/receipt against the placement's funding/receiving
 * Financial Accounts. Renew/withdraw/void are only offered while `Active` (see FixedDepositStatus's
 * own doc comment — a placement with interest history is corrected by withdrawing it, not voiding).
 */
export function FixedDepositsPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const { data: funds } = useFundsForBanking();
  const page = Number(filters.page) || 1;

  const { data, isFetching, isError, error, refetch } = useFixedDeposits({
    status: filters.status || undefined,
    fundId: filters.fundId || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const [placeOpen, setPlaceOpen] = useState(false);
  const totalPages = data ? Math.max(1, Math.ceil(Number(data.total) / PAGE_SIZE)) : 1;

  if (filters.fixedDepositId) {
    return (
      <FixedDepositDetail
        fixedDepositId={filters.fixedDepositId}
        onBack={() => setFilters({ fixedDepositId: '' })}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Fixed Deposits"
        description="Place, renew, withdraw, and track interest on the Association's Fixed Deposit instruments."
        crumbs={[{ label: 'Finance' }, { label: 'Fixed Deposits' }]}
        primaryAction={
          <RequirePermission permission={PERMISSIONS.finance.fixedDepositPlace}>
            <Button onClick={() => setPlaceOpen(true)}>
              <PlusIcon /> Place Fixed Deposit
            </Button>
          </RequirePermission>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => setFilters({ status: v === 'all' ? '' : v, page: '1' })}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Renewed">Renewed</SelectItem>
                <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                <SelectItem value="Voided">Voided</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Fund</label>
            <Select
              value={filters.fundId || 'all'}
              onValueChange={(v) => setFilters({ fundId: v === 'all' ? '' : v, page: '1' })}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All funds</SelectItem>
                {funds?.map((f) => (
                  <SelectItem key={f.fundId} value={f.fundId}>
                    {f.name}
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
              <CardTitle>Fixed Deposits</CardTitle>
            </CardHeading>
            <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
          </CardHeader>
          <CardTable>
            {!isFetching && data?.items.length === 0 ? (
              <EmptyState title="No fixed deposits yet" description="Place the first Fixed Deposit for this Association." />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate #</TableHead>
                      <TableHead>Bank / Branch</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Rate %</TableHead>
                      <TableHead>Maturity Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching && !data ? (
                      <TableSkeleton columns={7} />
                    ) : (
                      (data?.items ?? []).map((fd) => (
                        <TableRow
                          key={fd.fixedDepositId}
                          className="cursor-pointer"
                          onClick={() => setFilters({ fixedDepositId: fd.fixedDepositId })}
                        >
                          <TableCell className="font-medium">{fd.certificateNumber}</TableCell>
                          <TableCell>
                            {fd.bankName}
                            {fd.branchName ? ` / ${fd.branchName}` : ''}
                          </TableCell>
                          <TableCell>
                            <MoneyDisplay amount={fd.principal} />
                          </TableCell>
                          <TableCell>{Number(fd.interestRatePercent).toFixed(2)}%</TableCell>
                          <TableCell>{formatDate(fd.maturityDate)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[fd.status] ?? 'secondary'} appearance="light">
                              {fd.status}
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
          {data && Number(data.total) > 0 && (
            <div className="flex items-center justify-between gap-4 p-4">
              <span className="text-muted-foreground text-sm">
                Page {data.page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilters({ page: String(page - 1) })}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setFilters({ page: String(page + 1) })}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <PlaceFixedDepositDialog open={placeOpen} onOpenChange={setPlaceOpen} onPlaced={(id) => setFilters({ fixedDepositId: id })} />
    </>
  );
}

const placeSchema = z.object({
  certificateNumber: z.string().min(1, { message: 'Certificate number is required.' }).max(100),
  bankName: z.string().min(1, { message: 'Bank name is required.' }).max(200),
  branchName: z.string().max(200).optional().or(z.literal('')),
  fundingFinancialAccountId: z.string().min(1, { message: 'Select the funding account.' }),
  fundId: z.string().optional().or(z.literal('')),
  principal: z.string().min(1, { message: 'Principal is required.' }).refine((v) => Number(v) > 0, {
    message: 'Principal must be greater than zero.',
  }),
  interestRatePercent: z.string().min(1, { message: 'Interest rate is required.' }),
  calculationMethod: z.enum(['Simple', 'Compound']),
  paymentFrequency: z.enum(['Monthly', 'Quarterly', 'SemiAnnually', 'Annually', 'AtMaturity']),
  startDate: z.string().min(1, { message: 'Start date is required.' }),
  maturityDate: z.string().min(1, { message: 'Maturity date is required.' }),
  expectedGrossInterest: z.string().optional().or(z.literal('')),
  expectedDeductionRatePercent: z.string().optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});
type PlaceSchemaType = z.infer<typeof placeSchema>;

function PlaceFixedDepositDialog({
  open,
  onOpenChange,
  onPlaced,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaced: (fixedDepositId: string) => void;
}) {
  const [placeFixedDeposit, { isLoading }] = usePlaceFixedDeposit();
  const { data: accounts } = useFinancialAccounts();
  const { data: funds } = useFundsForBanking();

  const form = useForm<PlaceSchemaType>({
    resolver: zodResolver(placeSchema),
    defaultValues: {
      certificateNumber: '',
      bankName: '',
      branchName: '',
      fundingFinancialAccountId: '',
      fundId: '',
      principal: '',
      interestRatePercent: '',
      calculationMethod: 'Simple',
      paymentFrequency: 'Monthly',
      startDate: '',
      maturityDate: '',
      expectedGrossInterest: '',
      expectedDeductionRatePercent: '',
      notes: '',
    },
  });

  async function onSubmit(values: PlaceSchemaType) {
    try {
      const result = await placeFixedDeposit({
        placeFixedDepositRequest: {
          certificateNumber: values.certificateNumber,
          bankName: values.bankName,
          branchName: values.branchName || null,
          fundingFinancialAccountId: values.fundingFinancialAccountId,
          fundId: values.fundId || null,
          principal: values.principal,
          interestRatePercent: values.interestRatePercent,
          calculationMethod: values.calculationMethod,
          paymentFrequency: values.paymentFrequency,
          startDate: values.startDate,
          maturityDate: values.maturityDate,
          expectedGrossInterest: values.expectedGrossInterest || null,
          expectedDeductionRatePercent: values.expectedDeductionRatePercent || null,
          notes: values.notes || null,
        },
      }).unwrap();
      toast.success(`Fixed Deposit "${values.certificateNumber}" placed.`);
      form.reset();
      onOpenChange(false);
      onPlaced(result.fixedDepositId);
    } catch (err) {
      const apiError = toApiError(err);
      if (!applyApiErrorToForm(form, apiError)) {
        toast.error(toUserMessage(apiError ?? err));
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Place Fixed Deposit</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="certificateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch name (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fundingFinancialAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding account</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select the account funds are drawn from" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.filter((a) => a.isActive).map((a) => (
                        <SelectItem key={a.financialAccountId} value={a.financialAccountId}>
                          {a.name}
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
              name="principal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Principal</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interestRatePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest rate %</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="calculationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calculation method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CALCULATION_METHODS.map((m) => (
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
              name="paymentFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment frequency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
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
              name="maturityDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maturity date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expectedGrossInterest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected gross interest (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expectedDeductionRatePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected deduction rate % (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
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
                {isLoading ? 'Placing…' : 'Place Fixed Deposit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function FixedDepositDetail({ fixedDepositId, onBack }: { fixedDepositId: string; onBack: () => void }) {
  const { data, isError, error, refetch } = useFixedDeposit({ id: fixedDepositId });
  const [renewOpen, setRenewOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [accrualOpen, setAccrualOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const fd = data?.fixedDeposit;
  const isActive = fd?.status === 'Active';

  return (
    <>
      <PageHeader
        title="Fixed Deposits"
        crumbs={[{ label: 'Finance' }, { label: 'Fixed Deposits' }]}
        primaryAction={
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft /> Back to list
          </Button>
        }
        secondaryActions={
          isActive && fd ? (
            <RequirePermission permission={PERMISSIONS.finance.fixedDepositManage}>
              <Button variant="outline" size="sm" onClick={() => setRenewOpen(true)}>
                <RefreshCw /> Renew
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWithdrawOpen(true)}>
                <Wallet /> Withdraw
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setVoidOpen(true)}>
                <Ban /> Void
              </Button>
            </RequirePermission>
          ) : undefined
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
                <div className="text-muted-foreground text-sm">Certificate #</div>
                <div className="font-medium">{fd?.certificateNumber}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Bank / Branch</div>
                <div className="font-medium">
                  {fd?.bankName}
                  {fd?.branchName ? ` / ${fd.branchName}` : ''}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Principal</div>
                <div className="font-medium">
                  <MoneyDisplay amount={fd?.principal} />
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Status</div>
                <Badge variant={statusVariant[fd?.status ?? ''] ?? 'secondary'} appearance="light">
                  {fd?.status}
                </Badge>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Interest Rate</div>
                <div className="font-medium">{fd ? Number(fd.interestRatePercent).toFixed(2) : '—'}%</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Start / Maturity</div>
                <div className="font-medium">
                  {fd ? `${formatDate(fd.startDate)} – ${formatDate(fd.maturityDate)}` : '—'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Total Interest Accrued</div>
                <div className="font-medium">
                  <MoneyDisplay amount={fd?.totalInterestAccrued} />
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Outstanding Interest Receivable</div>
                <div className="font-medium">
                  <MoneyDisplay amount={fd?.outstandingInterestReceivable} />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Interest Accruals</CardTitle>
              </CardHeading>
              <CardToolbar>
                {isActive && (
                  <RequirePermission permission={PERMISSIONS.finance.fixedDepositInterestRecord}>
                    <Button variant="outline" size="sm" onClick={() => setAccrualOpen(true)}>
                      <PlusIcon /> Record Accrual
                    </Button>
                  </RequirePermission>
                )}
              </CardToolbar>
            </CardHeader>
            <CardTable>
              {data.interestAccruals.length === 0 ? (
                <EmptyState title="No interest accruals yet" description="Record each period's accrued interest here." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Accounting Date</TableHead>
                        <TableHead>Gross Amount</TableHead>
                        <TableHead>Reversed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.interestAccruals.map((a) => (
                        <TableRow key={a.fixedDepositInterestAccrualId}>
                          <TableCell>
                            {formatDate(a.periodStart)} – {formatDate(a.periodEnd)}
                          </TableCell>
                          <TableCell>{formatDate(a.accountingDate)}</TableCell>
                          <TableCell>
                            <MoneyDisplay amount={a.grossAmount} />
                          </TableCell>
                          <TableCell>{a.isReversed ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardTable>
          </Card>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Interest Receipts</CardTitle>
              </CardHeading>
              <CardToolbar>
                {isActive && (
                  <RequirePermission permission={PERMISSIONS.finance.fixedDepositInterestRecord}>
                    <Button variant="outline" size="sm" onClick={() => setReceiptOpen(true)}>
                      <PlusIcon /> Record Receipt
                    </Button>
                  </RequirePermission>
                )}
              </CardToolbar>
            </CardHeader>
            <CardTable>
              {data.interestReceipts.length === 0 ? (
                <EmptyState title="No interest receipts yet" description="Record each actual interest payment received here." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Accounting Date</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Deduction</TableHead>
                        <TableHead>Net</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.interestReceipts.map((r) => (
                        <TableRow key={r.fixedDepositInterestReceiptId}>
                          <TableCell>{formatDate(r.accountingDate)}</TableCell>
                          <TableCell>
                            <MoneyDisplay amount={r.grossAmount} />
                          </TableCell>
                          <TableCell>
                            <MoneyDisplay amount={r.deductionAmount} />
                          </TableCell>
                          <TableCell>
                            <MoneyDisplay amount={r.netAmount} />
                          </TableCell>
                          <TableCell>{r.referenceNumber ?? '—'}</TableCell>
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

      {fd && (
        <>
          <RenewFixedDepositDialog fixedDeposit={fd} open={renewOpen} onOpenChange={setRenewOpen} />
          <WithdrawFixedDepositDialog fixedDeposit={fd} open={withdrawOpen} onOpenChange={setWithdrawOpen} />
          <VoidFixedDepositDialog fixedDeposit={fd} open={voidOpen} onOpenChange={setVoidOpen} />
          <RecordInterestAccrualDialog fixedDeposit={fd} open={accrualOpen} onOpenChange={setAccrualOpen} />
          <RecordInterestReceiptDialog fixedDeposit={fd} open={receiptOpen} onOpenChange={setReceiptOpen} />
        </>
      )}
    </>
  );
}

const renewSchema = z.object({
  newCertificateNumber: z.string().min(1, { message: 'Certificate number is required.' }).max(100),
  newBranchName: z.string().max(200).optional().or(z.literal('')),
  fundingFinancialAccountId: z.string().min(1, { message: 'Select the funding account.' }),
  newPrincipal: z.string().min(1, { message: 'Principal is required.' }).refine((v) => Number(v) > 0, {
    message: 'Principal must be greater than zero.',
  }),
  newInterestRatePercent: z.string().min(1, { message: 'Interest rate is required.' }),
  newCalculationMethod: z.enum(['Simple', 'Compound']),
  newPaymentFrequency: z.enum(['Monthly', 'Quarterly', 'SemiAnnually', 'Annually', 'AtMaturity']),
  newStartDate: z.string().min(1, { message: 'Start date is required.' }),
  newMaturityDate: z.string().min(1, { message: 'Maturity date is required.' }),
  newExpectedGrossInterest: z.string().optional().or(z.literal('')),
  newExpectedDeductionRatePercent: z.string().optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});
type RenewSchemaType = z.infer<typeof renewSchema>;

function RenewFixedDepositDialog({
  fixedDeposit,
  open,
  onOpenChange,
}: {
  fixedDeposit: FixedDepositDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [renewFixedDeposit, { isLoading }] = useRenewFixedDeposit();
  const { data: accounts } = useFinancialAccounts();

  const form = useForm<RenewSchemaType>({
    resolver: zodResolver(renewSchema),
    defaultValues: {
      newCertificateNumber: '',
      newBranchName: fixedDeposit.branchName ?? '',
      fundingFinancialAccountId: fixedDeposit.fundingFinancialAccountId,
      newPrincipal: String(fixedDeposit.principal),
      newInterestRatePercent: String(fixedDeposit.interestRatePercent),
      newCalculationMethod: (fixedDeposit.calculationMethod as RenewSchemaType['newCalculationMethod']) ?? 'Simple',
      newPaymentFrequency: (fixedDeposit.paymentFrequency as RenewSchemaType['newPaymentFrequency']) ?? 'Monthly',
      newStartDate: '',
      newMaturityDate: '',
      newExpectedGrossInterest: '',
      newExpectedDeductionRatePercent: '',
      notes: '',
    },
  });

  async function onSubmit(values: RenewSchemaType) {
    try {
      await renewFixedDeposit({
        id: fixedDeposit.fixedDepositId,
        renewFixedDepositRequest: {
          newCertificateNumber: values.newCertificateNumber,
          newBranchName: values.newBranchName || null,
          fundingFinancialAccountId: values.fundingFinancialAccountId,
          newPrincipal: values.newPrincipal,
          newInterestRatePercent: values.newInterestRatePercent,
          newCalculationMethod: values.newCalculationMethod,
          newPaymentFrequency: values.newPaymentFrequency,
          newStartDate: values.newStartDate,
          newMaturityDate: values.newMaturityDate,
          newExpectedGrossInterest: values.newExpectedGrossInterest || null,
          newExpectedDeductionRatePercent: values.newExpectedDeductionRatePercent || null,
          notes: values.notes || null,
        },
      }).unwrap();
      toast.success('Fixed Deposit renewed.');
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Renew "{fixedDeposit.certificateNumber}"</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newCertificateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New certificate number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newBranchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch name (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fundingFinancialAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding account</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.filter((a) => a.isActive).map((a) => (
                        <SelectItem key={a.financialAccountId} value={a.financialAccountId}>
                          {a.name}
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
              name="newPrincipal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New principal</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newInterestRatePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New interest rate %</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newCalculationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calculation method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CALCULATION_METHODS.map((m) => (
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
              name="newPaymentFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment frequency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
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
              name="newStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New start date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newMaturityDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New maturity date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
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
                {isLoading ? 'Renewing…' : 'Renew'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const withdrawSchema = z.object({
  accountingDate: z.string().optional().or(z.literal('')),
  receivingFinancialAccountId: z.string().min(1, { message: 'Select the receiving account.' }),
});
type WithdrawSchemaType = z.infer<typeof withdrawSchema>;

function WithdrawFixedDepositDialog({
  fixedDeposit,
  open,
  onOpenChange,
}: {
  fixedDeposit: FixedDepositDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [withdrawFixedDeposit, { isLoading }] = useWithdrawFixedDeposit();
  const { data: accounts } = useFinancialAccounts();
  const form = useForm<WithdrawSchemaType>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { accountingDate: '', receivingFinancialAccountId: '' },
  });

  async function onSubmit(values: WithdrawSchemaType) {
    try {
      await withdrawFixedDeposit({
        id: fixedDeposit.fixedDepositId,
        withdrawFixedDepositRequest: {
          accountingDate: values.accountingDate || null,
          receivingFinancialAccountId: values.receivingFinancialAccountId,
        },
      }).unwrap();
      toast.success('Fixed Deposit withdrawn.');
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
          <DialogTitle>Withdraw "{fixedDeposit.certificateNumber}"</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="receivingFinancialAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receiving account</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select the account principal is returned to" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.filter((a) => a.isActive).map((a) => (
                        <SelectItem key={a.financialAccountId} value={a.financialAccountId}>
                          {a.name}
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
              name="accountingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accounting date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Withdrawing…' : 'Withdraw'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const voidSchema = z.object({ reason: z.string().min(1, { message: 'A reason is required.' }).max(500) });
type VoidSchemaType = z.infer<typeof voidSchema>;

function VoidFixedDepositDialog({
  fixedDeposit,
  open,
  onOpenChange,
}: {
  fixedDeposit: FixedDepositDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [voidFixedDeposit, { isLoading }] = useVoidFixedDeposit();
  const form = useForm<VoidSchemaType>({ resolver: zodResolver(voidSchema), defaultValues: { reason: '' } });

  async function onSubmit(values: VoidSchemaType) {
    try {
      await voidFixedDeposit({ id: fixedDeposit.fixedDepositId, voidFixedDepositRequest: { reason: values.reason } }).unwrap();
      toast.success('Fixed Deposit voided.');
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
          <DialogTitle>Void "{fixedDeposit.certificateNumber}"</DialogTitle>
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
                    <Input placeholder="e.g. data-entry error, never actually placed" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading ? 'Voiding…' : 'Void'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const accrualSchema = z.object({
  periodStart: z.string().min(1, { message: 'Period start is required.' }),
  periodEnd: z.string().min(1, { message: 'Period end is required.' }),
  accountingDate: z.string().optional().or(z.literal('')),
  grossAmount: z.string().min(1, { message: 'Gross amount is required.' }).refine((v) => Number(v) > 0, {
    message: 'Gross amount must be greater than zero.',
  }),
  notes: z.string().max(1000).optional().or(z.literal('')),
});
type AccrualSchemaType = z.infer<typeof accrualSchema>;

function RecordInterestAccrualDialog({
  fixedDeposit,
  open,
  onOpenChange,
}: {
  fixedDeposit: FixedDepositDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [recordAccrual, { isLoading }] = useRecordFixedDepositInterestAccrual();
  const form = useForm<AccrualSchemaType>({
    resolver: zodResolver(accrualSchema),
    defaultValues: { periodStart: '', periodEnd: '', accountingDate: '', grossAmount: '', notes: '' },
  });

  async function onSubmit(values: AccrualSchemaType) {
    try {
      await recordAccrual({
        id: fixedDeposit.fixedDepositId,
        recordFixedDepositInterestAccrualRequest: {
          periodStart: values.periodStart,
          periodEnd: values.periodEnd,
          accountingDate: values.accountingDate || null,
          grossAmount: values.grossAmount,
          notes: values.notes || null,
        },
      }).unwrap();
      toast.success('Interest accrual recorded.');
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
          <DialogTitle>Record Interest Accrual</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="periodStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period start</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="periodEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period end</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grossAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gross amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
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
                {isLoading ? 'Recording…' : 'Record accrual'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const receiptSchema = z.object({
  accountingDate: z.string().optional().or(z.literal('')),
  grossAmount: z.string().min(1, { message: 'Gross amount is required.' }).refine((v) => Number(v) > 0, {
    message: 'Gross amount must be greater than zero.',
  }),
  deductionAmount: z.string().min(1, { message: 'Deduction amount is required (0 if none).' }).refine((v) => Number(v) >= 0, {
    message: 'Deduction amount cannot be negative.',
  }),
  receivingFinancialAccountId: z.string().min(1, { message: 'Select the receiving account.' }),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});
type ReceiptSchemaType = z.infer<typeof receiptSchema>;

function RecordInterestReceiptDialog({
  fixedDeposit,
  open,
  onOpenChange,
}: {
  fixedDeposit: FixedDepositDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [recordReceipt, { isLoading }] = useRecordFixedDepositInterestReceipt();
  const { data: accounts } = useFinancialAccounts();
  const form = useForm<ReceiptSchemaType>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      accountingDate: '',
      grossAmount: '',
      deductionAmount: '0',
      receivingFinancialAccountId: '',
      referenceNumber: '',
      notes: '',
    },
  });

  async function onSubmit(values: ReceiptSchemaType) {
    try {
      await recordReceipt({
        id: fixedDeposit.fixedDepositId,
        recordFixedDepositInterestReceiptRequest: {
          accountingDate: values.accountingDate || null,
          grossAmount: values.grossAmount,
          deductionAmount: values.deductionAmount,
          receivingFinancialAccountId: values.receivingFinancialAccountId,
          referenceNumber: values.referenceNumber || null,
          notes: values.notes || null,
        },
      }).unwrap();
      toast.success('Interest receipt recorded.');
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
          <DialogTitle>Record Interest Receipt</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="receivingFinancialAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receiving account</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select the account interest was received into" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts?.filter((a) => a.isActive).map((a) => (
                        <SelectItem key={a.financialAccountId} value={a.financialAccountId}>
                          {a.name}
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
              name="accountingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accounting date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grossAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gross amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deductionAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deduction amount (tax withheld, etc.)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
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
                  <FormLabel>Reference number (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
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
                {isLoading ? 'Recording…' : 'Record receipt'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
