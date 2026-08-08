import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ServiceChargeRuleDirectoryPage } from './ServiceChargeRuleDirectoryPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Billing Admin',
  tenantId: 'tenant-1',
  roles: ['BillingAdmin'],
  permissions: ['billing.rule.view', 'billing.rule.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

const rule = {
  serviceChargeRuleId: 'rule-1',
  buildingId: 'bld-1',
  category: 'Maintenance',
  name: 'Monthly Maintenance',
  calculationMethod: 'FixedAmount',
  rate: 2500,
  unitTypeFilter: null,
  frequency: 'Monthly',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  isActive: true,
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
  );
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('ServiceChargeRuleDirectoryPage', () => {
  it('lists rules once a building is selected, and no query fires before one is chosen', async () => {
    mockBuildings();
    let rulesQueried = false;
    server.use(
      http.get(`${API_BASE}/api/v1/service-charge-rules`, ({ request }) => {
        rulesQueried = true;
        const url = new URL(request.url);
        expect(url.searchParams.get('buildingId')).toBe('bld-1');
        return HttpResponse.json({ items: [rule], page: 1, pageSize: 10, total: 1 });
      }),
      http.get(`${API_BASE}/api/v1/service-charge-rules/flats-missing-area`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ServiceChargeRuleDirectoryPage />, { auth: { user: adminUser, isInitialized: true } });

    expect(rulesQueried).toBe(false);

    await chooseOption(user, 'Select a building', 'Tower A (A)');

    await waitFor(() => expect(rulesQueried).toBe(true));
    expect(await screen.findByText('Monthly Maintenance')).toBeInTheDocument();
  }, 15000);

  it('deactivates a rule from the manage dialog', async () => {
    mockBuildings();
    let deactivateCalled = false;
    server.use(
      http.get(`${API_BASE}/api/v1/service-charge-rules`, () =>
        HttpResponse.json({ items: [rule], page: 1, pageSize: 10, total: 1 }),
      ),
      http.get(`${API_BASE}/api/v1/service-charge-rules/flats-missing-area`, () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 100, total: 0 }),
      ),
      http.post(`${API_BASE}/api/v1/service-charge-rules/rule-1/deactivate`, () => {
        deactivateCalled = true;
        return HttpResponse.json({ ...rule, isActive: false });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ServiceChargeRuleDirectoryPage />, { auth: { user: adminUser, isInitialized: true } });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await user.click(await screen.findByRole('button', { name: /manage/i }));
    await user.click(await screen.findByRole('button', { name: /deactivate rule/i }));

    await waitFor(() => expect(deactivateCalled).toBe(true));
  }, 15000);
});
