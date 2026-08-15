import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import { createStore } from '@/store/store';
import { server } from '@/test/server';
import type { PlatformAuthUser } from '@/store/slices/platformAuthSlice';
import { PageHeaderProvider } from '@/providers/page-header-provider';
import { PlatformOrganizationDetailPage } from './PlatformOrganizationDetailPage';

const API_BASE = 'https://localhost:7219';

const superAdmin: PlatformAuthUser = {
  id: 'platform-user-1',
  email: 'sadmin@mycondo.com',
  displayName: 'Platform SuperAdmin',
  roles: ['SuperAdmin'],
  permissions: ['platform.organization.read', 'platform.organization.update', 'platform.organization.features.manage'],
};

function detail(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    tenantId: 'tenant-1',
    name: 'Akter Residence Park',
    code: 'ARP',
    slug: 'arp',
    status: 'Active',
    createdAtUtc: '2026-08-01T00:00:00Z',
    updatedAtUtc: null,
    administrator: { userId: 'user-1', fullName: 'Admin', email: 'admin@mycondo.com' },
    enabledModuleKeys: ['billing', 'payments'],
    ...overrides,
  };
}

function renderDetailPage(initialDetail: ReturnType<typeof detail>) {
  server.use(http.get(`${API_BASE}/api/v1/platform/organizations/tenant-1`, () => HttpResponse.json(initialDetail)));

  const store = createStore({ platformAuth: { user: superAdmin, isInitialized: true } });
  return render(
    <MemoryRouter initialEntries={['/platform/organizations/tenant-1']}>
      <Provider store={store}>
        <PageHeaderProvider>
          <Routes>
            <Route path="/platform/organizations/:id" element={<PlatformOrganizationDetailPage />} />
          </Routes>
        </PageHeaderProvider>
      </Provider>
    </MemoryRouter>,
  );
}

describe('PlatformOrganizationDetailPage', () => {
  it('shows the organization overview, administrator, and enabled modules', async () => {
    renderDetailPage(detail());

    expect(await screen.findByRole('heading', { name: 'Akter Residence Park' })).toBeInTheDocument();
    expect(screen.getByText('admin@mycondo.com')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('shows "no administrator on record" for a pre-existing organization with none set', async () => {
    renderDetailPage(detail({ administrator: null }));

    await screen.findByRole('heading', { name: 'Akter Residence Park' });
    expect(screen.getByText(/no administrator on record/i)).toBeInTheDocument();
  });

  it('edits the organization name and code', async () => {
    renderDetailPage(detail());
    let receivedBody: unknown = null;
    server.use(
      http.patch(`${API_BASE}/api/v1/platform/organizations/tenant-1`, async ({ request }) => {
        receivedBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'Akter Residence Park' });

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const nameField = await screen.findByLabelText('Name');
    await user.clear(nameField);
    await user.type(nameField, 'Renamed Org');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(receivedBody).toEqual({ name: 'Renamed Org', code: 'ARP' }));
  });
});
