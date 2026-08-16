import { useState } from 'react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { DomesticWorkerFormDialog } from './DomesticWorkerFormDialog';

const API_BASE = 'https://localhost:7219';

const guardUser: AuthUser = {
  id: 'user-1',
  email: 'guard@example.com',
  name: 'Gate Guard',
  tenantId: 'tenant-1',
  roles: ['SecurityGuard'],
  permissions: ['domesticworker.manage'],
  buildingIds: [],
  buildingPermissions: [],
};

async function chooseOption(user: ReturnType<typeof userEvent.setup>, placeholder: string, optionName: string) {
  const placeholderNode = await screen.findByText(placeholder);
  const trigger = placeholderNode.closest('[role="combobox"]') as HTMLElement;
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

function ControlledDomesticWorkerFormDialog() {
  const [open, setOpen] = useState(true);
  return <DomesticWorkerFormDialog open={open} onOpenChange={setOpen} />;
}

describe('DomesticWorkerFormDialog', () => {
  it('maps a backend validation error onto the matching form field', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/domestic-workers`, () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Validation failed',
            errors: { Phone: ['Phone number is already registered to another domestic worker.'] },
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ControlledDomesticWorkerFormDialog />, { auth: { user: guardUser, isInitialized: true } });

    await user.type(screen.getByLabelText('Full name'), 'Rahima Begum');
    await user.type(screen.getByLabelText('Mobile number'), '01711000000');
    await chooseOption(user, 'Select type', 'Maid');
    await user.click(screen.getByRole('button', { name: /register worker/i }));

    expect(
      await screen.findByText('Phone number is already registered to another domestic worker.'),
    ).toBeInTheDocument();
  }, 15000);

  it('closes the dialog once the worker is registered', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/domestic-workers`, () =>
        HttpResponse.json({
          domesticWorkerProfileId: 'worker-1',
          fullName: 'Rahima Begum',
          phone: '01711000000',
          workerType: 'Maid',
          verificationStatus: 'Pending',
          status: 'Active',
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ControlledDomesticWorkerFormDialog />, { auth: { user: guardUser, isInitialized: true } });

    await screen.findByRole('dialog');
    await user.type(screen.getByLabelText('Full name'), 'Rahima Begum');
    await user.type(screen.getByLabelText('Mobile number'), '01711000000');
    await chooseOption(user, 'Select type', 'Maid');
    await user.click(screen.getByRole('button', { name: /register worker/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  }, 15000);
});
