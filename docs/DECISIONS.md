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

## 2026-07-09 · P04 · Status determination reasoning is template-assembled, NOT LLM (CLAUDE.md Rule 1 over PRD FR-1.3)

PRD FR-1.3 describes an "LLM explanation layer" that converts the factor breakdown into plain-English reasoning (receiving verdict + factors, forbidden from altering the verdict). This conflicts with CLAUDE.md Rule 1 ("employment status determination … are pure rules code. No LLM call may ever participate in them") and Build Prompt 4, which explicitly says the verdict-screen reasoning is "assembled from factor indications (template strings, not LLM)." The constitution wins: the Status Advisor is 100% deterministic, and its reasoning paragraph is template-assembled from factor indications — no Claude API call anywhere in `/lib/rules/status` or the verdict screen. This keeps the determination byte-identical for identical inputs (a testing gate). If the founder later wants LLM-phrased reasoning, it must sit strictly downstream of the fixed verdict and be treated as an AI edge, not part of the determination — that is a product change requiring sign-off (CLAUDE.md §9).
Approved by: build session (Rule 1 + Prompt 4 authority; PRD/constitution conflict logged).

## 2026-07-09 · P04 · Authored 9 of 12 status questions; verdict screen extended to all three verdicts

The Status Advisor prototype shipped only 3 of the 12 questions (personal service, control, mutuality — reproduced verbatim) and no determination logic (a manual clear/ambiguous toggle). The remaining nine questions (control-how, refusal, equipment, financial risk, integration, exclusivity, pay method, benefits, in-business) were authored in the same plain-English, reading-age-9 voice against PRD FR-1.1's seven case-law factor groups. The prototype's verdict screen only rendered employee/ambiguous; the built engine and screen handle all three verdicts (employee/worker/self-employed) × three confidence bands, generalising the prototype's banner/gauge/factor-accordion structure. The determination artefact carries a rules-engine version chip (NOT a VerificationSeal) — matching the prototype's own note and CLAUDE.md Rule 1 (deterministic, not examined).
Approved by: build session (prototype gap; PRD/constitution authority).

## 2026-07-09 · P04 · New dependency: @react-pdf/renderer (server-side PDFs)

CLAUDE.md §4 mandates "server-side PDF generation" but names no library. Added **@react-pdf/renderer** (runtime dependency) to render the determination PDF server-side; it will be reused for contract/variation-letter/audit-pack PDFs (Prompts 6/7/9/10). Uses react-pdf's built-in Helvetica rather than the brand woff2 fonts (react-pdf needs TTF/OTF, not woff2) — the on-screen determination matches the prototype exactly; the PDF is a clean legal artefact in brand colours. Storage: a private `evidence` bucket (supabase/storage-setup.sql, applied to hosted only — Supabase-specific, kept out of the PGlite-run migrations) with RLS scoped to business membership by path prefix.
Approved by: build session (required infrastructure; minimal standard choice).

## 2026-07-09 · P05 · Sole-trader vs limited checklist designed fresh; ICO + H&S added per FR-2.1

The Setup Engine prototype is hardcoded to the limited-company Dave/Liam scenario with NO sole-trader branching and only 7 rows (HMRC, payroll, pension, EL insurance, contract, RTW, records) — it omits the ICO registration and H&S steps that FR-2.1 (P0) requires. Per the fidelity rule, PRD wins on behaviour: the built checklist includes `ico_registration` and `health_safety` steps (styled to the prototype's row pattern), and the sole-trader/limited difference was designed fresh — HMRC and pension guidance differ by type, and a `directorConsideration` flag is set only for limited companies (director on payroll / director auto-enrolment). The "contract blocked until pension complete" dependency is reproduced from the prototype; a "payroll blocked until HMRC in progress" dependency was added (payroll needs the PAYE reference). Golden-tested (`lib/rules/setup/checklist.test.ts`).
Approved by: build session (PRD behaviour over prototype gap; logged).

## 2026-07-09 · P05 · Config additions: LEL weekly (£123), EL certificate-display penalty (£1,000)

The setup copy surfaces two statutory figures not previously in config: the PAYE Lower Earnings Limit (£123/week, the "must run PAYE above this" threshold) and the ELCI Act s.5 certificate-display penalty (£1,000). Both added to `config_versions.values` (`paye.lel_weekly`, `insurance.el_certificate_display_penalty`), identical in 2026.1/2026.2, and sourced via `getLiveConfig()` in the setup UI (Rule 4). The pension declaration deadline is computed by `lib/rules/setup/deadlines.ts` as duties-start + N months − 1 day (TPR's method), verified against the canonical Liam fixture (2026-08-03 → 2027-01-02) both as a golden and end-to-end.
Approved by: build session.

## 2026-07-09 · P06 · New dependency: @anthropic-ai/sdk (the locked "Claude API")

CLAUDE.md §4 locks "Claude API `claude-sonnet-4-6`" but names no client library. Added **@anthropic-ai/sdk** (runtime dependency) as the standard client for the Document Generator (and, in P07, the Examiner). The model id is centralised in `lib/ai/models.ts` (`GENERATION_MODEL`/`EXAMINATION_MODEL` = `claude-sonnet-4-6`, temperature 0) so it changes in one place. The generator dynamically imports the SDK and only when `ANTHROPIC_API_KEY` is set — so builds, tests, and dev without a key never touch the network.
Approved by: build session (required infrastructure for the AI edges; the locked model id is unchanged).

## 2026-07-09 · P06 · Generator fails SAFE to the solicitor template, not closed

CLAUDE.md Rule 2 "fail closed" governs the EXAMINER (no document reaches a user without an examiner PASS). The generator is different: the clause library render (`lib/templates/contract/render.ts`) is itself solicitor-owned, config-compliant legal text, so when the Claude transport is absent or errors, `generateContract` returns the template-rendered contract (marked `source:"template"`) rather than failing. This is safe because the Examiner still gates every document regardless of how it was drafted — nothing is delivered unexamined. Claude, when available, only re-expresses the authoritative clause bodies in plainer English at temperature 0; it is structurally prevented from adding, dropping, or renumbering clauses or altering statutory figures (the generator merges only clause `body` onto the fixed baseline).
Approved by: build session (Rule 2 is examiner-scoped; generator degradation is safe by construction).

## 2026-07-09 · P06 · Examiner interface + stub now; real examiner is P07

Per Build Prompt 6 ("stub the interface now: examine(document): ExaminationResult"), P06 ships the stable `Examine` contract (`lib/ai/examiner-types.ts`) and a stub (`lib/ai/examiner-stub.ts`), plus the 13-check spine (`lib/rules/examiner-checklist.ts`, without evaluators — P07 attaches them). Independence is enforced by construction: the examiner interface imports no generator internals; it receives only the finished artefact, the questionnaire facts, and live config. The stub runs the GENUINE deterministic checks (pay floor, holiday, parties, dates, presence of particulars) so a truly defective contract really fails, and simulates the language-level checks from a `directive` (approve | fix | human) so all three prototype paths are reproducible and pipeline-tested. P07 replaces the language simulation with the real temp-0 LLM examiner and keeps the deterministic checks + this interface.
Approved by: build session (Prompt 6 explicitly defers the examiner to Prompt 7).

## 2026-07-09 · P06 · Pay-floor + holiday validators live in /lib/rules/contract (deterministic core)

The contract questionnaire's live "meets the floor" validation (FR-3.3) is pure rules code, not UI logic: `lib/rules/contract/pay-floor.ts` (wage-band derivation + `checkPayFloor`) and `holiday.ts` (`checkHolidayFloor`). This is deliberate — the SAME functions back the Examiner's deterministic checks #3/#6 (P07) and the April uprating re-check (P09), so there is one source of truth for "is this legal?". Golden-tested (16 cases), including the Liam gotcha (a 27-year-old first-year apprentice is compared against the apprentice band, not the 21+ NLW) and a 1p-shortfall failure. The client never sees a statutory figure: the server page derives the floor from config and passes the number + assembled receipt copy as props (Rule 4), mirroring the P03 gap-questions pattern.
Approved by: build session.

## 2026-07-09 · P06 · Prototype demo chrome (device/screen/outcome switchers) not reproduced in the app

The Document Generator export is a standalone demo with device (mobile/desktop), screen, and "Examiner result" (first-pass/fix/human) switchers, and a "Skip the wait" affordance. These are prototype scaffolding, not product: the real screen renders inside the app shell (`fe-app-main`), and the examiner outcome comes from the pipeline, not a user toggle. The generation progress screen still plays the prototype's staged reveal (drafting → examining ticks → fixing/re-examining → approved/human), but driven by the REAL `runGeneration` result. A P06-only `demoOutcome` field on the server action lets a developer force the fix/human paths against the stub examiner; it is ignored once P07's real examiner lands. SSP weekly amount (the prototype's "£118.75/week") is referenced by name only, not by figure — it is a statutory rate not yet in config, and inventing it is barred (Rule 4 + "never invent statutory content"); a `// LEGAL-REVIEW` flag marks where the config value belongs.
Approved by: build session (prototype wins on appearance; these are demo-harness elements with no product counterpart).

## 2026-07-10 · P07 · Examiner is deterministic-gate-first; the LLM is an additive language layer

Build Prompt 7 mandates "hybrid evaluation": deterministic evaluators where mechanically checkable, LLM only for language-level checks. The build makes the DETERMINISTIC layer the release gate and the LLM strictly additive. Every one of the 13 checks has a deterministic evaluator (`lib/rules/examiner-checklist.ts`) that confirms the particular is PRESENT, FAITHFUL to the questionnaire facts, and meets the config FLOOR where one exists (pay, holiday, notice). These catch all 15 adversarial fixtures with no API key, so CI proves 15/15 (`lib/ai/examiner-adversarial.test.ts`). The temp-0 LLM pass (`examineContract`) judges only the `language`-kind checks (plain-English standard, cross-clause consistency) and can ONLY add a failure — it can never rescue a deterministic FAIL. Rationale: the deterministic gate is provable and offline-testable; the LLM adds defence against subtle language defects a human would catch. When no `ANTHROPIC_API_KEY` is present the examination runs deterministic-only (logged) — acceptable because the gate is the deterministic layer; the language pass is enhancement.
Approved by: build session (satisfies Prompt 7's hybrid model; makes the release gate deterministic and CI-provable).

## 2026-07-10 · P07 · Examiner independence enforced by a server-agnostic core + an import guard test

Rule 3 requires the examiner to share zero context with the generator. Enforced two ways: (1) the examiner module imports NO generator internals — only the finished artefact, the questionnaire facts, and live config (the sanctioned inputs); (2) a test (`lib/ai/examiner-independence.test.ts`) reads the examiner source and fails the build if it ever imports `./generator` or references generator prompt/option symbols. The examiner runs its OWN Claude call with its OWN system prompt ("You are FirstEmployer's independent Examiner … you did NOT write it"). Structurally, the logic lives in `examiner-core.ts` (no `server-only`, so the adversarial suite can exercise it) and `examiner.ts` is the thin `server-only` app entry — mirroring the generator/versions split from P06.
Approved by: build session (Rule 3 by construction + a regression guard).

## 2026-07-10 · P07 · Faithfulness checks: the examiner verifies the document matches the questionnaire

Beyond floors and presence, several deterministic evaluators assert the document is FAITHFUL to the agreed facts: the stated pay equals the agreed pay (and meets the floor), the stated notice equals the agreed notice (and meets the one-week statutory minimum), the parties/hours/holiday/start-date match. This is what lets the deterministic gate catch defects the prompt frames as "language" (e.g. "inconsistent notice clauses", "wrong party name", "stale £12.21 rate") without an LLM: a tampered or stale figure no longer matches the questionnaire, so it fails faithfulness. `STATUTORY_MIN_NOTICE_WEEKS = 1` is a legal rule constant (ERA s.86), not an upratable config rate, so it lives in code (not config) and does not trip the statutory-literal gate.
Approved by: build session.

## 2026-07-10 · P07 · Examiner Report/Viewer rendered from live data; prototype demo figures not reproduced

The Examiner Report + Document Viewer prototype is seeded with stale demo data (Liam **Byrne**, £10.20, 1 April 2026, Bristol, "Examiner v2.4.1", hash "FE-EXM-7f3a91"). The app renders from real records instead: the report's 13 rows come from the stored `examinations` row (with plain-English + affirmative detail derived from the examined clause bodies), the audit trail from the real attempt history, and the seal from the real `checklist_hash` + examiner version (`exam-1.0`). The contract PDF (`lib/pdf/contract.tsx`) is rendered on demand from the stored artefact and stamped with the seal — unlike the determination PDF (pre-rendered, rules-version stamped) because a contract is examined, not calculated. "Send for signature" is P1 (visible, badged, disabled per skill gotcha #7); "Version history" is inert until the vault (P10). Desktop clause-nav vs mobile jump-sheet switch via a CSS media class (`fe-doc-nav`/`fe-doc-jump`) since the app has no device switcher.
Approved by: build session (prototype wins on appearance; live data and honest seal win on truth).

## 2026-07-07 · P01 · shadcn/ui initialised as configuration only

components.json + lib/utils.ts (cn) + tailwindcss-animate are in place so `npx shadcn add` works when a primitive is genuinely needed, but no shadcn components are installed: the system library is bespoke, ported one-to-one from the prototype's own component sources (which the export embeds as JSX). Adding shadcn primitives that would restyle system components is prohibited by Rule 6.
Approved by: build session.
