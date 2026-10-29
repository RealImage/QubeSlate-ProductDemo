# Qube Slate

Cinema and DOOH advertising planning: advertisers compose campaigns, deliver them to theatres, and see proof of play from theatre play logs.

This repo holds the three Slate portals and the code they share.

| Portal | Who | Dev URL |
| --- | --- | --- |
| `apps/advertiser` | Advertisers, agencies, brands. Company + KYC, target groups, media, campaign wizard, checkout, delivery. | http://localhost:5173 |
| `apps/sac` | Screen Advertising Consolidators (sales houses that sell exhibitor inventory). Approvals (KYC, brands, campaigns), advertiser billing terms, inventory and DOOH configuration, proof of play. | http://localhost:5174 |
| `apps/admin` | Qube. Tenant onboarding (exhibitors, SACs), payment gateways, network and play-log ingestion health, read-only oversight, audited support sessions. | http://localhost:5175 |

## Model

```
Exhibitor ──owns──▶ Theatres · Screens · DOOH display groups · Devices (play logs)
    ▲
    │ sells inventory of (1..n)
   SAC ──classifies──▶ Advertiser: Card / Prepaid  → pays at checkout via the SAC's gateway, then SAC approval (reject = refund)
    │                              Contracted      → submits for SAC approval, checked against a contract credit limit
    └──approves──▶ KYC · Brands · Campaigns
Advertiser (belongs to one SAC) ──▶ Target groups · Media · Campaigns ─▶ Placements ─▶ Delivery
```

Qube supplies the software and payment-gateway integration; the SAC invoices its advertisers.

## Layout

```
apps/advertiser   apps/sac   apps/admin        React 19 + Vite + React Router + React Query
packages/domain   entities and business rules (pure TS, unit tested)
packages/api      API contracts, typed client per portal, session provider
packages/ui       prefab-ui entry point, app shell, Slate layout kit
packages/mock-server   Node mock of the Slate API shared by all portals
```

## Run it

```bash
npm install
npm run dev          # mock API on :4100 + all three portals
```

Or one at a time: `npm run dev:api`, `npm run dev:advertiser`, `npm run dev:sac`, `npm run dev:admin`.

Sign-in is mocked: pick a seeded account. The **Prototype · Account** switcher in the top bar changes user without signing out. Mock data persists in `packages/mock-server/.data/db.json`; delete it (or run `npm run fresh -w @slate/mock-server`) to reseed. Seed dates are relative to today, so there are always live, scheduled and completed campaigns.

To point a portal at a real backend, set `VITE_API_URL` (or `SLATE_API_ORIGIN` for the dev proxy).

## Checks

```bash
npm run typecheck    # tsc -b across every package
npm run lint         # oxlint
npm test             # vitest: domain rules
npm run test:e2e     # Playwright smoke test per portal
```

Before the first e2e run, install Playwright's browser (on Linux, add `--with-deps` for the system libraries):

```bash
npx playwright install chromium
```

## Design system

`@slate/ui` re-exports [prefab-ui](https://github.com/RealImage/prefab-ui) `v1.0.0-beta.18`, vendored as `packages/ui/vendor/prefab-1.0.0-beta.18.tgz`. The tag's git install pins Node to exactly 24.13.1 and needs GitHub credentials; the tarball avoids both. To upgrade, pack a newer tag the same way and update `packages/ui/package.json`.

The SAC app still carries the earlier vendored Qube design-system CSS (`packages/ui/legacy-ds`) for pages not yet moved to prefab components.

## Not yet real

- Auth: header-based mock session. Replace `packages/api/src/session.tsx` + `client.ts` with SSO; impersonation must use a signed short-lived token.
- Payment gateway: checkout is a stub that records a payment and raises an invoice.
- Rate cards: fixed constants in `packages/domain/src/pricing.ts`.
- Orientation-based placement eligibility for DOOH media: open product question, not enforced.
