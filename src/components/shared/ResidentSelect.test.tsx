import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ResidentSelect } from './ResidentSelect';

describe('ResidentSelect — form-control prop forwarding', () => {
  it('forwards id, aria-describedby, aria-invalid, and aria-required to the trigger button', () => {
    renderWithProviders(
      <ResidentSelect
        value={null}
        onChange={() => {}}
        id="resident"
        aria-describedby="resident-hint"
        aria-invalid
        aria-required
      />,
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('id', 'resident');
    expect(trigger).toHaveAttribute('aria-describedby', 'resident-hint');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-required', 'true');
  });

  it('omits those attributes when the caller does not pass them, instead of forcing empty values', () => {
    renderWithProviders(<ResidentSelect value={null} onChange={() => {}} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).not.toHaveAttribute('aria-required');
  });
});
