# DECISIONS.md — FirstEmployer build decision log

Every deviation from the PRD, the prototype, the locked stack, or the Build Prompt Pack is recorded here at the moment it is made. Never resolve a conflict silently.

Format: date · prompt/session · decision · reason · approved by.

---

## 2026-07-07 · P00 · PRD is v1.2, not v1.1

The Build Prompt Pack and the original CLAUDE.md reference `/docs/PRD-v1.1.md`. The actual locked PRD supplied by the founder is v1.2, stored at `/docs/PRD-v1.2.md`. CLAUDE.md's source-of-truth path was updated to v1.2. All pack references to "PRD v1.1" should be read as PRD v1.2.
Approved by: founder (file supplied; path change confirmed in session).

## 2026-07-07 · P00 · Relume Wireframe Brief dropped as a source of truth

The pack lists the Relume brief as tertiary reference. The founder confirmed it will not be added to the repo; the PRD and prototypes are sufficient. Removed from CLAUDE.md's sources-of-truth list.
Approved by: founder (in session).

## 2026-07-07 · P00 · Prototype export filenames differ from the pack's reference names

The pack references per-screen/per-state files (e.g. `dashboard-all-green.html`, `design-system.html`, `auth.html`). The actual Claude Design exports are named by screen with a ` (standalone)` suffix (e.g. `Style Reference (standalone).html`, `Status Advisor (standalone).html`) and some cover multiple states in one file. Filenames are kept verbatim as delivered. Each UI prompt must map the pack's reference names to the real export(s) before building, and record the mapping here if it is not obvious. Known so far: `design-system.html` → `Style Reference (standalone).html`.
Approved by: build session (naming only; no visual or behavioural deviation).

## 2026-07-07 · P00 · Dashboard state prototypes are one file, not four

The pack's Prompt 9 references `dashboard-all-green.html`, `dashboard-attention.html`, `dashboard-at-risk.html`, `dashboard-legal-change.html`. Founder confirmed all four live inside the single `FirstEmployer App.html` export (sign in → dashboard):

- **all-green / attention / at-risk** are scenario states of one built-in `ScenarioSwitcher` control at the top of the dashboard screen — it swaps the compliance ring (8/8 green · 6/8 amber · RTW-overdue red), headline, and obligation list in place.
- **legal-change** is NOT a switcher state: it is a permanent `LegalChangeCard` section (the minimum-wage-rise event card) shown below the timeline regardless of active scenario.

`FirstEmployer App.html` is expected to also contain the auth, app-shell, and journey-home screens referenced by Prompt 3. File to be added to `/design/prototype/`; not yet in the repo as of this entry.
Approved by: founder (in session).

## 2026-07-07 · P01 · DeadlineChip grading thresholds

The PRD (FR-5.2, signature components list) requires DeadlineChip's grade to be computed from the due date but names no thresholds. Implemented in `components/system/status/DeadlineChip.tsx` as: overdue < 0 days · urgent ≤ 7 days · approaching ≤ 30 days · comfortable > 30 days. Consistent with every prototype example (12 days → approaching, 3 days → urgent, 4 months → comfortable) and with the RTW 60/30/7 alert ladder. These are UX grading constants, not statutory values — statutory offsets stay in config.
Approved by: build session (interpretation; revisit if the PRD gains explicit thresholds).

## 2026-07-07 · P01 · Statutory literals in prototype demo copy not reproduced

The Style Reference showcase copy contains statutory rates in two demo strings (a currency-field error and the NMWA receipt popover). CLAUDE.md Rule 4 bars statutory literals outside config seeds/tests, so /dev/system rewords those two strings without figures ("Below the minimum wage for an apprentice"). Real screens will render rates from getLiveConfig. Behaviour rule wins over prototype copy per the fidelity rule's own hierarchy; appearance is unchanged.
Approved by: build session (Rule 4 compliance).

## 2026-07-07 · P01 · Fonts shipped locally from the prototype export's own assets

General Sans (500/600/700), Inter (latin + latin-ext variable subsets) and Material Symbols Rounded are served from /public/fonts, extracted byte-for-byte from the woff2 assets bundled inside the Style Reference export — no CDN dependency, PWA-friendly. Material Symbols is the full 3 MB variable font for now; subsetting to the used glyph set is deferred to the performance pass (Prompt 13/16 Lighthouse budgets). App routes only — marketing pages will be budgeted separately.
Approved by: build session.

## 2026-07-08 · P02 · Local DB verification via PGlite (Docker unavailable)

Docker Desktop cannot start on the dev machine, so the Supabase local stack (`supabase start`) is unavailable. Migrations are authored to Supabase conventions (`supabase/migrations/*.sql`, an `auth`-schema dependency, anon/authenticated/service_role roles) and verified with `@electric-sql/pglite` — real Postgres 16 compiled to WASM, in-process, no Docker. A test-only shim (`supabase/tests/shim.sql`, never applied to real Supabase) reproduces `auth.uid()`, `auth.users`, and the three Supabase roles so the real migrations apply and RLS can be exercised via `SET ROLE authenticated`. Applying these same migrations to a real Supabase project (Prompt 3 / whenever keys are supplied) remains the production path.
Approved by: build session (Docker blocked; PGlite gives genuine DDL + RLS verification without it).

## 2026-07-08 · P02 · New dev dependencies: vitest + @electric-sql/pglite

The locked stack (CLAUDE.md §4) names no test runner, but §6 mandates golden/adversarial suites under `pnpm gate`. Added **vitest** (test runner) and **@electric-sql/pglite** (in-process Postgres for the migration/RLS harness) as devDependencies only — neither ships in the app bundle. `pnpm gate` now runs `typecheck && lint && test`.
Approved by: build session (testing infrastructure is required by §6; these are the minimal, standard choices).

## 2026-07-08 · P02 · True immutability enforced by trigger, not RLS alone

CLAUDE.md Rule 5 requires determinations/examinations/rtw_records/events to have "no update, no delete, for any role including service where feasible." RLS with select+insert-only policies blocks `authenticated`, but `service_role` bypasses RLS. So each immutable table also carries a `before update or delete` trigger (`public.forbid_mutation`) that raises for EVERY role including service_role and the table owner. Corrections happen by appending a new row (rtw re-checks link via `supersedes`; documents version-chain). Verified in the PGlite harness (update/delete rejected even as superuser).
Approved by: build session (strongest available enforcement of the evidence guarantee).

## 2026-07-08 · P02 · Business creation deferred to a SECURITY DEFINER RPC (no authenticated INSERT on businesses)

`businesses` and `business_members` have no `authenticated` INSERT policy: a naive insert would create a business the user then can't see (no membership row) or allow self-adding to arbitrary businesses. Creation will go through a SECURITY DEFINER onboarding function in Prompt 3 that atomically writes the business + owner membership. Seeds use the service role. This is a deliberate security choice, not an omission.
Approved by: build session.

## 2026-07-08 · P02 · PRD vs CLAUDE.md conflict noted: RTW alert schedule (deferred to Prompt 8)

CLAUDE.md testing-gate 3 says the RTW alert schedule is "60/30/7"; PRD v1.2 FR-4.4 and journey J2 say "90/30/7 days" (90-day pre-expiry follow-up). This is a genuine behaviour conflict (CLAUDE.md vs PRD). It does NOT affect the Prompt 2 schema (obligations store only `due_date`; alert offsets are computed later), so resolution is deferred to Prompt 8 (RTW). Alert schedules are a UX/product choice, deliberately NOT stored in statutory config. Flagging now so it is not lost; founder decision may be needed per CLAUDE.md §9 if it cannot be reconciled (likely: 90/30/7 for RTW re-checks per PRD, 30/14/7/1 for general obligations per FR-5.3).
Owner: resolve at Prompt 8.

## 2026-07-09 · P03-prep · Hosted Supabase DDL via Management API over HTTPS

The dev network blocks the raw Postgres port (direct-host DNS lookup hung; only HTTPS egress works — Supabase Management API `/health` returned 200). So migrations/seed are applied to the hosted project through `scripts/db/apply-sql.mjs`, which POSTs SQL to `https://api.supabase.com/v1/projects/{ref}/database/query` using a Personal Access Token in `.env.local` (`SUPABASE_ACCESS_TOKEN`, gitignored). `scripts/db/verify.mjs` sanity-checks schema/seed/RLS via the REST API with the project keys. `pg` is added as a devDependency as a fallback path but is unused while the Postgres port is blocked. The first hosted apply hit a half-committed `public` schema from an earlier partial SQL-editor run; a one-off `drop schema public cascade` reset (kept in scratchpad, not committed) cleared it before re-applying the full bundle. Demo seed's `auth.users` inserts (id,email) succeed via the Management API's superuser role.
Approved by: build session (only viable automated transport given network egress limits).

## 2026-07-09 · P03 · Tier price conflict — RESOLVED (canonical £9.99/£14.99/£24.99)

The Onboarding prototype originally hardcoded Starter £7.99 / Launch £14.99 / Growth £29.99, conflicting with CLAUDE.md §1 and PRD §10 (£9.99 / £14.99 / £24.99). **Founder ruling (2026-07-09): canonical set is £9.99 / £14.99 / £24.99** (Launch unchanged); the prototype values are superseded. Actions taken: `lib/pricing.ts` set to canonical; the prototype bundles corrected to match (`scripts` price-repack decoded, replaced, and re-packed the embedded assets in Onboarding, Account & Settings, and Homepage — the three bundles that carried the old literals; Pricing/Cost Calculator were already clean). Employee caps 1/5/15 unchanged; highlighted tier Launch.
Status: CLOSED — founder ruling applied to both product and prototypes.

## 2026-07-09 · P03 · Already-employer path includes Business Basics (prototype omits it)

The Onboarding prototype's already-employer path goes fork → 6 gap questions → gap report, never collecting a business name/structure. But `businesses.name` is NOT NULL and structure (sole/limited) drives the checklist, so a persisted business requires them. The build inserts the shared Basics step into the already-path (fork → basics → gapq → gapreport). Deviation from prototype flow on a data-necessity basis (PRD/data model wins on behaviour); appearance of Basics itself is unchanged. Already-path still defaults to Starter tier (no tier chooser), matching the prototype's "free Starter checklist" copy.
Approved by: build session (NOT NULL business name).

## 2026-07-09 · P03 · Auth trust-footer ICO number omitted until registration is live

The prototype AuthScreen shows "ICO registration ZA000000" — a placeholder. Showing a fake ICO number on a compliance product is dishonest, and ICO registration is a launch blocker (CLAUDE.md §8). The build keeps the "encrypted and stored in the UK" trust line but omits the ICO number until the real registration is issued (Prompt 16 launch checklist). Minor copy deviation on honesty grounds.
Approved by: build session.

## 2026-07-09 · P03 · Supabase dev auth config (site_url + redirect allowlist)

Set the hosted project's auth `site_url` to `http://localhost:3100` and added localhost:3000/3100 (+ `/**`) to the redirect allowlist via the Management API, so magic-link `emailRedirectTo` validates in dev. Production URLs get added at deploy (Prompt 16). Note: the hosted project's built-in email service rate-limits magic-link sends (~3-4/hour) — automated tests verify magic-link wiring by rendering + isolated `signInWithOtp` call, and drive the full flow via the password path (same post-auth flow).
Approved by: build session.

## 2026-07-09 · P03 · Build convention — tier prices centralised in lib/pricing.ts

Founder-directed. All tier price/cap/copy data lives in a single module, `lib/pricing.ts` (mirrors the prototype's `FE_TIERS`). Every consumer imports from it: `lib/tiers.ts` (gating), the onboarding tier chooser, the marketing pricing page (Prompt 13), and Stripe (Prompt 12). No price literal may appear in a component or any other module — the one place to change a price is `lib/pricing.ts`. `lib/tiers.ts` re-exports the data and adds gating (`employeeCap`, `canAddEmployee`).
Approved by: founder (in session).

## 2026-07-09 · P03 · Statutory figures in gap-check copy sourced from config (Rule 4)

The gap questionnaire copy in the prototype embeds statutory literals (£5m EL cover, £2,500/day, £45,000 RTW penalty, 3% pension, £400 TPR penalty, 3-yr pay records, 4 weeks' tribunal pay). Rule 4 bars statutory literals outside config, and the grep gate would flag them. So `config_versions.values` gained an `employment_penalties` block (tpr_auto_enrolment_fixed 400, written_statement_tribunal_weeks 4, pay_record_retention_years 3 — identical in 2026.1 and 2026.2, not part of the April uprating); the other figures already existed in config. Gap-question copy is assembled from `getLiveConfig()` in `lib/content/gap-questions.ts`, keeping the prototype's exact wording while sourcing every number from config. `scripts/gen-seed.mjs` now upserts config_versions so edits propagate to the hosted DB.
Approved by: build session (Rule 4 compliance; prototype copy preserved).

## 2026-07-07 · P01 · shadcn/ui initialised as configuration only

components.json + lib/utils.ts (cn) + tailwindcss-animate are in place so `npx shadcn add` works when a primitive is genuinely needed, but no shadcn components are installed: the system library is bespoke, ported one-to-one from the prototype's own component sources (which the export embeds as JSX). Adding shadcn primitives that would restyle system components is prohibited by Rule 6.
Approved by: build session.
