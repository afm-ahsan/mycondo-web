// Platform-scope analogue of tenantSession.ts. The mycondo_platform_rt refresh cookie is HttpOnly —
// JS can't read it to decide whether a silent-refresh attempt is worth making. This hint is not a
// credential, just "did we last leave this browser with an active platform session" — safe to keep in
// sessionStorage so usePlatformSessionBootstrap/platformBaseQueryWithRefresh can skip calling
// /platform/auth/refresh when there's clearly nothing to restore (first visit, or after logout).
// Deliberately a separate storage key from tenantSession.ts's — see mycondo-docs ADR-019 on keeping
// platform and tenant auth state from ever crossing over.
const STORAGE_KEY = 'mycondo:hasPlatformSession';

export function markPlatformSessionActive(): void {
  sessionStorage.setItem(STORAGE_KEY, '1');
}

export function hasPlatformSessionHint(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function clearPlatformSessionHint(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
