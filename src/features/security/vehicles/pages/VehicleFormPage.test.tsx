import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { VehicleFormPage } from './VehicleFormPage';

const API_BASE = 'https://localhost:7219';

const guardUser: AuthUser = {
  id: 'user-1',
  email: 'guard@example.com',
  name: 'Gate Guard',
  tenantId: 'tenant-1',
  roles: ['SecurityGuard'],
  permissions: ['vehicle.create'],
  buildingIds: [],
  buildingPermissions: [],
};

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('VehicleFormPage', () => {
  it('maps a backend duplicate-registration conflict onto the registration number field', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/vehicles`, () =>
        HttpResponse.json(
          {
            status: 409,
            title: 'Conflict',
            detail: "A vehicle with registration 'DHAKA-METRO-GA-1234' already exists for this tenant.",
          },
          { status: 409 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<VehicleFormPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByLabelText('Registration number'), 'DHAKA-METRO-GA-1234');
    await chooseOption(user, 'Select type', 'Car');
    await chooseOption(user, 'Select category', 'Resident');
    await user.click(screen.getByRole('button', { name: /register vehicle/i }));

    expect(
      await screen.findByText("A vehicle with registration 'DHAKA-METRO-GA-1234' already exists for this tenant."),
    ).toBeInTheDocument();
  }, 15000);
});
