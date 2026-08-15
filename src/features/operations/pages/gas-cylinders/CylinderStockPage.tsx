import { useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { AlertCircle, Plus, Scale } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate, formatDateTime } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
import { useUrlFilters } from '@/hooks/use-url-filters';
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
import type { CylinderStockMovementDto, MonthlyCylinderReconciliationDto } from '@/api/generated/mycondoApi';
import type { StockAdjustmentSchemaType, StockMovementSchemaType } from '../../schemas/stockSchema';
import type { ReconciliationSchemaType } from '../../schemas/stockSchema';

const STOCK_FILTER_DEFAULTS = { movementPage: '1', movementPageSize: '10', reconciliationPage: '1', reconciliationPageSize: '10' };

export function CylinderStockPage() {
  const [filters, setFilters] = useUrlFilters(STOCK_FILTER_DEFAULTS);
  const movementPagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.movementPage) || 1) - 1),
    pageSize: Number(filters.movementPageSize) || 10,
  };
  const reconciliationPagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.reconciliationPage) || 1) - 1),
    pageSize: Number(filters.reconciliationPageSize) || 10,
  };
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [reconciliationDialogOpen, setReconciliationDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: currentStock, isFetching: stockFetching } = useCurrentStock({});
  const { data: movements, isFetching: movementsFetching, isError, refetch } = useStockMovements({
    page: movementPagination.pageIndex + 1,
    pageSize: movementPagination.pageSize,
  });
  const {
    data: reconciliations,
    isFetching: reconciliationsFetching,
    isError: reconciliationsError,
    refetch: refetchReconciliations,
  } = useMonthlyReconciliations({
    page: reconciliationPagination.pageIndex + 1,
    pageSize: reconciliationPagination.pageSize,
  });

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
    pageCount: Math.max(1, Math.ceil(total / movementPagination.pageSize)),
    manualPagination: true,
    state: { pagination: movementPagination },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(movementPagination) : updater;
      setFilters({ movementPage: String(next.pageIndex + 1), movementPageSize: String(next.pageSize) });
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const reconciliationColumns: ColumnDef<MonthlyCylinderReconciliationDto>[] = [
    { id: 'period', header: 'Period', cell: ({ row }) => formatDate(row.original.periodMonth) },
    { id: 'cylinderType', header: 'Cylinder type', cell: ({ row }) => row.original.cylinderType },
    { id: 'opening', header: 'Opening', cell: ({ row }) => row.original.openingStock },
    { id: 'received', header: 'Received', cell: ({ row }) => row.original.totalReceived },
    { id: 'issued', header: 'Issued', cell: ({ row }) => row.original.totalIssued },
    { id: 'emptyReturned', header: 'Empty returned', cell: ({ row }) => row.original.totalEmptyReturned },
    { id: 'closing', header: 'Closing', cell: ({ row }) => row.original.closingStock },
    {
      id: 'variance',
      header: 'Variance',
      cell: ({ row }) => {
        const variance = Number(row.original.varianceQuantity);
        const isMatched = variance === 0;
        return (
          <div className="flex items-center gap-2">
            <span className={isMatched ? undefined : 'font-semibold text-destructive'}>{row.original.varianceQuantity}</span>
            <Badge variant={isMatched ? 'success' : 'destructive'} appearance="light">
              {isMatched ? 'Matched' : 'Variance Detected'}
            </Badge>
          </div>
        );
      },
    },
  ];

  const reconciliationTotal = reconciliations ? Number(reconciliations.total) : 0;
  const reconciliationTable = useReactTable({
    columns: reconciliationColumns,
    data: reconciliations?.items ?? [],
    pageCount: Math.max(1, Math.ceil(reconciliationTotal / reconciliationPagination.pageSize)),
    manualPagination: true,
    state: { pagination: reconciliationPagination },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(reconciliationPagination) : updater;
      setFilters({ reconciliationPage: String(next.pageIndex + 1), reconciliationPageSize: String(next.pageSize) });
    },
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

      {errorMessage && (
        <Alert variant="destructive" appearance="light" className="mb-2" onClose={() => setErrorMessage(null)}>
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{errorMessage}</AlertTitle>
        </Alert>
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
              {stockFetching && !currentStock ? (
                <TableSkeleton columns={2} />
              ) : (currentStock ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="p-0 text-center">
                    <EmptyState
                      icon={<Scale className="size-8" aria-hidden="true" />}
                      title="No stock recorded"
                      description="No cylinder stock has been recorded for this property yet."
                    />
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

      {isError ? (
        <Card className="mb-4">
          <ErrorState description="Failed to load stock movements. Please try again." onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={movementsFetching} emptyMessage="No stock movements yet." tableLayout={{ cellBorder: true }}>
          <Card className="mb-4">
            <CardHeader>
              <CardHeading>
                <CardTitle>Stock Movements</CardTitle>
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

      {reconciliationsError ? (
        <Card>
          <ErrorState description="Failed to load reconciliations. Please try again." onRetry={refetchReconciliations} />
        </Card>
      ) : (
        <DataGrid
          table={reconciliationTable}
          recordCount={reconciliationTotal}
          isLoading={reconciliationsFetching}
          emptyMessage="No reconciliations yet."
          tableLayout={{ cellBorder: true }}
        >
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Monthly Reconciliations</CardTitle>
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

      <StockMovementDialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen} isSubmitting={isRecordingMovement} onSubmit={handleRecordMovement} />
      <StockAdjustmentDialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen} isSubmitting={isRecordingAdjustment} onSubmit={handleRecordAdjustment} />
      <ReconciliationDialog open={reconciliationDialogOpen} onOpenChange={setReconciliationDialogOpen} isSubmitting={isCreatingReconciliation} onSubmit={handleCreateReconciliation} />
    </>
  );
}
