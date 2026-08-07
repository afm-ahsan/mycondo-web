import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { PageHeader } from './PageHeader';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('PageHeader', () => {
  it('renders the title and, when given one, the description', () => {
    renderWithRouter(<PageHeader title="Users" description="Everyone in this tenant." />);
    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByText('Everyone in this tenant.')).toBeInTheDocument();
  });

  it('renders breadcrumb items as links except the last, which is the current page', () => {
    renderWithRouter(
      <PageHeader
        title="New Booking"
        crumbs={[
          { label: 'Facilities', path: '/facilities' },
          { label: 'Community Hall', path: '/facilities/community-hall' },
          { label: 'New Booking' },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Facilities' })).toHaveAttribute('href', '/facilities');
    expect(screen.getByRole('link', { name: 'Community Hall' })).toHaveAttribute(
      'href',
      '/facilities/community-hall',
    );
    // The last crumb ("New Booking") is the current page — shadcn's BreadcrumbPage keeps role="link"
    // for consistent breadcrumb screen-reader navigation, but marks it non-interactive and current.
    const currentCrumb = screen.getByRole('link', { name: 'New Booking' });
    expect(currentCrumb).toHaveAttribute('aria-current', 'page');
    expect(currentCrumb).toHaveAttribute('aria-disabled', 'true');
    expect(currentCrumb).not.toHaveAttribute('href');
  });

  it('renders primary and secondary actions together in the action area', () => {
    renderWithRouter(
      <PageHeader
        title="Guests"
        secondaryActions={<button type="button">Export</button>}
        primaryAction={<button type="button">New Guest</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Guest' })).toBeInTheDocument();
  });

  it('renders no breadcrumb and no action area when neither is given', () => {
    renderWithRouter(<PageHeader title="Dashboard" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
