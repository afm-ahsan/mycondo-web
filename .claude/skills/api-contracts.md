---
name: api-contracts
description: How the frontend consumes the backend's OpenAPI contract — codegen tooling, RTK Query slice pattern, and what to do since the backend has no business endpoints yet.
---

# Consuming Backend API Contracts

## Codegen

`openapi-typescript` (types) + `@rtk-query/codegen-openapi` (RTK Query hooks), generating from
`mycondo-api`'s `/openapi/v1.json` (served locally at `http://localhost:5000/openapi/v1.json`, UI at
`/scalar`). Never hand-write a type or fetch call for something the backend already exposes via
OpenAPI — regenerate the client instead. Generated output lives under `src/generated/api/` (per the
target structure) or wherever the current codegen config points — check
`@rtk-query/codegen-openapi`'s config file for the actual output path before assuming.

## Current reality (2026-07-28)

The backend has **no business endpoints yet** — only health checks and the OpenAPI/Scalar UI exist.
The Auth commands (Login/Register/RefreshToken/Logout) are implemented backend-side but not wired to
HTTP. This means there is currently nothing real to codegen against beyond the empty/near-empty
OpenAPI document. Don't build frontend API-consumption code against imagined future endpoints — wait
for `mycondo-api` to actually expose them, or coordinate the backend endpoint work as the same task.

## Error handling

Map the backend's Problem Details error contract (`type`, `title`, `status`, `code`, `detail`,
`correlationId`, `errors`) to form field errors via `form.setError` (React Hook Form) and to toast/
banner messages for non-field errors. `src/api/errors.ts` already has an `ApiError` shape and a
`toUserMessage` helper — extend that rather than parsing Problem Details ad hoc per call site.

## Auth

Access token in memory, refresh token in an HTTP-only cookie — never `localStorage`. `baseApi.ts`
already implements JWT-aware fetch with auto-refresh; new API slices should build on top of it, not
duplicate the auth-header/refresh logic.
