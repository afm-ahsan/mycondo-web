import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createStore, type RootState } from '@/store/store';
import { PageHeaderProvider } from '@/providers/page-header-provider';

export function renderWithProviders(ui: ReactElement, preloadedState?: Partial<RootState>) {
  const store = createStore(preloadedState);

  return {
    store,
    ...render(<MemoryRouter>
      <Provider store={store}>
        <PageHeaderProvider>{ui}</PageHeaderProvider>
      </Provider>
    </MemoryRouter>),
  };
}
