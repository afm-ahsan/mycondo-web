import {
  Card,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { Truck } from 'lucide-react';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useSupplierComparisonReport } from '../../api/reportsApi';
import { RatePerKg } from '../../components/RatePerKg';
import { PageHeader } from '@/components/shared/PageHeader';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const COMPARISON_FILTER_DEFAULTS = { fromDate: firstDayOfMonth(), toDate: today() };

export function SupplierComparisonPage() {
  const [filters, setFilters] = useUrlFilters(COMPARISON_FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useSupplierComparisonReport({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  return (
    <>
      <PageHeader title="Supplier Comparison" crumbs={[{ label: 'Operations' }, { label: 'Gas Cylinders' }, { label: 'Supplier Comparison' }]} />

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
          <div className="space-y-1">
            <Label>From</Label>
            <Input type="date" value={filters.fromDate} onChange={(e) => setFilters({ fromDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={filters.toDate} onChange={(e) => setFilters({ toDate: e.target.value })} />
          </div>
        </div>
      </Card>

      {isError ? (
        <Card>
          <ErrorState description="Failed to load the supplier comparison report. Please try again." onRetry={refetch} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Supplier Comparison</CardTitle>
            </CardHeading>
            <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Total quantity</TableHead>
                    <TableHead>Total amount</TableHead>
                    <TableHead>Avg. price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetching && !data ? (
                    <TableSkeleton columns={5} />
                  ) : (data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0 text-center">
                        <EmptyState
                          icon={<Truck className="size-8" aria-hidden="true" />}
                          title="No purchases found"
                          description="No supplier purchases were recorded in the selected period."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data ?? []).map((line) => (
                      <TableRow key={line.supplierId}>
                        <TableCell>{line.supplierName}</TableCell>
                        <TableCell>{line.purchaseCount}</TableCell>
                        <TableCell>{line.totalQuantity}</TableCell>
                        <TableCell><MoneyDisplay amount={line.totalAmount} /></TableCell>
                        <TableCell><RatePerKg amount={line.averageUnitPricePerKg} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
        </Card>
      )}
    </>
  );
}
