import { useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Scale } from 'lucide-react';
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
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate, formatDateTime } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
import {
  useCreateMonthlyReconciliation,
  useCurrentStock,
  useMonthlyReconciliations,
  useRecordStockAdjustment,
  useRecordStockMovement,
  useStockMovements,
} from '../../api/cylinderStockApi';
import { StockMovementDialog } from '../../components/StockMovementDialog';
import { StockAdjustmentDialog } from '../../components/StockAdjustmentDialog';
import { ReconciliationDialog } from '../../components/ReconciliationDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { cylinderStockMovementTypeToneMap, type CylinderStockMovementType } from '../../lib/status';
import type { CylinderStockMovementDto } from '@/api/generated/mycondoApi';
import type { StockAdjustmentSchemaType, StockMovementSchemaType } from '../../schemas/stockSchema';
import type { ReconciliationSchemaType } from '../../schemas/stockSchema';

export function CylinderStockPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [reconciliationDialogOpen, setReconciliationDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: currentStock, isFetching: stockFetching } = useCurrentStock({});
  const { data: movements, isFetching: movementsFetching, isError } = useStockMovements({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const { data: reconciliations, isFetching: reconciliationsFetching } = useMonthlyReconciliations({ page: 1, pageSize: 20 });

  const [recordMovement, { isLoading: isRecordingMovement }] = useRecordStockMovement();
  const [recordAdjustment, { isLoading: isRecordingAdjustment }] = useRecordStockAdjustment();
  const [createReconciliation, { isLoading: isCreatingReconciliation }] = useCreateMonthlyReconciliation();

  async function handleRecordMovement(values: StockMovementSchemaType) {
    setErrorMessage(null);
    try {
      await recordMovement({
        recordStockMovementCommand: {
          cylinderType: values.cylinderType,
          movementKind: values.movementKind,
          quantity: values.quantity,
          occurredAtUtc: new Date(values.occurredAtUtc).toISOString(),
          cylinderPurchaseId: null,
        },
      }).unwrap();
      setMovementDialogOpen(false);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleRecordAdjustment(values: StockAdjustmentSchemaType) {
    setErrorMessage(null);
    try {
      await recordAdjustment({
        recordStockAdjustmentCommand: {
          cylinderType: values.cylinderType,
          signedQuantity: values.signedQuantity,
          reason: values.reason,
          occurredAtUtc: new Date(values.occurredAtUtc).toISOString(),
        },
      }).unwrap();
      setAdjustmentDialogOpen(false);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleCreateReconciliation(values: ReconciliationSchemaType) {
    setErrorMessage(null);
    try {
      await createReconciliation({
        createMonthlyReconciliationCommand: {
          cylinderType: values.cylinderType,
          periodMonth: `${values.periodMonth}-01`,
          remarks: values.remarks || null,
        },
      }).unwrap();
      setReconciliationDialogOpen(false);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  const columns: ColumnDef<CylinderStockMovementDto>[] = [
    { id: 'date', header: 'Date', cell: ({ row }) => formatDateTime(row.original.occurredAtUtc) },
    { id: 'cylinderType', header: 'Cylinder type', cell: ({ row }) => row.original.cylinderType },
    {
      id: 'movementType',
      header: 'Type',
      cell: ({ row }) => <StatusBadge status={row.original.movementType as CylinderStockMovementType} toneMap={cylinderStockMovementTypeToneMap} />,
    },
    { id: 'quantity', header: 'Quantity', cell: ({ row }) => row.original.quantity },
    { id: 'reason', header: 'Reason', cell: ({ row }) => row.original.reason ?? '—' },
  ];

  const total = movements ? Number(movements.total) : 0;
  const table = useReactTable({
    columns,
    data: movements?.items ?? [],
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    manualPagination: true,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Gas Cylinder Stock"
        crumbs={[{ label: 'Operations' }, { label: 'Gas Cylinders' }, { label: 'Stock' }]}
        primaryAction={
          <RequirePermission permission={PERMISSIONS.gasCylinder.stockManage}>
            <Button variant="outline" onClick={() => setReconciliationDialogOpen(true)}>
              <Scale /> Reconcile
            </Button>
            <RequirePermission permission={PERMISSIONS.gasCylinder.approve}>
              <Button variant="outline" onClick={() => setAdjustmentDialogOpen(true)}>
                Adjust
              </Button>
            </RequirePermission>
            <Button onClick={() => setMovementDialogOpen(true)}>
              <Plus /> Record Movement
            </Button>
          </RequirePermission>
        }
      />

      {(isError || errorMessage) && (
        <p className="text-destructive text-sm mb-2">{errorMessage ?? 'Failed to load stock movements. Please try again.'}</p>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardHeading>
            <CardTitle>Current Stock</CardTitle>
          </CardHeading>
          <CardToolbar>{stockFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
        </CardHeader>
        <CardTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cylinder type</TableHead>
                <TableHead>Current stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(currentStock ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground text-center">
                    No stock recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                (currentStock ?? []).map((line) => (
                  <TableRow key={line.cylinderType}>
                    <TableCell>{line.cylinderType}</TableCell>
                    <TableCell>{line.currentStock}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardTable>
      </Card>

      <DataGrid table={table} recordCount={total} isLoading={movementsFetching} emptyMessage="No stock movements yet." tableLayout={{ cellBorder: true }}>
        <Card className="mb-4">
          <CardHeader>
            <CardHeading>
              <CardTitle>Stock Movements</CardTitle>
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

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Monthly Reconciliations</CardTitle>
          </CardHeading>
          <CardToolbar>{reconciliationsFetching && <span className="text-muted-foreground text-sm">Loading…</span>}</CardToolbar>
        </CardHeader>
        <CardTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Cylinder type</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Empty returned</TableHead>
                <TableHead>Closing</TableHead>
                <TableHead>Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(reconciliations?.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground text-center">
                    No reconciliations yet.
                  </TableCell>
                </TableRow>
              ) : (
                (reconciliations?.items ?? []).map((line) => (
                  <TableRow key={line.monthlyCylinderReconciliationId}>
                    <TableCell>{formatDate(line.periodMonth)}</TableCell>
                    <TableCell>{line.cylinderType}</TableCell>
                    <TableCell>{line.openingStock}</TableCell>
                    <TableCell>{line.totalReceived}</TableCell>
                    <TableCell>{line.totalIssued}</TableCell>
                    <TableCell>{line.totalEmptyReturned}</TableCell>
                    <TableCell>{line.closingStock}</TableCell>
                    <TableCell>{line.varianceQuantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardTable>
      </Card>

      <StockMovementDialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen} isSubmitting={isRecordingMovement} onSubmit={handleRecordMovement} />
      <StockAdjustmentDialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen} isSubmitting={isRecordingAdjustment} onSubmit={handleRecordAdjustment} />
      <ReconciliationDialog open={reconciliationDialogOpen} onOpenChange={setReconciliationDialogOpen} isSubmitting={isCreatingReconciliation} onSubmit={handleCreateReconciliation} />
    </>
  );
}
