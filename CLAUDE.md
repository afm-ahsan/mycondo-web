# MyCondo — Web

## Project Overview

MyCondo is a multi-tenant SaaS building automation and property management platform delivered to ARP Flat Owner's Association under proposal MC-PROP-2026-001 (fixed-price BDT 2,50,000, 24 weeks). This repo is the **frontend SPA**: React + TypeScript + Vite + Metronic, calling the backend API at https://github.com/afm-ahsan/mycondo-api.

**Governance baseline:** see `../mycondo-docs/02-architecture/CURRENT_STATE_ASSESSMENT.md`,
`TARGET_ARCHITECTURE.md`, and `Architecture_Decision_Register.md` (established 2026-07-28, Wave 0).
Notably, ADR-005 (RTK Query, approved 2026-07-28 — resolved a conflict with the governing strategy
document's TanStack Query recommendation) and ADR-006 (`modules/` → `features/` rename, executed
2026-07-28) are both settled; see the register for the reasoning if you need it.

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
│   ├── features/                   # Business features (mirror backend module names 1:1; renamed from modules/ 2026-07-28, ADR-006)
│   │   └── <feature>/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── api/                # RTK Query slice for this feature
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

## Feature Layout (mirrors backend 1:1)

| Backend module                     | Frontend folder           |
|-----------------------------------|---------------------------|
| `MyCondo.Modules.Tenancy`         | `src/features/tenancy/`    |
| `MyCondo.Modules.Identity`        | `src/features/identity/`   |
| `MyCondo.Modules.Property`        | `src/features/property/`   |
| `MyCondo.Modules.Security`        | `src/features/security/`   |
| `MyCondo.Modules.Residents`       | `src/features/residents/`  |
| `MyCondo.Modules.Leasing`         | `src/features/leasing/`    |
| `MyCondo.Modules.Billing`         | `src/features/billing/`    |
| `MyCondo.Modules.Payments`        | `src/features/payments/`   |
| `MyCondo.Modules.Expenses`        | `src/features/expenses/`   |
| `MyCondo.Modules.Vendors`         | `src/features/vendors/`    |
| `MyCondo.Modules.Payroll`         | `src/features/payroll/`    |
| `MyCondo.Modules.Complaints`      | `src/features/complaints/` |
| `MyCondo.Modules.Notifications`   | `src/features/notifications/` |
| `MyCondo.Modules.Documents`       | `src/features/documents/`  |
| `MyCondo.Modules.Reporting`       | `src/features/reporting/`  |
| `MyCondo.Modules.Amenities` (P2)  | `src/features/amenities/`  |
| `MyCondo.Modules.Maintenance` (P2)| `src/features/maintenance/`|

`src/features/security/` (as of 2026-08-06): only `guests/` (Guest Register — directory, create,
fast check-in/check-out, currently-inside view) is implemented. The backend's other `Features/
Security/*` areas (Vehicles, DomesticWorkers, ServiceProviders, SebaVisits, Parcels) have a complete,
wired API contract already but **no frontend UI yet** — do not assume they exist. Community Hall
booking, Swimming Pool, Generator, and Gas Cylinder management have no backend implementation at all
as of this date (confirmed by repo-wide search of `mycondo-api`) and are blocked on backend work
before any frontend slice can start.

## Common Commands

```powershell
npm install
npm run dev                       # Vite dev server on http://localhost:4219
npm run lint                      # eslint --fix
npm run build                     # tsc typecheck + vite build (no separate `typecheck` script exists)
npm run preview                   # serve the built bundle
npm test                          # vitest run
npm run test:watch                # vitest (watch mode)
```

**As of 2026-08-06 (Wave 0.5, Security/Guest Register slice), Vitest + React Testing Library + MSW
are installed and wired** (`vitest.config.ts`, `src/test/setup.ts`, `src/test/server.ts`,
`src/test/renderWithProviders.tsx`) — `npm test` runs the suite. Tests are colocated
`<PageName>.test.tsx` next to the component they cover; see `src/features/identity/pages/
RolePermissionMatrixPage.test.tsx` or `src/features/security/guests/pages/
GuestCheckInOutPage.test.tsx` for the pattern (MSW `http.get/post` handlers +
`renderWithProviders` + `userEvent`). There is still no separate `typecheck` script (`npm run build`
remains the way to catch type errors) and no Playwright/`test:e2e` script yet — that gap is tracked
as `mycondo-docs/07-delivery/MASTER_BACKLOG.md` PF-5.

## Required Frontend Env (`.env`)

```
VITE_MYCONDO_API_BASE_URL=https://localhost:7219
VITE_MYCONDO_APP_NAME=MyCondo
VITE_MYCONDO_ENV=development
```

Dev server runs on `http://localhost:4219` (fixed in `vite.config.ts`, not env-driven). See
`docs/local-development-ports.md` for the full reserved-port registry shared with sibling local
projects on this machine.

## Always Do

- Use **strict TypeScript**; no `any`, no `@ts-ignore` without comment justifying it.
- Put **server state in RTK Query**, never copy it into Redux slices.
- Validate every form with **Zod** + React Hook Form; map server errors to `form.setError`.
- Keep features independent — feature A imports from feature B only via its public surface (`feature/index.ts`).
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
- Backend OpenAPI spec (when running locally): https://localhost:7219/openapi/v1.json
- Backend API docs UI: https://localhost:7219/scalar
