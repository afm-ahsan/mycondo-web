import { useEffect, useRef } from 'react';
import { setAccessToken } from '@/api/baseApi';
import { useAppDispatch } from '@/store/hooks';
import { initializationFinished, sessionRestored } from '@/store/slices/authSlice';
import { toAuthUser, useRefreshSession } from '../api/authApi';
import { clearPersistedTenantId, readPersistedTenantId } from '../lib/tenantSession';

/**
 * Attempts a silent session restore on app mount, before any protected route renders — the
 * mycondo_rt HttpOnly cookie carries the actual refresh token; this only needs to supply the
 * tenantId RefreshRequest requires (see tenantSession.ts). No persisted tenantId, or a rejected
 * refresh, both mean "no active session" (the expected state on a first visit), not an error —
 * either way ends in `initializationFinished`, which RequireAuth/RequirePermission gate on.
 */
export function useSessionBootstrap(): void {
  const dispatch = useAppDispatch();
  const [refreshSession] = useRefreshSession();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) {
      return;
    }
    attempted.current = true;

    const tenantId = readPersistedTenantId();
    if (!tenantId) {
      dispatch(initializationFinished());
      return;
    }

    refreshSession({ refreshRequest: { tenantId } })
      .unwrap()
      .then((response) => {
        setAccessToken(response.accessToken);
        dispatch(sessionRestored(toAuthUser(response.user)));
      })
      .catch(() => {
        clearPersistedTenantId();
        dispatch(initializationFinished());
      });
  }, [dispatch, refreshSession]);
}
