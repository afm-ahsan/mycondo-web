# MyCondo Web — Claude Code Instructions

This file contains **repository-specific, durable frontend engineering rules** for `mycondo-web`.

Global workflow, Git, token-efficiency, architecture-governance, verification, and communication rules are defined in the root `../CLAUDE.md` and apply here.

Load additional architecture, feature, ADR, or current-state documentation only when required by the task.

---

## 1. Repository Responsibility

`mycondo-web` is the MyCondo React frontend.

Its responsibilities include:

- presentation;
- interaction and navigation;
- client-side form validation;
- API consumption;
- permission-aware UI;
- user feedback;
- responsive behavior;
- accessibility;
- client-side state required for UX.

The backend remains authoritative for:

- business rules;
- tenant isolation;
- permissions;
- financial calculations;
- lifecycle transitions;
- validation that affects business correctness;
- persisted data;
- API contracts.

Never recreate authoritative backend behavior in the frontend.

Frontend validation improves UX; it does not replace backend validation.

---

## 2. Technology Baseline

Use the existing repository stack and versions unless an approved architecture decision changes them.

Core technologies:

- React 19
- TypeScript strict mode
- Vite
- Metronic React
- Tailwind CSS
- Redux Toolkit
- RTK Query
- React Hook Form
- Zod
- React Router
- Microsoft SignalR client
- OpenAPI-generated API contracts
- Vitest
- React Testing Library
- MSW
- Playwright when/where configured

Do not introduce competing libraries for capabilities already standardized by the project.

In particular, do not introduce new usage of:

- TanStack Query;
- Formik;
- Auth0;
- Supabase.

Their presence in upstream/template dependencies does not make them part of MyCondo's application architecture.

---

## 3. Feature-First Structure

Business functionality belongs under:

```text
src/features/<feature>/
```

Prefer feature-local organization such as:

```text
src/features/<feature>/
├── pages/
├── components/
├── hooks/
├── api/
├── schemas/
├── utils/
└── types/
```

Use only the folders a feature actually needs.

Do not create broad global dumping grounds for feature-specific:

- components;
- hooks;
- types;
- schemas;
- utilities;
- API calls.

Shared code belongs outside a feature only when it is genuinely cross-cutting and reused across multiple features.

Do not move code into shared folders merely because sharing might happen later.

---

## 4. Feature Boundaries

Keep features independently understandable and minimally coupled.

Avoid direct imports into another feature's internal folders.

If cross-feature reuse is genuinely required, use the existing public surface or extract a truly shared abstraction to an appropriate shared location.

Do not create circular feature dependencies.

Do not duplicate the same domain concept across multiple frontend features simply to avoid a clean shared boundary.

Follow existing backend bounded-context/module ownership when deciding frontend feature ownership.

---

## 5. Backend Contract Is Authoritative

Do not invent frontend contracts.

Use the backend OpenAPI specification and generated client/types as the source of truth.

When implementing a feature:

1. inspect the relevant generated API contract;
2. verify the backend supports the required operation;
3. use existing generated types/hooks where available;
4. build UI around the actual contract.

If the backend does not expose required functionality:

- do not fake persistence;
- do not create an unofficial client-only business workflow;
- do not invent request/response fields;
- report the contract gap.

A missing backend capability is not solved by pretending it exists in the frontend.

---

## 6. OpenAPI & Generated Client

Generated API contracts should remain aligned with `mycondo-api`.

When the backend contract changes:

1. regenerate/update the frontend API client using the existing repository workflow;
2. inspect the generated diff;
3. update affected frontend code;
4. verify type safety and behavior.

Do not manually maintain duplicate DTOs when generated contract types already exist.

Do not edit generated files unless the established generation workflow explicitly requires it.

Avoid unnecessary API-client regeneration for frontend-only changes.

---

## 7. Server State

Use **RTK Query** for server state.

Examples:

- remote lists;
- entity details;
- mutations;
- loading state;
- request errors;
- cache invalidation;
- API-derived data.

Do not copy RTK Query server state into ordinary Redux slices.

Use Redux slices only for genuine client/global application state that is not naturally owned by the server/API cache.

Prefer component/local state for ephemeral UI state.

Typical ownership:

```text
Server data            → RTK Query
Cross-app client state → Redux slice when justified
Form state             → React Hook Form
Local UI state         → React state
URL/search state       → Router/search params
```

Avoid introducing state layers when existing ownership already solves the problem.

---

## 8. RTK Query Discipline

Follow existing base API and feature endpoint conventions.

For mutations:

- invalidate/update only relevant cache tags;
- avoid unnecessary broad cache invalidation;
- surface server errors consistently;
- prevent accidental duplicate submissions where appropriate.

Use generated hooks/contracts when available rather than creating parallel handwritten API clients.

Do not call `fetch`/Axios directly inside feature components when the established API layer already owns that responsibility.

---

## 9. URL State

Persist user-navigational state in the URL when appropriate, especially:

- search;
- filters;
- pagination;
- sort;
- selected view/tab when shareable/bookmarkable.

Do not put navigational state into Redux merely because multiple components need it.

Preserve useful list state when navigating to detail/edit pages and back where the existing UX pattern supports it.

---

## 10. Forms

Use:

- React Hook Form;
- Zod;
- existing form components/conventions.

Every meaningful form should have a clear schema.

Use Zod for client-side input validation and form typing where appropriate.

Map backend field-validation errors into the relevant form controls using the established error-handling pattern, including `setError` where applicable.

Do not duplicate complex backend invariants in Zod.

Client validation should cover:

- required fields;
- formats;
- obvious ranges;
- immediate UX constraints.

Backend remains authoritative for business validity.

---

## 11. Submission Safety

Mutating forms/actions must provide safe interaction behavior.

As appropriate:

- disable or guard duplicate submission;
- show meaningful loading/progress state;
- avoid firing the same mutation multiple times accidentally;
- preserve form input after recoverable server errors;
- show success/error feedback.

For destructive, irreversible, high-impact, financial, or lifecycle-transition actions, use the project's established confirmation pattern.

Do not add confirmation dialogs to routine low-risk interactions unnecessarily.

---

## 12. Authentication

Use the application's established JWT authentication architecture.

Never store JWT access or refresh tokens in `localStorage`.

Preserve the established security model:

- access token handled according to the existing in-memory auth mechanism;
- refresh token handled through the established secure cookie/server flow.

Do not introduce:

- Auth0;
- Supabase auth;
- alternative authentication state libraries

without explicit architectural approval.

Do not implement frontend workarounds that weaken backend authentication requirements.

---

## 13. Authorization & Permission-Aware UI

The backend is authoritative for authorization.

Frontend permission handling exists to improve UX, not provide security.

Use established permission data/utilities for:

- route availability;
- navigation visibility;
- action/button visibility;
- contextual operations.

Do not hard-code role names where permission checks are authoritative.

Do not assume hiding a button secures an operation.

Never broaden or fabricate frontend permissions to make a feature visible.

If the API returns `403`, treat it as an authorization outcome rather than bypassing the check client-side.

---

## 14. Routing

Follow the existing React Router structure and route conventions.

Business routes should live with or clearly reference their owning feature.

Use the established authenticated/permission-aware routing mechanisms.

Do not introduce an alternative router architecture for isolated features.

Preserve deep-link behavior where possible.

Route-level code should coordinate navigation/rendering, not contain business logic.

---

## 15. Components

Prefer small, focused components with explicit responsibilities.

Keep business-feature components within their feature.

Move a component to a shared location only when it is genuinely reusable across business features.

Prefer composition over highly configurable mega-components.

Do not prematurely generalize a component based on one or two speculative future uses.

Use named exports for ordinary components unless the existing router/lazy-loading convention requires otherwise.

---

## 16. Metronic & Design System

Metronic remains the application's layout/design foundation.

Reuse existing:

- layout shell;
- navigation;
- cards;
- forms;
- tables;
- dialogs;
- typography;
- spacing;
- responsive conventions;
- feedback patterns.

Do not fork or duplicate the Metronic shell for individual features.

Do not create a parallel design system.

When Metronic's default component behavior conflicts with MyCondo usability requirements, prefer a minimal compatible extension rather than wholesale replacement.

Use Tailwind utilities where they complement established components and conventions.

---

## 17. Shared UI Patterns

Before creating new UI primitives, inspect the existing shared implementations.

Reuse established patterns for common needs such as:

- page headers;
- breadcrumbs;
- search/filter controls;
- pagination;
- tables;
- empty states;
- loading states;
- error states;
- confirmation dialogs;
- status badges;
- forms;
- toasts/notifications.

Do not create feature-specific copies of shared patterns without a real requirement.

---

## 18. Tables & Directories

Directory/list pages should follow existing MyCondo list conventions.

As appropriate, support:

- responsive layout;
- search;
- filters;
- pagination;
- loading state;
- empty state;
- error state;
- permission-aware actions.

Avoid unnecessarily dense table layouts on small screens.

Do not assume desktop-only usage.

Preserve backend pagination/filter semantics rather than reimplementing large server datasets client-side.

---

## 19. Responsive UX

All new or materially modified UI must be usable across supported viewport sizes.

Do not validate layout only at desktop width.

Check for:

- horizontal overflow;
- clipped controls;
- unusable tables;
- cramped forms;
- inaccessible action menus;
- modal/dialog overflow;
- header collisions;
- navigation overlap;
- inappropriate fixed widths.

Prefer responsive layout changes over hiding important functionality on smaller screens.

---

## 20. Accessibility

Use semantic HTML and existing accessible components.

Preserve:

- label/input association;
- keyboard operability;
- focus visibility;
- meaningful button/link text;
- dialog focus behavior;
- error association;
- appropriate ARIA only when semantic HTML is insufficient.

Do not use clickable `div`/`span` elements when a semantic button or link is appropriate.

Do not encode meaning using color alone.

Accessibility fixes should integrate with the existing UI system rather than creating parallel patterns.

---

## 21. Loading, Empty & Error States

Remote-data pages must handle relevant states explicitly.

As appropriate:

```text
loading
success
empty
error
```

Avoid rendering misleading "no data" content while a request is still loading.

Do not swallow API errors.

Provide actionable feedback when the user can recover.

Avoid exposing raw technical/server exception text directly to normal users unless the existing UX intentionally does so.

---

## 22. TypeScript

Use strict TypeScript.

Do not use `any`.

When data is genuinely unknown, use:

```ts
unknown
```

and narrow it safely.

Do not use `@ts-ignore` to silence real problems.

If an exceptional suppression is unavoidable, use the narrowest mechanism and document why.

Prefer inferred/generated types over duplicate handwritten interfaces.

Avoid unsafe casting simply to satisfy the compiler.

---

## 23. Error Handling

Use the project's established API-error normalization.

Distinguish where appropriate between:

- validation errors;
- unauthorized;
- forbidden;
- not found;
- conflict;
- server/network failure.

Do not duplicate error-parsing logic across individual components.

Map errors to the UI surface that can best help the user recover:

- field error;
- inline message;
- toast;
- page-level error.

Do not display success when a mutation partially or fully failed.

---

## 24. Sensitive Data

Do not assume sensitive values returned by the backend can be redisplayed or reused.

Respect backend masking/redaction.

Never attempt to reconstruct masked:

- National IDs;
- passport numbers;
- authentication secrets;
- protected personal information.

Do not persist sensitive API responses to browser storage unless explicitly supported by the security architecture.

Do not log sensitive user information unnecessarily to the browser console.

---

## 25. Financial & High-Impact Actions

For financial or high-impact state mutations:

- use the backend-provided workflow;
- preserve existing idempotency-key mechanisms where provided;
- prevent accidental duplicate submission;
- do not compute authoritative financial values in the browser;
- display server-calculated values as authoritative;
- confirm destructive/high-impact operations according to established UX patterns.

Do not reconstruct ledger, allocation, invoice, fee, or billing rules client-side.

---

## 26. Real-Time Features

Use the established SignalR infrastructure when a feature genuinely requires real-time updates.

Do not introduce polling when an existing SignalR channel already serves the requirement.

Likewise, do not introduce SignalR solely to avoid a normal refresh/query invalidation.

Keep real-time subscriptions scoped and clean them up correctly.

Do not create duplicate connections per component when the shared infrastructure already manages connection lifecycle.

---

## 27. Testing

Use progressive verification from the root instructions.

### Component/Page Tests

Use:

- Vitest;
- React Testing Library;
- `userEvent`;
- MSW;
- existing `renderWithProviders` or equivalent test infrastructure.

Prefer tests that reflect user-observable behavior.

Do not over-test implementation details.

### Test Priority

For a changed feature, prefer:

1. affected test(s);
2. affected feature tests;
3. lint/build;
4. broader test suite when justified.

Run broader regression checks at appropriate final/release gates.

Do not repeatedly run the entire suite after every minor UI edit.

---

## 28. API Mocking in Tests

Use MSW and existing test infrastructure for API behavior.

Do not mock RTK Query internals directly when the user interaction can be tested against mocked HTTP behavior.

Test meaningful states such as:

- successful load;
- empty response;
- validation failure;
- authorization failure;
- mutation success/failure

when relevant to the feature's risk.

Do not create exhaustive test matrices for trivial presentational changes.

---

## 29. Build & Common Commands

Use the scripts currently defined in `package.json` as authoritative.

Typical commands include:

```powershell
npm install
npm run dev
npm run lint
npm run build
npm test
npm run test:watch
```

Do not assume a script exists without checking `package.json`.

Do not run `npm install` unnecessarily when dependencies are already present and unchanged.

For routine changes, prefer targeted tests followed by `npm run build` or other appropriate verification.

Inspect current configuration for ports, environment variables, and API URLs rather than carrying historical values in this instruction file.

---

## 30. Dependencies

Before adding a package:

1. verify the capability is not already provided by the current stack;
2. inspect existing project patterns;
3. assess bundle/security/maintenance impact;
4. prefer the existing design system or utility stack.

Do not add dependencies for trivial helpers easily implemented with platform/existing-library capabilities.

Do not replace established dependencies merely because another library is familiar.

---

## 31. Performance

Avoid obvious unnecessary client-side cost.

Prefer:

- server-side pagination/filtering where supported;
- RTK Query caching;
- appropriate memoization only when justified;
- lazy loading/code splitting according to existing routing conventions;
- avoiding duplicate requests.

Do not add `useMemo`/`useCallback` everywhere by default.

Do not optimize speculatively without evidence.

When touching large lists or expensive rendering, evaluate the actual bottleneck before introducing complexity.

---

## 32. Frontend Business-Logic Boundary

The frontend may perform display derivation such as:

- labels;
- formatting;
- presentation grouping;
- temporary form calculations;
- UI enable/disable logic based on returned state/permissions.

The frontend must not become authoritative for:

- eligibility;
- permission decisions;
- financial calculations;
- invoice totals;
- lifecycle validity;
- tenant access;
- persistence invariants;
- domain state transitions.

When uncertain, prefer asking the backend for authoritative behavior rather than duplicating rules.

---

## 33. Documentation & Current State

Do not embed detailed feature-status history in this file.

When a task depends on whether a particular frontend capability already exists:

1. inspect the relevant feature directory;
2. inspect the generated API contract when needed;
3. consult current-state/feature documentation only if necessary.

Do not assume historical implementation status from memory.

If documentation says a feature is missing but code exists, verify the implementation and report the stale documentation rather than rebuilding it.

---

## 34. Do Not

Do not:

- introduce TanStack Query for server state;
- introduce Formik;
- introduce Auth0 or Supabase;
- store JWTs in `localStorage`;
- use `any` as an escape hatch;
- duplicate generated backend DTOs unnecessarily;
- hand-write parallel API clients where RTK Query/generated APIs already exist;
- copy server state into Redux slices;
- put authoritative business rules in components;
- invent backend fields/endpoints;
- fake unsupported backend behavior;
- hard-code role names when permission checks exist;
- hide backend errors;
- create parallel design systems;
- fork the Metronic layout unnecessarily;
- perform unrelated UI refactors;
- add dependencies without justification;
- create broad abstractions for a single feature;
- treat browser validation as security;
- expose sensitive values the backend intentionally masks.

---

## 35. Prefer

Prefer:

- generated contracts over handwritten duplicates;
- RTK Query over manual fetching;
- URL state for shareable navigation state;
- React Hook Form + Zod for forms;
- Metronic/shared components over feature-specific duplication;
- feature-local code over premature globalization;
- permissions over role-name assumptions;
- backend-calculated values over frontend reconstruction;
- user-observable tests over implementation-detail tests;
- responsive behavior by default;
- targeted inspection over broad repository scans;
- targeted verification over repeated full-suite runs;
- existing patterns over new abstractions;
- concise implementation reports over narration.

---

## 36. Task Execution Principle

For each frontend task:

> **Find the narrowest relevant feature surface, verify the backend contract, reuse established UI/state patterns, implement only the necessary UX, preserve type/auth/permission boundaries, test according to risk, and report concisely.**

Do not spend context reconstructing feature history or rereading unrelated frontend documentation.