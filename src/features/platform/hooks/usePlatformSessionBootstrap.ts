import { useEffect, useRef } from 'react';
import { setPlatformAccessToken } from '@/api/platformBaseApi';
import { useAppDispatch } from '@/store/hooks';
import { platformInitializationFinished, platformSessionRestored } from '@/store/slices/platformAuthSlice';
import { toPlatformAuthUser, usePlatformRefresh } from '../api/platformAuthApi';
import { clearPlatformSessionHint, hasPlatformSessionHint, markPlatformSessionActive } from '../lib/platformSession';

/**
 * Platform-scope analogue of useSessionBootstrap — simpler, since the platform refresh call needs no
 * request body at all (no tenantId-equivalent to persist client-side; the mycondo_platform_rt
 * HttpOnly cookie is the only signal). A rejected/missing-cookie refresh just means "no active
 * platform session," not an error.
 *
 * Skips the refresh call entirely when platformSession.ts has no hint of a prior session (first visit,
 * or after logout) — otherwise every anonymous visit to the platform login page fired a doomed refresh
 * against an empty cookie, which the backend correctly rejects as a validation error (RefreshToken must
 * not be empty) since it can't distinguish "no cookie" from "malformed request" once it reaches Mediator.
 */
export function usePlatformSessionBootstrap(): void {
  const dispatch = useAppDispatch();
  const [refresh] = usePlatformRefresh();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) {
      return;
    }
    attempted.current = true;

    if (!hasPlatformSessionHint()) {
      dispatch(platformInitializationFinished());
      return;
    }

    refresh()
      .unwrap()
      .then((response) => {
        setPlatformAccessToken(response.accessToken);
        markPlatformSessionActive();
        dispatch(platformSessionRestored(toPlatformAuthUser(response.user)));
      })
      .catch(() => {
        clearPlatformSessionHint();
        dispatch(platformInitializationFinished());
      });
  }, [dispatch, refresh]);
}
