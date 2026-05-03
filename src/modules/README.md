# `src/modules/` — Business modules

One folder per backend module (1:1 mirror, kebab-case for multi-word). See `CLAUDE.md` for the full mapping.

## Module folder shape

```
src/modules/<feature>/
├── pages/                    # Route-level components (e.g. InvoicesListPage.tsx)
├── components/               # Module-specific UI components
├── hooks/                    # Module-specific hooks (camelCase, prefixed `use`)
├── api/                      # RTK Query slice (createApi or injectEndpoints)
├── schemas/                  # Zod schemas mirroring backend contracts
├── types.ts                  # Module-specific TS types
└── index.ts                  # Public surface — only export what other modules may use
```

## Rules

- Module A imports from module B **only** through `module-b/index.ts`. Reaching into `module-b/components/Foo` from outside is a code-review reject.
- Server state lives in the module's `api/` slice (RTK Query). Don't mirror it into Redux slices.
- Forms = React Hook Form + Zod schema from `schemas/`.
- Route definitions live in the module (e.g. `module/<feature>/routes.tsx`) and get composed in `src/app/router.tsx`.

## Adding a new module

Use `docs/conventions/08-templates/module-implementation-checklist.md`.
