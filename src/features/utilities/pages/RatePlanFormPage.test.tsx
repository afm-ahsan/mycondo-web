import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { RatePlanFormPage } from './RatePlanFormPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Utility Admin',
  tenantId: 'tenant-1',
  roles: ['UtilityAdmin'],
  permissions: ['utility.rateplan.manage'],
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

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('RatePlanFormPage', () => {
  it('creates a Metered rate plan with slabs and submits the exact command shape', async () => {
    mockBuildings();
    let receivedBody: unknown = null;
    server.use(
      http.post(`${API_BASE}/api/v1/rate-plans`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          ratePlanId: 'rp-1',
          buildingId: 'bld-1',
          utilityType: 'Electricity',
          name: 'Tiered Electricity',
          structure: 'Metered',
          fixedAmount: null,
          fixedServiceCharge: 0,
          taxPercentage: 0,
          effectiveFrom: '2026-08-08',
          effectiveTo: null,
          isActive: true,
          slabs: [{ slabOrder: 1, fromUnits: 0, toUnits: 100, ratePerUnit: 8 }],
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RatePlanFormPage utilityType="Electricity" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await user.type(screen.getByLabelText('Name'), 'Tiered Electricity');
    await chooseOption(user, 'Select structure', 'Metered');

    await user.click(screen.getByRole('button', { name: /add slab/i }));
    await user.clear(screen.getByLabelText('From units'));
    await user.type(screen.getByLabelText('From units'), '0');
    await user.clear(screen.getByLabelText(/to units/i));
    await user.type(screen.getByLabelText(/to units/i), '100');
    await user.clear(screen.getByLabelText('Rate/unit'));
    await user.type(screen.getByLabelText('Rate/unit'), '8');

    await user.click(screen.getByRole('button', { name: /create rate plan/i }));

    expect(receivedBody).toMatchObject({
      buildingId: 'bld-1',
      utilityType: 'Electricity',
      name: 'Tiered Electricity',
      structure: 'Metered',
      fixedAmount: null,
      slabs: [{ slabOrder: 1, fromUnits: 0, toUnits: 100, ratePerUnit: 8 }],
    });
  }, 15000);

  it('does not show a slab editor for a Fixed structure, only a fixed amount field', async () => {
    mockBuildings();
    const user = userEvent.setup();
    renderWithProviders(<RatePlanFormPage utilityType="Gas" />, {
      auth: { user: adminUser, isInitialized: true },
    });

    await chooseOption(user, 'Select a building', 'Tower A (A)');
    await chooseOption(user, 'Select structure', 'Fixed');

    expect(screen.getByLabelText(/fixed amount/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add slab/i })).not.toBeInTheDocument();
  }, 15000);
});
