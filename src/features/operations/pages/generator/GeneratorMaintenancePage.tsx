import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Plus } from 'lucide-react';
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
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GeneratorSelect } from '@/components/shared/GeneratorSelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate, formatDateTime } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
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
import { MaintenanceScheduleDialog } from '../../components/MaintenanceScheduleDialog';
import { CompleteMaintenanceDialog } from '../../components/CompleteMaintenanceDialog';
import { BreakdownDialog } from '../../components/BreakdownDialog';
import { ReasonDialog } from '../../components/ReasonDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatBdt } from '../../lib/format';
import type {
  GeneratorBreakdownRecordDto,
  GeneratorMaintenanceScheduleDto,
  GeneratorServiceRecordDto,
} from '@/api/generated/mycondoApi';
import type { BreakdownSchemaType, CompleteMaintenanceSchemaType, MaintenanceScheduleSchemaType } from '../../schemas/maintenanceSchema';

export function GeneratorMaintenancePage() {
  const [generatorId, setGeneratorId] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [schedulePagination, setSchedulePagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [servicePagination, setServicePagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [breakdownPagination, setBreakdownPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [completingScheduleId, setCompletingScheduleId] = useState<string | null>(null);
  const [breakdownDialogOpen, setBreakdownDialogOpen] = useState(false);
  const [resolvingBreakdownId, setResolvingBreakdownId] = useState<string | null>(null);

  const { data: generatorsData } = useGenerators({ page: 1, pageSize: 100 });
  const generatorNameById = useMemo(
    () => Object.fromEntries((generatorsData?.items ?? []).map((g) => [g.generatorId, g.name])),
    [generatorsData],
  );

  const { data: schedules, isFetching: schedulesFetching } = useGeneratorMaintenanceSchedules({
    generatorId,
    page: schedulePagination.pageIndex + 1,
    pageSize: schedulePagination.pageSize,
  });
  const { data: serviceRecords, isFetching: serviceFetching } = useGeneratorServiceRecords({
    generatorId,
    page: servicePagination.pageIndex + 1,
    pageSize: servicePagination.pageSize,
  });
  const { data: breakdowns, isFetching: breakdownsFetching } = useGeneratorBreakdowns({
    generatorId,
    page: breakdownPagination.pageIndex + 1,
    pageSize: breakdownPagination.pageSize,
  });

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
    { id: 'generator', header: 'Generator', cell: ({ row }) => generatorNameById[row.original.generatorId] ?? '—' },
    { id: 'dueDate', header: 'Due date', cell: ({ row }) => (row.original.nextDueDate ? formatDate(row.original.nextDueDate) : '—') },
    { id: 'dueHours', header: 'Due hour meter', cell: ({ row }) => row.original.nextDueHourMeterReading ?? '—' },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={row.original.isActive ? 'primary' : 'secondary'} appearance="light">{row.original.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RequirePermission permission={PERMISSIONS.generator.maintenanceManage}>
          <Button size="sm" variant="outline" onClick={() => setCompletingScheduleId(row.original.generatorMaintenanceScheduleId)}>
            Complete
          </Button>
        </RequirePermission>
      ),
    },
  ];

  const serviceColumns: ColumnDef<GeneratorServiceRecordDto>[] = [
    { id: 'generator', header: 'Generator', cell: ({ row }) => generatorNameById[row.original.generatorId] ?? '—' },
    { id: 'date', header: 'Date', cell: ({ row }) => formatDate(row.original.performedAtUtc) },
    { id: 'description', header: 'Description', cell: ({ row }) => row.original.description },
    { id: 'cost', header: 'Cost', cell: ({ row }) => formatBdt(row.original.cost) },
  ];

  const breakdownColumns: ColumnDef<GeneratorBreakdownRecordDto>[] = [
    { id: 'generator', header: 'Generator', cell: ({ row }) => generatorNameById[row.original.generatorId] ?? '—' },
    { id: 'reported', header: 'Reported', cell: ({ row }) => formatDateTime(row.original.reportedAtUtc) },
    { id: 'description', header: 'Description', cell: ({ row }) => row.original.description },
    { id: 'downtimeStart', header: 'Downtime start', cell: ({ row }) => formatDateTime(row.original.downtimeStartUtc) },
    { id: 'downtimeEnd', header: 'Downtime end', cell: ({ row }) => (row.original.downtimeEndUtc ? formatDateTime(row.original.downtimeEndUtc) : '—') },
    { id: 'resolution', header: 'Resolution', cell: ({ row }) => row.original.resolution ?? '—' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        !row.original.downtimeEndUtc ? (
          <RequirePermission permission={PERMISSIONS.generator.maintenanceManage}>
            <Button size="sm" variant="outline" onClick={() => setResolvingBreakdownId(row.original.generatorBreakdownRecordId)}>
              Resolve
            </Button>
          </RequirePermission>
        ) : null,
    },
  ];

  const scheduleTotal = schedules ? Number(schedules.total) : 0;
  const scheduleTable = useReactTable({
    columns: scheduleColumns,
    data: schedules?.items ?? [],
    pageCount: Math.max(1, Math.ceil(scheduleTotal / schedulePagination.pageSize)),
    manualPagination: true,
    state: { pagination: schedulePagination },
    onPaginationChange: setSchedulePagination,
    getCoreRowModel: getCoreRowModel(),
  });

  const serviceTotal = serviceRecords ? Number(serviceRecords.total) : 0;
  const serviceTable = useReactTable({
    columns: serviceColumns,
    data: serviceRecords?.items ?? [],
    pageCount: Math.max(1, Math.ceil(serviceTotal / servicePagination.pageSize)),
    manualPagination: true,
    state: { pagination: servicePagination },
    onPaginationChange: setServicePagination,
    getCoreRowModel: getCoreRowModel(),
  });

  const breakdownTotal = breakdowns ? Number(breakdowns.total) : 0;
  const breakdownTable = useReactTable({
    columns: breakdownColumns,
    data: breakdowns?.items ?? [],
    pageCount: Math.max(1, Math.ceil(breakdownTotal / breakdownPagination.pageSize)),
    manualPagination: true,
    state: { pagination: breakdownPagination },
    onPaginationChange: setBreakdownPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Generator Maintenance"
        crumbs={[{ label: 'Operations' }, { label: 'Generator' }, { label: 'Maintenance' }]}
      />

      {errorMessage && <p className="text-destructive text-sm mb-2">{errorMessage}</p>}

      <div className="mb-4 max-w-xs">
        <GeneratorSelect value={generatorId} onValueChange={setGeneratorId} placeholder="All generators" />
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">Service History</TabsTrigger>
          <TabsTrigger value="breakdowns">Breakdowns</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
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
                <DataGridTable />
              </CardTable>
              <CardFooter>
                <DataGridPagination />
              </CardFooter>
            </Card>
          </DataGrid>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <DataGrid table={serviceTable} recordCount={serviceTotal} isLoading={serviceFetching} emptyMessage="No service history yet." tableLayout={{ cellBorder: true }}>
            <Card>
              <CardHeader>
                <CardHeading>
                  <CardTitle>Service History</CardTitle>
                </CardHeading>
              </CardHeader>
              <CardTable>
                <DataGridTable />
              </CardTable>
              <CardFooter>
                <DataGridPagination />
              </CardFooter>
            </Card>
          </DataGrid>
        </TabsContent>

        <TabsContent value="breakdowns" className="space-y-4">
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
                <DataGridTable />
              </CardTable>
              <CardFooter>
                <DataGridPagination />
              </CardFooter>
            </Card>
          </DataGrid>
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
