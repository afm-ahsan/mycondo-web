import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, LockOpen, PencilLine, PlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { toUserMessage } from '@/api/errors';
import type { FinancialAccountDto } from '@/api/generated/mycondoApi';
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
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import {
  useActivateFinancialAccount,
  useCreateFinancialAccount,
  useDeactivateFinancialAccount,
  useFinancialAccounts,
  useFundsForBanking,
  useUpdateFinancialAccount,
} from '../api/bankingApi';

const ACCOUNT_TYPES = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Bank', label: 'Bank' },
  { value: 'MobileFinancialService', label: 'Mobile Financial Service' },
];

/**
 * Template 4 (Banking, Fixed Deposits & Interest) — the physical money locations (cash on hand, bank
 * accounts, MFS wallets) postings can reference. Account type is fixed at creation (see
 * `UpdateFinancialAccountRequest`, which omits it) since it maps to a distinct chart-of-account entry
 * created alongside the account.
 */
export function FinancialAccountsPage() {
  const { data, isFetching, isError, error, refetch } = useFinancialAccounts();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FinancialAccountDto | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ account: FinancialAccountDto; activate: boolean } | null>(null);

  const [activateAccount, { isLoading: isActivating }] = useActivateFinancialAccount();
  const [deactivateAccount, { isLoading: isDeactivating }] = useDeactivateFinancialAccount();

  async function runStatusChange() {
    if (!statusTarget) return;
    const { account, activate } = statusTarget;
    try {
      if (activate) {
        await activateAccount({ id: account.financialAccountId }).unwrap();
        toast.success(`"${account.name}" activated.`);
      } else {
        await deactivateAccount({ id: account.financialAccountId }).unwrap();
        toast.success(`"${account.name}" deactivated.`);
      }
    } catch (err) {
      toast.error(toUserMessage(err));
    } finally {
      setStatusTarget(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Financial Accounts"
        description="Cash, bank, and mobile financial service accounts Finance postings can reference."
        crumbs={[{ label: 'Finance' }, { label: 'Financial Accounts' }]}
        primaryAction={
          <RequirePermission permission={PERMISSIONS.finance.bankAccountManage}>
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon /> Add Account
            </Button>
          </RequirePermission>
        }
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Accounts</CardTitle>
            </CardHeading>
            <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
          </CardHeader>
          <CardTable>
            {!isFetching && data?.length === 0 ? (
              <EmptyState title="No financial accounts yet" description="Add the first cash, bank, or MFS account." />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Bank / Branch</TableHead>
                      <TableHead>Account #</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching && !data ? (
                      <TableSkeleton columns={7} />
                    ) : (
                      (data ?? []).map((account) => (
                        <TableRow key={account.financialAccountId}>
                          <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell>{account.accountType}</TableCell>
                          <TableCell>
                            {account.bankName}
                            {account.branchName ? ` / ${account.branchName}` : ''}
                          </TableCell>
                          <TableCell>{account.accountNumber ?? '—'}</TableCell>
                          <TableCell>{account.fundName ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant={account.isActive ? 'success' : 'secondary'} appearance="light">
                              {account.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <RowActionsMenu
                              ariaLabel={`Actions for ${account.name}`}
                              actions={[
                                {
                                  key: 'edit',
                                  label: 'Edit',
                                  icon: <PencilLine />,
                                  onClick: () => setEditTarget(account),
                                  permission: PERMISSIONS.finance.bankAccountManage,
                                },
                                {
                                  key: 'deactivate',
                                  label: 'Deactivate',
                                  icon: <Lock />,
                                  onClick: () => setStatusTarget({ account, activate: false }),
                                  permission: PERMISSIONS.finance.bankAccountManage,
                                  hidden: !account.isActive,
                                  variant: 'destructive',
                                },
                                {
                                  key: 'activate',
                                  label: 'Activate',
                                  icon: <LockOpen />,
                                  onClick: () => setStatusTarget({ account, activate: true }),
                                  permission: PERMISSIONS.finance.bankAccountManage,
                                  hidden: account.isActive,
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

      <FinancialAccountFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <FinancialAccountFormDialog
        account={editTarget ?? undefined}
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />

      {statusTarget && (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => !open && setStatusTarget(null)}
          title={statusTarget.activate ? 'Activate this account?' : 'Deactivate this account?'}
          description={
            statusTarget.activate
              ? 'Postings will be able to reference this account again.'
              : 'New postings will no longer be able to reference this account.'
          }
          confirmLabel={statusTarget.activate ? 'Activate' : 'Deactivate'}
          loadingLabel="Working…"
          isLoading={isActivating || isDeactivating}
          confirmVariant={statusTarget.activate ? 'primary' : 'destructive'}
          onConfirm={runStatusChange}
        />
      )}
    </>
  );
}

const accountSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(200),
  accountType: z.enum(['Cash', 'Bank', 'MobileFinancialService']),
  bankName: z.string().max(200).optional().or(z.literal('')),
  branchName: z.string().max(200).optional().or(z.literal('')),
  accountNumber: z.string().max(100).optional().or(z.literal('')),
  fundId: z.string().optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});
type AccountSchemaType = z.infer<typeof accountSchema>;

function FinancialAccountFormDialog({
  account,
  open,
  onOpenChange,
}: {
  account?: FinancialAccountDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [createAccount, { isLoading: isCreating }] = useCreateFinancialAccount();
  const [updateAccount, { isLoading: isUpdating }] = useUpdateFinancialAccount();
  const { data: funds } = useFundsForBanking();
  const isEditing = Boolean(account);
  const isLoading = isCreating || isUpdating;

  const form = useForm<AccountSchemaType>({
    resolver: zodResolver(accountSchema),
    values: {
      name: account?.name ?? '',
      accountType: (account?.accountType as AccountSchemaType['accountType']) ?? 'Bank',
      bankName: account?.bankName ?? '',
      branchName: account?.branchName ?? '',
      accountNumber: account?.accountNumber ?? '',
      fundId: account?.fundId ?? '',
      notes: account?.notes ?? '',
    },
  });

  async function onSubmit(values: AccountSchemaType) {
    try {
      if (account) {
        await updateAccount({
          id: account.financialAccountId,
          updateFinancialAccountRequest: {
            name: values.name,
            bankName: values.bankName || null,
            branchName: values.branchName || null,
            accountNumber: values.accountNumber || null,
            fundId: values.fundId || null,
            notes: values.notes || null,
          },
        }).unwrap();
        toast.success(`"${values.name}" updated.`);
      } else {
        await createAccount({
          createFinancialAccountRequest: {
            name: values.name,
            accountType: values.accountType,
            bankName: values.bankName || null,
            branchName: values.branchName || null,
            accountNumber: values.accountNumber || null,
            fundId: values.fundId || null,
            notes: values.notes || null,
          },
        }).unwrap();
        toast.success(`"${values.name}" created.`);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Financial Account' : 'Add Financial Account'}</DialogTitle>
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
                    <Input placeholder="e.g. Association Main Account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <FormField
                control={form.control}
                name="accountType"
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
                        {ACCOUNT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank name (optional)</FormLabel>
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
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account number (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                {isLoading ? 'Saving…' : isEditing ? 'Save changes' : 'Create account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
