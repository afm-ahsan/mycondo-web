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
  /** Optional so the ~60 existing test fixtures that build an AuthUser inline don't all need updating
   * for an MVP-1 field addition; real sessions always populate it via toAuthUser below. */
  avatarUrl?: string | null;
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
    // Dispatched after a successful My Profile update or avatar change so the header dropdown and
    // profile page reflect the new name/avatar immediately — no reload, no re-login. A merge (not a
    // full `sessionRestored`) since the caller only has the fields the mutation actually returned.
    profileUpdated(state, action: PayloadAction<{ name?: string; avatarUrl?: string | null }>) {
      if (!state.user) {
        return;
      }
      if (action.payload.name !== undefined) {
        state.user.name = action.payload.name;
      }
      if (action.payload.avatarUrl !== undefined) {
        state.user.avatarUrl = action.payload.avatarUrl;
      }
    },
  },
});

export const {
  sessionRestored,
  sessionStarted,
  sessionEnded,
  initializationFinished,
  profileUpdated,
} = authSlice.actions;
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
    avatarUrl: dto.avatarUrl ?? null,
  };
}
