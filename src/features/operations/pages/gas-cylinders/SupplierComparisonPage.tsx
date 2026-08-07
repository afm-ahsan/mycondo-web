import { useState } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupplierComparisonReport } from '../../api/reportsApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatBdt, formatNumber } from '../../lib/format';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SupplierComparisonPage() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth());
  const [toDate, setToDate] = useState(today());

  const { data, isFetching, isError } = useSupplierComparisonReport({ fromDate, toDate });

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
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>To</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {isError && <p className="text-destructive text-sm mb-2">Failed to load the supplier comparison report. Please try again.</p>}

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Supplier Comparison</CardTitle>
          </CardHeading>
          <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
        </CardHeader>
        <CardTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Total quantity</TableHead>
                <TableHead>Total amount</TableHead>
                <TableHead>Avg. price/kg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No purchases in this period.
                  </TableCell>
                </TableRow>
              ) : (
                (data ?? []).map((line) => (
                  <TableRow key={line.supplierId}>
                    <TableCell>{line.supplierName}</TableCell>
                    <TableCell>{line.purchaseCount}</TableCell>
                    <TableCell>{line.totalQuantity}</TableCell>
                    <TableCell>{formatBdt(line.totalAmount)}</TableCell>
                    <TableCell>{formatNumber(line.averageUnitPricePerKg)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardTable>
      </Card>
    </>
  );
}
