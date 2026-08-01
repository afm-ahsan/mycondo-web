import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createStore, type RootState } from '@/store/store';

export function renderWithProviders(ui: ReactElement, preloadedState?: Partial<RootState>) {
  const store = createStore(preloadedState);

  return {
    store,
    ...render(<MemoryRouter>
      <Provider store={store}>{ui}</Provider>
    </MemoryRouter>),
  };
}
