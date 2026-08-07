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
import { useCylinderConsumptionReport } from '../../api/reportsApi';
import { PageHeader } from '@/components/shared/PageHeader';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CylinderConsumptionPage() {
  const [cylinderType, setCylinderType] = useState('');
  const [fromDate, setFromDate] = useState(firstDayOfMonth());
  const [toDate, setToDate] = useState(today());

  const { data, isFetching, isError } = useCylinderConsumptionReport({
    cylinderType: cylinderType || undefined,
    fromDate,
    toDate,
  });

  return (
    <>
      <PageHeader title="Gas Cylinder Consumption" crumbs={[{ label: 'Operations' }, { label: 'Gas Cylinders' }, { label: 'Consumption' }]} />

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
          <div className="space-y-1">
            <Label>Cylinder type (optional)</Label>
            <Input placeholder="e.g. LPG-12kg" value={cylinderType} onChange={(e) => setCylinderType(e.target.value)} />
          </div>
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

      {isError && <p className="text-destructive text-sm mb-2">Failed to load the consumption report. Please try again.</p>}

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Consumption by Cylinder Type</CardTitle>
          </CardHeading>
          <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
        </CardHeader>
        <CardTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cylinder type</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Empty returned</TableHead>
                <TableHead>Net change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No activity in this period.
                  </TableCell>
                </TableRow>
              ) : (
                (data ?? []).map((line) => (
                  <TableRow key={line.cylinderType}>
                    <TableCell>{line.cylinderType}</TableCell>
                    <TableCell>{line.totalReceived}</TableCell>
                    <TableCell>{line.totalIssued}</TableCell>
                    <TableCell>{line.totalEmptyReturned}</TableCell>
                    <TableCell>{line.netChange}</TableCell>
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
