import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { BatchBillingPage } from './BatchBillingPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Billing Admin',
  tenantId: 'tenant-1',
  roles: ['BillingAdmin'],
  permissions: ['billing.invoice.generate', 'billing.rule.view'],
  buildingIds: [],
  buildingPermissions: [],
};

function mockBuildings() {
  server.use(
    http.get(`${API_BASE}/api/v1/properties/buildings`, () =>
      HttpResponse.json({
        items: [{ buildingId: 'bld-1', name: 'Tower A', code: 'A', address: null }],
        page: 1,
        pageSize: 100,
        total: 1,
      }),
    ),
    http.get(`${API_BASE}/api/v1/service-charge-rules/flats-missing-area`, () =>
      HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 }),
    ),
  );
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('BatchBillingPage', () => {
  it('requires confirmation, sends an idempotency key, and renders the structured outcome without collapsing it into a toast', async () => {
    mockBuildings();
    let receivedKey: string | null = null;
    let generateCalled = false;

    server.use(
      http.post(`${API_BASE}/api/v1/invoices/generate-batch`, ({ request }) => {
        generateCalled = true;
        receivedKey = request.headers.get('X-Idempotency-Key');
        return HttpResponse.json({
          requestedCount: 5,
          generatedCount: 2,
          alreadyExistingCount: 1,
          skippedCount: 1,
          failedCount: 1,
          generatedInvoiceIds: ['inv-1', 'inv-2'],
          skippedItems: [{ flatId: 'flat-3', reason: 'No applicable service charge rule for this flat\'s unit type' }],
          failedItems: [{ flatId: 'flat-4', reason: 'Unexpected error' }],
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<BatchBillingPage />, { auth: { user: adminUser, isInitialized: true } });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await user.click(screen.getByRole('button', { name: /generate invoices/i }));

    // Confirmation dialog gate — the mutation must not fire until confirmed.
    expect(generateCalled).toBe(false);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^generate invoices$/i }));

    await waitFor(() => expect(generateCalled).toBe(true));
    expect(receivedKey).not.toBeNull();

    // Each outcome is shown as its own labeled count, not collapsed into one "Success" message.
    expect(await screen.findByText('Generated')).toBeInTheDocument();
    expect(screen.getByText('Already existing')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  }, 15000);
});
