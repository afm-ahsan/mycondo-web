import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { PageHeader } from '@/components/shared/PageHeader';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { formatDate } from '@/lib/helpers';
import { useFinancialPositionReport } from '../api/reportsApi';
import type { FinancialPositionSectionDto } from '@/api/generated/mycondoApi';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const FILTER_DEFAULTS = { asOfDate: today() };

function SectionTable({
  title,
  section,
  isFetching,
}: {
  title: string;
  section: FinancialPositionSectionDto | undefined;
  isFetching: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>{title}</CardTitle>
        </CardHeading>
        <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
      </CardHeader>
      <CardTable>
        {!isFetching && section?.lines.length === 0 ? (
          <EmptyState title="No accounts" description={`No ${title.toLowerCase()} activity.`} />
        ) : (
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(section?.lines ?? []).map((line) => (
                  <TableRow key={line.chartOfAccountId}>
                    <TableCell>{line.code}</TableCell>
                    <TableCell>{line.name}</TableCell>
                    <TableCell>
                      <MoneyDisplay amount={line.balance} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-medium" colSpan={2}>
                    Total
                  </TableCell>
                  <TableCell className="font-medium">
                    <MoneyDisplay amount={section?.total} />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardTable>
    </Card>
  );
}

/**
 * Balance sheet — Assets in one section, Liabilities + Equity in another, with a summary footer
 * showing Retained Surplus/Deficit and Total Liabilities + Equity (which, together with Equity's own
 * section total, balances against the Assets total). Laid out as a 2-column grid on wide screens
 * (Assets | Liabilities+Equity) since the report is inherently two-sided.
 */
export function FinancialPositionReportPage() {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useFinancialPositionReport({
    asOfDate: filters.asOfDate,
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
        title="Financial Position"
        crumbs={[{ label: 'Finance' }, { label: 'Reports' }, { label: 'Financial Position' }]}
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
          <div className="space-y-1">
            <Label>As of</Label>
            <Input type="date" value={filters.asOfDate} onChange={(e) => setFilters({ asOfDate: e.target.value })} />
          </div>
        </div>
      </Card>

      {isError ? (
        <ErrorState description="Couldn't load the financial position." onRetry={refetch} />
      ) : (
        <div id="print-root" className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-medium">
            As of {data ? formatDate(data.metadata.asOfDate ?? filters.asOfDate) : '…'}
          </h3>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SectionTable title="Assets" section={data?.assets} isFetching={isFetching} />
            <div className="space-y-4">
              <SectionTable title="Liabilities" section={data?.liabilities} isFetching={isFetching} />
              <SectionTable title="Equity" section={data?.equity} isFetching={isFetching} />
            </div>
          </div>

          <Card>
            <CardTable>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Retained Surplus / Deficit</TableCell>
                    <TableCell>
                      <MoneyDisplay amount={data?.retainedSurplusDeficit} emphasizeNegative />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Liabilities + Equity</TableCell>
                    <TableCell>
                      <MoneyDisplay amount={data?.totalLiabilitiesAndEquity} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardTable>
          </Card>
        </div>
      )}
    </>
  );
}
