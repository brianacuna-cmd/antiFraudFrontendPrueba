# Antifraud Demo Frontend

A React + Vite + TypeScript demo frontend for the fraud pipeline (config →
rule → activate → score → case), talking to a backend under `/api/v1` with
trusted-header auth. See `frontend-integration-spec.md` for the full backend
contract this app was built against.

## Architecture

Screaming/hexagonal layout: each feature (`settings`, `fraud-config`,
`rules`, `ingestor`, `cases`) lives under `src/features/<name>/` with
`domain/`, `application/`, `infrastructure/`, and `ui/` layers. Shared atomic
UI primitives and a single HTTP client live under `src/shared/`.

- `src/shared/http/httpClient.ts` — fetch wrapper injecting the trusted
  headers and mapping 401/400/404 to typed errors.
- `src/shared/settings/settingsStore.ts` — Zustand + localStorage store for
  the operator identity (`x-actor-user-id` / `x-actor-organization-id`).
- `src/app/SettingsGate.tsx` — gates every screen except Settings itself on a
  valid identity being present.
- `src/app/router.tsx` — React Router v6 routes for all features.
- `src/shared/monaco/monaco-workers.ts` — self-hosted Monaco bootstrap
  (imported once in `main.tsx`) required by the native `@gorules/jdm-editor`
  rule graph editor.

## Prerequisites

- Node.js 22+
- A running backend on `http://localhost:3000` with `AUTH_MODE=trusted-header`
  (see `frontend-integration-spec.md` §0). This app does **not** implement
  session/JWT login — only the trusted-header demo mode.

## Setup

```bash
npm install
```

### Environment variables

Create a `.env` file at the project root (not committed) with:

```
VITE_API_BASE=/api/v1
```

> **Note**: this repo does not ship a `.env` file. If you don't create one,
> the app falls back to the same default (`/api/v1`) at runtime via
> `settingsStore`'s default, so this step is optional unless you need to
> point at a different API base path.

### Backend connectivity (dev proxy)

`vite.config.ts` proxies `/api/*` to `http://localhost:3000` in dev
(`server.proxy`), so the backend does not need CORS configured for local
development. Start your backend on port 3000 before `npm run dev`.

### Setting your identity

On first load, the app only lets you reach the **Settings** screen. Enter
any 24-character hex string for both User ID and Organization ID (e.g.
`000000000000000000000001` / `0000000000000000000000aa`, per the backend
spec's trusted-header mode) and save. All other screens unlock once a valid
identity is stored.

## Scripts

```bash
npm run dev      # start the Vite dev server
npm run build    # typecheck (tsc -b) + production build
npm run test     # run the Vitest suite once
npm run test:watch
npm run lint     # oxlint
```

## Demo flow (per the backend's required setup order)

1. **Settings** — set your user/organization IDs.
2. **Fraud Config** — save SLA + risk thresholds (`PUT /organization-fraud-config`).
   Scoring cannot open cases until this exists.
3. **Rules** — author a JDM decision graph in the native GoRules editor, save
   as a draft, then activate it.
4. **Ingestor** — submit a `CanonicalRiskEvent` (camelCase, strict) to score
   it and optionally open a case.
5. **Cases** — browse, filter, and act on opened cases (timeline, notes,
   evidence, lifecycle transitions).

## Testing

Vitest + React Testing Library + MSW. Strict TDD was followed from Phase 1
onward: tests exercise real HTTP contracts via MSW-mocked handlers modeled
on `frontend-integration-spec.md`, never a live backend.

```bash
npm run test
```

The native `@gorules/jdm-editor` (`DecisionGraph`/`JdmConfigProvider`) is
mocked in tests that render it, since it draws Monaco + ReactFlow canvases
that are not meaningfully testable in jsdom; the mock exposes a controllable
stub so the surrounding validation/submit logic is still exercised for real.

### Backend-contract TODOs (confirm against a live backend before shipping)

These are modeled from the spec with conservative defaults and are marked
`TODO(backend-contract)` in the code:

1. **Evidence upload limits** — no documented size/type cap; the client
   enforces a default 10MB cap (`features/cases/domain/caseFilters.ts`).
2. **Case / timeline / evidence response shapes** — `Case`, `TimelineEvent`,
   and `Evidence` types are intentionally loose (index signatures / optional
   fields) since the spec only documents a handful of guaranteed fields.
3. **`reassign` / `reopen` request bodies** — the spec explicitly defers
   these (§2.4). The client sends `{ assigneeId }` for reassign and `{}` for
   reopen; adjust `features/cases/infrastructure/casesApi.ts` once confirmed.
4. **Evidence download auth** — `GET /evidence/:id/download` is linked via a
   plain `<a href>`; how trusted-header auth applies to a plain navigation
   (vs. `fetch`) is unconfirmed.

## E2E (optional, deferred)

A Playwright end-to-end suite (setup order → score → case flow) was scoped
in the design but is **not included in this iteration** to avoid
destabilizing the Vitest/MSW-based test run. To add it later:

```bash
npm install -D @playwright/test
npx playwright install
```

Then add a `playwright.config.ts` and `e2e/` suite driving the flow in
"Demo flow" above against a real backend on `localhost:3000`.
