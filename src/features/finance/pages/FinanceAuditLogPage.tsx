import { toUserMessage } from '@/api/errors';
import { Card, CardHeader, CardHeading, CardTable, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatDateTime } from '@/lib/helpers';
import { useFinanceAuditLog } from '../api/governanceApi';

/**
 * Template 6 — read-only view of sensitive Finance governance actions (period close/soft-close/reopen,
 * reversals/voids/waivers, account-mapping changes, Fixed Deposit lifecycle changes, Expense approval,
 * Bank Reconciliation completion). Deliberately does not cover every routine posting — those are
 * already durably recorded as ledger entries, which is itself the audit trail for "create/post" (see
 * FinanceAuditLogEntry's own doc comment).
 */
export function FinanceAuditLogPage() {
  const { data, isFetching, isError, error, refetch } = useFinanceAuditLog({ take: 100 });

  return (
    <>
      <PageHeader
        title="Finance Audit Log"
        description="The most recent sensitive Finance governance actions for this tenant."
        crumbs={[{ label: 'Finance' }, { label: 'Audit Log' }]}
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Recent activity</CardTitle>
            </CardHeading>
          </CardHeader>
          <CardTable>
            {!isFetching && data?.length === 0 ? (
              <EmptyState title="No activity yet" description="Sensitive Finance actions will appear here as they occur." />
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Occurred</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetching && !data ? (
                      <TableSkeleton columns={4} />
                    ) : (
                      (data ?? []).map((entry) => (
                        <TableRow key={entry.financeAuditLogEntryId}>
                          <TableCell className="whitespace-nowrap">{formatDateTime(entry.occurredAtUtc)}</TableCell>
                          <TableCell className="font-medium">{entry.action}</TableCell>
                          <TableCell>
                            {entry.targetType ? (
                              <span className="text-muted-foreground text-sm">
                                {entry.targetType}
                                {entry.targetId ? ` #${entry.targetId.slice(0, 8)}` : ''}
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="max-w-md truncate text-sm" title={entry.metadata ?? undefined}>
                            {entry.metadata ?? '—'}
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
    </>
  );
}
