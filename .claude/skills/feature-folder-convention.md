---
name: feature-folder-convention
description: Frontend feature-folder layout for MyCondo — src/features/ naming (renamed from modules/ 2026-07-28) and the mapping to backend modules.
---

# Feature Folder Convention (Frontend)

## Current state

`src/features/<feature>/` — currently **empty** (only a README; renamed from `src/modules/` on
2026-07-28, ADR-006). The intended per-feature shape (`mycondo-web/CLAUDE.md`):

```
src/features/<feature>/
├── pages/
├── components/
├── hooks/
├── api/           # RTK Query slice for this feature (ADR-005 — RTK Query, not TanStack Query)
└── types.ts
```

## Feature-to-backend mapping

One frontend feature folder per backend module, 1:1, kebab-case for multi-word names — see the table
in `mycondo-api/docs/kickoff.md` ("Module → frontend folder map") for the exact list (`tenancy`,
`identity`, `property`, `residents`, `leasing`, `billing`, `payments`, `expenses`, `vendors`,
`payroll`, `complaints`, `notifications`, `documents`, `reporting`, plus Phase 2 `amenities`,
`maintenance`, `security`).

## Cross-feature imports

A feature may only import another feature through its public surface (an `index.ts` barrel), never by
reaching into `../other-feature/components/SomeInternalThing`.
