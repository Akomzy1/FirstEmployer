# FirstEmployer — Claude Code Build Prompt Pack v1.0

**Purpose:** Sequenced prompts for Claude Code to build the working FirstEmployer prototype from the Claude Design HTML output.
**Sources of truth (in order of authority):**
1. **PRD v1.1 (Locked)** — behaviour, rules, requirements. Wins on WHAT the product does.
2. **Prototype HTML (Claude Design exports in `/design/prototype/`)** — visual truth. Wins on HOW it looks.
3. Relume Wireframe Brief v1.0 — reference only where 1 and 2 are silent.

**Before Prompt 1:** place all Claude Design HTML exports in the repo at `/design/prototype/`, named by screen (e.g. `dashboard-all-green.html`, `examiner-report-approved.html`, `examiner-report-failed-fixed.html`, `status-advisor-question.html`, `marketing-home.html`, plus the design-system reference page as `design-system.html`). Every UI prompt below names its reference files.

**How to run:** one prompt per Claude Code session. Do not start a prompt until the previous prompt's VERIFY gate passes. Commit at every gate with the prompt number in the message (`feat(p04): status advisor rules engine — gate passed`).

---

## THE PROTOTYPE FIDELITY RULE (embedded in CLAUDE.md by Prompt 0; every UI prompt re-states it)

> **The prototype HTML in `/design/prototype/` is the binding visual specification. You must strictly follow and align with it.** Extract — do not reinvent — its design tokens, spacing, type scale, component structure, copy, and states. When building any screen: (1) open and read the named prototype file(s) first; (2) reproduce the DOM structure and visual hierarchy as React components; (3) reuse the shared component library — never restyle ad hoc; (4) if the prototype and the PRD conflict, PRD wins on behaviour, prototype wins on appearance — and you must record the conflict in `DECISIONS.md` rather than silently choosing; (5) if a needed state/screen has no prototype file, compose it strictly from existing design-system components and flag it `// NO-PROTOTYPE: composed from system` for review. Deviating from the prototype without a logged decision is a build defect, not a creative choice.

---

## PROMPT 0 — Repository + CLAUDE.md (the build constitution)

```
Initialise the FirstEmployer repository and write CLAUDE.md at the repo root. This file governs every future session; write it exactly as specified, then scaffold nothing else yet.

CLAUDE.md must contain:

# FirstEmployer — Build Constitution

## What this is
UK compliance platform for first-time employers. Guided journey: employment status → HMRC setup → examined contract generation → right-to-work → pension → continuous compliance dashboard. PWA, mobile-first. Source docs: /docs/PRD-v1.1.md (behaviour), /design/prototype/ (appearance).

## Non-negotiable architecture rules
1. DETERMINISTIC CORE, AI EDGES. Status determination, setup sequencing, deadline computation, obligation state, and right-to-work routing are pure rules code — no LLM calls, ever. Identical inputs must produce identical outputs. Only two subsystems may call the Claude API: the Document Generator and the Assistant.
2. FAIL CLOSED. No generated document reaches a user without an examiner PASS. Examiner failure after max attempts → human-review queue, never silent delivery. If the examiner service is down, generation is unavailable — never bypassed.
3. GENERATOR/EXAMINER SEPARATION. The examiner runs with its own prompt, its own context, and must never receive the generator's reasoning or share its conversation. They communicate only via the document artefact. Enforce in code structure: separate modules, separate API calls, no shared message history.
4. CONFIG IS LAW. Every statutory value (rates, thresholds, deadlines, penalties) lives in the config_versions table with effective dates. Hardcoding a statutory number anywhere — including UI copy, tests may use fixtures — is a build defect. Current live config: post-1-April-2026 set (NLW £12.71; 18–20 £10.85; 16–17/apprentice £8.00; AE trigger £10,000; band £6,240–£50,270; SSP day-one; RTW penalties £45,000/£60,000).
5. EVIDENCE BY DEFAULT. Every determination, examination, document version, config publish, and RTW record writes an immutable audit row at creation time. Deleting audit rows is impossible via app code (RLS + no delete policy).
6. PROTOTYPE FIDELITY. [paste the Prototype Fidelity Rule verbatim from the pack header]

## Design invariants (from the design system)
- verified-green #1E9E6A appears ONLY on legally-true/compliant states and primary CTAs. Decorative green is a defect.
- Every statutory claim in UI copy renders a StatutoryReceipt chip.
- Reading age 9 for guidance copy; en-GB spelling; tabular figures on all numeric UI; body ≥17px; tap targets ≥44px; WCAG 2.2 AA.
- Red never shouts: reserved for overdue/at-risk, calm treatment.
- Reward register is relief, not celebration. No confetti.

## Stack (locked)
Next.js 14 App Router + TypeScript strict. Supabase (Postgres, Auth, Storage, RLS on every table). Tailwind + shadcn/ui. Claude API: claude-sonnet-4-6 for generation/examination (temperature 0) and assistant. Stripe subscriptions. Resend email. Vercel deploy. PostHog analytics. pdf generation server-side.

## Testing gates
- Rules engines (status, deadlines, obligations) ship with golden test suites; a release that changes a golden verdict without a logged config/rules version bump fails CI.
- The canonical uprating fixture is 1 April 2026 (£12.21→£12.71): config transition tests must use it.
- Examiner: adversarial fixture set (documents seeded with known defects) — examiner must catch 100% of seeded statutory defects.

## Working rules for Claude Code
- Read the named prototype file(s) before writing any UI code in a task.
- Never install packages outside the locked stack without logging in DECISIONS.md.
- Every screen: mobile 375px first; verify no horizontal scroll.
- Seeded dev data uses the canonical demo scenario: Dave Okonkwo / DO Plumbing & Heating Ltd / Liam Carter, apprentice, £8.00/hr, start 3 Aug 2026.
- Commit per completed task with prompt number.

Then: git init, create /docs (copy in PRD), /design/prototype (I will add HTML exports), DECISIONS.md (empty log), README with run instructions placeholder.

VERIFY: CLAUDE.md exists with all sections; repo structure created; nothing else built.
```

---

## PROMPT 1 — Scaffold + Design Token Extraction + Component Library

```
Read CLAUDE.md. Read /design/prototype/design-system.html in full — this task is EXTRACTION, not invention.

1. Scaffold Next.js 14 (App Router, TS strict), Tailwind, shadcn/ui, Supabase client setup, PostHog stub. Route groups: (marketing), (app)/app, (admin)/admin.

2. Extract from design-system.html into tailwind.config: the exact colour tokens (ink-900, bone-50, verified-green-600, amber-500, red-600, terracotta-500, neutral ramp), font stacks, type scale, radii, shadows. Cross-check hex values against the prototype file, not from memory.

3. Build the shared component library in /components/system, matching the prototype's markup and states one-to-one:
   Button (4 variants + loading/disabled), DeadlineChip (4 grades, computes grade from a due date prop), StatutoryReceipt (chip + popover, takes {ref, plainEnglish, officialUrl}), StatusPill, FormField set (text/select/radio-cards/date/currency/file with camera capture attr), Card / DocumentCard (paper-grain treatment from prototype CSS) / ObligationRow, Alert (info/warning/success/legal-change), ProgressDots + ProgressBar with autosave indicator, VerificationSeal ({timestamp, hash}).

4. Build a /dev/system route rendering every component in every state, side-by-side conceptually with the prototype for eyeball diffing.

PROTOTYPE FIDELITY RULE applies in full. Any token or state present in design-system.html but missing from your library is a defect; anything you add that isn't in the prototype must be flagged NO-PROTOTYPE.

VERIFY: /dev/system renders all components; tokens diff-checked against prototype hex values; mobile 375px clean; zero decorative green.
```

---

## PROMPT 2 — Database Schema + RLS + Config System

```
Read CLAUDE.md. No UI in this task. Create Supabase migrations for the full schema:

- profiles (auth extension), businesses (type: sole_trader|limited, sector, tier, trial/subscription state)
- employees (business_id, name, dob→age-band derivation, start_date, pay {amount, period, hours}, status)
- determinations (employee_id, answers jsonb, verdict, confidence_band, factors jsonb, rules_version, reference FE-DET-YYYY-NNNN, pdf_path) — immutable
- config_versions (id, label e.g. "2026.2", effective_from, status draft|scheduled|live, values jsonb, published_by, audit_note) — statutory values ONLY here
- documents (business_id, employee_id, type, status draft|examining|approved|human_review|superseded, version, content_path, questionnaire jsonb)
- examinations (document_id, attempt, verdict pass|fail, checks jsonb [13 rows: id, name, result, detail, statutory_ref], defects jsonb, generator_version, examiner_version, config_version, created_at, checklist_hash) — immutable, no update/delete policies
- obligations (business_id, employee_id nullable, type, state, due_date, source, evidence_id nullable) — the dashboard's engine
- rtw_records (employee_id, route, checked_by, checked_at, result, evidence paths, expiry_date nullable, follow_up_due nullable) — immutable
- evidence (business_id, type, file_path, meta jsonb, retention_class)
- assistant_threads/messages (grounding_refs jsonb per message)
- events (append-only audit log: actor, action, entity, payload, at)

RLS: every table scoped to business membership; examinations/determinations/rtw_records/events have insert+select only (no update/delete for any role including service where feasible). Admin access via service role only.

Seed: config_versions with "2026.1" (superseded: NLW 12.21, 18–20 10.00, apprentice 7.55) and "2026.2" (live from 2026-04-01: NLW 12.71, 18–20 10.85, apprentice 8.00, AE trigger 10000, band 6240–50270, SSP day-one true, RTW penalties 45000/60000, pension declaration months 5, EL min cover 5000000). Seed the Dave/Liam demo business.

Build /lib/config.ts: getLiveConfig(date?) resolving by effective date; the ONLY sanctioned way to read statutory values.

VERIFY: migrations apply clean; RLS tested with two seeded businesses (cross-access denied); config resolver returns 2026.1 for 2026-03-31 and 2026.2 for 2026-04-01; golden test file for the resolver committed.
```

---

## PROMPT 3 — Auth, App Shell, Onboarding Fork

```
Read CLAUDE.md. Prototype refs: app-shell.html, auth.html, onboarding-fork.html, onboarding-basics.html, gap-questionnaire.html. Read them first; PROTOTYPE FIDELITY RULE applies.

1. Auth: Supabase magic-link primary, password optional, per auth.html exactly (trust footer included).
2. App shell: bottom tab bar (mobile) / left rail (desktop) per prototype; business name header; PWA install prompt component built but trigger-wired later (Prompt 17).
3. Onboarding: fork screen (two scenario cards) → business basics (name, structure — drives checklist instantiation later, sector) → tier chooser (Starter 9.99/Launch 14.99 highlighted/Growth 24.99, trial-no-card copy) → creates business row, starts trial state (Stripe wiring in Prompt 14 — stub the subscription state machine now).
4. Already-an-employer path: 6-question gap questionnaire (one per screen, radio cards, autosave to db) → gap report screen with severity-ordered gaps per prototype → writes corresponding obligations rows.
5. Save-and-resume foundation (FR-8.6): journey_state per business persisted server-side on every step of every flow; /app/home "continue where you left off" card reads it. Build journey home per journey-home.html with the six-module map reading real module state.

VERIFY: full signup→onboarding→journey-home flow works on 375px; kill the tab mid-questionnaire, sign in again, resume exactly where left; gap answers create obligations rows; screens visually match prototypes.
```

---

## PROMPT 4 — Status Advisor (deterministic rules engine)

```
Read CLAUDE.md. Prototype refs: status-advisor-intro.html, status-advisor-question.html, status-advisor-verdict.html, status-advisor-ambiguous.html, determination-document.html.

1. /lib/rules/status: pure TypeScript rules engine. Inputs: 12 answers (control, substitution, mutuality, equipment, financial risk, integration, exclusivity, etc. — derive the full question set from PRD FR-1.1). Output: {verdict: employee|worker|self_employed, confidence: clear|leaning|ambiguous, factors: [{id, answer, indication, weight, refs}]}. NO LLM. Version the engine (rules_version "sa-1.0").
2. GOLDEN SUITE FIRST: write 40 golden cases (fixtures: answers → expected verdict+band) covering clear employees, clear self-employed, worker middle ground, and 6 ambiguous edge cases, including a Ready-Mixed-Concrete-pattern case and an apprentice case. Engine development is done when all pass; CI fails on any golden change without rules_version bump.
3. Flow UI per prototypes: one question per screen, why-we-ask expandables, progress dots, autosave (journey_state). Verdict screen: gauge, plain-English reasoning assembled from factor indications (template strings, not LLM), factor accordion with StatutoryReceipts (statute + case-law chips).
4. Ambiguous path: interstitial with recorded acknowledgement (events row) before continue, per prototype.
5. Determination document: server-side PDF (reference FE-DET-YYYY-NNNN, rules_version chip, factors table), stored, determinations row written, deposited to evidence vault; CTA into Setup.

VERIFY: 40/40 golden pass; same answers twice → byte-identical verdict payload; ambiguous acknowledgement lands in events; PDF downloads; screens match prototypes on 375px.
```

---

## PROMPT 5 — Setup Engine

```
Read CLAUDE.md. Prototype refs: setup-checklist.html, setup-step-hmrc.html, setup-payroll.html, setup-pension.html, setup-insurance.html.

1. Checklist instantiation rules (/lib/rules/setup): steps derived from business.type (sole trader vs limited differ) and gap-questionnaire results for existing employers. States: not_started|in_progress|blocked|complete with dependency logic (contract blocked until pension in progress etc. per PRD FR-2.6 ordering).
2. HMRC step detail per prototype: annotated walkthrough frames (static assets), the organisation-account warning component, PAYE-reference capture field (validated format NNN/XXNNNNN), "posts within 5 working days" reminder scheduling (obligations row with due date), evidence upload.
3. Payroll step: comparison cards from a /lib/data/payroll-providers.ts file (name, price, best-for, hmrc_recognised) — content file, not hardcoded in JSX; referral disclosure banner per prototype.
4. Pension step: duties timeline computed BY RULES from employee.start_date via config (declaration deadline = duties start + config.pension_declaration_months); provider cards; writes the declaration obligation with DeadlineChip data.
5. Insurance step: penalty explainer (value from config via StatutoryReceipt props), certificate upload → evidence row + expiry date → renewal obligation created.

VERIFY: sole trader vs limited produce different checklists; Liam's start date 2026-08-03 yields declaration due 2027-01-02 (golden test); completing steps flips obligations; uploads land in vault; prototype match on 375px.
```

---

## PROMPT 6 — Document Generator (generation half)

```
Read CLAUDE.md. Prototype refs: documents-list.html, contract-questionnaire.html, generation-progress.html, human-review-fallback.html. Architecture rules 1–3 apply with force.

1. /lib/ai/generator.ts: Claude API (claude-sonnet-4-6, temperature 0). System prompt assembled from: solicitor-clause-library templates (/lib/templates/contract/*.ts — parameterised clauses, placeholder library committed now, flagged for solicitor review), the questionnaire payload, and statutory values injected FROM CONFIG (never inline). Output: structured contract JSON (clauses[]) + rendered document. Version the prompt (generator_version "gen-1.0").
2. Questionnaire UI per prototype: sectioned form, live statutory-floor validation (currency field checks pay÷hours against config rate for the employee's age band — pure function, golden tested), holiday pre-fill from config, autosave.
3. Generation pipeline: documents row (status draft→examining) → generator call → hand artefact to examiner (Prompt 7 — stub the interface now: examine(document): ExaminationResult) → on PASS: approved; on FAIL: one revision cycle with defects fed back to generator (defects only, never examiner reasoning) → second FAIL: status human_review, queue row, user notified per fallback prototype.
4. Generation progress screen per prototype: staged states streamed to client (drafting → examining with per-check ticks → approved/revising with named defect / human review). Honest attempt display.

VERIFY: pipeline runs end-to-end against the stubbed examiner (forced pass, forced fail-fix, forced double-fail paths all render correct screens); no statutory literal in generator code (grep gate: no "12.71" outside config seed/tests); prototype match.
```

---

## PROMPT 7 — Examiner Agent (the core IP)

```
Read CLAUDE.md. Prototype refs: examiner-report-approved.html, examiner-report-failed-fixed.html, document-viewer.html. Architecture rules 2–3 are the whole point of this task.

1. /lib/ai/examiner.ts: fully separate module. Own Claude API call, own system prompt, temperature 0, receives ONLY the document artefact + questionnaire facts + live config values. It must never receive generator prompts, reasoning, or history — enforce by construction (no shared imports of generator context types).
2. The 13-check checklist as STRUCTURE, not vibes: each check defined in /lib/rules/examiner-checklist.ts with {id, name, plain_english, statutory_ref, evaluator}. Hybrid evaluation: deterministic evaluators where mechanically checkable (pay ≥ config floor for age band; holiday ≥ 5.6wk pro-rata; both parties named matches questionnaire; all ERA s.1 particulars present; notice ≥ statutory; dates coherent), LLM evaluation only for language-level checks (clause consistency, plain-English standard) — and the LLM answers per-check with pass/fail+detail JSON. Any single FAIL → document FAILS.
3. Every run writes an immutable examinations row: attempt, per-check results, defects, generator/examiner/config versions, checklist_hash (hash of checklist definition + config version — the VerificationSeal content).
4. ADVERSARIAL FIXTURES: 15 seeded-defect documents (pay 1p under apprentice rate; missing probation particular; 27-day holiday; inconsistent notice clauses; wrong party name; stale £12.21 rate...). Examiner must catch 15/15 — this is the release gate.
5. Examiner Report UI per prototypes (full-screen, verdict banner, 13 rows with receipts, audit trail expandable, VerificationSeal rendering checklist_hash, the failed-then-fixed variant, independence footer copy). Document viewer per prototype with clause anchors + PDF export stamped with the seal.

VERIFY: 15/15 adversarial catches (CI gate); generator/examiner share zero conversation context (code-review the imports); examinations rows immutable (update attempt fails under RLS); report screens match prototypes; wire the real examiner into Prompt 6's pipeline and re-run all three paths.
```

---

## PROMPT 8 — Right to Work Module

```
Read CLAUDE.md. Prototype refs: rtw-route-selector.html, rtw-sharecode-walkthrough.html, rtw-record.html, rtw-expiry-state.html.

1. Route rules (/lib/rules/rtw): document-type decision tree → manual|share_code|guidance route. Pure rules.
2. Walkthrough UI per prototypes: annotated GOV.UK frames, must-show checklist, camera-first evidence capture.
3. Check record: form → immutable rtw_records row + evidence files → generates "statutory excuse" record PDF into vault with receipt copy per prototype.
4. Time-limited permissions: expiry date → follow_up obligation auto-created with 60/30/7-day alert schedule (obligations + notification jobs); re-check flow reuses walkthrough and supersedes chain (record versions linked, nothing overwritten).

VERIFY: manual and share-code routes complete on 375px with camera capture; expiry seeds obligations with correct alert dates (golden test on date math); records immutable; prototype match.
```

---

## PROMPT 9 — Dashboard + Obligations Engine + Uprating Job

```
Read CLAUDE.md. Prototype refs: dashboard-all-green.html, dashboard-attention.html, dashboard-at-risk.html, dashboard-legal-change.html. This is the product's hero — fidelity scrutiny is highest here.

1. Obligations engine (/lib/rules/obligations): derives each business's obligation set + state from underlying records (determination exists? PAYE ref captured? pension declaration done? contract approved? RTW valid/not-expiring? insurance in date? records duty). State transitions are pure functions; DeadlineChip grades computed from due dates.
2. ComplianceRing per prototype: all-green / attention / at-risk states driven by real engine output. Headline copy logic per prototype exactly ("You're compliant, {firstName}." etc.).
3. Obligation rows with one-tap fix deep links into owning modules; 90-day timeline strip.
4. UPRATING JOB (J4, P0 acceptance): scheduled job — on a config_version becoming live, re-evaluate every business's pay-dependent obligations against the new config overnight; where pay < new floor: flag obligation, dashboard legal-change event card per prototype (per-employee gap, "Generate variation letter" — a Document Generator flow for a variation letter template, examined like everything else) → on approval, obligation returns green.
5. Golden J4 test: seed business on 2026.1 with employee at £12.21 → publish 2026.2 → job flags gap of £0.50/hr → variation letter path → green. The canonical fixture.

VERIFY: three dashboard states render from engine (not hardcoded); J4 golden passes end-to-end; deep links land in the right module step; pixel-match against all four prototype files on 375px.
```

---

## PROMPT 10 — Evidence Vault + Audit Pack

```
Read CLAUDE.md. Prototype refs: vault-grid.html, audit-pack-export.html, document-detail-history.html.

1. Vault: filterable grid over evidence + documents + determinations + rtw_records (unified view model), version chips, seals where examined, retention_class labels with receipt copy per prototype.
2. Audit Pack: scope presets (HMRC / Home Office / TPR / Everything) → chronological compile → single indexed PDF bundle (cover page: business, date range, index table, then artefacts in order) generated server-side with progress state → vault row + download.
3. Version history timeline on document detail (superseded chain from the uprating variation).

VERIFY: HMRC preset excludes RTW evidence, Home Office preset includes it (scope rules golden-tested); bundle PDF opens with working index; prototype match.
```

---

## PROMPT 11 — AI Assistant

```
Read CLAUDE.md. Prototype refs: assistant-chat.html, assistant-boundary.html. Architecture rule 1: the assistant is an AI EDGE — it reads state, it never mutates it, and it never computes a deadline itself (it quotes the obligations engine).

1. /lib/ai/assistant.ts: claude-sonnet-4-6, grounded on: curated guidance corpus (/content/guidance/*.md, committed placeholder set), live config values, and the business's own obligation state (read-only context injection). Every answer must return grounding refs; the UI renders source chips + StatutoryReceipts per prototype. If the model cannot ground an answer, it must signpost, not improvise — enforce via system prompt + a response-schema check that rejects unsourced statutory claims.
2. Boundary behaviour per prototype: out-of-scope topics (dismissal, discrimination claims, disputes) → boundary card with ACAS + solicitor signposts. Boundary topic list in /lib/ai/assistant-boundaries.ts.
3. Context cards: proactive surfacing of nearest deadline from obligations (deterministic selection, assistant only phrases it). Deep-link buttons badged P1 (visible, disabled).
4. Adversarial test set: 10 prompts trying to extract dismissal advice, unsourced rate claims, or non-UK law — all must boundary or ground correctly.

VERIFY: 10/10 adversarial handled; every rendered answer shows ≥1 source chip or is a signpost; assistant has no write access (code-review); prototype match.
```

---

## PROMPT 12 — Billing + Tiers

```
Read CLAUDE.md. Prototype refs: account-tier.html, settings-privacy.html.

1. Stripe: three monthly prices (9.99/14.99/24.99), 7-day trial without card, checkout + customer portal, webhook → subscription state machine on businesses (trialing|active|past_due|canceled) with grace behaviour (read-only access on lapse — documents remain downloadable; generation gated).
2. Tier gates enforced server-side: employee-count limits (3/5/15), Growth-only features flagged. Gate checks in one module (/lib/tiers.ts), never inline.
3. Account screen per prototype (usage meter, upgrade cards, portal link); Settings per prototype including data export (JSON+files zip) and account deletion flow honouring statutory retention (retention_class rows survive with anonymised owner, explained in UI per prototype).

VERIFY: trial→active→canceled transitions via Stripe test clocks; 4th employee blocked on Starter with upgrade path shown; deletion retains RTW/holiday-pay records, purges the rest; prototype match.
```

---

## PROMPT 13 — Marketing Site (SEO/GEO build)

```
Read CLAUDE.md. Prototype refs: marketing-home.html, feature-template.html, feature-contracts.html, pricing.html, trust.html, about.html, guides-hub.html, guide-article.html, sector-template.html, tool-readiness.html, tool-calculator.html. PROTOTYPE FIDELITY RULE applies to every page.

1. Build all marketing routes as SSG/ISR in (marketing) group, per prototypes. Sector pages ×8 and guides ×12 from MDX/content collections (/content/sectors, /content/guides — commit the pillar guide fully written from the trust/how-it-works copy already in prototypes; stub the other 11 with front-matter + answer-box so the system is real).
2. Statutory values on marketing pages come from getLiveConfig at build/revalidate time with "Rates current as of {config.label}" badges — the calculator and risk stats never hardcode (grep gate).
3. Readiness check: 8-question flow reusing the app's radio-card components, results + email gate (Resend list), gaps handoff into onboarding (querystring → pre-seeded obligations).
4. Cost calculator: pure functions over config (employer NI with Employment Allowance note, pension 3%, EL estimate); shareable result; email-gated PDF.
5. SEO: per-page metadata (≤60-char titles, answer-style descriptions), JSON-LD (Organization+SoftwareApplication sitewide; Product+Offer on pricing; FAQPage where FAQs exist; HowTo on relevant guides; Article+author+dateModified on guides; BreadcrumbList), segmented XML sitemaps, canonicals, robots.txt allowing GPTBot/ClaudeBot/PerplexityBot, disallowing /app /admin.
6. GEO: answer-first summary-box component on every guide (40–60 words); llms.txt + llms-full.txt generated from the content collections at build; canonical entity descriptor rendered in footer + About + llms.txt verbatim; question-shaped H2s preserved from prototypes.
7. CWV budgets: LCP <2.0s, CLS <0.05, INP <200ms on throttled mobile — Lighthouse CI check committed.

VERIFY: Lighthouse ≥95 SEO / budgets met on Home + pillar guide; rich-results test passes for FAQPage/Product/Article; llms.txt lists all live content; zero hardcoded rates (grep); pixel-match spot check on Home hero, pricing cards, answer box at 375px.
```

---

## PROMPT 14 — Admin Console

```
Read CLAUDE.md. Prototype refs: admin-users.html, admin-examinations.html, admin-config-publisher.html, admin-monitor-queue.html, admin-feedback.html. Desktop-first; service-role access behind admin auth (email allowlist).

1. Users & subscriptions table with drill-in.
2. Examination log inspector: filters (verdict, defect type, date), drill-in per prototype (attempt timeline, defect detail, version chips) — read-only, flight-recorder framing.
3. Config publisher: versions list, jsonb diff view (old→new per key), publish flow requiring audit note + typed confirmation; publishing schedules the uprating job (Prompt 9). This is the only write path to config_versions.
4. Monitor review queue: full UI per prototype wired to a manual-entry source for now (P1 agent later) — a human can log a source change, classify, propose a config draft, approve → creates draft config_version. Nothing auto-publishes.
5. Feedback table (flow-completion widget data — add the widget itself to all flow-completion screens in this task, per FR-8.5).

VERIFY: config publish requires note+confirm and lands in events; diff view correct for 2026.1→2026.2; non-allowlisted users hard-blocked; feedback rows arrive from a completed flow.
```

---

## PROMPT 15 — PWA + Save/Resume Hardening

```
Read CLAUDE.md. Prototype ref: app-shell.html (install prompt component).

1. Web app manifest (name, icons, standalone, theme ink-900/bone-50), service worker: app-shell caching, offline fallback page ("You're offline — everything you've done is saved"), no caching of authed API data beyond shell.
2. Install prompt trigger per design intent: fires after first module completion event, never on first load; dismissal respected 30 days.
3. Save/resume audit (FR-8.6 P0): walk EVERY multi-step flow (status advisor, gap questionnaire, contract questionnaire, RTW walkthrough, onboarding) — kill/resume test each; fix any flow not persisting per-step. Add "Saved just now" indicators wherever missing per design system.
4. Flaky-network behaviour: mutations queue-and-retry or fail loud with preserved input — never silent loss.

VERIFY: installable on Android Chrome + iOS Safari (add-to-home-screen); airplane-mode mid-questionnaire → reconnect → nothing lost; Lighthouse PWA checks pass.
```

---

## PROMPT 16 — Golden Suite, Hardening, Launch Gate

```
Read CLAUDE.md. Final gate — no new features.

1. Consolidate CI: status golden 40/40, examiner adversarial 15/15, deadline/date math goldens, J4 uprating end-to-end, config-resolver goldens, assistant adversarial 10/10, RLS cross-tenant suite, grep gates (statutory literals, decorative green class usage), Lighthouse budgets. One `pnpm gate` command runs everything; CI blocks merge on any failure.
2. Security pass: rate limiting on AI endpoints, upload validation (type/size/AV hook), Stripe webhook signature verification, admin allowlist test, secrets audit.
3. Accessibility pass: keyboard-complete on all flows, axe clean on top 10 screens, focus management in one-question-per-screen flows.
4. DECISIONS.md review: every NO-PROTOTYPE flag and PRD/prototype conflict logged has a resolution.
5. Produce LAUNCH-CHECKLIST.md: solicitor sign-off on clause library [blocking], ICO registration live [blocking], DPIA complete (pending Open Question 7 controller/processor answer) [blocking], Stripe live keys, domain + SSL, PostHog live, support inbox, status page.

VERIFY: `pnpm gate` green; checklist committed with blocking items honestly marked NOT DONE where true.
```

---

## STANDING REMINDERS (paste if any session drifts)

- Re-read CLAUDE.md. The prototype HTML in /design/prototype/ is the binding visual spec — extract, don't invent; log every deviation in DECISIONS.md.
- PRD v1.1 wins on behaviour; prototype wins on appearance.
- No LLM in the deterministic core. No statutory literal outside config. No document past a failed examiner. Green only when legally true.
