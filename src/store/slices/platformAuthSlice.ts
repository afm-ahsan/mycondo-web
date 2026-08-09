import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Deliberately a separate slice from authSlice.ts — no TenantId field exists on this shape at all
// (not merely unset), matching PlatformAuthenticatedUserDto on the backend. See mycondo-docs ADR-019.
export interface PlatformAuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export interface PlatformAuthState {
  user: PlatformAuthUser | null;
  isInitialized: boolean;
}

const initialState: PlatformAuthState = {
  user: null,
  isInitialized: false,
};

const platformAuthSlice = createSlice({
  name: 'platformAuth',
  initialState,
  reducers: {
    platformSessionRestored(state, action: PayloadAction<PlatformAuthUser>) {
      state.user = action.payload;
      state.isInitialized = true;
    },
    platformSessionStarted(state, action: PayloadAction<PlatformAuthUser>) {
      state.user = action.payload;
      state.isInitialized = true;
    },
    platformSessionEnded(state) {
      state.user = null;
      state.isInitialized = true;
    },
    platformInitializationFinished(state) {
      state.isInitialized = true;
    },
  },
});

export const {
  platformSessionRestored,
  platformSessionStarted,
  platformSessionEnded,
  platformInitializationFinished,
} = platformAuthSlice.actions;
export const platformAuthReducer = platformAuthSlice.reducer;
