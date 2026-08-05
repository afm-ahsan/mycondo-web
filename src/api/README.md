# `src/api/` — RTK Query base + generated client

## What lives here

- `client.ts` — `fetchBaseQuery` configured with `VITE_MYCONDO_API_BASE_URL`, JWT bearer header, correlation-id, automatic refresh on 401.
- `baseApi.ts` — the empty `createApi(...)` instance every module's slice extends via `.injectEndpoints()`.
- `errors.ts` — `ApiError` parser + `toUserMessage` helper (per `docs/conventions/04-api-design/03-error-responses.md`).
- `generated/` — output of `npm run codegen` from the backend's `/openapi/v1.json`. **Do not edit by hand**; regenerate.

## Workflow

1. Backend changes a contract → OpenAPI spec at `https://localhost:7219/openapi/v1.json` updates (port per `docs/local-development-ports.md`).
2. Run `npm run codegen` here → `src/api/generated/` rewrites.
3. Module's `api/` slice extends `baseApi` and consumes the generated types.
4. Type errors surface immediately — that's the point.

## Phase 3 work

This folder is currently empty. Phase 3 (foundation infra) wires it up. Tracking item in `docs/kickoff.md`.
