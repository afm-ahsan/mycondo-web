# MyCondo — Web

## Project Overview

MyCondo is a multi-tenant SaaS building automation and property management platform delivered to ARP Flat Owner's Association under proposal MC-PROP-2026-001 (fixed-price BDT 2,50,000, 24 weeks). This repo is the **frontend SPA**: React + TypeScript + Vite + Metronic, calling the backend API at https://github.com/afm-ahsan/mycondo-api.

## Tech Stack

- **React 19** + **TypeScript 5.9+ strict** + **Vite 7**
- **Metronic React Vite Template** (kept as the design system / layout base)
- **Tailwind CSS v4** (utility-first, complements Metronic)
- **Redux Toolkit + RTK Query** for server state and store
- **React Hook Form + Zod** for forms + validation
- **React Router v7** for routing
- **`@microsoft/signalr`** for real-time
- **OpenAPI codegen**: `openapi-typescript` + `@rtk-query/codegen-openapi` (consumes `mycondo-api`'s `/openapi/v1.json`)
- **Vitest + React Testing Library** for unit tests
- **Playwright** for E2E

> Note: the upstream Metronic template ships with TanStack Query, Auth0, Supabase, and Formik. We swap **TanStack Query → RTK Query**, **Auth0/Supabase → our JWT auth**, and **Formik → React Hook Form** during Phase 3 foundation work. The convention library at `docs/conventions/02-frontend/` is the source of truth.

## Project Structure

```
mycondo-web/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── auth/                       # Metronic auth scaffolding (kept; adapted to our JWT)
│   ├── components/                 # Metronic UI components (kept)
│   ├── modules/                    # Business modules (mirror backend module names 1:1)
│   │   └── <feature>/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── api/                # RTK Query slice for this module
│   │       └── types.ts
│   ├── store/                      # Redux store + typed hooks
│   ├── api/                        # Shared RTK Query base + generated client
│   ├── lib/                        # Cross-cutting helpers (env, signalr, i18n, auth)
│   └── (Metronic-supplied folders kept as-is: layouts/, providers/, routing/, partials/, hooks/, errors/)
├── e2e/                            # Playwright
└── docs/
    └── conventions/                # Convention library (duplicated from template)
```

## Conventions

**This project follows the convention library at `docs/conventions/`. Read it before generating, modifying, or reviewing code.**

Most relevant files:
- Foundation: `docs/conventions/00-foundation/`
- Frontend: `docs/conventions/02-frontend/`
- API design: `docs/conventions/04-api-design/`
- Security: `docs/conventions/05-security/`

When the conventions specify a rule, **follow it**. Project-specific overrides are listed below.

## Module Layout (mirrors backend 1:1)

| Backend module                     | Frontend folder           |
|-----------------------------------|---------------------------|
| `MyCondo.Modules.Tenancy`         | `src/modules/tenancy/`    |
| `MyCondo.Modules.Identity`        | `src/modules/identity/`   |
| `MyCondo.Modules.Property`        | `src/modules/property/`   |
| `MyCondo.Modules.Residents`       | `src/modules/residents/`  |
| `MyCondo.Modules.Leasing`         | `src/modules/leasing/`    |
| `MyCondo.Modules.Billing`         | `src/modules/billing/`    |
| `MyCondo.Modules.Payments`        | `src/modules/payments/`   |
| `MyCondo.Modules.Expenses`        | `src/modules/expenses/`   |
| `MyCondo.Modules.Vendors`         | `src/modules/vendors/`    |
| `MyCondo.Modules.Payroll`         | `src/modules/payroll/`    |
| `MyCondo.Modules.Complaints`      | `src/modules/complaints/` |
| `MyCondo.Modules.Notifications`   | `src/modules/notifications/` |
| `MyCondo.Modules.Documents`       | `src/modules/documents/`  |
| `MyCondo.Modules.Reporting`       | `src/modules/reporting/`  |
| `MyCondo.Modules.Amenities` (P2)  | `src/modules/amenities/`  |
| `MyCondo.Modules.Maintenance` (P2)| `src/modules/maintenance/`|
| `MyCondo.Modules.Security` (P2)   | `src/modules/security/`   |

## Common Commands

```powershell
npm install
npm run dev                       # Vite dev server on http://localhost:5173
npm run typecheck
npm run lint
npm test                          # Vitest
npm run test:e2e                  # Playwright (requires API running)
npm run build
npm run preview                   # serve the built bundle
```

## Required Frontend Env (`.env`)

```
VITE_MYCONDO_API_BASE_URL=http://localhost:5000
VITE_MYCONDO_APP_NAME=MyCondo
VITE_MYCONDO_ENV=development
```

## Always Do

- Use **strict TypeScript**; no `any`, no `@ts-ignore` without comment justifying it.
- Put **server state in RTK Query**, never copy it into Redux slices.
- Validate every form with **Zod** + React Hook Form; map server errors to `form.setError`.
- Keep modules independent — module A imports from module B only via its public surface (`module/index.ts`).
- Use Metronic's existing layout shell; don't fork it.

## Never Do

- **Never store JWTs in `localStorage`.** Refresh token in HTTP-only cookie; access token in memory.
- **Never default-export non-router components.** Named exports only.
- **Never `any`.** Use `unknown` + narrowing if types are genuinely unknown.
- **Never commit secrets** or hardcode `MYCONDO_*` values.
- **Never use TanStack Query, Formik, Auth0, or Supabase** in new code — they ship with the Metronic template but are being replaced.

## Project-Specific Overrides

These deviate from the conventions library; an ADR will be added before Phase 2 work begins.

- **Two-repo layout** (this repo + `mycondo-api`) instead of monorepo. Per proposal §03.
- **React 19** instead of React 18.3 (convention default). Metronic template ships with React 19; downgrading is risky and React 19 is the natural evolution.
- **TanStack Query / Auth0 / Supabase / Formik are present in `package.json` from the upstream template** but **must not be used in our code**. We migrate to RTK Query / our JWT auth / React Hook Form during Phase 3.

## Useful Links

- Backend repo: https://github.com/afm-ahsan/mycondo-api
- Backend OpenAPI spec (when running locally): http://localhost:5000/openapi/v1.json
- Backend API docs UI: http://localhost:5000/scalar
