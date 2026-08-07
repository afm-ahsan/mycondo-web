import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Settings2 } from 'lucide-react';
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
import { GeneratorSelect } from '@/components/shared/GeneratorSelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDateTime } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
import { useGenerators, useGeneratorSessions, useStartGeneratorSession, useStopGeneratorSession } from '../../api/generatorsApi';
import { StartSessionDialog } from '../../components/StartSessionDialog';
import { StopSessionDialog } from '../../components/StopSessionDialog';
import { ManageGeneratorsDialog } from '../../components/ManageGeneratorsDialog';
import { PageHeader } from '../../components/PageHeader';
import { formatNumber } from '../../lib/format';
import { generatorSessionStatusToneMap, type GeneratorSessionStatus } from '../../lib/status';
import { StatusBadge } from '@/components/ui/status-badge';
import type { GeneratorSessionDto } from '@/api/generated/mycondoApi';
import type { StartSessionSchemaType, StopSessionSchemaType } from '../../schemas/generatorSessionSchema';

/** Operation log — start/stop generator runtime sessions. "Only one open session per generator" is
 * enforced server-side (backend row-lock); a 409/422 here surfaces as a page-level alert, not silently
 * swallowed, per the "no client-owned business-state transitions" convention. */
export function GeneratorLogPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [generatorId, setGeneratorId] = useState<string | undefined>();
  const [startOpen, setStartOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [stoppingSessionId, setStoppingSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isFetching, isError } = useGeneratorSessions({
    generatorId,
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
      header: '',
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
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Generator Operation Log"
        crumbs={[{ label: 'Operations' }, { label: 'Generator' }, { label: 'Operation Log' }]}
        actions={
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

      {(isError || errorMessage) && (
        <p className="text-destructive text-sm mb-2">{errorMessage ?? 'Failed to load sessions. Please try again.'}</p>
      )}

      <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No sessions yet." tableLayout={{ cellBorder: true }}>
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Sessions</CardTitle>
            </CardHeading>
            <CardToolbar>
              <GeneratorSelect value={generatorId} onValueChange={setGeneratorId} placeholder="All generators" />
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
