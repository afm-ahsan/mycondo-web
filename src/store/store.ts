import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/api/baseApi';
import { platformBaseApi } from '@/api/platformBaseApi';
import { authReducer } from './slices/authSlice';
import { platformAuthReducer } from './slices/platformAuthSlice';

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  [platformBaseApi.reducerPath]: platformBaseApi.reducer,
  auth: authReducer,
  platformAuth: platformAuthReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function createStore(preloadedState?: Partial<RootState>) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(baseApi.middleware, platformBaseApi.middleware),
    preloadedState,
  });

  setupListeners(store.dispatch);
  return store;
}

export const store = createStore();

export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];
