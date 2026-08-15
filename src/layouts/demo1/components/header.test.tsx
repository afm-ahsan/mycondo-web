import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { renderWithProviders } from '@/test/renderWithProviders';
import { SettingsProvider } from '@/providers/settings-provider';
import type { AuthUser } from '@/store/slices/authSlice';
import { Header } from './header';

// No permissions: HeaderGlobalSearch/HeaderNotifications render null (both are permission-gated and
// otherwise fire RTK Query requests this test isn't set up to mock), isolating the assertions below
// to layout/composition rather than each utility's own data-fetching behavior.
const viewOnlyUser: AuthUser = {
  id: 'user-1',
  email: 'viewer@example.com',
  name: 'Viewer',
  tenantId: 'tenant-1',
  roles: [],
  permissions: [],
  buildingIds: [],
  buildingPermissions: [],
};

// Header renders inside <Container>, which reads layout width from SettingsProvider — not part of
// renderWithProviders' default stack since no other test target (a bare page component, never the
// layout chrome) needs it.
function renderHeader(ui: ReactElement) {
  return renderWithProviders(<SettingsProvider>{ui}</SettingsProvider>, {
    auth: { user: viewOnlyUser, isInitialized: true },
  });
}

describe('Header', () => {
  it('renders the page breadcrumb on the left and the user avatar as the rightmost utility', () => {
    renderHeader(
      <>
        <Header />
        <PageHeader
          title="Guest Register"
          crumbs={[
            { label: 'Security & Access' },
            { label: 'Visitor Management' },
            { label: 'Guest Register' },
          ]}
        />
      </>,
    );

    const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(breadcrumbNav).toHaveTextContent('Security & Access');
    expect(breadcrumbNav).toHaveTextContent('Visitor Management');
    expect(breadcrumbNav).toHaveTextContent('Guest Register');

    const avatar = screen.getByAltText('User Avatar');
    const quickLinks = screen.getByRole('button', { name: 'Quick links' });

    // Header row order: breadcrumb, then utilities, with the avatar last of all.
    expect(breadcrumbNav.compareDocumentPosition(quickLinks) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(quickLinks.compareDocumentPosition(avatar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders exactly one user avatar — no leftover top-left mount', () => {
    renderHeader(<Header />);
    expect(screen.getAllByAltText('User Avatar')).toHaveLength(1);
  });

  it('renders no breadcrumb when the current page published none', () => {
    renderHeader(<Header />);
    expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).not.toBeInTheDocument();
  });
});
