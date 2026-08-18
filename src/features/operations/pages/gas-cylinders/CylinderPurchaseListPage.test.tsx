import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { CylinderPurchaseListPage } from './CylinderPurchaseListPage';

const API_BASE = 'https://localhost:7219';

const managerUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  name: 'Manager',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['gascylinder.purchase.manage', 'gascylinder.approve', 'gascylinder.view'],
  buildingIds: [],
  buildingPermissions: [],
};

const supplier = {
  gasCylinderSupplierId: 'sup-1',
  name: 'Padma Oil',
  contactPhone: null,
  contactEmail: null,
  address: null,
  isActive: true,
};

function purchase(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    cylinderPurchaseId: 'purchase-1',
    supplierId: 'sup-1',
    invoiceNumber: 'INV-001',
    purchaseDate: '2026-08-01',
    cylinderType: 'LPG-12kg',
    quantity: 20,
    cylinderWeightKg: 12,
    ratePerCylinder: 1500,
    deliveryOrOtherCost: 200,
    remarks: null,
    paymentStatus: 'Unpaid',
    approvalStatus: 'PendingApproval',
    approvedBy: null,
    approvedAtUtc: null,
    rejectedReason: null,
    totalKg: 240,
    lineAmount: 30000,
    unitPricePerKg: 125,
    grandTotal: 30200,
    ...overrides,
  };
}

function renderPage(initialPurchase: ReturnType<typeof purchase>) {
  server.use(
    http.get(`${API_BASE}/api/v1/gas-cylinder-suppliers`, () => HttpResponse.json({ items: [supplier], page: 1, pageSize: 100, total: 1 })),
    http.get(`${API_BASE}/api/v1/cylinder-purchases`, () => HttpResponse.json({ items: [initialPurchase], page: 1, pageSize: 10, total: 1 })),
  );
  return renderWithProviders(<CylinderPurchaseListPage />, { auth: { user: managerUser, isInitialized: true } });
}

describe('CylinderPurchaseListPage', () => {
  it('displays server-computed TotalKg/GrandTotal without recalculating them client-side', async () => {
    renderPage(purchase());

    // 240 = 20 * 12 (TotalKg), 125 = 1500 / 12 (UnitPricePerKg) — both come straight from the API
    // response, not recomputed in the browser (proves no client-owned business-state calculation).
    expect(await screen.findByText('240.00')).toBeInTheDocument();
    expect(screen.getAllByText(/30,200/).length).toBeGreaterThan(0);
  });

  it('approves a pending purchase only after confirmation', async () => {
    let approveCalled = false;
    renderPage(purchase({ approvalStatus: 'PendingApproval' }));
    server.use(
      http.post(`${API_BASE}/api/v1/cylinder-purchases/purchase-1/approve`, () => {
        approveCalled = true;
        return HttpResponse.json(purchase({ approvalStatus: 'Approved' }));
      }),
    );

    const user = userEvent.setup();
    const row = (await screen.findByText('INV-001')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /actions for purchase inv-001/i }));
    await user.click(await screen.findByRole('menuitem', { name: /^approve$/i }));

    // Clicking the row action opens a confirmation — it must not fire immediately.
    expect(approveCalled).toBe(false);
    expect(screen.getByText('Approve this purchase?')).toBeInTheDocument();
    expect(screen.getAllByText('INV-001').length).toBeGreaterThan(0);

    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(approveCalled).toBe(true));
  });

  it('marks an approved, unpaid purchase as paid only after confirmation', async () => {
    let markPaidCalled = false;
    renderPage(purchase({ approvalStatus: 'Approved', paymentStatus: 'Unpaid' }));
    server.use(
      http.post(`${API_BASE}/api/v1/cylinder-purchases/purchase-1/mark-paid`, () => {
        markPaidCalled = true;
        return HttpResponse.json(purchase({ approvalStatus: 'Approved', paymentStatus: 'Paid' }));
      }),
    );

    const user = userEvent.setup();
    const row = (await screen.findByText('INV-001')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /actions for purchase inv-001/i }));
    await user.click(await screen.findByRole('menuitem', { name: /^mark paid$/i }));

    expect(markPaidCalled).toBe(false);
    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Mark Paid' }));

    await waitFor(() => expect(markPaidCalled).toBe(true));
  });

  it('rejects a pending purchase with a reason', async () => {
    let receivedBody: unknown = null;
    renderPage(purchase({ approvalStatus: 'PendingApproval' }));
    server.use(
      http.post(`${API_BASE}/api/v1/cylinder-purchases/purchase-1/reject`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(purchase({ approvalStatus: 'Rejected', rejectedReason: 'Price mismatch' }));
      }),
    );

    const user = userEvent.setup();
    const row = (await screen.findByText('INV-001')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /actions for purchase inv-001/i }));
    await user.click(await screen.findByRole('menuitem', { name: /^reject$/i }));
    await user.type(screen.getByLabelText('Reason'), 'Price mismatch');
    await user.click(screen.getByRole('button', { name: 'Reject', hidden: false }));

    await waitFor(() => expect(receivedBody).toMatchObject({ reason: 'Price mismatch' }));
  });

  it('hides Approve/Reject/Mark Paid actions for a view-only user', async () => {
    const viewOnlyUser: AuthUser = { ...managerUser, permissions: ['gascylinder.view'] };
    server.use(
      http.get(`${API_BASE}/api/v1/gas-cylinder-suppliers`, () => HttpResponse.json({ items: [supplier], page: 1, pageSize: 100, total: 1 })),
      http.get(`${API_BASE}/api/v1/cylinder-purchases`, () => HttpResponse.json({ items: [purchase()], page: 1, pageSize: 10, total: 1 })),
    );
    renderWithProviders(<CylinderPurchaseListPage />, { auth: { user: viewOnlyUser, isInitialized: true } });

    await screen.findByText('INV-001');
    expect(screen.queryByRole('button', { name: /actions for purchase inv-001/i })).not.toBeInTheDocument();
  });
});
