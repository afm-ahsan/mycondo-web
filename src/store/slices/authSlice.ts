import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthenticatedUserDto } from '@/api/generated/mycondoApi';

export interface BuildingPermission {
  buildingId: string;
  permission: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  buildingIds: string[];
  buildingPermissions: BuildingPermission[];
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

/**
 * Maps the wire DTO (Login/Register/Refresh response's `user` field) to Redux's AuthUser shape.
 * Lives here (not authApi.ts) so baseApi.ts's silent-refresh path can reuse it without a module
 * cycle — baseApi.ts already imports the session actions from this file, and generated
 * mycondoApi.ts imports baseApi.ts, so this file must not import anything from authApi.ts.
 */
export function toAuthUser(dto: AuthenticatedUserDto): AuthUser {
  return {
    id: dto.userId,
    email: dto.email,
    name: dto.fullName,
    tenantId: dto.tenantId,
    roles: dto.roles,
    permissions: dto.permissions,
    buildingIds: dto.buildingIds,
    buildingPermissions: dto.buildingPermissions,
  };
}
