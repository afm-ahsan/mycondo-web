---
name: react-frontend
description: MyCondo frontend conventions — Metronic shell, RTK Query (not TanStack Query), the open ADR conflict, and the current template-content situation. Use for any change inside mycondo-web/src.
---

# React Frontend Conventions

## Stack (as actually decided and committed, not the original strategy-doc default)

React 19 + TypeScript strict + Vite 7 + Metronic (kept as design system) + Redux Toolkit/RTK Query +
React Hook Form + Zod + Tailwind v4 + React Router v7. RTK Query over TanStack Query is a deliberate,
approved deviation from the governing strategy document — see
`mycondo-docs/02-architecture/Architecture_Decision_Register.md` ADR-005 (resolved 2026-07-28) if you
need the reasoning. Don't introduce TanStack Query anywhere; RTK Query is settled.

## Never use in new code

TanStack Query, Auth0, Supabase, Formik — all ship in `package.json` from the upstream Metronic
template but are explicitly forbidden by this repo's own governance (`mycondo-web/CLAUDE.md`). If you
see them imported in a file you're touching, that's template leftover to flag, not a pattern to copy.

## Server state

RTK Query only. Never copy server data into a plain Redux slice. Base client:
`src/api/baseApi.ts` (JWT-aware fetch with auto-refresh already built).

## Forms

React Hook Form + Zod for every form. Map server validation errors (from the backend's Problem
Details `errors` field) to `form.setError`.

## Current template-content situation (2026-07-28)

`src/features/` is empty (only a README) — **zero MyCondo business screens exist yet**. Everything
under `src/pages/{dashboards,account,network,public-profile,store-admin,store-client}` and wired into
`src/routing/app-routing-setup.tsx` is unmodified Metronic demo content (e-commerce, social network,
generic SaaS account settings) with no MyCondo relevance. Per ADR-007, the approach is to **replace
these routes incrementally as real features land**, not strip them all at once — so don't be alarmed
finding them, and don't spend a task "cleaning up" demo routes unless that's the actual assignment.

## Rules

- Strict TypeScript — no `any`, no unexplained `@ts-ignore`.
- Named exports only for router-mounted components (no default export for pages/routes).
- Never store JWTs in `localStorage` — refresh token in an HTTP-only cookie, access token in memory.
- Keep modules/features independent — cross-feature imports only via a feature's public
  `index.ts`/barrel, never reaching into another feature's internals.
- Use Metronic's existing layout shell; don't fork it.
