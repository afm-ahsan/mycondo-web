import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { ServiceProviderFormPage } from './ServiceProviderFormPage';

const API_BASE = 'https://localhost:7219';

const guardUser: AuthUser = {
  id: 'user-1',
  email: 'guard@example.com',
  name: 'Gate Guard',
  tenantId: 'tenant-1',
  roles: ['SecurityGuard'],
  permissions: ['serviceprovider.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('ServiceProviderFormPage', () => {
  it('maps a backend validation error onto the matching form field', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/service-providers`, () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Validation failed',
            errors: { Phone: ['Phone number is already registered to another service provider.'] },
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ServiceProviderFormPage />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByLabelText('Full name'), 'Nasrin Sultana');
    await user.type(screen.getByLabelText('Mobile number'), '01711000000');
    await chooseOption(user, 'Select type', 'Tutor');
    await user.click(screen.getByRole('button', { name: /register provider/i }));

    expect(
      await screen.findByText('Phone number is already registered to another service provider.'),
    ).toBeInTheDocument();
  }, 15000);
});
