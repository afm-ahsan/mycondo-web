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
import { ErrorState } from '@/components/feedback/ErrorState';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useCylinderConsumptionReport } from '../../api/reportsApi';
import { PageHeader } from '@/components/shared/PageHeader';

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const CONSUMPTION_FILTER_DEFAULTS = { cylinderType: '', fromDate: firstDayOfMonth(), toDate: today() };

export function CylinderConsumptionPage() {
  const [filters, setFilters] = useUrlFilters(CONSUMPTION_FILTER_DEFAULTS);

  const { data, isFetching, isError, refetch } = useCylinderConsumptionReport({
    cylinderType: filters.cylinderType || undefined,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
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
            <Input
              placeholder="e.g. LPG-12kg"
              value={filters.cylinderType}
              onChange={(e) => setFilters({ cylinderType: e.target.value })}
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

      {isError ? (
        <Card>
          <ErrorState description="Failed to load the consumption report. Please try again." onRetry={refetch} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Consumption by Cylinder Type</CardTitle>
            </CardHeading>
            <CardToolbar>{isFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
          </CardHeader>
          <CardTable>
            <ScrollArea>
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
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
        </Card>
      )}
    </>
  );
}
