import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { StaffMemberFormPage } from './StaffMemberFormPage';

const API_BASE = 'https://localhost:7219';

const adminUser: AuthUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Front Desk Admin',
  tenantId: 'tenant-1',
  roles: ['FrontDeskAdmin'],
  permissions: ['staffattendance.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('StaffMemberFormPage', () => {
  it('maps a backend validation error onto the matching form field', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/staff-members`, () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Validation failed',
            errors: { FullName: ['Full name is required.'] },
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<StaffMemberFormPage />, { auth: { user: adminUser, isInitialized: true } });

    await user.type(screen.getByLabelText('Full name'), 'Md. Karim Sheikh');
    await chooseOption(user, 'Select role', 'Guard');
    await user.click(screen.getByRole('button', { name: /register staff member/i }));

    expect(await screen.findByText('Full name is required.')).toBeInTheDocument();
  }, 15000);
});
