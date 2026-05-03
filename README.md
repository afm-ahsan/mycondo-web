# mycondo-web

Multi-tenant SaaS property-management SPA. React + TypeScript + Vite + Metronic for ARP Flat Owner's Association under proposal MC-PROP-2026-001.

## Overview

MyCondo replaces spreadsheets and paper registers for residential and commercial property management with one tenant-isolated SaaS platform. This repo is the SPA; the API lives at https://github.com/afm-ahsan/mycondo-api.

Core capabilities:
- Single-page app for both admins (BuildingAdmin, Treasurer, Secretary, etc.) and residents (Owners, Tenants).
- Real-time updates via SignalR (notifications, complaint status, visitor alerts).
- Auto-generated, type-safe API client from the backend's OpenAPI 3.1 spec.
- Mobile-responsive down to 360 px; WCAG 2.1 AA target on resident-facing pages.

## Tech Stack

| Layer    | Technology                                                                  |
|----------|-----------------------------------------------------------------------------|
| Frontend | React 19 · TypeScript 5.9+ · Vite 7 · Metronic React Vite                    |
| State    | Redux Toolkit + RTK Query                                                    |
| Forms    | React Hook Form + Zod                                                        |
| Style    | Tailwind CSS v4                                                              |
| Routing  | React Router v7                                                              |
| Realtime | `@microsoft/signalr`                                                         |
| Tests    | Vitest + React Testing Library + Playwright                                  |
| Codegen  | `openapi-typescript` + `@rtk-query/codegen-openapi`                          |

## Repository Structure

```
mycondo-web/
├── src/                             # main.tsx, App.tsx, modules/, components/, ...
├── public/
├── e2e/                             # Playwright tests
├── docs/conventions/                # Convention library (duplicated from template)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Quickstart (Local Dev)

### Prerequisites

- Node 22 LTS (or use `.nvmrc` with `nvm use`)
- A running `mycondo-api` on http://localhost:5000

### Setup

```powershell
git clone https://github.com/afm-ahsan/mycondo-web.git
cd mycondo-web

npm install
copy .env.example .env
# Edit .env: VITE_MYCONDO_API_BASE_URL=http://localhost:5000

npm run dev
# → http://localhost:5173
```

## Development

### Type-check, lint, format

```powershell
npm run typecheck
npm run lint
npm run format
```

### Tests

```powershell
npm test                    # Vitest unit tests
npm run test:e2e            # Playwright (requires API running)
```

### Build

```powershell
npm run build
npm run preview             # serve the production bundle locally
```

## Project Documentation

- **Conventions**: `docs/conventions/` — opinionated rules; AI tools and humans must read before editing
- **AI guidance**: `CLAUDE.md` — module-mapping table, stack quirks, deviation list

## Conventions

This repo follows the conventions in `docs/conventions/`. Any deviation must be documented as an ADR (in the `mycondo-api` repo's `docs/decisions/`, since that repo is the documentation home).

## Contributing

1. Branch from `main`: `git checkout -b feat/<short-name>`
2. Follow `docs/conventions/`; add tests
3. Open a PR using `.github/pull_request_template.md`
4. CI must be green (typecheck, lint, Vitest, build)
5. Squash-merge

## License

Proprietary — © 2026 Ajwad Technologies. See `mycondo-api` proposal §22 for license terms granted to ARP Flat Owner's Association.
