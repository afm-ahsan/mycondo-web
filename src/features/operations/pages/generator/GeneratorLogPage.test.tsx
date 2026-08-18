import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { server } from '@/test/server';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AuthUser } from '@/store/slices/authSlice';
import { GeneratorLogPage } from './GeneratorLogPage';

const API_BASE = 'https://localhost:7219';

const operatorUser: AuthUser = {
  id: 'user-1',
  email: 'operator@example.com',
  name: 'Operator',
  tenantId: 'tenant-1',
  roles: [],
  permissions: ['generator.operation.manage', 'generator.view'],
  buildingIds: [],
  buildingPermissions: [],
};

const generator = {
  generatorId: 'gen-1',
  buildingId: 'bld-1',
  name: 'Generator 1',
  model: 'Cummins C150',
  capacityKva: 150,
  location: 'Roof',
  currentHourMeterReading: 1200,
  isActive: true,
};

function emptySessions(total = 0) {
  return { items: [], page: 1, pageSize: 10, total };
}

describe('GeneratorLogPage', () => {
  it('starts a session successfully', async () => {
    let startCalled = false;
    server.use(
      http.get(`${API_BASE}/api/v1/generators`, () => HttpResponse.json({ items: [generator], page: 1, pageSize: 100, total: 1 })),
      http.get(`${API_BASE}/api/v1/generator-sessions`, () => HttpResponse.json(emptySessions())),
      http.post(`${API_BASE}/api/v1/generator-sessions`, () => {
        startCalled = true;
        return HttpResponse.json({
          generatorSessionId: 'session-1',
          generatorId: 'gen-1',
          startAtUtc: new Date().toISOString(),
          stopAtUtc: null,
          operatorId: 'user-1',
          openingFuelLevel: 40,
          closingFuelLevel: null,
          outageReason: null,
          runtimeMinutes: null,
          status: 'Open',
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<GeneratorLogPage />, { auth: { user: operatorUser, isInitialized: true } });

    await user.click(await screen.findByRole('button', { name: /start session/i }));

    const generatorTrigger = (await screen.findByText('Select a generator')).closest('[role="combobox"]') as HTMLElement;
    await user.click(generatorTrigger);
    await user.click(await screen.findByRole('option', { name: 'Generator 1' }));

    const fuelInput = screen.getByLabelText(/opening fuel level/i);
    await user.clear(fuelInput);
    await user.type(fuelInput, '40');

    await user.click(screen.getByRole('button', { name: /^start session$/i }));

    await waitFor(() => expect(startCalled).toBe(true));
  }, 15000);

  it('shows the backend conflict message when a generator already has an open session', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/generators`, () => HttpResponse.json({ items: [generator], page: 1, pageSize: 100, total: 1 })),
      http.get(`${API_BASE}/api/v1/generator-sessions`, () => HttpResponse.json(emptySessions())),
      http.post(`${API_BASE}/api/v1/generator-sessions`, () =>
        HttpResponse.json(
          { status: 422, title: 'Domain rule violated', detail: 'Generator gen-1 already has an open session. Stop it before starting a new one.' },
          { status: 422 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<GeneratorLogPage />, { auth: { user: operatorUser, isInitialized: true } });

    await user.click(await screen.findByRole('button', { name: /start session/i }));

    const generatorTrigger = (await screen.findByText('Select a generator')).closest('[role="combobox"]') as HTMLElement;
    await user.click(generatorTrigger);
    await user.click(await screen.findByRole('option', { name: 'Generator 1' }));

    await user.click(screen.getByRole('button', { name: /^start session$/i }));

    expect(await screen.findByText(/already has an open session/i)).toBeInTheDocument();
  }, 15000);

  it('stops an open session', async () => {
    let stopCalled = false;
    server.use(
      http.get(`${API_BASE}/api/v1/generators`, () => HttpResponse.json({ items: [generator], page: 1, pageSize: 100, total: 1 })),
      http.get(`${API_BASE}/api/v1/generator-sessions`, () =>
        HttpResponse.json({
          items: [
            {
              generatorSessionId: 'session-1',
              generatorId: 'gen-1',
              startAtUtc: new Date().toISOString(),
              stopAtUtc: null,
              operatorId: 'user-1',
              openingFuelLevel: 40,
              closingFuelLevel: null,
              outageReason: null,
              runtimeMinutes: null,
              status: 'Open',
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
        }),
      ),
      http.post(`${API_BASE}/api/v1/generator-sessions/session-1/stop`, () => {
        stopCalled = true;
        return HttpResponse.json({});
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<GeneratorLogPage />, { auth: { user: operatorUser, isInitialized: true } });

    await user.click(await screen.findByRole('button', { name: /actions for generator 1/i }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Stop' }));

    const fuelInput = screen.getByLabelText(/closing fuel level/i);
    await user.clear(fuelInput);
    await user.type(fuelInput, '25');

    await user.click(screen.getByRole('button', { name: /^stop session$/i }));

    await waitFor(() => expect(stopCalled).toBe(true));
  }, 15000);
});
