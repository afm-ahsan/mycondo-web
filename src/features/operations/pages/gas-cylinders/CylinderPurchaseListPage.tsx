import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  functionalUpdate,
  getCoreRowModel,
  type PaginationState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import { AlertCircle, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
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
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmActionDialog } from '@/components/shared/ConfirmActionDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { SupplierSelect } from '@/components/shared/SupplierSelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate, formatNumber } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
import { useUrlFilters } from '@/hooks/use-url-filters';
import {
  useApproveCylinderPurchase,
  useCreateSupplier,
  useCylinderPurchases,
  useMarkCylinderPurchasePaid,
  useRecordCylinderPurchase,
  useRejectCylinderPurchase,
  useSuppliers,
} from '../../api/gasCylinderApi';
import { CylinderPurchaseDialog } from '../../components/CylinderPurchaseDialog';
import { RatePerKg } from '../../components/RatePerKg';
import { SupplierDialog } from '../../components/SupplierDialog';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { cylinderPurchaseApprovalStatusToneMap, cylinderPurchasePaymentStatusToneMap, type CylinderPurchaseApprovalStatus, type CylinderPurchasePaymentStatus } from '../../lib/status';
import type { CylinderPurchaseDto } from '@/api/generated/mycondoApi';
import type { CylinderPurchaseSchemaType, SupplierSchemaType } from '../../schemas/gasCylinderSchema';

const PURCHASES_FILTER_DEFAULTS = { supplierId: '', page: '1', pageSize: '10' };

export function CylinderPurchaseListPage() {
  const [filters, setFilters] = useUrlFilters(PURCHASES_FILTER_DEFAULTS);
  const pagination: PaginationState = {
    pageIndex: Math.max(0, (Number(filters.page) || 1) - 1),
    pageSize: Number(filters.pageSize) || 10,
  };
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [rejectingPurchaseId, setRejectingPurchaseId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<CylinderPurchaseDto | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<CylinderPurchaseDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = functionalUpdate(updater, pagination);
    setFilters({ page: String(next.pageIndex + 1), pageSize: String(next.pageSize) });
  }

  const { data, isFetching, isError, refetch } = useCylinderPurchases({
    supplierId: filters.supplierId || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const { data: suppliersData } = useSuppliers({ page: 1, pageSize: 100 });
  const supplierNameById = useMemo(
    () => Object.fromEntries((suppliersData?.items ?? []).map((s) => [s.gasCylinderSupplierId, s.name])),
    [suppliersData],
  );

  const [recordPurchase, { isLoading: isRecording }] = useRecordCylinderPurchase();
  const [createSupplier, { isLoading: isCreatingSupplier }] = useCreateSupplier();
  const [approvePurchase, { isLoading: isApproving }] = useApproveCylinderPurchase();
  const [rejectPurchase, { isLoading: isRejecting }] = useRejectCylinderPurchase();
  const [markPaid, { isLoading: isMarkingPaid }] = useMarkCylinderPurchasePaid();

  async function handleRecordPurchase(values: CylinderPurchaseSchemaType) {
    setErrorMessage(null);
    try {
      await recordPurchase({
        recordCylinderPurchaseCommand: {
          supplierId: values.supplierId,
          invoiceNumber: values.invoiceNumber,
          purchaseDate: values.purchaseDate,
          cylinderType: values.cylinderType,
          quantity: values.quantity,
          cylinderWeightKg: values.cylinderWeightKg,
          ratePerCylinder: values.ratePerCylinder,
          deliveryOrOtherCost: values.deliveryOrOtherCost,
          remarks: values.remarks || null,
        },
      }).unwrap();
      setPurchaseDialogOpen(false);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleCreateSupplier(values: SupplierSchemaType) {
    setErrorMessage(null);
    try {
      await createSupplier({
        createSupplierCommand: {
          name: values.name,
          contactPhone: values.contactPhone || null,
          contactEmail: values.contactEmail || null,
          address: values.address || null,
        },
      }).unwrap();
      setSupplierDialogOpen(false);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleApprove() {
    if (!approveTarget) return;
    setErrorMessage(null);
    try {
      await approvePurchase({ id: approveTarget.cylinderPurchaseId }).unwrap();
      toast.success(`Purchase ${approveTarget.invoiceNumber} approved.`);
      setApproveTarget(null);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleReject(reason: string) {
    if (!rejectingPurchaseId) return;
    setErrorMessage(null);
    try {
      await rejectPurchase({ id: rejectingPurchaseId, rejectCylinderPurchaseRequest: { reason } }).unwrap();
      toast.success('Purchase rejected.');
      setRejectingPurchaseId(null);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleMarkPaid() {
    if (!markPaidTarget) return;
    setErrorMessage(null);
    try {
      await markPaid({ id: markPaidTarget.cylinderPurchaseId }).unwrap();
      toast.success(`Purchase ${markPaidTarget.invoiceNumber} marked as paid.`);
      setMarkPaidTarget(null);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  const columns: ColumnDef<CylinderPurchaseDto>[] = [
    { id: 'date', header: 'Date', cell: ({ row }) => formatDate(row.original.purchaseDate) },
    { id: 'supplier', header: 'Supplier', cell: ({ row }) => supplierNameById[row.original.supplierId] ?? '—' },
    { id: 'invoice', header: 'Invoice', cell: ({ row }) => row.original.invoiceNumber },
    { id: 'cylinderType', header: 'Cylinder type', cell: ({ row }) => row.original.cylinderType },
    { id: 'quantity', header: 'Quantity', cell: ({ row }) => row.original.quantity },
    { id: 'weight', header: 'Weight (kg)', cell: ({ row }) => formatNumber(row.original.cylinderWeightKg) },
    { id: 'rate', header: 'Rate', cell: ({ row }) => <MoneyDisplay amount={row.original.ratePerCylinder} /> },
    { id: 'totalKg', header: 'Total kg', cell: ({ row }) => formatNumber(row.original.totalKg) },
    { id: 'unitPricePerKg', header: 'Unit price', cell: ({ row }) => <RatePerKg amount={row.original.unitPricePerKg} /> },
    { id: 'grandTotal', header: 'Amount', cell: ({ row }) => <MoneyDisplay amount={row.original.grandTotal} /> },
    {
      id: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => <StatusBadge status={row.original.paymentStatus as CylinderPurchasePaymentStatus} toneMap={cylinderPurchasePaymentStatusToneMap} />,
    },
    {
      id: 'approvalStatus',
      header: 'Approval',
      cell: ({ row }) => <StatusBadge status={row.original.approvalStatus as CylinderPurchaseApprovalStatus} toneMap={cylinderPurchaseApprovalStatusToneMap} />,
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        const purchase = row.original;
        return (
          <div className="flex gap-2">
            {purchase.approvalStatus === 'PendingApproval' && (
              <RequirePermission permission={PERMISSIONS.gasCylinder.approve}>
                <Button size="sm" variant="outline" onClick={() => setApproveTarget(purchase)}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectingPurchaseId(purchase.cylinderPurchaseId)}>
                  Reject
                </Button>
              </RequirePermission>
            )}
            {purchase.approvalStatus === 'Approved' && purchase.paymentStatus === 'Unpaid' && (
              <RequirePermission permission={PERMISSIONS.gasCylinder.purchaseManage}>
                <Button size="sm" variant="outline" onClick={() => setMarkPaidTarget(purchase)}>
                  Mark Paid
                </Button>
              </RequirePermission>
            )}
          </div>
        );
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
        title="Gas Cylinder Purchases"
        crumbs={[{ label: 'Operations' }, { label: 'Gas Cylinders' }, { label: 'Purchases' }]}
        primaryAction={
          <RequirePermission permission={PERMISSIONS.gasCylinder.purchaseManage}>
            <Button variant="outline" onClick={() => setSupplierDialogOpen(true)}>
              <Users /> New Supplier
            </Button>
            <Button onClick={() => setPurchaseDialogOpen(true)}>
              <Plus /> Record Purchase
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
          <ErrorState description="Failed to load purchases. Please try again." onRetry={refetch} />
        </Card>
      ) : (
        <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No purchases yet." tableLayout={{ cellBorder: true }}>
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Purchases</CardTitle>
              </CardHeading>
              <CardToolbar>
                <SupplierSelect
                  value={filters.supplierId || undefined}
                  onValueChange={(id) => setFilters({ supplierId: id, page: '1' })}
                  placeholder="All suppliers"
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

      <CylinderPurchaseDialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen} isSubmitting={isRecording} onSubmit={handleRecordPurchase} />
      <SupplierDialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen} isSubmitting={isCreatingSupplier} onSubmit={handleCreateSupplier} />
      <ReasonDialog
        open={rejectingPurchaseId !== null}
        onOpenChange={(open) => !open && setRejectingPurchaseId(null)}
        title="Reject Purchase"
        confirmLabel="Reject"
        confirmVariant="destructive"
        isSubmitting={isRejecting}
        onConfirm={handleReject}
      />
      <ConfirmActionDialog
        open={approveTarget !== null}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve this purchase?"
        description={
          approveTarget && (
            <>
              Approve invoice <strong>{approveTarget.invoiceNumber}</strong> from{' '}
              <strong>{supplierNameById[approveTarget.supplierId] ?? 'this supplier'}</strong> for{' '}
              <MoneyDisplay amount={approveTarget.grandTotal} />. This unlocks Mark Paid for the purchase.
            </>
          )
        }
        confirmLabel="Approve"
        loadingLabel="Approving..."
        isLoading={isApproving}
        onConfirm={handleApprove}
      />
      <ConfirmActionDialog
        open={markPaidTarget !== null}
        onOpenChange={(open) => !open && setMarkPaidTarget(null)}
        title="Mark this purchase as paid?"
        description={
          markPaidTarget && (
            <>
              Mark invoice <strong>{markPaidTarget.invoiceNumber}</strong> (<MoneyDisplay amount={markPaidTarget.grandTotal} />) as paid. This
              cannot be undone from this screen.
            </>
          )
        }
        confirmLabel="Mark Paid"
        loadingLabel="Saving..."
        isLoading={isMarkingPaid}
        onConfirm={handleMarkPaid}
      />
    </>
  );
}
