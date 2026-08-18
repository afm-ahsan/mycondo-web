import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { AlertCircle, CheckCircle2, Plus, Wrench } from 'lucide-react';
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
import { DATA_GRID_COLUMN_ALIGN_CENTER, DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { RowActionsMenu } from '@/components/ui/data-grid-row-actions';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/feedback/ErrorState';
import { GeneratorSelect } from '@/components/shared/GeneratorSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate, formatDateTime } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useGenerators } from '../../api/generatorsApi';
import {
  useCompleteMaintenanceService,
  useGeneratorBreakdowns,
  useGeneratorMaintenanceSchedules,
  useGeneratorServiceRecords,
  useRecordBreakdown,
  useResolveBreakdown,
  useCreateMaintenanceSchedule,
} from '../../api/generatorMaintenanceApi';
import { useGeneratorMaintenanceDueReport } from '../../api/reportsApi';
import { MaintenanceScheduleDialog } from '../../components/MaintenanceScheduleDialog';
import { CompleteMaintenanceDialog } from '../../components/CompleteMaintenanceDialog';
import { BreakdownDialog } from '../../components/BreakdownDialog';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import type {
  GeneratorBreakdownRecordDto,
  GeneratorMaintenanceScheduleDto,
  GeneratorServiceRecordDto,
} from '@/api/generated/mycondoApi';
import type { BreakdownSchemaType, CompleteMaintenanceSchemaType, MaintenanceScheduleSchemaType } from '../../schemas/maintenanceSchema';

const MAINTENANCE_FILTER_DEFAULTS = {
  generatorId: '',
  tab: 'schedule',
  schedulePage: '1',
  schedulePageSize: '10',
  servicePage: '1',
  servicePageSize: '10',
  breakdownPage: '1',
  breakdownPageSize: '10',
};

export function GeneratorMaintenancePage() {
  const [filters, setFilters] = useUrlFilters(MAINTENANCE_FILTER_DEFAULTS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const schedulePagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.schedulePage) || 1) - 1),
    pageSize: Number(filters.schedulePageSize) || 10,
  };
  const servicePagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.servicePage) || 1) - 1),
    pageSize: Number(filters.servicePageSize) || 10,
  };
  const breakdownPagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.breakdownPage) || 1) - 1),
    pageSize: Number(filters.breakdownPageSize) || 10,
  };

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [completingScheduleId, setCompletingScheduleId] = useState<string | null>(null);
  const [breakdownDialogOpen, setBreakdownDialogOpen] = useState(false);
  const [resolvingBreakdownId, setResolvingBreakdownId] = useState<string | null>(null);

  const { data: generatorsData } = useGenerators({ page: 1, pageSize: 100 });
  const generatorNameById = useMemo(
    () => Object.fromEntries((generatorsData?.items ?? []).map((g) => [g.generatorId, g.name])),
    [generatorsData],
  );

  const { data: schedules, isFetching: schedulesFetching, isError: schedulesError, refetch: refetchSchedules } = useGeneratorMaintenanceSchedules({
    generatorId: filters.generatorId || undefined,
    page: schedulePagination.pageIndex + 1,
    pageSize: schedulePagination.pageSize,
  });
  const { data: serviceRecords, isFetching: serviceFetching, isError: serviceError, refetch: refetchService } = useGeneratorServiceRecords({
    generatorId: filters.generatorId || undefined,
    page: servicePagination.pageIndex + 1,
    pageSize: servicePagination.pageSize,
  });
  const { data: breakdowns, isFetching: breakdownsFetching, isError: breakdownsError, refetch: refetchBreakdowns } = useGeneratorBreakdowns({
    generatorId: filters.generatorId || undefined,
    page: breakdownPagination.pageIndex + 1,
    pageSize: breakdownPagination.pageSize,
  });
  // Unpaginated, bounded set (one line per active schedule) — the backend's authoritative isDue
  // flag, never recalculated client-side. Cross-referenced by generatorMaintenanceScheduleId so the
  // Schedule tab shows the same due status the Reports page already surfaces, instead of requiring
  // an operator to leave the maintenance workflow to find out what needs action.
  const { data: dueReport } = useGeneratorMaintenanceDueReport();
  const dueByScheduleId = useMemo(
    () => new Map((dueReport ?? []).map((line) => [line.generatorMaintenanceScheduleId, line.isDue])),
    [dueReport],
  );

  const [createSchedule, { isLoading: isCreatingSchedule }] = useCreateMaintenanceSchedule();
  const [completeService, { isLoading: isCompleting }] = useCompleteMaintenanceService();
  const [recordBreakdown, { isLoading: isReportingBreakdown }] = useRecordBreakdown();
  const [resolveBreakdown, { isLoading: isResolving }] = useResolveBreakdown();

  async function handleCreateSchedule(values: MaintenanceScheduleSchemaType) {
    setErrorMessage(null);
    try {
      await createSchedule({
        createMaintenanceScheduleCommand: {
          generatorId: values.generatorId,
          nextDueDate: values.nextDueDate || null,
          nextDueHourMeterReading: values.nextDueHourMeterReading ?? null,
        },
      }).unwrap();
      setScheduleDialogOpen(false);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleCompleteMaintenance(values: CompleteMaintenanceSchemaType) {
    if (!completingScheduleId) return;
    setErrorMessage(null);
    try {
      await completeService({
        id: completingScheduleId,
        completeMaintenanceServiceRequest: {
          performedAtUtc: new Date(values.performedAtUtc).toISOString(),
          description: values.description,
          cost: values.cost ?? null,
          nextDueDate: values.nextDueDate || null,
          nextDueHourMeterReading: values.nextDueHourMeterReading ?? null,
        },
      }).unwrap();
      setCompletingScheduleId(null);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleReportBreakdown(values: BreakdownSchemaType) {
    setErrorMessage(null);
    try {
      await recordBreakdown({
        recordBreakdownCommand: {
          generatorId: values.generatorId,
          reportedAtUtc: new Date(values.reportedAtUtc).toISOString(),
          description: values.description,
          downtimeStartUtc: new Date(values.downtimeStartUtc).toISOString(),
        },
      }).unwrap();
      setBreakdownDialogOpen(false);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleResolveBreakdown(resolution: string) {
    if (!resolvingBreakdownId) return;
    setErrorMessage(null);
    try {
      await resolveBreakdown({
        id: resolvingBreakdownId,
        resolveBreakdownRequest: { resolution, cost: null, downtimeEndUtc: new Date().toISOString() },
      }).unwrap();
      setResolvingBreakdownId(null);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  const scheduleColumns: ColumnDef<GeneratorMaintenanceScheduleDto>[] = [
    { id: 'generator', header: 'Generator', size: DATA_GRID_COLUMN_SIZE.medium, cell: ({ row }) => generatorNameById[row.original.generatorId] ?? '—' },
    { id: 'dueDate', header: 'Due date', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => (row.original.nextDueDate ? formatDate(row.original.nextDueDate) : '—') },
    { id: 'dueHours', header: 'Due hour meter', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => row.original.nextDueHourMeterReading ?? '—' },
    {
      id: 'due',
      header: 'Due status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => {
        const isDue = dueByScheduleId.get(row.original.generatorMaintenanceScheduleId);
        if (isDue === undefined) return '—';
        return isDue ? (
          <Badge variant="destructive" appearance="light">
            Maintenance Due
          </Badge>
        ) : (
          <Badge variant="success" appearance="light">
            Up to Date
          </Badge>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => <Badge variant={row.original.isActive ? 'primary' : 'secondary'} appearance="light">{row.original.isActive ? 'Active' : 'Inactive'}</Badge>,
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.action,
      cell: ({ row }) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${generatorNameById[row.original.generatorId] ?? 'schedule'}`}
          actions={[
            {
              key: 'complete',
              label: 'Complete',
              icon: <CheckCircle2 />,
              onClick: () => setCompletingScheduleId(row.original.generatorMaintenanceScheduleId),
              permission: PERMISSIONS.generator.maintenanceManage,
            },
          ]}
        />
      ),
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
    },
  ];

  const serviceColumns: ColumnDef<GeneratorServiceRecordDto>[] = [
    { id: 'generator', header: 'Generator', size: DATA_GRID_COLUMN_SIZE.medium, cell: ({ row }) => generatorNameById[row.original.generatorId] ?? '—' },
    { id: 'date', header: 'Date', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => formatDate(row.original.performedAtUtc) },
    {
      id: 'description',
      header: 'Description',
      size: DATA_GRID_COLUMN_SIZE.flexible,
      meta: { cellClassName: 'truncate' },
      cell: ({ row }) => {
        const description = row.original.description;
        return <span title={description}>{description}</span>;
      },
    },
    { id: 'cost', header: 'Cost', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => (row.original.cost != null ? <MoneyDisplay amount={row.original.cost} /> : '—') },
  ];

  const breakdownColumns: ColumnDef<GeneratorBreakdownRecordDto>[] = [
    { id: 'generator', header: 'Generator', size: DATA_GRID_COLUMN_SIZE.medium, cell: ({ row }) => generatorNameById[row.original.generatorId] ?? '—' },
    { id: 'reported', header: 'Reported', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => formatDateTime(row.original.reportedAtUtc) },
    {
      id: 'description',
      header: 'Description',
      size: DATA_GRID_COLUMN_SIZE.flexible,
      meta: { cellClassName: 'truncate' },
      cell: ({ row }) => {
        const description = row.original.description;
        return <span title={description}>{description}</span>;
      },
    },
    { id: 'downtimeStart', header: 'Downtime start', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => formatDateTime(row.original.downtimeStartUtc) },
    {
      id: 'downtimeEnd',
      header: 'Downtime end',
      size: DATA_GRID_COLUMN_SIZE.compact,
      cell: ({ row }) => (row.original.downtimeEndUtc ? formatDateTime(row.original.downtimeEndUtc) : '—'),
    },
    {
      id: 'resolution',
      header: 'Resolution',
      size: DATA_GRID_COLUMN_SIZE.flexible,
      meta: { cellClassName: 'truncate' },
      cell: ({ row }) => {
        const resolution = row.original.resolution;
        return resolution ? <span title={resolution}>{resolution}</span> : '—';
      },
    },
    {
      id: 'actions',
      header: 'Action',
      size: DATA_GRID_COLUMN_SIZE.action,
      cell: ({ row }) => (
        <RowActionsMenu
          ariaLabel={`Actions for ${generatorNameById[row.original.generatorId] ?? 'breakdown'}`}
          actions={[
            {
              key: 'resolve',
              label: 'Resolve',
              icon: <Wrench />,
              onClick: () => setResolvingBreakdownId(row.original.generatorBreakdownRecordId),
              permission: PERMISSIONS.generator.maintenanceManage,
              hidden: !!row.original.downtimeEndUtc,
            },
          ]}
        />
      ),
      meta: DATA_GRID_COLUMN_ALIGN_CENTER,
    },
  ];

  const scheduleTotal = schedules ? Number(schedules.total) : 0;
  const scheduleTable = useReactTable({
    columns: scheduleColumns,
    data: schedules?.items ?? [],
    pageCount: Math.max(1, Math.ceil(scheduleTotal / schedulePagination.pageSize)),
    manualPagination: true,
    state: { pagination: schedulePagination },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(schedulePagination) : updater;
      setFilters({ schedulePage: String(next.pageIndex + 1), schedulePageSize: String(next.pageSize) });
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const serviceTotal = serviceRecords ? Number(serviceRecords.total) : 0;
  const serviceTable = useReactTable({
    columns: serviceColumns,
    data: serviceRecords?.items ?? [],
    pageCount: Math.max(1, Math.ceil(serviceTotal / servicePagination.pageSize)),
    manualPagination: true,
    state: { pagination: servicePagination },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(servicePagination) : updater;
      setFilters({ servicePage: String(next.pageIndex + 1), servicePageSize: String(next.pageSize) });
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const breakdownTotal = breakdowns ? Number(breakdowns.total) : 0;
  const breakdownTable = useReactTable({
    columns: breakdownColumns,
    data: breakdowns?.items ?? [],
    pageCount: Math.max(1, Math.ceil(breakdownTotal / breakdownPagination.pageSize)),
    manualPagination: true,
    state: { pagination: breakdownPagination },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(breakdownPagination) : updater;
      setFilters({ breakdownPage: String(next.pageIndex + 1), breakdownPageSize: String(next.pageSize) });
    },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Generator Maintenance"
        crumbs={[{ label: 'Operations' }, { label: 'Generator' }, { label: 'Maintenance' }]}
      />

      {errorMessage && (
        <Alert variant="destructive" appearance="light" className="mb-2" onClose={() => setErrorMessage(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{errorMessage}</AlertTitle>
        </Alert>
      )}

      <div className="mb-4 max-w-xs">
        <GeneratorSelect
          value={filters.generatorId || undefined}
          onValueChange={(id) => setFilters({ generatorId: id })}
          placeholder="All generators"
        />
      </div>

      <Tabs value={filters.tab} onValueChange={(tab) => setFilters({ tab })}>
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">Service History</TabsTrigger>
          <TabsTrigger value="breakdowns">Breakdowns</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          {schedulesError ? (
            <Card>
              <ErrorState description="Failed to load maintenance schedules. Please try again." onRetry={refetchSchedules} />
            </Card>
          ) : (
            <DataGrid table={scheduleTable} recordCount={scheduleTotal} isLoading={schedulesFetching} emptyMessage="No maintenance schedules yet." tableLayout={{ cellBorder: true }}>
              <Card>
                <CardHeader>
                  <CardHeading>
                    <CardTitle>Maintenance Schedules</CardTitle>
                  </CardHeading>
                  <CardToolbar>
                    <RequirePermission permission={PERMISSIONS.generator.maintenanceManage}>
                      <Button onClick={() => setScheduleDialogOpen(true)}>
                        <Plus /> New Schedule
                      </Button>
                    </RequirePermission>
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

        <TabsContent value="history" className="space-y-4">
          {serviceError ? (
            <Card>
              <ErrorState description="Failed to load service history. Please try again." onRetry={refetchService} />
            </Card>
          ) : (
            <DataGrid table={serviceTable} recordCount={serviceTotal} isLoading={serviceFetching} emptyMessage="No service history yet." tableLayout={{ cellBorder: true }}>
              <Card>
                <CardHeader>
                  <CardHeading>
                    <CardTitle>Service History</CardTitle>
                  </CardHeading>
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

        <TabsContent value="breakdowns" className="space-y-4">
          {breakdownsError ? (
            <Card>
              <ErrorState description="Failed to load breakdowns. Please try again." onRetry={refetchBreakdowns} />
            </Card>
          ) : (
            <DataGrid table={breakdownTable} recordCount={breakdownTotal} isLoading={breakdownsFetching} emptyMessage="No breakdowns reported." tableLayout={{ cellBorder: true }}>
              <Card>
                <CardHeader>
                  <CardHeading>
                    <CardTitle>Breakdown Log</CardTitle>
                  </CardHeading>
                  <CardToolbar>
                    <RequirePermission permission={PERMISSIONS.generator.maintenanceManage}>
                      <Button onClick={() => setBreakdownDialogOpen(true)}>
                        <Plus /> Report Breakdown
                      </Button>
                    </RequirePermission>
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
      </Tabs>

      <MaintenanceScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        isSubmitting={isCreatingSchedule}
        onSubmit={handleCreateSchedule}
      />
      <CompleteMaintenanceDialog
        open={completingScheduleId !== null}
        onOpenChange={(open) => !open && setCompletingScheduleId(null)}
        isSubmitting={isCompleting}
        onSubmit={handleCompleteMaintenance}
      />
      <BreakdownDialog
        open={breakdownDialogOpen}
        onOpenChange={setBreakdownDialogOpen}
        isSubmitting={isReportingBreakdown}
        onSubmit={handleReportBreakdown}
      />
      <ReasonDialog
        open={resolvingBreakdownId !== null}
        onOpenChange={(open) => !open && setResolvingBreakdownId(null)}
        title="Resolve Breakdown"
        description="Describe how the breakdown was resolved."
        confirmLabel="Resolve"
        isSubmitting={isResolving}
        onConfirm={handleResolveBreakdown}
      />
    </>
  );
}
