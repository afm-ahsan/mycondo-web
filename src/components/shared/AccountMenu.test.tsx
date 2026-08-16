import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountMenu } from './AccountMenu';

function renderMenu(props: Partial<React.ComponentProps<typeof AccountMenu>> = {}) {
  return render(
    <MemoryRouter>
      <AccountMenu
        trigger={<button>Open menu</button>}
        displayName="Jane Doe"
        displayEmail="jane@example.com"
        avatarUrl="/media/avatars/blank.png"
        onLogout={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('AccountMenu', () => {
  it('renders a My Profile link pointing at profileHref when provided', async () => {
    const user = userEvent.setup();
    renderMenu({ profileHref: '/me/profile' });

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const profileLink = await screen.findByRole('menuitem', { name: /my profile/i });
    expect(profileLink).toHaveAttribute('href', '/me/profile');
  });

  it('omits the My Profile item when profileHref is not provided', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    await screen.findByText('jane@example.com');
    expect(screen.queryByRole('menuitem', { name: /my profile/i })).not.toBeInTheDocument();
  });

  it('shows Language as a fixed, non-interactive "English" row', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    await screen.findByText('Language');
    expect(screen.getByText('English')).toBeInTheDocument();
    // Static, not a switcher — no menu item/trigger role wraps the label.
    expect(screen.queryByRole('menuitem', { name: /language/i })).not.toBeInTheDocument();
  });

  it('still renders Dark Mode toggle and Logout', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(await screen.findByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('asks for confirmation before logging out, and only calls onLogout after confirming', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderMenu({ onLogout });

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(onLogout).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Are you sure you want to log out?');

    await user.click(screen.getByRole('button', { name: 'Yes, Log Out' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('closing the confirmation via Cancel does not log out', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderMenu({ onLogout });

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    await screen.findByRole('alertdialog');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onLogout).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
