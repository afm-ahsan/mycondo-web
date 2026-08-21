import { skipToken } from '@reduxjs/toolkit/query/react';
import { Printer } from 'lucide-react';
import { useGetApiV1MeFlatsQuery } from '@/api/generated/mycondoApi';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { hasPermission } from '@/lib/auth/permissions';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useResidentFinancialStatementReport } from '../api/reportsApi';

const FILTER_DEFAULTS = { buildingId: '', flatId: '', fromDate: '', toDate: '', page: '1' };
const PAGE_SIZE = 25;

/**
 * Resident Privacy (Template 5, non-negotiable): a caller holding only the self-service
 * `finance.report.statement.own.view` permission must never be able to pick an arbitrary flat — the
 * flat/building pickers only render for callers holding the broader `finance.report.view`. A
 * self-service-only caller's own flat (from `GET /api/v1/me/flats`) is used automatically, with no
 * picker to bypass. The backend handler still enforces this independently either way (defense in
 * depth) — this page only controls what's offered in the UI.
 */
export function ResidentFinancialStatementReportPage() {
  const user = useAppSelector((s) => s.auth.user);
  const canViewAny = hasPermission(user, PERMISSIONS.finance.reportView);

  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const { data: myFlats } = useGetApiV1MeFlatsQuery(undefined, { skip: canViewAny });

  const effectiveFlatId = canViewAny ? filters.flatId : (myFlats?.[0]?.flatId ?? '');
  const page = Number(filters.page) || 1;

  const { data, isFetching, isError, refetch } = useResidentFinancialStatementReport(
    effectiveFlatId
      ? {
          flatId: effectiveFlatId,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          page,
          pageSize: PAGE_SIZE,
        }
      : skipToken,
  );

  const totalPages = data ? Math.max(1, Math.ceil(Number(data.total) / PAGE_SIZE)) : 1;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { position: absolute; inset: 0; width: 100%; margin: 0; padding: 0; }
          #print-hide-on-print { display: none !important; }
        }
      `}</style>

      <PageHeader
        title="Resident Financial Statement"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Resident Financial Statement' }]}
      />

      <Card className="mb-4" id="print-hide-on-print">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer /> Print
            </Button>
          </CardToolbar>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
          {canViewAny && (
            <>
              <div className="space-y-1 w-full sm:w-56">
                <Label>Building</Label>
                <BuildingSelect
                  value={filters.buildingId || undefined}
                  onValueChange={(v) => setFilters({ buildingId: v, flatId: '', page: '1' })}
                />
              </div>
              <div className="space-y-1 w-full sm:w-56">
                <Label>Flat</Label>
                <FlatSelect
                  buildingId={filters.buildingId || undefined}
                  value={filters.flatId || undefined}
                  onValueChange={(v) => setFilters({ flatId: v, page: '1' })}
                />
              </div>
            </>
          )}
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={filters.fromDate} onChange={(e) => setFilters({ fromDate: e.target.value, page: '1' })} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={filters.toDate} onChange={(e) => setFilters({ toDate: e.target.value, page: '1' })} />
          </div>
        </div>
      </Card>

      {!effectiveFlatId ? (
        <EmptyState
          title={canViewAny ? 'Choose a flat' : 'No flat found'}
          description={canViewAny ? 'Select a building and flat to view its statement.' : "We couldn't find a flat linked to your account."}
        />
      ) : isError ? (
        <ErrorState description="Couldn't load the financial statement." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>
                  {data ? `Flat ${data.flatNumber}` : 'Statement'} — opening{' '}
                  <MoneyDisplay amount={data?.openingBalance} className="inline" /> · closing{' '}
                  <MoneyDisplay amount={data?.closingBalance} className="inline" />
                </CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.lines.length === 0 ? (
                <EmptyState title="No activity" description="No ledger activity in this period." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching && !data ? (
                        <TableSkeleton columns={6} />
                      ) : (
                        (data?.lines ?? []).map((line) => (
                          <TableRow key={line.entryId}>
                            <TableCell>{formatDate(line.businessDate)}</TableCell>
                            <TableCell>{line.description}</TableCell>
                            <TableCell>{line.referenceType ?? '—'}</TableCell>
                            <TableCell>{line.direction}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.amount} />
                            </TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.runningBalance} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium" colSpan={5}>
                          Closing balance
                        </TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.closingBalance} />
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardTable>
            {data && Number(data.total) > 0 && (
              <div className="flex items-center justify-between gap-4 p-4" id="print-hide-on-print">
                <span className="text-muted-foreground text-sm">
                  Page {data.page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setFilters({ page: String(page - 1) })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setFilters({ page: String(page + 1) })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
