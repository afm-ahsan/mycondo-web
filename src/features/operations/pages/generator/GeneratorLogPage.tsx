import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { AlertCircle, Plus, Settings2 } from 'lucide-react';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ErrorState } from '@/components/feedback/ErrorState';
import { GeneratorSelect } from '@/components/shared/GeneratorSelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDateTime } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useGenerators, useGeneratorSessions, useStartGeneratorSession, useStopGeneratorSession } from '../../api/generatorsApi';
import { StartSessionDialog } from '../../components/StartSessionDialog';
import { StopSessionDialog } from '../../components/StopSessionDialog';
import { ManageGeneratorsDialog } from '../../components/ManageGeneratorsDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatNumber } from '@/lib/helpers';
import { generatorSessionStatusToneMap, type GeneratorSessionStatus } from '../../lib/status';
import { StatusBadge } from '@/components/ui/status-badge';
import type { GeneratorSessionDto } from '@/api/generated/mycondoApi';
import type { StartSessionSchemaType, StopSessionSchemaType } from '../../schemas/generatorSessionSchema';

const LOG_FILTER_DEFAULTS = { generatorId: '', page: '1', pageSize: '10' };

/** Operation log — start/stop generator runtime sessions. "Only one open session per generator" is
 * enforced server-side (backend row-lock); a 409/422 here surfaces as a page-level alert, not silently
 * swallowed, per the "no client-owned business-state transitions" convention. */
export function GeneratorLogPage() {
  const [filters, setFilters] = useUrlFilters(LOG_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };
  const [startOpen, setStartOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [stoppingSessionId, setStoppingSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = functionalUpdate(updater, pagination);
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, refetch } = useGeneratorSessions({
    generatorId: filters.generatorId || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const { data: generatorsData } = useGenerators({ page: 1, pageSize: 100 });
  const generatorNameById = useMemo(
    () => Object.fromEntries((generatorsData?.items ?? []).map((g) => [g.generatorId, g.name])),
    [generatorsData],
  );

  const [startSession, { isLoading: isStarting }] = useStartGeneratorSession();
  const [stopSession, { isLoading: isStopping }] = useStopGeneratorSession();

  async function handleStart(values: StartSessionSchemaType) {
    setErrorMessage(null);
    try {
      await startSession({
        startGeneratorSessionCommand: {
          generatorId: values.generatorId,
          openingFuelLevel: values.openingFuelLevel,
        },
      }).unwrap();
      setStartOpen(false);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleStop(values: StopSessionSchemaType) {
    if (!stoppingSessionId) return;
    setErrorMessage(null);
    try {
      await stopSession({
        id: stoppingSessionId,
        stopGeneratorSessionRequest: {
          closingFuelLevel: values.closingFuelLevel,
          outageReason: values.outageReason || null,
          hourMeterReading: values.hourMeterReading ?? null,
        },
      }).unwrap();
      setStoppingSessionId(null);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  const columns: ColumnDef<GeneratorSessionDto>[] = [
    { id: 'generator', header: 'Generator', cell: ({ row }) => generatorNameById[row.original.generatorId] ?? '—' },
    { id: 'start', header: ({ column }) => <DataGridColumnHeader title="Start" column={column} />, cell: ({ row }) => formatDateTime(row.original.startAtUtc) },
    { id: 'stop', header: 'Stop', cell: ({ row }) => (row.original.stopAtUtc ? formatDateTime(row.original.stopAtUtc) : '—') },
    { id: 'runtime', header: 'Runtime (min)', cell: ({ row }) => row.original.runtimeMinutes ?? '—' },
    { id: 'openingFuel', header: 'Opening fuel', cell: ({ row }) => formatNumber(row.original.openingFuelLevel) },
    { id: 'closingFuel', header: 'Closing fuel', cell: ({ row }) => (row.original.closingFuelLevel != null ? formatNumber(row.original.closingFuelLevel) : '—') },
    { id: 'fuelConsumed', header: 'Fuel consumed', cell: ({ row }) => (row.original.fuelConsumed != null ? formatNumber(row.original.fuelConsumed) : '—') },
    { id: 'outageReason', header: 'Outage reason', cell: ({ row }) => row.original.outageReason ?? '—' },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status as GeneratorSessionStatus} toneMap={generatorSessionStatusToneMap} />,
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) =>
        row.original.status === 'Open' ? (
          <RequirePermission permission={PERMISSIONS.generator.operationManage}>
            <Button size="sm" variant="outline" onClick={() => setStoppingSessionId(row.original.generatorSessionId)}>
              Stop
            </Button>
          </RequirePermission>
        ) : null,
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
    <>
      <PageHeader
        title="Generator Operation Log"
        crumbs={[{ label: 'Operations' }, { label: 'Generator' }, { label: 'Operation Log' }]}
        primaryAction={
          <>
            <RequirePermission permission={PERMISSIONS.generator.view}>
              <Button variant="outline" onClick={() => setManageOpen(true)}>
                <Settings2 /> Manage Generators
              </Button>
            </RequirePermission>
            <RequirePermission permission={PERMISSIONS.generator.operationManage}>
              <Button onClick={() => setStartOpen(true)}>
                <Plus /> Start Session
              </Button>
            </RequirePermission>
          </>
        }
      />

      {errorMessage && (
        <Alert variant="destructive" appearance="light" className="mb-2" onClose={() => setErrorMessage(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{errorMessage}</AlertTitle>
        </Alert>
      )}

      {isError ? (
        <Card>
          <ErrorState description="Failed to load sessions. Please try again." onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No sessions yet." tableLayout={{ cellBorder: true }}>
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Sessions</CardTitle>
              </CardHeading>
              <CardToolbar>
                <GeneratorSelect
                  value={filters.generatorId || undefined}
                  onValueChange={(id) => setFilters({ generatorId: id, page: '1' })}
                  placeholder="All generators"
                />
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

      <ManageGeneratorsDialog open={manageOpen} onOpenChange={setManageOpen} />
      <StartSessionDialog open={startOpen} onOpenChange={setStartOpen} isSubmitting={isStarting} onSubmit={handleStart} />
      <StopSessionDialog
        open={stoppingSessionId !== null}
        onOpenChange={(open) => !open && setStoppingSessionId(null)}
        isSubmitting={isStopping}
        onSubmit={handleStop}
      />
    </>
  );
}
