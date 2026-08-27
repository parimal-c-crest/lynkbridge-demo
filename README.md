# LynkBridge — clickable SPA prototype

A static, fully navigable prototype of the LynkBridge B2B multi-tenant customer portal, built for product discovery, UX review and Phase 1 scope validation.

**This is not a product build.** There is no backend, database, authentication, file storage, email, carrier integration, monitoring, billing or AI. Everything runs in the browser against generated mock data.

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Typecheck and produce a production bundle in `dist/` |
| `npm run preview` | Serve the built bundle |
| `npm run verify` | Everything below, in order |
| `npm run typecheck` | TypeScript, no emit |
| `npm run verify:routes` | Every internal link target resolves to a declared route |
| `npm run verify:data` | Referential integrity, tenant scoping and modelling rules over the mock dataset |
| `npm run verify:render` | Renders every route/role combination, chart edge cases and filter drill-downs, and checks for tenant leakage |

## Signing in

No password is checked — any value works, or leave it blank.

| Account | Sees |
| --- | --- |
| `customer@demo.com` | Acme Corporation only |
| `customer2@demo.com` | Global Industries only — sign in as both to compare tenant separation |
| `admin@demo.com` | All customers, plus Carriers, Imports and Users & Roles |

The account menu in the top bar switches between them without signing out.

## What to look at

Five end-to-end journeys the prototype is built to demonstrate:

1. **Explore a service** — Dashboard → Locations → a location → Services tab → a service → its circuit → its contract.
2. **Raise a ticket** — Tickets → Create ticket → Submit → the new ticket opens with its history.
3. **Manage a customer** (admin) — Customers → a customer → Locations tab → a location → its services.
4. **Import data** (admin) — Imports → data type and file → Preview → Validation → Confirm → Success.
5. **Contract renewal** — Dashboard → Upcoming renewals → a contract → its services → their locations.

**Reports** (sidebar → Insights) runs 12 reports against your current records, each with a summary chart, a row filter and a real CSV export generated in the browser. **Settings** holds the controls that genuinely drive the portal — change the renewal notice window and every badge, filter and chart moves with it.

Charts are on both dashboards and at the head of the Locations, Circuits, Contracts and Tickets lists. They are clickable: selecting a segment, bar, column or cell filters the list beneath it through the URL, so any filtered view is shareable and survives a reload.

**`/roadmap`** (bottom of the sidebar) is the honest register: what the client confirmed, what the build team assumed to make screens work, what still needs answering, and what is deliberately deferred. Read it before treating any behaviour here as a requirement.

## Architecture

```
src/
  data/         types, generated dataset, and the relational read layer (selectors)
  state/        simulated session, in-memory store, toasts
  components/   layout, data table stack, charts, UI primitives, form controls
  pages/
    shared/     screens both roles use, parameterised by the signed-in role
    customer/   customer-only screens
    admin/      admin-only screens
  reports/      the report catalogue — pure functions over the scoped dataset
  prototype/    the assumption / open-question register rendered at /roadmap
  lib/          formatting, the search-filter-sort-paginate hook, usePortal
scripts/        the three verification harnesses
docs/           the client brief and build specification this was built from
```

Two things worth knowing before changing anything:

- **Customer and admin share one implementation of each screen.** `usePortal()` returns the route prefix, the scoped dataset and whether the viewer is an admin; screens use it to decide their own links and whether a Customer column applies. Do not fork a screen per role.
- **Nothing outside `src/data/` knows how records are produced.** Replacing `dataset.ts` with API calls is the intended migration path; `selectors.ts` is the only file whose shape would change.

## Mock data

Generated from a fixed seed, so every run produces identical data and demos stay reproducible. All names, addresses, contacts, account numbers and figures are fictional.

4 tenants · 35 locations · 114 services · 99 circuits · 20 contracts · 57 documents · 43 tickets · 20 users.

Dates are measured against a fixed prototype date (2026-08-27) so renewal windows and ticket ages do not drift between demos.

## Known limitations

- Tenant separation is a client-side filter for demonstration. **It is not a security boundary.**
- Created tickets, uploaded documents and confirmed imports live in React state only and are lost on refresh. "Reset demo data" appears in the top bar once anything has been changed.
- Document preview and download are simulated; no file is ever read, stored or transmitted.
- The import wizard simulates a parse from the file name. The file itself is never opened.
- Only two roles exist, with no permission matrix, because none was defined.
- Settings do not persist — a refresh restores the defaults. Notification switches record a preference and do nothing.
- Reports have no date-range filter, no saved definitions and no scheduled delivery. CSV export is real; everything else about reporting is a proposal.
- Verification was run headlessly (typecheck, build, route audit, data integrity, server-side render of every route). Interactive behaviour — hover, drawer animation, focus order, real viewport breakpoints — has not been checked in a browser.
