// The mycondo_rt refresh cookie carries the *token*, not which tenant it belongs to — RefreshRequest
// still needs an explicit tenantId (RLS has no JWT to read pre-auth, same reasoning as ADR-013). This
// is not a credential, just "which org was I last signed into" — safe to keep in sessionStorage so a
// page reload's silent-refresh attempt (useSessionBootstrap) has something to send.
const STORAGE_KEY = 'mycondo:lastTenantId';

export function persistTenantId(tenantId: string): void {
  sessionStorage.setItem(STORAGE_KEY, tenantId);
}

export function readPersistedTenantId(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearPersistedTenantId(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
