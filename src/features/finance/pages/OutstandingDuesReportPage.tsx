import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BuildingSelect } from '@/components/shared/BuildingSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useOutstandingDuesReport } from '../api/reportsApi';

const FILTER_DEFAULTS = { buildingId: '' };

/**
 * Simple, non-bucketed outstanding balance per flat (total outstanding only — the bucketed-by-age
 * sibling is the separate Receivables Ageing report, not reproduced here). The line DTO has no
 * building-name field, so the per-row building is not resolved via a lookup; the chosen building
 * filter (or "All buildings") is shown as scope context in the header instead.
 */
export function OutstandingDuesReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useOutstandingDuesReport({
    buildingId: filters.buildingId || undefined,
  });

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
        title="Outstanding Dues"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Outstanding Dues' }]}
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
              onValueChange={(v) => setFilters({ buildingId: v })}
              placeholder="All buildings"
            />
          </div>
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the outstanding dues report." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Outstanding Dues{filters.buildingId ? '' : ' — All buildings'}</CardTitle>
              </CardHeading>
              <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
            </CardHeader>
            <CardTable>
              {!isFetching && data?.lines.length === 0 ? (
                <EmptyState title="No outstanding dues" description="No flat currently has an outstanding balance." />
              ) : (
                <ScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Flat</TableHead>
                        <TableHead>Open Invoices</TableHead>
                        <TableHead>Outstanding Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching && !data ? (
                        <TableSkeleton columns={3} />
                      ) : (
                        (data?.lines ?? []).map((line) => (
                          <TableRow key={line.flatId}>
                            <TableCell>{line.flatNumber}</TableCell>
                            <TableCell>{line.openInvoiceCount}</TableCell>
                            <TableCell>
                              <MoneyDisplay amount={line.outstandingBalance} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-medium" colSpan={2}>
                          Total
                        </TableCell>
                        <TableCell className="font-medium">
                          <MoneyDisplay amount={data?.totalOutstanding} />
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardTable>
          </Card>
        </div>
      )}
    </>
  );
}
