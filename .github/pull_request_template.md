## Summary
<1–2 sentences: what this changes and why.>

## Changes
- <bullet 1>
- <bullet 2>
- <bullet 3>

## Screenshots / Demo
<For UI changes, attach screenshots or a short Loom; mark "N/A" otherwise.>

## Test plan
- [ ] Vitest unit tests added/updated
- [ ] Playwright E2E added/updated (if user-facing)
- [ ] Manual testing notes:
  - <browsers / screen sizes / role-as-user / what you tried>

## Convention checklist
- [ ] Code follows `docs/conventions/`
- [ ] No `any`; no `@ts-ignore` without comment
- [ ] No class components; named exports for non-router components
- [ ] Server state in **RTK Query** (NOT TanStack Query, NOT slices)
- [ ] Forms use **React Hook Form + Zod**; server-side errors mapped to `form.setError`
- [ ] No `localStorage` for JWTs (refresh in HTTP-only cookie; access in memory)
- [ ] Module independence — module A reaches into module B only through `module/index.ts`
- [ ] Used Metronic's existing layout shell (didn't fork it)
- [ ] No new use of TanStack Query / Formik / Auth0 / Supabase (these are template leftovers being replaced)
- [ ] OpenAPI client regenerated if backend contract changed (`npm run codegen`)
- [ ] Translations added for any user-facing strings (i18n-ready, even if English-only at MVP)
- [ ] Mobile responsive down to 360 px verified
- [ ] No secrets, tokens, or PII committed

## Risks / Considerations
<What could go wrong? Backwards compatibility? Performance? Anything reviewers should think about?>

## Rollback plan
<"Revert PR" is fine for code-only changes. For changes affecting persisted client state — e.g. auth-flow rewrites — note any cleanup needed.>

## Related
- Closes #<issue>
- Refs <ticket-id> in `mycondo-api`
- Builds on #<other-pr> (if stacked)
