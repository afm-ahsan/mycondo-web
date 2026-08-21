import { skipToken } from '@reduxjs/toolkit/query/react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { FlatSelect } from '@/components/shared/FlatSelect';
import { KpiCard } from '@/components/shared/KpiCard';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useFlatFinancialStatementReport } from '../api/reportsApi';

const FILTER_DEFAULTS = { buildingId: '', flatId: '', fromDate: '', toDate: '', page: '1' };
const PAGE_SIZE = 25;

/**
 * Board/admin-facing per-flat statement — any flat, unlike `ResidentFinancialStatementReportPage`'s
 * self-service `finance.report.statement.own.view` gating. Route-level permission (`finance.report.view`,
 * wired by the orchestrating session) is what restricts access to this page; the picker itself is
 * always shown here, no self-service auto-selected-flat branch.
 */
export function FlatFinancialStatementReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const page = Number(filters.page) || 1;

  const { data, isFetching, isError, refetch } = useFlatFinancialStatementReport(
    filters.flatId
      ? {
          flatId: filters.flatId,
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
        title="Flat Financial Statement"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Flat Financial Statement' }]}
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

      {!filters.flatId ? (
        <EmptyState title="Choose a flat" description="Select a building and flat to view its statement." />
      ) : isError ? (
        <ErrorState description="Couldn't load the flat financial statement." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium mb-2">
              {data ? `Flat ${data.flatNumber}` : 'Statement'}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Opening Balance" value={<MoneyDisplay amount={data?.openingBalance} />} isLoading={isFetching} />
              <KpiCard label="Period Debit" value={<MoneyDisplay amount={data?.periodDebitTotal} />} isLoading={isFetching} tone="destructive" />
              <KpiCard label="Period Credit" value={<MoneyDisplay amount={data?.periodCreditTotal} />} isLoading={isFetching} tone="success" />
              <KpiCard label="Closing Balance" value={<MoneyDisplay amount={data?.closingBalance} />} isLoading={isFetching} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Ledger Activity</CardTitle>
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
                          <TableRow key={line.ledgerEntryId}>
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
