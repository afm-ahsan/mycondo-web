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
import { GeneratorSelect } from '@/components/shared/GeneratorSelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
import { useGenerators } from '../../api/generatorsApi';
import { useGeneratorFuelReceipts, useRecordFuelReceipt } from '../../api/generatorMaintenanceApi';
import { FuelReceiptDialog } from '../../components/FuelReceiptDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatBdt, formatNumber } from '@/lib/helpers';
import type { GeneratorFuelReceiptDto } from '@/api/generated/mycondoApi';
import type { FuelReceiptSchemaType } from '../../schemas/fuelReceiptSchema';

export function GeneratorFuelLogPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [generatorId, setGeneratorId] = useState<string | undefined>();
  const [recordOpen, setRecordOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isFetching, isError } = useGeneratorFuelReceipts({
    generatorId,
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
    { id: 'generator', header: 'Generator', cell: ({ row }) => generatorNameById[row.original.generatorId] ?? '—' },
    { id: 'date', header: 'Date', cell: ({ row }) => formatDate(row.original.receivedAtUtc) },
    { id: 'quantity', header: 'Quantity', cell: ({ row }) => formatNumber(row.original.quantity) },
    { id: 'cost', header: 'Cost', cell: ({ row }) => formatBdt(row.original.cost) },
    { id: 'supplier', header: 'Supplier', cell: ({ row }) => row.original.supplier ?? '—' },
    { id: 'remarks', header: 'Remarks', cell: ({ row }) => row.original.remarks ?? '—' },
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

      {(isError || errorMessage) && (
        <p className="text-destructive text-sm mb-2">{errorMessage ?? 'Failed to load fuel receipts. Please try again.'}</p>
      )}

      <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No fuel receipts yet." tableLayout={{ cellBorder: true }}>
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Fuel Receipts</CardTitle>
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

      <FuelReceiptDialog open={recordOpen} onOpenChange={setRecordOpen} isSubmitting={isRecording} onSubmit={handleRecord} />
    </>
  );
}
