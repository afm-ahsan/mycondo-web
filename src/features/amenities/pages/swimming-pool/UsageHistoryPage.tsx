import { useState } from 'react';
import {
  type ColumnDef,
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { toUserMessage } from '@/api/errors';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { FacilitySelect } from '@/components/shared/FacilitySelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { applyApiErrorToForm, toApiError } from '@/lib/forms/applyApiErrorToForm';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { usePoolIncidents, usePoolSessions, useReportPoolIncident } from '../../api/poolApi';
import { PageHeader } from '@/components/shared/PageHeader';
import { PoolSessionStatusBadge } from '../../components/PoolSessionStatusBadge';
import { formatDuration, formatTimeOfDay } from '../../lib/format';
import { type PoolSessionStatus } from '../../lib/bookingStatus';
import { poolIncidentSchema, type PoolIncidentSchemaType } from '../../schemas/poolIncidentSchema';
import { formatDate } from '@/lib/helpers';
import type { PoolSessionDto } from '@/api/generated/mycondoApi';

const ALL = '__all__';
const USAGE_FILTER_DEFAULTS = {
  tab: 'history',
  facilityId: '',
  openOnly: ALL,
  page: '1',
  pageSize: '10',
  incidentPage: '1',
};

export function UsageHistoryPage() {
  const [filters, setFilters] = useUrlFilters(USAGE_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = functionalUpdate(updater, pagination);
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, refetch } = usePoolSessions({
    facilityId: filters.facilityId || undefined,
    openOnly: filters.openOnly === ALL ? undefined : filters.openOnly === 'true',
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const columns: ColumnDef<PoolSessionDto>[] = [
    {
      id: 'date',
      header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
      cell: ({ row }) => formatDate(row.original.entryAtUtc),
    },
    { id: 'personType', header: 'Resident/Guest', cell: ({ row }) => row.original.personType },
    {
      id: 'flat',
      header: 'Building/Flat',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.flatId.slice(0, 8)}</span>,
    },
    { id: 'entry', header: 'Entry', cell: ({ row }) => formatTimeOfDay(row.original.entryAtUtc) },
    { id: 'exit', header: 'Exit', cell: ({ row }) => formatTimeOfDay(row.original.exitAtUtc) },
    {
      id: 'duration',
      header: 'Duration',
      cell: ({ row }) => formatDuration(row.original.entryAtUtc, row.original.exitAtUtc),
    },
    { id: 'fee', header: 'Fee', cell: ({ row }) => (row.original.guestFeeAmount != null ? <MoneyDisplay amount={row.original.guestFeeAmount} /> : '—') },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <PoolSessionStatusBadge status={row.original.status as PoolSessionStatus} />,
    },
    {
      id: 'operator',
      header: 'Operator',
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {(row.original.checkedOutBy ?? row.original.checkedInBy)?.slice(0, 8) ?? '—'}
        </span>
      ),
    },
  ];

  const total = data ? Number(data.total) : 0;
  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    // The API has no sort parameter on this query — DataGridColumnHeader would otherwise show a
    // clickable sort arrow that updates but never actually reorders rows (no getSortedRowModel).
    enableSorting: false,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Usage History" crumbs={[{ label: 'Facilities' }, { label: 'Swimming Pool' }, { label: 'Usage History' }]} />

      <Tabs value={filters.tab} onValueChange={(tab) => setFilters({ tab })}>
        <TabsList>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <p className="text-muted-foreground text-xs">
            &quot;Building/Flat&quot; and &quot;Operator&quot; show raw ids — mycondo-api has no
            flat-by-id or user-directory lookup endpoint in scope for this slice, so names can&apos;t
            be resolved without knowing the building in advance.
          </p>
          {isError ? (
            <Card>
              <ErrorState description="Failed to load usage history. Please try again." onRetry={refetch} />
            </Card>
          ) : (
            <DataGrid
              table={table}
              recordCount={total}
              isLoading={isFetching}
              emptyMessage="No pool sessions yet."
              tableLayout={{ cellBorder: true }}
            >
              <Card>
                <CardHeader>
                  <CardHeading>
                    <CardTitle>Usage history</CardTitle>
                  </CardHeading>
                  <CardToolbar className="flex flex-wrap gap-2">
                    <FacilitySelect
                      facilityType="SwimmingPool"
                      value={filters.facilityId || undefined}
                      onValueChange={(id) => setFilters({ facilityId: id, page: '1' })}
                      placeholder="All pools"
                    />
                    <Select value={filters.openOnly} onValueChange={(v) => setFilters({ openOnly: v, page: '1' })}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All (in and out)</SelectItem>
                        <SelectItem value="true">Currently inside</SelectItem>
                        <SelectItem value="false">Checked out</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardToolbar>
                </CardHeader>
                <CardTable>
                  <ScrollArea>
                    <DataGridTable />
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardTable>
                <CardFooter>
                  <DataGridPagination />
                </CardFooter>
              </Card>
            </DataGrid>
          )}
        </TabsContent>

        <TabsContent value="incidents">
          <IncidentsTab
            facilityId={filters.facilityId || undefined}
            page={Number(filters.incidentPage) || 1}
            onPageChange={(page) => setFilters({ incidentPage: String(page) })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const INCIDENTS_PAGE_SIZE = 10;

function IncidentsTab({
  facilityId,
  page,
  onPageChange,
}: {
  facilityId: string | undefined;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data, isFetching, isError, refetch } = usePoolIncidents({ facilityId, page, pageSize: INCIDENTS_PAGE_SIZE });
  const [reportIncident, { isLoading }] = useReportPoolIncident();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PoolIncidentSchemaType>({
    resolver: zodResolver(poolIncidentSchema),
    defaultValues: {
      facilityId: facilityId ?? '',
      poolSessionId: '',
      occurredAtUtc: new Date().toISOString().slice(0, 16),
      description: '',
      severity: 'Minor',
      actionTaken: '',
    },
  });

  async function onSubmit(values: PoolIncidentSchemaType) {
    setError(null);
    try {
      await reportIncident({
        reportPoolIncidentCommand: {
          facilityId: values.facilityId,
          poolSessionId: values.poolSessionId || null,
          occurredAtUtc: new Date(values.occurredAtUtc).toISOString(),
          description: values.description,
          severity: values.severity,
          actionTaken: values.actionTaken || null,
        },
      }).unwrap();
      toast.success('Incident reported.');
      setOpen(false);
      form.reset();
      refetch();
    } catch (err) {
      const apiError = toApiError(err);
      const handled = applyApiErrorToForm(form, apiError);
      if (!handled) setError(toUserMessage(apiError ?? err));
    }
  }

  const total = data ? Number(data.total) : 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * INCIDENTS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * INCIDENTS_PAGE_SIZE, total);

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Incidents</CardTitle>
        </CardHeading>
        <CardToolbar>
          <RequirePermission permission={PERMISSIONS.pool.incidentManage}>
            <Button onClick={() => setOpen(true)}>
              <Plus /> Report Incident
            </Button>
          </RequirePermission>
        </CardToolbar>
      </CardHeader>
      <CardTable>
        {isError ? (
          <ErrorState description="Failed to load incidents. Please try again." onRetry={refetch} />
        ) : isFetching ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No incidents reported" description="Incidents reported by pool operators will appear here." />
        ) : (
          <ul className="divide-y">
            {data.items.map((incident) => (
              <li key={incident.poolIncidentId} className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{incident.severity}</span>
                  <span className="text-muted-foreground text-xs">{formatDate(incident.occurredAtUtc)}</span>
                </div>
                <p className="text-sm">{incident.description}</p>
                {incident.actionTaken && (
                  <p className="text-muted-foreground text-xs">Action: {incident.actionTaken}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardTable>
      {!isError && total > 0 && (
        <CardFooter className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            Showing {rangeStart}–{rangeEnd} of {total}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft /> Previous
            </Button>
            <Button size="sm" variant="outline" disabled={rangeEnd >= total} onClick={() => onPageChange(page + 1)}>
              Next <ChevronRight />
            </Button>
          </div>
        </CardFooter>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report incident</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive" appearance="light" onClose={() => setError(null)}>
              <AlertIcon>
                <AlertTriangle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="facilityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pool</FormLabel>
                    <FormControl>
                      <FacilitySelect facilityType="SwimmingPool" value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="occurredAtUtc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occurred at</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Minor">Minor</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actionTaken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action taken (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Reporting…' : 'Report'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
