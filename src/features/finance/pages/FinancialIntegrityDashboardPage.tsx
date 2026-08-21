import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toUserMessage } from '@/api/errors';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useFinancialIntegrityDashboard } from '../api/governanceApi';

/**
 * Template 6 — a read-only control surface over already-persisted ledger data, not another
 * accounting engine (see FinanceIntegrityRepository's doc comment). Every count here is expected to
 * be zero in a healthy tenant; the two "stale" checks are operational backlog signals, not
 * data-integrity defects, so they're presented separately from the three that drive `isHealthy`.
 */
export function FinancialIntegrityDashboardPage() {
  const { data, isFetching, isError, error, refetch } = useFinancialIntegrityDashboard();

  const integrityChecks = data
    ? [
        {
          key: 'unbalanced',
          label: 'Unbalanced postings',
          description: 'Ledger postings whose debits and credits do not sum to zero.',
          count: Number(data.unbalancedPostingsCount),
        },
        {
          key: 'duplicate',
          label: 'Duplicate logical postings',
          description: 'Postings sharing the same source reference — a duplicate financial effect.',
          count: Number(data.duplicateLogicalPostingsCount),
        },
        {
          key: 'closed-period',
          label: 'Closed-period violations',
          description: 'Ledger entries recorded after their accounting period was closed.',
          count: Number(data.closedPeriodViolationsCount),
        },
      ]
    : [];

  const operationalChecks = data
    ? [
        {
          key: 'unreconciled',
          label: 'Stale unreconciled bank items',
          description: 'Bank statement lines still unmatched more than 45 days after the statement date.',
          count: Number(data.staleUnreconciledBankItemsCount),
        },
        {
          key: 'interest',
          label: 'Stale unreceived interest accruals',
          description: 'Fixed Deposit interest accrued more than 45 days ago with no matching receipt.',
          count: Number(data.staleUnreceivedInterestAccrualsCount),
        },
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Financial Integrity Dashboard"
        description="Live checks against the posted ledger — a control surface, not another accounting engine."
        crumbs={[{ label: 'Finance' }, { label: 'Integrity Dashboard' }]}
      />

      {isError ? (
        <Card>
          <ErrorState description={toUserMessage(error)} onRetry={refetch} />
        </Card>
      ) : (
        <div className="space-y-4">
          {data && (
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                {data.isHealthy ? (
                  <>
                    <CheckCircle2 className="text-success size-6" />
                    <div>
                      <div className="font-medium">Healthy</div>
                      <div className="text-muted-foreground text-sm">No data-integrity defects detected.</div>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-destructive size-6" />
                    <div>
                      <div className="font-medium">Attention required</div>
                      <div className="text-muted-foreground text-sm">
                        One or more data-integrity checks found a defect — see below.
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Data-integrity checks</CardTitle>
              </CardHeading>
            </CardHeader>
            <CardContent className="space-y-3">
              {isFetching && !data
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-muted h-14 animate-pulse rounded-md" />
                  ))
                : integrityChecks.map((check) => (
                    <div key={check.key} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <div className="font-medium">{check.label}</div>
                        <div className="text-muted-foreground text-sm">{check.description}</div>
                      </div>
                      <Badge variant={check.count === 0 ? 'success' : 'destructive'} appearance="light">
                        {check.count}
                      </Badge>
                    </div>
                  ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Operational backlog</CardTitle>
              </CardHeading>
            </CardHeader>
            <CardContent className="space-y-3">
              {isFetching && !data
                ? Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-muted h-14 animate-pulse rounded-md" />
                  ))
                : operationalChecks.map((check) => (
                    <div key={check.key} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <div className="font-medium">{check.label}</div>
                        <div className="text-muted-foreground text-sm">{check.description}</div>
                      </div>
                      <Badge variant={check.count === 0 ? 'success' : 'warning'} appearance="light">
                        {check.count}
                      </Badge>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
