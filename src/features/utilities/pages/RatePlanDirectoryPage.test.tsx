import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { RatePlanDirectoryPage } from './RatePlanDirectoryPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Utility Admin',
  tenantId: 'tenant-1',
  roles: ['UtilityAdmin'],
  permissions: ['utility.rateplan.view', 'utility.rateplan.manage'],
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
  );
}

function ratePlan(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    ratePlanId: 'rp-1',
    buildingId: 'bld-1',
    utilityType: 'Gas',
    name: 'Standard Gas Rate',
    structure: 'Metered',
    fixedAmount: null,
    fixedServiceCharge: 50,
    taxPercentage: 5,
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    isActive: true,
    slabs: [
      { slabOrder: 1, fromUnits: 0, toUnits: 50, ratePerUnit: 10 },
      { slabOrder: 2, fromUnits: 50, toUnits: null, ratePerUnit: 15 },
    ],
    ...overrides,
  };
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('RatePlanDirectoryPage', () => {
  it('lists rate plans for the selected building, showing slab count rather than a single amount for Metered plans', async () => {
    mockBuildings();
    let receivedUtilityType: string | null = null;
    server.use(
      http.get(`${API_BASE}/api/v1/rate-plans`, ({ request }) => {
        receivedUtilityType = new URL(request.url).searchParams.get('utilityType');
        return HttpResponse.json({ items: [ratePlan()], page: 1, pageSize: 10, total: 1 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RatePlanDirectoryPage utilityType="Gas" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    await chooseOption(user, 'Select a building', 'Tower A (A)');

    expect(await screen.findByText('Standard Gas Rate')).toBeInTheDocument();
    expect(screen.getByText('2 slab(s)')).toBeInTheDocument();
    await waitFor(() => expect(receivedUtilityType).toBe('Gas'));
  }, 15000);

  it('deactivates a rate plan from the Manage dialog — plans are otherwise immutable', async () => {
    mockBuildings();
    server.use(
      http.get(`${API_BASE}/api/v1/rate-plans`, () =>
        HttpResponse.json({ items: [ratePlan()], page: 1, pageSize: 10, total: 1 }),
      ),
    );

    let deactivateCalled = false;
    server.use(
      http.post(`${API_BASE}/api/v1/rate-plans/rp-1/deactivate`, () => {
        deactivateCalled = true;
        return HttpResponse.json(ratePlan({ isActive: false }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RatePlanDirectoryPage utilityType="Gas" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await user.click(await screen.findByRole('button', { name: /manage/i }));
    await user.click(screen.getByRole('button', { name: /deactivate rate plan/i }));

    await waitFor(() => expect(deactivateCalled).toBe(true));
  }, 15000);
});
