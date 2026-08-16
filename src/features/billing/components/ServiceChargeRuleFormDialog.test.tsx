import { useState } from 'react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ServiceChargeRuleFormDialog } from './ServiceChargeRuleFormDialog';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Billing Admin',
  tenantId: 'tenant-1',
  roles: ['BillingAdmin'],
  permissions: ['billing.rule.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

function ControlledServiceChargeRuleFormDialog() {
  const [open, setOpen] = useState(true);
  return <ServiceChargeRuleFormDialog buildingId="bld-1" open={open} onOpenChange={setOpen} />;
}

describe('ServiceChargeRuleFormDialog', () => {
  it('creates a rule scoped to the given building and submits the exact command shape', async () => {
    let receivedBody: unknown = null;

    server.use(
      http.post(`${API_BASE}/api/v1/service-charge-rules`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          serviceChargeRuleId: 'rule-1',
          buildingId: 'bld-1',
          category: 'Maintenance',
          name: 'Monthly Maintenance',
          calculationMethod: 'FixedAmount',
          rate: 2500,
          unitTypeFilter: null,
          frequency: 'Monthly',
          effectiveFrom: '2026-08-01',
          effectiveTo: null,
          isActive: true,
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ControlledServiceChargeRuleFormDialog />, { auth: { user: adminUser, isInitialized: true } });

    await user.type(screen.getByLabelText('Name'), 'Monthly Maintenance');
    await user.type(screen.getByLabelText('Category'), 'Maintenance');
    await chooseOption(user, 'Select method', 'Fixed Amount');
    await user.clear(screen.getByLabelText('Rate (BDT)'));
    await user.type(screen.getByLabelText('Rate (BDT)'), '2500');
    await chooseOption(user, 'Select frequency', 'Monthly');
    await user.click(screen.getByRole('button', { name: /create rule/i }));

    await waitFor(() => expect(receivedBody).not.toBeNull());
    expect(receivedBody).toMatchObject({
      buildingId: 'bld-1',
      name: 'Monthly Maintenance',
      category: 'Maintenance',
      calculationMethod: 'FixedAmount',
      rate: 2500,
      frequency: 'Monthly',
      unitTypeFilter: null,
    });
  }, 15000);

  it('maps a backend validation error onto the matching form field', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/service-charge-rules`, () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Validation failed',
            errors: { Name: ['A rule with this name already exists for this building.'] },
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ControlledServiceChargeRuleFormDialog />, { auth: { user: adminUser, isInitialized: true } });

    await user.type(screen.getByLabelText('Name'), 'Monthly Maintenance');
    await user.type(screen.getByLabelText('Category'), 'Maintenance');
    await chooseOption(user, 'Select method', 'Fixed Amount');
    await user.clear(screen.getByLabelText('Rate (BDT)'));
    await user.type(screen.getByLabelText('Rate (BDT)'), '2500');
    await chooseOption(user, 'Select frequency', 'Monthly');
    await user.click(screen.getByRole('button', { name: /create rule/i }));

    expect(await screen.findByText('A rule with this name already exists for this building.')).toBeInTheDocument();
  }, 15000);
});
