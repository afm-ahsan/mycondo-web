import type { FetchArgs } from '@reduxjs/toolkit/query/react';

/**
 * The user-facing intent behind an HTTP request — distinct from the transport-level HTTP verb. A
 * `POST /search` is a search, not a save; `GET /residents?search=ahsan` is a search, not a load. This
 * is the sole vocabulary the global loader (global-http-loader.tsx) speaks — do not invent additional
 * words or scatter these strings into feature components.
 */
export type HttpOperation = 'load' | 'save' | 'update' | 'delete' | 'search';

/** Text the global loader shows for each operation — the one place this vocabulary is defined. */
export const HTTP_OPERATION_LABEL: Record<HttpOperation, string> = {
  load: 'Loading',
  save: 'Saving',
  update: 'Updating',
  delete: 'Deleting',
  search: 'Searching',
};

/**
 * `FetchArgs` extended with an optional explicit operation override, for the handful of hand-authored
 * endpoints (src/api/idempotentEndpoints.ts) where the HTTP method is a poor signal of intent — every
 * idempotency-key mutation is forced onto POST regardless of whether it's really creating a record
 * (RecordPayment) or correcting one (ReversePayment, VoidInvoice, CorrectReading). Generated endpoints
 * (src/api/generated/mycondoApi.ts) never set this — those are classified by resolveHttpOperation.
 */
export type AppFetchArgs = FetchArgs & { operation?: HttpOperation };

// Session-lifecycle calls happen underneath the CondoBD branded loader (bootstrap) or as a silent
// background token refresh — never a user-initiated mutation the "Saving…" HTTP-method fallback would
// otherwise imply for a POST. Deliberately narrow: only login/refresh/logout, not every /auth/* route
// (e.g. PUT /auth/me "Update Profile" and POST /auth/register "Register Tenant" are genuine
// save/update actions the user explicitly submitted, and should read as such).
const SESSION_LIFECYCLE_URL_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/platform/auth/login',
  '/api/v1/platform/auth/refresh',
  '/api/v1/platform/auth/logout',
];

function hasSearchIntent(url: string, params: Record<string, unknown> | undefined): boolean {
  if (url.replace(/\/+$/, '').toLowerCase().endsWith('/search')) return true;
  const value = params?.search ?? params?.searchText;
  return typeof value === 'string' && value.trim().length > 0;
}

function fromMethod(method: string): HttpOperation {
  switch (method) {
    case 'POST':
      return 'save';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'load';
  }
}

/**
 * Resolves the semantic operation for a request, in precedence order:
 *   1. an explicit `operation` on the args (hand-authored endpoints only);
 *   2. known application conventions — the session-lifecycle exclusion above, and search-intent
 *      detection via a truthy `search`/`searchText` param or a `/search` URL suffix;
 *   3. HTTP-method fallback (GET→load, POST→save, PUT/PATCH→update, DELETE→delete).
 * Never infer solely from the HTTP verb — see the module doc comment.
 */
export function resolveHttpOperation(args: string | AppFetchArgs): HttpOperation {
  if (typeof args === 'string') return 'load';
  if (args.operation) return args.operation;

  const method = (args.method ?? 'GET').toUpperCase();

  if (SESSION_LIFECYCLE_URL_PREFIXES.some((prefix) => args.url.startsWith(prefix))) {
    return 'load';
  }

  if (hasSearchIntent(args.url, args.params)) {
    return 'search';
  }

  return fromMethod(method);
}

/**
 * Strips the `operation` override field before handing args off to `fetchBaseQuery` — it isn't a real
 * `FetchArgs` member, and fetchBaseQuery spreads unrecognized args straight into the `RequestInit`
 * passed to `fetch()`.
 */
export function stripOperation(args: AppFetchArgs): FetchArgs {
  const rest = { ...args };
  delete rest.operation;
  return rest;
}
