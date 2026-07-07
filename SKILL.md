---
name: firstemployer
description: Full-stack development and domain skill for FirstEmployer — the UK compliance platform that takes first-time employers (sole traders, micro-businesses) from "I want to hire someone" to fully compliant: employment status determination, HMRC PAYE setup, AI-generated employment contracts verified by an independent examiner agent, right-to-work checks, pension auto-enrolment, and a continuous compliance dashboard. Use this skill whenever the user works on ANY part of FirstEmployer, including: the Status Advisor, Setup Engine, Document Generator, Examiner agent, examiner report or verification seal, Right to Work module, Compliance Dashboard, ComplianceRing, obligations engine, evidence vault, audit pack, AI assistant, config_versions or statutory config, the April uprating job, onboarding, tiers/billing, the marketing site, guides, readiness check, cost calculator, sector pages, SEO/GEO work, admin console, PWA behaviour, or any UI component in the design system (DeadlineChip, StatutoryReceipt, StatusPill, VerificationSeal). Also trigger on mentions of "FirstEmployer", "FE", "first employer", "hire first employee", "employment status", "written statement of particulars", "ERA 1996", "statutory excuse", "duties start date", "declaration of compliance", "NLW/NMW rates", "generator/examiner", "fail closed", "Get to Green", or the Dave Okonkwo / Liam Carter demo scenario — even if the request seems like generic Next.js/Supabase work, because FirstEmployer has non-negotiable architecture rules that generic patterns will violate.
---

# FirstEmployer — Project Skill

Read `CLAUDE.md` at the repo root first; it is the constitution and wins over everything here. This skill is the working reference: domain knowledge, patterns, and gotchas that keep sessions fast and correct.

## The one-paragraph mental model

The product is a **compliance decision map executed as software**: employment status constrains contract templates → contract terms drive the PAYE path → start date computes the pension duties timeline → each completed step spawns monitored obligations with deadlines. Four of six modules are deterministic rules code (Status Advisor, Setup Engine, RTW, Dashboard/obligations). Only the Document Generator and Assistant call the Claude API — and every generated document passes an independent Examiner before a user can see it. Fail closed, evidence everything, config is law, green is earned.

## Architecture quick reference

```
/lib/rules/        pure deterministic engines (status, setup, obligations, rtw, examiner-checklist)
/lib/ai/           the ONLY Claude API callers: generator.ts, examiner.ts, assistant.ts
/lib/config.ts     getLiveConfig(date?) — sole sanctioned reader of statutory values
/lib/templates/    solicitor clause library (parameterised; // LEGAL-REVIEW flags until signed off)
/lib/tiers.ts      all tier gating (3/5/15 employees; Growth features) — never inline gate checks
/components/system shared library extracted from /design/prototype/design-system.html
/design/prototype/ Claude Design HTML exports — BINDING visual spec (CLAUDE.md Rule 6)
/content/          guides (MDX), sectors, guidance corpus for the assistant, payroll-providers data
/docs/             PRD v1.1, Relume brief, DECISIONS.md, LAUNCH-CHECKLIST.md
```

**Never violate:** LLM calls inside `/lib/rules/` · statutory literals outside config seeds/tests · generator and examiner sharing context · a document reaching `approved` without an `examinations` PASS row · update/delete on immutable tables · decorative `verified-green`.

## Domain knowledge (UK employment law as implemented)

### Employment status (Status Advisor)
Three verdicts: **employee | worker | self-employed**, with confidence band **clear | leaning | ambiguous**. Factors follow the case-law tests: control (when/where/how work is done), personal service vs substitution right, mutuality of obligation, equipment provision, financial risk, integration, exclusivity. Key anchor case for fixtures: *Ready Mixed Concrete (1968)*. Ambiguous verdicts require a recorded user acknowledgement (events row) before continuing, plus professional-advice signposting. Determinations are deterministic — the reasoning paragraph is template-assembled from factor indications, never LLM-written. Reference format `FE-DET-YYYY-NNNN`, stamped with `rules_version`.

### The written statement of particulars (the contract)
ERA 1996 s.1, as amended: day-one right, and since the 2024 reforms the particulars include probation terms and training entitlements. The Examiner's 13 checks derive from this. The mechanically-checkable subset (deterministic evaluators, not LLM): both parties named and matching the questionnaire · pay ≥ config floor for the employee's age band · holiday ≥ 5.6 weeks pro-rata · notice ≥ statutory minimum · all mandatory particulars present · dates internally coherent. Language-level checks (clause consistency, plain-English standard) go to the examiner LLM at temperature 0 with per-check pass/fail JSON. **Any single FAIL fails the document.** Max 2 attempts, then `human_review`.

### Pension auto-enrolment
Duties start **immediately** on the first employee's start date — "duties start date". **Never use "staging date" in code or copy; it is legacy (pre-2017) terminology.** Declaration of compliance due 5 months from duties start (config value) — this deadline is the most-missed obligation by real first-time employers and is first-class on the dashboard. Assessment against the earnings trigger (£10,000) and qualifying band (£6,240–£50,270) — both frozen for 2026/27.

### Right to work
Two main routes: manual (British/Irish passport) and share-code (eVisa/BRP holders via the GOV.UK checking service). A correctly conducted and recorded check gives the employer a **statutory excuse** — the record IS the legal defence, hence immutable rows plus evidence photos. Time-limited permission → expiry date → follow-up obligation with 60/30/7-day alerts; re-checks supersede, never overwrite. Penalties (config): £45,000 first breach per worker, £60,000 repeat.

### Statutory rates discipline
Current live config version **"2026.2"** (effective 1 April 2026): NLW £12.71 (21+), £10.85 (18–20), £8.00 (16–17/apprentice), SSP day-one. Superseded **"2026.1"** (£12.21 / £10.00 / £7.55) is retained deliberately — the 2026.1→2026.2 transition is the **canonical uprating fixture** for the J4 overnight re-check job, golden tests, and demos. If you ever see £12.21 rendered in UI, that is a defect, not history.

### Liam Carter gotcha
The demo employee is an **apprentice at £8.00/hour** — legal at the apprentice rate, below the 21+ NLW. Age-band derivation matters: validation and examiner checks must compare against the band rate, not blanket NLW. This is intentional fixture design; do not "fix" his pay upward.

## Design system essentials

Tokens (extract from prototype, never from memory): ink-900 `#0E1B2C`, bone-50 `#F7F4EE`, verified-green-600 `#1E9E6A`, amber-500 `#D97A08`, red-600 `#C0392B`, terracotta-500 (marketing only). Components: `DeadlineChip` (grade computed from due date: comfortable/approaching/urgent/overdue), `StatutoryReceipt` ({ref, plainEnglish, officialUrl}), `StatusPill`, `VerificationSeal` ({timestamp, hash} — hash = checklist definition + config version), `ObligationRow`, `DocumentCard` (paper grain), legal-change Alert variant. Voice: reassure before instructing; reading age 9; relief not celebration.

## Common tasks — the right way

**Adding/altering a statutory value:** new `config_versions` draft in the admin publisher → diff → publish with audit note → the uprating job re-evaluates affected obligations. Never edit a live version; never inline the value.

**Adding an examiner check:** extend `/lib/rules/examiner-checklist.ts` ({id, name, plain_english, statutory_ref, evaluator}), prefer a deterministic evaluator, add an adversarial fixture that fails without it, bump examiner version. The checklist_hash changes — that's expected and correct.

**Adding a document type:** template in `/lib/templates/` with `// LEGAL-REVIEW` flag → questionnaire section → examiner checklist mapping → document type in vault filters and audit-pack scopes. No type ships without examiner coverage.

**New marketing/guide content:** MDX in `/content/guides` with front-matter (title, category, answer_box 40–60 words, last_reviewed, reviewer) — the answer box, dated rates via config, question-shaped H2s, and llms.txt regeneration are what make the GEO strategy real. Rates in prose always dated: "£12.71/hour from 1 April 2026".

**New multi-step flow:** one question per screen, radio cards ≥44px, per-step server-side journey_state persistence, autosave indicator, killed-tab resume test. No exceptions — FR-8.6 is P0.

**Touching billing/tiers:** all gate logic in `/lib/tiers.ts`, enforced server-side; limits 3/5/15 employees for Starter/Launch/Growth; lapsed subscriptions go read-only (documents downloadable, generation gated) — users never lose access to documents they generated.

## Gotchas that have bitten or will

1. **Government Gateway trap:** the HMRC walkthrough's organisation-vs-individual warning is the single highest-value piece of guidance in Setup — never trim it in redesigns.
2. **PAYE ref timing:** HMRC posts the reference in ~5 working days; the flow depends on the "mark in progress + reminder to return" pattern, not on the user waiting.
3. **Data deletion vs statutory retention:** account deletion anonymises the owner but retains `retention_class` records (RTW: employment + 2 years; holiday-pay: 6 years). Never build a hard cascade delete.
4. **Assistant scope:** dismissal, discrimination, disputes → boundary card (ACAS + solicitor), enforced in `/lib/ai/assistant-boundaries.ts` and by response-schema rejection of unsourced statutory claims. The assistant also never computes deadlines — it quotes the obligations engine.
5. **Marketing pages read config too** — the cost calculator and risk stats render from `getLiveConfig` at build/revalidate with a "rates current as of" badge. A stale rate on the marketing site of a compliance product is a brand-level defect.
6. **Examiner independence is structural:** if you find yourself importing a generator type into examiner.ts, stop — that's the escalation path in CLAUDE.md §9.
7. **P1 features are visible-but-badged** (e-signature, assistant action buttons, multi-employee matrix, Monitor agent), never silently omitted — the UI truthfully shows what's coming.

## Definition of done (any task)

Matches the named prototype file at 375px · relevant golden/adversarial suites green (`pnpm gate`) · no grep-gate violations · immutability and RLS intact · journey resumes after a killed tab · DECISIONS.md updated for any deviation · commit tagged with the prompt number.
