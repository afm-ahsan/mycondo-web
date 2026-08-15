import { useMemo } from 'react';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/EmptyState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { Gauge, Wrench } from 'lucide-react';
import { GeneratorSelect } from '@/components/shared/GeneratorSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { formatDate, formatNumber } from '@/lib/helpers';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useGeneratorMaintenanceDueReport, useGeneratorOperationalReport } from '../../api/reportsApi';
import { PageHeader } from '@/components/shared/PageHeader';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const REPORT_FILTER_DEFAULTS = { generatorId: '', fromDate: firstDayOfMonth(), toDate: today() };

export function GeneratorReportsPage() {
  const [filters, setFilters] = useUrlFilters(REPORT_FILTER_DEFAULTS);

  const { data: operational, isFetching: operationalFetching } = useGeneratorOperationalReport({
    generatorId: filters.generatorId || undefined,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
  const { data: maintenanceDue, isFetching: maintenanceDueFetching } = useGeneratorMaintenanceDueReport();

  const filteredMaintenanceDue = useMemo(
    () =>
      filters.generatorId
        ? (maintenanceDue ?? []).filter((line) => line.generatorId === filters.generatorId)
        : (maintenanceDue ?? []),
    [maintenanceDue, filters.generatorId],
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
            <GeneratorSelect
              value={filters.generatorId || undefined}
              onValueChange={(id) => setFilters({ generatorId: id })}
              placeholder="All generators"
            />
          </div>
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

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Runtime, Fuel Usage &amp; Cost per Hour</CardTitle>
          </CardHeading>
          <CardToolbar>{operationalFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
        </CardHeader>
        <CardTable>
          <ScrollArea>
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
                {operationalFetching && !operational ? (
                  <TableSkeleton columns={7} />
                ) : (operational ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0 text-center">
                      <EmptyState
                        icon={<Gauge className="size-8" aria-hidden="true" />}
                        title="No activity found"
                        description="No generator activity was recorded in the selected period."
                      />
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
                      <TableCell><MoneyDisplay amount={line.totalFuelCost} /></TableCell>
                      <TableCell>{line.costPerHour != null ? <MoneyDisplay amount={line.costPerHour} /> : '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
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
          <ScrollArea>
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
                {maintenanceDueFetching && !maintenanceDue ? (
                  <TableSkeleton columns={5} />
                ) : filteredMaintenanceDue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0 text-center">
                      <EmptyState
                        icon={<Wrench className="size-8" aria-hidden="true" />}
                        title="No maintenance due"
                        description="No generators currently have a scheduled maintenance due."
                      />
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
      </Card>
    </>
  );
}
