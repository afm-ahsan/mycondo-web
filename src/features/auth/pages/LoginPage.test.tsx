import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { renderWithProviders } from '@/test/renderWithProviders';
import { LoginPage } from './LoginPage';

describe('LoginPage — accessibility smoke', () => {
  it('has no detectable axe violations', async () => {
    const { container } = renderWithProviders(<LoginPage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('LoginPage — password toggle accessible name', () => {
  it('names the toggle by its action and updates the name when toggled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');

    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });
});
