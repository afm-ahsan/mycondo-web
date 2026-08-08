import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  getCoreRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Users } from 'lucide-react';
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
import { SupplierSelect } from '@/components/shared/SupplierSelect';
import { RequirePermission } from '@/lib/auth/RequirePermission';
import { PERMISSIONS } from '@/lib/auth/permissionKeys';
import { formatDate } from '@/lib/helpers';
import { toApiError } from '@/lib/forms/applyApiErrorToForm';
import { toUserMessage } from '@/api/errors';
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
import { SupplierDialog } from '../../components/SupplierDialog';
import { ReasonDialog } from '../../components/ReasonDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatBdt, formatNumber } from '@/lib/helpers';
import { cylinderPurchaseApprovalStatusToneMap, cylinderPurchasePaymentStatusToneMap, type CylinderPurchaseApprovalStatus, type CylinderPurchasePaymentStatus } from '../../lib/status';
import type { CylinderPurchaseDto } from '@/api/generated/mycondoApi';
import type { CylinderPurchaseSchemaType, SupplierSchemaType } from '../../schemas/gasCylinderSchema';

export function CylinderPurchaseListPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [rejectingPurchaseId, setRejectingPurchaseId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isFetching, isError } = useCylinderPurchases({
    supplierId,
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

  async function handleApprove(id: string) {
    setErrorMessage(null);
    try {
      await approvePurchase({ id }).unwrap();
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleReject(reason: string) {
    if (!rejectingPurchaseId) return;
    setErrorMessage(null);
    try {
      await rejectPurchase({ id: rejectingPurchaseId, rejectCylinderPurchaseRequest: { reason } }).unwrap();
      setRejectingPurchaseId(null);
    } catch (err) {
      setErrorMessage(toUserMessage(toApiError(err) ?? err));
    }
  }

  async function handleMarkPaid(id: string) {
    setErrorMessage(null);
    try {
      await markPaid({ id }).unwrap();
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
    { id: 'rate', header: 'Rate', cell: ({ row }) => formatBdt(row.original.ratePerCylinder) },
    { id: 'totalKg', header: 'Total kg', cell: ({ row }) => formatNumber(row.original.totalKg) },
    { id: 'unitPricePerKg', header: 'Unit price/kg', cell: ({ row }) => formatBdt(row.original.unitPricePerKg) },
    { id: 'grandTotal', header: 'Amount', cell: ({ row }) => formatBdt(row.original.grandTotal) },
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
      header: '',
      cell: ({ row }) => {
        const purchase = row.original;
        return (
          <div className="flex gap-2">
            {purchase.approvalStatus === 'PendingApproval' && (
              <RequirePermission permission={PERMISSIONS.gasCylinder.approve}>
                <Button size="sm" variant="outline" disabled={isApproving} onClick={() => handleApprove(purchase.cylinderPurchaseId)}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectingPurchaseId(purchase.cylinderPurchaseId)}>
                  Reject
                </Button>
              </RequirePermission>
            )}
            {purchase.approvalStatus === 'Approved' && purchase.paymentStatus === 'Unpaid' && (
              <RequirePermission permission={PERMISSIONS.gasCylinder.purchaseManage}>
                <Button size="sm" variant="outline" disabled={isMarkingPaid} onClick={() => handleMarkPaid(purchase.cylinderPurchaseId)}>
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
    onPaginationChange: setPagination,
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

      {(isError || errorMessage) && (
        <p className="text-destructive text-sm mb-2">{errorMessage ?? 'Failed to load purchases. Please try again.'}</p>
      )}

      <DataGrid table={table} recordCount={total} isLoading={isFetching} emptyMessage="No purchases yet." tableLayout={{ cellBorder: true }}>
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Purchases</CardTitle>
            </CardHeading>
            <CardToolbar>
              <SupplierSelect value={supplierId} onValueChange={setSupplierId} placeholder="All suppliers" />
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
    </>
  );
}
