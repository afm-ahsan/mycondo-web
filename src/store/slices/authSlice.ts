import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
  buildingIds: string[];
}

export interface AuthState {
  user: AuthUser | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionRestored(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isInitialized = true;
    },
    sessionStarted(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isInitialized = true;
    },
    sessionEnded(state) {
      state.user = null;
      state.isInitialized = true;
    },
    initializationFinished(state) {
      state.isInitialized = true;
    },
  },
});

export const { sessionRestored, sessionStarted, sessionEnded, initializationFinished } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
