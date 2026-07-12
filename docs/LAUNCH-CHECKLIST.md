# LAUNCH-CHECKLIST.md — FirstEmployer

Honest state at the end of the Build Prompt Pack (P00–P16). **Blocking items are
marked NOT DONE where true** — nothing here is aspirational (CLAUDE.md §8).

## Launch blockers

| # | Item | Status | Owner / next step |
|---|------|--------|-------------------|
| 1 | **Solicitor sign-off on the clause library** | ❌ NOT DONE — `// LEGAL-REVIEW` flags live in `lib/templates/contract/clauses.ts` and `variation.ts`; every clause is placeholder legal text until reviewed | Founder + employment solicitor |
| 2 | **ICO registration** | ✅ DONE — **ZC160686** issued 2026-07-10; wired into the marketing footer, auth trust footer, Settings and More screens via the single `ICO_REGISTRATION` constant (`lib/marketing/entity.ts`) | — |
| 3 | **DPIA** | ❌ NOT DONE — pending PRD Open Question 7 (controller vs processor for employee personal data) | Founder + solicitor |
| 4 | **Stripe live keys + products** | 🟡 NEARLY DONE (2026-07-10) — live secret key, webhook signing secret, and all three price IDs in `.env.local`; the three live prices verified against the Stripe API (£9.99/£14.99/£24.99 GBP monthly, active, no Stripe-side trial — exact match to `lib/pricing.ts`); webhook endpoint registered for `https://firstemployer.co.uk/api/stripe/webhook`. Remaining: copy the five `STRIPE_*` vars to Vercel env, then the live checkout + cancel pass after deploy (guide step 6) | Founder + deploy |
| 5 | **Production domain + SSL + `NEXT_PUBLIC_APP_URL`** | 🟡 IN PROGRESS — domain secured 2026-07-10: **firstemployer.co.uk** (canonical apex; www redirects). Remaining: add both domains to the Vercel project (SSL is automatic) and set `NEXT_PUBLIC_APP_URL=https://firstemployer.co.uk` in Vercel env | Founder (Vercel) |
| 6 | **Support inbox** | ✅ DONE (2026-07-12) — **support@firstemployer.co.uk**: mailbox created (founder), domain verified in Resend, test send delivered (200). Wired via the single `SUPPORT_EMAIL` constant. Supabase auth emails also route through Resend SMTP now (sender "FirstEmployer <support@…>", no built-in rate cap); live magic-link send verified 200 | — |

## Deploy-time verification (built and unit-tested; needs a served deploy or device)

- [x] Apply migrations to hosted Supabase — **complete (founder, 2026-07-10)**: base schema
      0001–0010 + seed at P03, and the post-P03 bundle (0011–0013 + refreshed seed with the
      `ni` config block) via `supabase/pending-migrations-bundle.sql` in the SQL editor.
- [x] Run `node scripts/db/verify.mjs` — **ALL CHECKS PASS (2026-07-10)**: base schema,
      both config versions + `ni` block, canonical demo tenants, 0011–0013 objects and both
      functions, RLS from anon. (The pending bundle had only partially applied; re-applied
      idempotently via `scripts/db/apply-sql.mjs` + Management API token.) Known WARN:
      20 non-canonical businesses from P03 e2e runs — harmless residue, cleanup optional.
- [x] Set env — **done (2026-07-11)**: all 13 production vars in Vercel (`CRON_SECRET` mirrors
      `JOBS_SECRET` for Vercel cron auth). Canonical domain is **www**.firstemployer.co.uk
      (DECISIONS 2026-07-11); bare domain 308s to it.
- [x] Stripe webhook — **done**: registered at `https://www.firstemployer.co.uk/api/stripe/webhook`;
      unsigned POST returns 400 (signature check live).
- [x] Cron — **done + verified live (2026-07-11)**: `vercel.json` cron hits `/api/jobs/uprating`
      02:00 UTC (GET + Bearer, same guard as POST). Manual authenticated run returned 200:
      config 2026.2, 20 businesses / 2 employees checked, 0 flagged. Wrong secret → 401.
- [x] Lighthouse — **done + green in CI (2026-07-12)**: audits production on every push
      (run #10 SUCCESS). Home: perf 99, LCP 746ms, CLS 0.011, SEO 100. Fixed en route:
      font-swap layout shift (CLS 0.162 → 0.011) via metric-matched Inter fallback,
      `font-display: block` on the icon font, and preloads for the two critical fonts.
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
