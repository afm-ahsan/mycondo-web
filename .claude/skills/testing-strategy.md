---
name: testing-strategy
description: Frontend testing reality check — no test tooling is installed yet despite CLAUDE.md documenting it. Use before claiming any frontend change is tested.
---

# Frontend Testing Strategy

## Reality as of 2026-07-28

**There is no frontend test tooling installed.** `package.json` has no `test` or `test:e2e` script,
and no `vitest`, `@testing-library/react`, or `@playwright/test` dependency exists — despite
`mycondo-web/CLAUDE.md`'s tech-stack section documenting "Vitest + React Testing Library" and
"Playwright" as if they were already wired up. Don't run or reference `npm test`/`npm run test:e2e` —
they don't exist yet. This is tracked as `mycondo-docs/07-delivery/MASTER_BACKLOG.md` PF-5.

## What you can actually verify today

- `npm run lint` — ESLint (flat config, typescript-eslint + react-hooks + react-refresh rules).
- `npm run build` — runs `tsc` (strict typecheck) then `vite build`. This is currently the **only**
  way to catch type errors; there's no separate `typecheck` script.
- Manual verification in the dev server (`npm run dev`) for behavior that isn't type-checkable.

## When adding test tooling (PF-5)

Set up Vitest + React Testing Library for component/hook unit tests and Playwright for e2e, matching
what the strategy document and this repo's own CLAUDE.md already commit to. Once added, update this
skill file and `mycondo-web/CLAUDE.md`'s Common Commands section to stop being aspirational.

## Until then

Report frontend changes as verified via lint + typecheck/build + manual dev-server check — don't imply
automated test coverage that doesn't exist.
