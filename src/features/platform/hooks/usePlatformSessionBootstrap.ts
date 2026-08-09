import { useEffect, useRef } from 'react';
import { setPlatformAccessToken } from '@/api/platformBaseApi';
import { useAppDispatch } from '@/store/hooks';
import { platformInitializationFinished, platformSessionRestored } from '@/store/slices/platformAuthSlice';
import { toPlatformAuthUser, usePlatformRefresh } from '../api/platformAuthApi';

/**
 * Platform-scope analogue of useSessionBootstrap — simpler, since the platform refresh call needs no
 * request body at all (no tenantId-equivalent to persist client-side; the mycondo_platform_rt
 * HttpOnly cookie is the only signal). A rejected/missing-cookie refresh just means "no active
 * platform session," not an error.
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

    refresh()
      .unwrap()
      .then((response) => {
        setPlatformAccessToken(response.accessToken);
        dispatch(platformSessionRestored(toPlatformAuthUser(response.user)));
      })
      .catch(() => {
        dispatch(platformInitializationFinished());
      });
  }, [dispatch, refresh]);
}
