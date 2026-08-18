import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { AlertCircle, Plus } from 'lucide-react';
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
import { DATA_GRID_COLUMN_SIZE } from '@/components/ui/data-grid-column-sizing';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ErrorState } from '@/components/feedback/ErrorState';
import { GeneratorSelect } from '@/components/shared/GeneratorSelect';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useGenerators } from '../../api/generatorsApi';
import { useGeneratorFuelReceipts, useRecordFuelReceipt } from '../../api/generatorMaintenanceApi';
import { FuelReceiptDialog } from '../../components/FuelReceiptDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatNumber } from '@/lib/helpers';
import type { GeneratorFuelReceiptDto } from '@/api/generated/mycondoApi';
import type { FuelReceiptSchemaType } from '../../schemas/fuelReceiptSchema';

const FUEL_LOG_FILTER_DEFAULTS = { generatorId: '', page: '1', pageSize: '10' };

export function GeneratorFuelLogPage() {
  const [filters, setFilters] = useUrlFilters(FUEL_LOG_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };
  const [recordOpen, setRecordOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = functionalUpdate(updater, pagination);
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, refetch } = useGeneratorFuelReceipts({
    generatorId: filters.generatorId || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const { data: generatorsData } = useGenerators({ page: 1, pageSize: 100 });
  const generatorNameById = useMemo(
    () => Object.fromEntries((generatorsData?.items ?? []).map((g) => [g.generatorId, g.name])),
    [generatorsData],
  );

  const [recordReceipt, { isLoading: isRecording }] = useRecordFuelReceipt();

  async function handleRecord(values: FuelReceiptSchemaType) {
    setErrorMessage(null);
    try {
      await recordReceipt({
        recordFuelReceiptCommand: {
          generatorId: values.generatorId,
          receivedAtUtc: new Date(values.receivedAtUtc).toISOString(),
          quantity: values.quantity,
          cost: values.cost ?? null,
          supplier: values.supplier || null,
          remarks: values.remarks || null,
        },
      }).unwrap();
      setRecordOpen(false);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  const columns: ColumnDef<GeneratorFuelReceiptDto>[] = [
    { id: 'generator', header: 'Generator', size: DATA_GRID_COLUMN_SIZE.medium, cell: ({ row }) => generatorNameById[row.original.generatorId] ?? '—' },
    { id: 'date', header: 'Date', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => formatDate(row.original.receivedAtUtc) },
    { id: 'quantity', header: 'Quantity', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => formatNumber(row.original.quantity) },
    { id: 'cost', header: 'Cost', size: DATA_GRID_COLUMN_SIZE.compact, cell: ({ row }) => (row.original.cost != null ? <MoneyDisplay amount={row.original.cost} /> : '—') },
    { id: 'supplier', header: 'Supplier', size: DATA_GRID_COLUMN_SIZE.medium, cell: ({ row }) => row.original.supplier ?? '—' },
    {
      id: 'remarks',
      header: 'Remarks',
      size: DATA_GRID_COLUMN_SIZE.flexible,
      meta: { cellClassName: 'truncate' },
      cell: ({ row }) => {
        const remarks = row.original.remarks;
        return remarks ? <span title={remarks}>{remarks}</span> : '—';
      },
    },
  ];

  const total = data ? Number(data.total) : 0;
  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    state: { pagination },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Generator Fuel Log"
        crumbs={[{ label: 'Operations' }, { label: 'Generator' }, { label: 'Fuel Log' }]}
        primaryAction={
          <RequirePermission permission={PERMISSIONS.generator.fuelManage}>
            <Button onClick={() => setRecordOpen(true)}>
              <Plus /> Record Receipt
            </Button>
          </RequirePermission>
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
          <ErrorState description="Failed to load fuel receipts. Please try again." onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No fuel receipts yet." tableLayout={{ cellBorder: true }}>
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Fuel Receipts</CardTitle>
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

      <FuelReceiptDialog open={recordOpen} onOpenChange={setRecordOpen} isSubmitting={isRecording} onSubmit={handleRecord} />
    </>
  );
}
