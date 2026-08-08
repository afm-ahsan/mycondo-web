import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { GeneratorSelect } from '@/components/shared/GeneratorSelect';
import { formatDate } from '@/lib/helpers';
import { useGeneratorMaintenanceDueReport, useGeneratorOperationalReport } from '../../api/reportsApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatBdt, formatNumber } from '@/lib/helpers';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function GeneratorReportsPage() {
  const [generatorId, setGeneratorId] = useState<string | undefined>();
  const [fromDate, setFromDate] = useState(firstDayOfMonth());
  const [toDate, setToDate] = useState(today());

  const { data: operational, isFetching: operationalFetching } = useGeneratorOperationalReport({
    generatorId,
    fromDate,
    toDate,
  });
  const { data: maintenanceDue, isFetching: maintenanceDueFetching } = useGeneratorMaintenanceDueReport();

  const filteredMaintenanceDue = useMemo(
    () => (generatorId ? (maintenanceDue ?? []).filter((line) => line.generatorId === generatorId) : maintenanceDue ?? []),
    [maintenanceDue, generatorId],
  );

  return (
    <>
      <PageHeader title="Generator Reports" crumbs={[{ label: 'Operations' }, { label: 'Generator' }, { label: 'Reports' }]} />

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Filters</CardTitle>
          </CardHeading>
        </CardHeader>
        <div className="flex flex-wrap gap-4 p-4">
          <div className="space-y-1">
            <Label>Generator</Label>
            <GeneratorSelect value={generatorId} onValueChange={setGeneratorId} placeholder="All generators" />
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

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Runtime, Fuel Usage &amp; Cost per Hour</CardTitle>
          </CardHeading>
          <CardToolbar>{operationalFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
        </CardHeader>
        <CardTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Generator</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Runtime (min)</TableHead>
                <TableHead>Fuel consumed</TableHead>
                <TableHead>Fuel received</TableHead>
                <TableHead>Fuel cost</TableHead>
                <TableHead>Cost/hour</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(operational ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No activity in this period.
                  </TableCell>
                </TableRow>
              ) : (
                (operational ?? []).map((line) => (
                  <TableRow key={line.generatorId}>
                    <TableCell>{line.generatorName}</TableCell>
                    <TableCell>{line.sessionCount}</TableCell>
                    <TableCell>{line.totalRuntimeMinutes}</TableCell>
                    <TableCell>{formatNumber(line.totalFuelConsumed)}</TableCell>
                    <TableCell>{formatNumber(line.totalFuelReceived)}</TableCell>
                    <TableCell>{formatBdt(line.totalFuelCost)}</TableCell>
                    <TableCell>{line.costPerHour != null ? formatBdt(line.costPerHour) : '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardTable>
      </Card>

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Maintenance Due</CardTitle>
          </CardHeading>
          <CardToolbar>{maintenanceDueFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
        </CardHeader>
        <CardTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Generator</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Due hour meter</TableHead>
                <TableHead>Current hour meter</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaintenanceDue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No active maintenance schedules.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaintenanceDue.map((line) => (
                  <TableRow key={line.generatorMaintenanceScheduleId}>
                    <TableCell>{line.generatorName}</TableCell>
                    <TableCell>{line.nextDueDate ? formatDate(line.nextDueDate) : '—'}</TableCell>
                    <TableCell>{line.nextDueHourMeterReading ?? '—'}</TableCell>
                    <TableCell>{formatNumber(line.currentHourMeterReading)}</TableCell>
                    <TableCell>
                      <Badge variant={line.isDue ? 'destructive' : 'success'} appearance="light">
                        {line.isDue ? 'Due' : 'OK'}
                      </Badge>
                    </TableCell>
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
