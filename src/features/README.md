# `src/features/` — Business features

One folder per backend module (1:1 mirror, kebab-case for multi-word). See `CLAUDE.md` for the full mapping.

> Renamed from `src/modules/` to `src/features/` on 2026-07-28 (Wave 0.5, ADR-006) to match the
> governing architecture document exactly. Purely a folder-name change — the shape and rules below
> are unchanged from the original `modules/` convention.

## Feature folder shape

```
src/features/<feature>/
├── pages/                    # Route-level components (e.g. InvoicesListPage.tsx)
├── components/               # Feature-specific UI components
├── hooks/                    # Feature-specific hooks (camelCase, prefixed `use`)
├── api/                      # RTK Query slice (createApi or injectEndpoints)
├── schemas/                  # Zod schemas mirroring backend contracts
├── types.ts                  # Feature-specific TS types
└── index.ts                  # Public surface — only export what other features may use
```

## Rules

- Feature A imports from feature B **only** through `feature-b/index.ts`. Reaching into `feature-b/components/Foo` from outside is a code-review reject.
- Server state lives in the feature's `api/` slice (RTK Query — see `mycondo-docs/02-architecture/Architecture_Decision_Register.md` ADR-005). Don't mirror it into Redux slices.
- Forms = React Hook Form + Zod schema from `schemas/`.
- Route definitions live in the feature (e.g. `features/<feature>/routes.tsx`) and get composed in `src/app/router.tsx`.

## Adding a new feature

Use `docs/conventions/08-templates/module-implementation-checklist.md`.
