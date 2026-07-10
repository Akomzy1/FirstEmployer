# LAUNCH-CHECKLIST.md — FirstEmployer

Honest state at the end of the Build Prompt Pack (P00–P16). **Blocking items are
marked NOT DONE where true** — nothing here is aspirational (CLAUDE.md §8).

## Launch blockers

| # | Item | Status | Owner / next step |
|---|------|--------|-------------------|
| 1 | **Solicitor sign-off on the clause library** | ❌ NOT DONE — `// LEGAL-REVIEW` flags live in `lib/templates/contract/clauses.ts` and `variation.ts`; every clause is placeholder legal text until reviewed | Founder + employment solicitor |
| 2 | **ICO registration** | ❌ NOT DONE — UI deliberately shows "ICO registration in progress" (no fake number, DECISIONS P03) | Founder; add the real number to the footer + settings once issued |
| 3 | **DPIA** | ❌ NOT DONE — pending PRD Open Question 7 (controller vs processor for employee personal data) | Founder + solicitor |
| 4 | **Stripe live keys + products** | ❌ NOT DONE — env has placeholders; create the three monthly prices (amounts MUST match `lib/pricing.ts`) and set `STRIPE_PRICE_*`; run the trial→active→past_due→canceled test-clock pass (state machine is unit-tested offline; the clock run needs live keys) | Founder |
| 5 | **Production domain + SSL + `NEXT_PUBLIC_APP_URL`** | ❌ NOT DONE | Founder (Vercel) |
| 6 | **Support inbox** (hello@firstemployer.co.uk is referenced in UI) | ❌ NOT DONE | Founder |

## Deploy-time verification (built and unit-tested; needs a served deploy or device)

- [ ] Apply migrations 0001–0013 + `storage-setup.sql` to production Supabase; run `scripts/db/verify.mjs`
- [ ] Set env: Supabase keys, `ANTHROPIC_API_KEY`, Stripe keys + price ids, `RESEND_API_KEY`, `JOBS_SECRET`, `ADMIN_EMAILS`, `NEXT_PUBLIC_APP_URL`
- [ ] Stripe webhook endpoint (`/api/stripe/webhook`) registered with the live signing secret
- [ ] Cron: `POST /api/jobs/uprating` (Bearer `JOBS_SECRET`) scheduled nightly — the J4 overnight re-check
- [ ] Lighthouse CI run against the deploy (config committed: SEO ≥ 0.95, LCP < 2.0s, CLS < 0.05 on Home + pillar guide)
- [ ] PWA installability verified on Android Chrome and iOS Safari (add to home screen); airplane-mode mid-questionnaire → reconnect → nothing lost
- [ ] axe pass on the top 10 screens (focus management + aria labels are in; the browser run needs the deploy)
- [ ] End-to-end journey J1 on production data: signup → status → setup → examined contract → RTW → all-green dashboard
- [ ] AV scanning provider wired to `AV_SCAN_URL` (hook + fail-closed behaviour already in `lib/security/upload.ts`)
- [ ] Rate-limit store: in-memory per instance today (hard ceiling per instance); move to a shared store (e.g. Upstash) when scaling past one region
- [ ] PostHog live key; verify no PII in events
- [ ] Status page

## What `pnpm gate` proves on every commit (CI-blocking)

- Status Advisor goldens (40 cases, 40/40) · Examiner adversarial 15/15 ·
  deadline/date-math goldens (pension declaration; RTW 90/30/7) · J4 uprating
  end-to-end (flag → examined variation letter → green) · config-resolver
  goldens (2026-03-31 → 2026.1; 2026-04-01 → 2026.2) · assistant adversarial
  10/10 · RLS cross-tenant + immutability + deletion-retention + publish flow
  (real Postgres via PGlite) · billing state machine + tier gates · audit-pack
  scope + bundle · calculator + config-diff goldens · security (rate limit +
  upload validation) — **194+ tests**
- Grep gates: statutory literals (none outside config/tests; content uses
  config tokens) · decorative green (reviewed allowlist ratchet) · secrets audit

## Standing product flags (deliberate, not omissions)

- P1 features visible-but-badged: e-signature, assistant action buttons,
  multi-employee matrix, Monitor agent (queue is manual-entry)
- Starter tier is monitoring-only (PRD §10); caps 3/5/15
- RTW alert schedule is 90/30/7 (PRD FR-4.4; CLAUDE.md gate 3 should be updated
  by the founder — DECISIONS P08)
- Calculator PDF export deferred; shareable link shipped (DECISIONS P13)
