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
| `MyCondo.Modules.Operations` (P2) | `src/features/operations/` |
| `MyCondo.Modules.Utilities`       | `src/features/utilities/`  |

`src/features/security/` (as of 2026-08-06): only `guests/` (Guest Register — directory, create,
fast check-in/check-out, currently-inside view) is implemented. The backend's other `Features/
Security/*` areas (Vehicles, DomesticWorkers, ServiceProviders, SebaVisits, Parcels) have a complete,
wired API contract already but **no frontend UI yet** — do not assume they exist.

`src/features/utilities/` (as of 2026-08-08, UX-3): a single shared bounded context for Electricity
and Gas — one `Meter`/`MeterAssignment`/`RatePlan`/`Reading` domain model, differentiated purely by a
`utilityType` prop threaded through every page/component (`MeterDirectoryPage`, `ReadingRegisterPage`,
`ReadingCapturePage`, `ReadingDetailPage`, `RatePlanDirectoryPage`, `RatePlanFormPage`), never
duplicated per utility. Implements Meter install/assign/mark-faulty/reactivate/replace, the reading
lifecycle (Draft → Reviewed → Finalized → Billed, plus terminal Corrected), and Rate Plan
create/deactivate/end-effective-period (`RatePlanFormPage` is create-only — `RatePlanDto` is
immutable after creation, same pattern as `ServiceChargeRule`). Billing (`billReadingIdempotent`) and
Correction (`correctReadingIdempotent`) use the shared idempotency-key infrastructure since both can
mutate an invoice and the resident ledger. The Reading Register is deliberately meter-scoped (pick a
building, then a meter, to see its register) because `GET /api/v1/readings` has no `buildingId`/
`utilityType` filter of its own — a disclosed, not-yet-closed API gap (see UX-3 evidence report).

`src/features/amenities/` (as of 2026-08-07, Slice G — merged to `main` in both repos): Community
Hall Booking (calendar, list, create, details with the full approve/reject/pay/check-in/complete/
inspect/cancel/no-show action set) and Swimming Pool Management (search-and-check-in/out, current
occupancy, usage history + incidents, combined facility settings) are implemented. **Known backend
contract gaps discovered while building this slice** (not frontend omissions — nothing to build
against): bookings have no update/edit endpoint (a Draft booking can only be Submitted or Cancelled,
never field-edited — requirement "edit while status permits" is unimplementable until a backend
PUT/PATCH exists), `RequestBookingCommand` has no `notes`/add-on-services field at all, there's no
live per-slot availability-check endpoint (conflicts only surface as a 409 on the actual create
call), and no audit-log/event endpoint for a booking's history (the UI timeline is built from the
lifecycle timestamp fields already on `BookingDto`).

`src/features/operations/` (as of 2026-08-07, Slice H — the final register-digitization slice):
Generator Management (operation log with start/stop sessions, fuel log, maintenance schedule +
service history + breakdown log, runtime/fuel/cost-per-hour + maintenance-due reports, plus a
"Manage Generators" dialog off the Operation Log page for master create/edit/deactivate — no menu
slot exists for it, same placement pattern as Slice G's Facility settings) and Gas Cylinder
Management (purchases with the full approve/reject/mark-paid workflow and server-computed
TotalKg/LineAmount/UnitPricePerKg/GrandTotal, stock movements + controlled adjustments + monthly
reconciliation, consumption report, supplier comparison report) are implemented. Supplier master
data has create-only UI (a "New Supplier" action on the Purchases page); the backend's
update/deactivate/reactivate supplier endpoints exist but have no frontend UI yet — a known,
disclosed limitation, not an oversight. **No contract mismatches found** between the backend and the
regenerated OpenAPI client for this slice — every generated hook, computed field
(`totalKg`/`lineAmount`/`unitPricePerKg`/`grandTotal`), and permission string matched the backend
exactly on the first regeneration.

`src/features/leasing/` (as of 2026-08-07, Tenant Registration — merged to `main` in both repos via
PR #3): a 5-step guided wizard (Property & Occupant → Contact & Identity → Household → Documents →
Review & Submit) replacing the paper Flat Owner/Tenant Registration Form, plus a status-filterable
list page and a detail/review page with the owner-review → management-verification → activate/
move-out action set and a real status-history timeline (backend-persisted, not a timestamp
reconstruction like `ApprovalTimeline`). **Priority 2** (also delivered): Domestic Worker assignment,
Driver assignment (no separate Driver aggregate — a `DomesticWorkerProfile` with
`WorkerType.Driver`, assigned through the same worker-assignment endpoint), Vehicle assignment, a
restricted Security Directory (`SecurityDirectoryPage`, DTOs structurally omit NID/passport/address/
email — the fields simply don't exist on the type), move-out cascade that ends every active worker/
vehicle assignment and deactivates every household member in one transaction, live-computed (not
persisted) access eligibility, and a printable English registration form (`@media print`, A4, no PDF
library — see architecture decisions below). Domain/permission names use `OccupancyRegistration`/
`occupancy-registration.*` rather than `TenantRegistration` to avoid colliding with this app's own
multi-tenancy vocabulary (`TenantId`, `tenant.manage`) — "Tenant Registration" remains the label used
everywhere in UI copy and menu titles; see mycondo-api's `OccupancyRegistration` doc comment for the
full rationale. Sensitive fields (National ID/passport) are masked server-side via `IdentityMasking`,
matching the `GuestProfileDto`/`DomesticWorkerProfileDto` precedent — no unmasked value is ever
returned by any endpoint this feature calls; replacing a stored NID requires the user to type a full
new value (the raw value can never be redisplayed to pre-fill the form).

**Known limitations (explicitly disclosed, not oversights):**
1. Document upload records file metadata only (name/type/size against a synthetic storage key) —
   mycondo-api's `Attachments` feature has no real object-storage upload path yet (see `Attachment`'s
   doc comment); the wizard's Documents step says so plainly rather than pretending files are stored
   anywhere. App-wide gap, not specific to this feature.
2. No dedicated frontend idempotency-key plumbing for Tenant Registration's mutating requests.
3. A previously stored masked NID cannot be recovered for editing; replacement requires a full new
   value (by design — see masking discipline above).
4. Docker-dependent `MyCondo.MultiTenancyTests`/parts of `MyCondo.Api.IntegrationTests` remain
   unavailable without a local Docker daemon (Testcontainers) — pre-existing environment gap, not a
   regression from this feature.
5. Status changes surface via the existing `OccupancyRegistrationStatusHistory` audit trail rather
   than a new/parallel notification framework (approved architecture decision, not a gap).
6. Print support uses browser/A4 `@media print` rather than server-generated PDF (approved
   architecture decision).
7. **The printable form covers 29 of the 45 fields on the full paper-form checklist** — Father's/
   Mother's Name, Marital Status, Profession, Employer/Office Address, household member Occupation,
   driver Licence information, Property name (single-property system, so not applicable), Passport as
   a field distinct from National ID, Emergency Contact Relationship/Address, Unit lease Start/End
   dates, Previous residence/landlord information, and a vehicle's linked driver were never part of
   the Priority 1/2 data model (`OccupancyRegistration`/`HouseholdMember` only capture the fields
   listed in the domain entity). This was true from initial delivery and confirmed unchanged during
   the 2026-08-07 finalization review — not a regression, but not previously written down either.

**Finalization review (2026-08-07, post-merge):** two genuine defects were found and fixed via small
follow-up branches (both repos' `feat/tenant-registration` had already been merged to `main` by the
time the review ran, so fixes landed on new branches off `main` rather than amending the merged PRs):
`fix/tenant-registration-move-in-date` (mycondo-web) — Step 2 of the wizard was hardcoding
`moveInExpectedDate: null` on every save, silently wiping the date entered in Step 1 on every
registration; and `fix/tenant-registration-nid-preserve-on-blank` (mycondo-api) — resuming a draft and
saving Step 2 without retyping the (deliberately blank) NID field silently cleared a previously
recorded NID, since `UpdateDraft` treated "not provided" the same as "clear it." Both are fixed,
tested, and pushed; neither has been merged (awaiting review, per standing policy).

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
