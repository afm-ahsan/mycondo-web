import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { RequirePermission } from './RequirePermission';

describe('RequirePermission', () => {
  it('renders children when the user holds the required permission', () => {
    renderWithProviders(
      <RequirePermission permission="user.view" fallback={<span>Denied</span>}>
        <span>Granted content</span>
      </RequirePermission>,
      {
        auth: {
          user: {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Test User',
            tenantId: 'tenant-1',
            roles: [],
            permissions: ['user.view'],
            buildingIds: [],
            buildingPermissions: [],
          },
          isInitialized: true,
        },
      },
    );

    expect(screen.getByText('Granted content')).toBeInTheDocument();
    expect(screen.queryByText('Denied')).not.toBeInTheDocument();
  });

  it('renders the fallback (not the protected content) when the user lacks the permission', () => {
    renderWithProviders(
      <RequirePermission permission="user.view" fallback={<span>Denied</span>}>
        <span>Granted content</span>
      </RequirePermission>,
      {
        auth: {
          user: {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Test User',
            tenantId: 'tenant-1',
            roles: [],
            permissions: [],
            buildingIds: [],
            buildingPermissions: [],
          },
          isInitialized: true,
        },
      },
    );

    expect(screen.getByText('Denied')).toBeInTheDocument();
    expect(screen.queryByText('Granted content')).not.toBeInTheDocument();
  });

  it('renders nothing (not a crash) when no fallback is given and the permission is missing', () => {
    const { container } = renderWithProviders(
      <RequirePermission permission="user.view">
        <span>Granted content</span>
      </RequirePermission>,
      {
        auth: {
          user: {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Test User',
            tenantId: 'tenant-1',
            roles: [],
            permissions: [],
            buildingIds: [],
            buildingPermissions: [],
          },
          isInitialized: true,
        },
      },
    );

    expect(container).toBeEmptyDOMElement();
  });
});
