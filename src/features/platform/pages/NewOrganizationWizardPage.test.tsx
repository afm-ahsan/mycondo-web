import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { PlatformAuthUser } from '@/store/slices/platformAuthSlice';
import { NewOrganizationWizardPage } from './NewOrganizationWizardPage';

const API_BASE = 'https://localhost:7219';

const superAdmin: PlatformAuthUser = {
  id: 'platform-user-1',
  email: 'sadmin@mycondo.com',
  displayName: 'Platform SuperAdmin',
  roles: ['SuperAdmin'],
  permissions: ['platform.organization.create'],
};

async function fillIdentityStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Organization name'), 'Akter Residence Park');
  await user.type(screen.getByLabelText('Code'), 'ARP');
  await user.type(screen.getByLabelText('Slug'), 'arp');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

async function fillAdministratorStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Full name'), 'Admin');
  await user.type(screen.getByLabelText('Email'), 'admin@mycondo.com');
  await user.type(screen.getByLabelText('Initial password'), 'Correct-Horse-Battery-9');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('NewOrganizationWizardPage', () => {
  it('fires no network call until the final Create Organization click', async () => {
    let createCalled = false;
    server.use(
      http.post(`${API_BASE}/api/v1/platform/organizations`, () => {
        createCalled = true;
        return HttpResponse.json({
          tenantId: 'tenant-1', name: 'Akter Residence Park', code: 'ARP', slug: 'arp',
          status: 'Active', administratorUserId: 'user-1',
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<NewOrganizationWizardPage />, {
      platformAuth: { user: superAdmin, isInitialized: true },
    });

    await fillIdentityStep(user);
    expect(createCalled).toBe(false);

    await fillAdministratorStep(user);
    expect(createCalled).toBe(false);

    expect(await screen.findByText(/choose which product modules/i)).toBeInTheDocument();
    expect(createCalled).toBe(false);
  }, 15000);

  it('creates the organization with the selected modules on final submit', async () => {
    let receivedBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API_BASE}/api/v1/platform/organizations`, async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          tenantId: 'tenant-1', name: 'Akter Residence Park', code: 'ARP', slug: 'arp',
          status: 'Active', administratorUserId: 'user-1',
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<NewOrganizationWizardPage />, {
      platformAuth: { user: superAdmin, isInitialized: true },
    });

    await fillIdentityStep(user);
    await fillAdministratorStep(user);
    await screen.findByText(/choose which product modules/i);
    await user.click(screen.getByLabelText('Billing'));
    await user.click(screen.getByRole('button', { name: 'Create Organization' }));

    await waitFor(() => expect(receivedBody).not.toBeNull());
    expect(receivedBody).toMatchObject({
      name: 'Akter Residence Park',
      code: 'ARP',
      slug: 'arp',
      administratorFullName: 'Admin',
      administratorEmail: 'admin@mycondo.com',
      administratorPassword: 'Correct-Horse-Battery-9',
    });
    expect((receivedBody!.enabledModuleKeys as string[])).not.toContain('billing');
  }, 15000);

  it('surfaces a conflict as a field-relevant, actionable error', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/platform/organizations`, () =>
        HttpResponse.json({ title: 'Conflict', status: 409, detail: 'Slug already exists.' }, { status: 409 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<NewOrganizationWizardPage />, {
      platformAuth: { user: superAdmin, isInitialized: true },
    });

    await fillIdentityStep(user);
    await fillAdministratorStep(user);
    await screen.findByText(/choose which product modules/i);
    await user.click(screen.getByRole('button', { name: 'Create Organization' }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  }, 15000);
});
