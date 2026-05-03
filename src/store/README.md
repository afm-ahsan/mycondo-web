# `src/store/` — Redux Toolkit store

## What lives here

- `store.ts` — `configureStore({ reducer: { [baseApi.reducerPath]: baseApi.reducer, ...slices }, middleware: getDefaultMiddleware().concat(baseApi.middleware) })`.
- `hooks.ts` — typed `useAppDispatch` / `useAppSelector` (NEVER use the raw versions).
- `slices/` — global UI slices (e.g. `auth`, `notifications`, `ui-prefs`). **Server state does NOT live here** — server state belongs in module-specific RTK Query slices.

## Rules

- One store. Configured once in `store.ts`.
- `<Provider>` wraps the app in `src/main.tsx` (or `src/app/providers.tsx`).
- Per `docs/conventions/02-frontend/03-state-and-data-fetching.md`: server state in RTK Query, client UI state in slices, ephemeral local state in `useState`.

## Phase 3 work

This folder is currently empty. Phase 3 (foundation infra) wires it up. Tracking item in `docs/kickoff.md`.
