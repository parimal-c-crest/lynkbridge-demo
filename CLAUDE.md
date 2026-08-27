# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **static clickable SPA prototype** of the LynkBridge B2B multi-tenant customer portal — a telecom/connectivity management platform (TEM). It exists for product discovery and Phase 1 scope validation, not as a product build.

Stack: **Vite + React 19 + TypeScript + React Router 7 + Tailwind v4**, with a hand-built component library (no UI kit). Chosen at scaffold time — the repo had no prior tooling to reuse.

## Commands

```bash
npm run dev              # http://localhost:5173
npm run build            # tsc -b && vite build
npm run verify           # typecheck + routes + data + render (run this before claiming anything works)
npm run verify:routes    # every internal link target resolves to a declared route
npm run verify:data      # referential integrity, tenant scoping, modelling invariants
npm run verify:render    # SSR-renders every route/role case, chart edge cases and filter drill-downs
```

There is no test runner and no linter. The `verify:*` harnesses in [scripts/](scripts/) are the safety net — they catch the failures that matter here (dangling relations, broken links, screens that throw on real records, cross-tenant leakage). Extend them rather than adding a framework.

Note: `verify:render` renders server-side, so `<Navigate>` guards produce empty output. That is asserted deliberately via `expectBlockedByGuard`, not treated as a pass by accident.

## The rule that governs this codebase

The build specification is explicit that **undefined requirements must never be silently promoted into confirmed ones**. Most of the brief is unconfirmed.

Before hardening any behaviour into shared logic, check which register it falls into — they are the source of truth and are rendered in-app at `/roadmap`:

- [src/prototype/assumptions.ts](src/prototype/assumptions.ts) — `CONFIRMED` / `ASSUMPTIONS` / `OPEN_QUESTIONS` / `ROADMAP`.

If you invent something to make a screen work, add it to `ASSUMPTIONS` and surface it with `<ProtoNote>` on the screen. Do not build an RBAC matrix beyond the two existing roles, and do not treat statuses, priorities or document categories as settled vocabulary.

Roadmap items (carrier APIs, monitoring, outage detection, billing, ticket automation, SLA, CRM, notifications, AI) must stay non-functional.

## Architecture

**One screen serves both roles.** Customer and admin mount the same components under `/customer/*` and `/admin/*`. `usePortal()` ([src/lib/usePortal.ts](src/lib/usePortal.ts)) hands a screen its route prefix, its scoped dataset and `isAdmin`; the screen decides its own links and whether a Customer column applies. Never fork a screen per role — the only genuinely admin-only screens are Customers, Carriers, Imports and Users.

**Data flows one way through the read layer.** [src/data/dataset.ts](src/data/dataset.ts) generates records from a fixed seed; [src/data/selectors.ts](src/data/selectors.ts) is the only place relations are traversed; pages never index into arrays themselves. Replacing `dataset.ts` with API calls is the intended migration and should not touch any page.

**Charts are computed in selectors, drawn by four components.** `src/components/charts/` holds `BarChart` (magnitude across named categories), `ColumnChart` (a value bucketed over time), `StackedStrip` (part-to-whole across states) and `AreaChart` (a running total), all wrapped by `ChartFrame`. No charting library: these four forms are simple SVG/CSS, and a dependency would import its own visual language.

Three rules hold across every chart:

- **Aggregation lives in `selectors.ts`, never in a page** — so a chart can never disagree with the table beside it. `contractMrc()` and `totalMrc()` are the shared basis.
- **Colour is chosen last, and the categorical palette is computed, not eyeballed.** Magnitude uses the sequential brand ramp; states use `STATUS_FILL` in `ChartFrame.tsx`. Those status steps were picked by running the dataviz skill's `validate_palette.js` — the obvious `warn-700`/`danger-700` pairing failed the normal-vision floor at ΔE 9.1, so warn snaps to `warn-600`. Re-run the validator before changing any of them.
- **Every mark carries a written value or label**, so nothing is encoded by colour alone.

**Charts drill down through the URL.** `useCollection()` reads `q` and each filter key from the query string, so a segment can link to `/admin/circuits?status=Degraded` and land on exactly the rows behind the mark. Filter state lives in the URL, not in component state — keep it that way, or chart click-through and shareable filtered views both break.

**List screens are one component.** `useCollection()` ([src/lib/useCollection.ts](src/lib/useCollection.ts)) does search, filter, sort and pagination; `CollectionTable` renders the filter bar, table and pagination together. A new list screen supplies rows, columns and filter definitions — nothing else.

**Writes are in-memory only.** [src/state/DataContext.tsx](src/state/DataContext.tsx) holds the dataset in React state. Ticket creation, notes, status changes, uploads and imports mutate it and nothing else; a refresh restores the seed.

## Modelling decisions that must not be undone

The specification's data model contradicted its own screen specs. These fixes are load-bearing and each is documented in [src/data/types.ts](src/data/types.ts):

- **`Service.mrc` is the only stored cost.** Contract MRC and every dashboard total roll up from it via `contractMrc()`. The spec put `mrc` on both Service and Contract, which let two screens disagree about the same money. Do not add `Contract.mrc`.
- **The carrier lives on `Service` only.** Circuits resolve their carrier through their service (`carrierForCircuit`). The spec stored it on both.
- **Service ↔ circuit is 1:1**, and only for physically delivered service types. Security and Other have no circuit.
- **Circuits carry no `tenantId`** — they are scoped through their service. `scopeToTenant()` relies on this.
- **Carriers are platform-global** with no tenant, because the admin carrier list aggregates customers across tenants.
- **Documents use `relatedEntityType` + `relatedEntityId`**, not one free-text field, so the Location and Related Entity columns both resolve. `describeRelatedEntity()` returns a route *suffix* plus an `adminOnly` flag — never a finished URL.

## Tenant separation

`scopeToTenant()` filters mock arrays client-side. It demonstrates what isolation looks like to a user and **provides no security whatsoever**. Say so plainly wherever it comes up; the UI already does, in the login screen, the roadmap page and the selector's own docblock.

## Source documents

[docs/](docs/) holds the brief this was built from — three binary Office files. Read them by unzipping the XML part (`content.xml` for `.odt`, `word/document.xml` for `.docx`) and stripping tags; force UTF-8 on output, as the text contains characters that crash cp1252 stdout on Windows.

- `LynkBridge_Static_SPA_Build_Spec_for_Claude_Code.odt` — the build instruction, 29 numbered sections. Screens cite these section numbers.
- `Discussion.docx` — the raw client thread; the source of truth for business requirements.
- `project-details.odt` — analyst summary. Its §17 traffic-light classification is the original basis for the four registers in `src/prototype/assumptions.ts`.

`Discussion.docx` also contains a live meeting link and internal commercial figures. Do not copy that content into source, README or any client-facing output.

## Adjacent directory

`d:\wamp64_www\lbm-integer\Smarty\templates_c` is an additional working directory belonging to a separate legacy PHP/Smarty application with its own CLAUDE.md. It is unrelated to LynkBridge — do not treat its stack or conventions as context here.
