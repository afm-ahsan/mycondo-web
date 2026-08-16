import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BangladeshPhoneInput } from './BangladeshPhoneInput';

function ControlledPhoneInput({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return <BangladeshPhoneInput aria-label="Phone Number" value={value} onChange={setValue} />;
}

describe('BangladeshPhoneInput', () => {
  it('renders the fixed +880 prefix', () => {
    render(<ControlledPhoneInput />);
    expect(screen.getByText('+880')).toBeInTheDocument();
  });

  it('shows only the local digits for a canonical value', () => {
    render(<ControlledPhoneInput initialValue="+8801323993388" />);
    expect(screen.getByLabelText('Phone Number')).toHaveValue('1323993388');
  });

  it('sanitizes typed input immediately, stripping formatting characters', async () => {
    const user = userEvent.setup();
    render(<ControlledPhoneInput />);
    const input = screen.getByLabelText('Phone Number');

    await user.type(input, '1323-993-388');

    expect(input).toHaveValue('1323993388');
  });

  it('caps typed input at 10 local digits', async () => {
    const user = userEvent.setup();
    render(<ControlledPhoneInput />);
    const input = screen.getByLabelText('Phone Number');

    await user.type(input, '13239933888');

    expect(input).toHaveValue('1323993388');
  });

  it.each([
    ['+8801323993388', '1323993388'],
    ['+880-1323-993-388', '1323993388'],
    ['01323993388', '1323993388'],
    ['8801323993388', '1323993388'],
  ])('normalizes a pasted value %s to %s without double-prefixing', async (pasted, expectedLocal) => {
    const user = userEvent.setup();
    render(<ControlledPhoneInput />);
    const input = screen.getByLabelText('Phone Number');

    await user.click(input);
    await user.paste(pasted);

    expect(input).toHaveValue(expectedLocal);
  });

  it('drops letters instead of producing a fake-looking number', async () => {
    const user = userEvent.setup();
    render(<ControlledPhoneInput />);
    const input = screen.getByLabelText('Phone Number');

    await user.type(input, 'abcdefghij');

    expect(input).toHaveValue('');
  });
});
