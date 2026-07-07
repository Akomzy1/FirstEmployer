# FirstEmployer — Build Constitution (CLAUDE.md)

> Place this file at the repository root. Every Claude Code session must read it before writing code. Prompt 0 of the Build Prompt Pack now means: copy this file in verbatim, then scaffold the repo structure. If any instruction in a session conflicts with this file, stop and log the conflict in DECISIONS.md.

## 1. What this product is

FirstEmployer is a UK compliance platform for first-time employers (sole traders and micro-businesses: plumbers, salon owners, café owners — low digital confidence, mobile-first, anxious). It guides one continuous journey: employment status determination → HMRC/payroll/pension/insurance setup → AI-generated, independently examined employment documents → right-to-work checks → a live compliance dashboard that monitors obligations forever. Delivered as an installable PWA. £9.99/£14.99/£24.99 monthly tiers.

**Sources of truth, in order of authority:**
1. `/docs/PRD-v1.2.md` — wins on WHAT the product does (behaviour, rules, requirements).
2. `/design/prototype/*.html` — wins on HOW it looks (Claude Design exports; binding visual spec).

The canonical demo scenario used in ALL seeded/dev data: **Dave Okonkwo, DO Plumbing & Heating Ltd (limited company, Walsall), hiring Liam Carter, apprentice plumber, £8.00/hour, 40 hrs/week, start date 3 August 2026.** Keep this continuous across every screen and fixture.

## 2. Non-negotiable architecture rules

### Rule 1 — Deterministic core, AI edges
Employment status determination, setup-checklist instantiation and sequencing, all deadline computation, obligation state derivation, and right-to-work routing are **pure rules code**. No LLM call may ever participate in them. Identical inputs must produce byte-identical outputs. Exactly two subsystems may call the Claude API:
- the Document Generator (`/lib/ai/generator.ts`)
- the Assistant (`/lib/ai/assistant.ts`)
- (the Examiner's language-level checks in `/lib/ai/examiner.ts` — see Rule 3)

Every rules engine is versioned (`rules_version`) and ships with a golden test suite. Changing a golden verdict without a logged version bump is a CI failure.

### Rule 2 — Fail closed
No generated document reaches a user without an examiner PASS recorded in `examinations`. Examiner failure after the maximum revision attempts (2) routes the document to `human_review` and notifies the user honestly — never silent delivery, never a bypass. If the examiner service is unavailable, generation is unavailable. The system fails safe, not silent.

### Rule 3 — Generator/Examiner separation
The examiner is architecturally independent: its own module, its own system prompt, its own API call, temperature 0. It receives ONLY (a) the document artefact, (b) the questionnaire facts, (c) live config values. It must never receive the generator's prompt, reasoning, or conversation history. They communicate only through the document. Enforce by construction: no shared context types, no shared message arrays. On a FAIL, only the structured defect list is fed back to the generator — never examiner reasoning. This separation is the product's core IP claim; weakening it is not a refactor, it is a product change requiring founder sign-off.

### Rule 4 — Config is law
Every statutory value — rates, thresholds, deadlines, penalties, entitlements — lives in the `config_versions` table with effective dates, read exclusively via `getLiveConfig(date?)` in `/lib/config.ts`. Hardcoding a statutory number anywhere (code, UI copy, marketing pages) is a build defect enforced by grep gates in CI. Test fixtures may pin values.

Live config at time of writing (version "2026.2", effective 2026-04-01): NLW £12.71 (21+); NMW £10.85 (18–20), £8.00 (16–17 and apprentice); statutory holiday 5.6 weeks; AE trigger £10,000; qualifying band £6,240–£50,270; minimum contribution 8% (3% employer); SSP day-one; RTW civil penalty £45,000 first / £60,000 repeat; EL minimum cover £5m; pension declaration of compliance due 5 months from duties start. Superseded version "2026.1" (NLW £12.21; 18–20 £10.00; apprentice £7.55) is retained for the canonical uprating fixture.

### Rule 5 — Evidence by default
Every determination, examination, document version, config publish, RTW record, and acknowledgement writes an immutable audit row at the moment it happens. `determinations`, `examinations`, `rtw_records`, and `events` have insert+select policies only — no update, no delete, for any role. The audit pack must be able to reconstruct the business's compliance history from these rows alone.

### Rule 6 — Prototype fidelity
The prototype HTML in `/design/prototype/` is the binding visual specification. When building any screen: (1) open and read the named prototype file first; (2) reproduce its DOM structure, visual hierarchy, states, and copy as React components; (3) reuse the shared component library in `/components/system` — never restyle ad hoc; (4) PRD wins on behaviour, prototype wins on appearance — record any conflict in DECISIONS.md, never resolve silently; (5) screens without a prototype are composed strictly from existing system components and flagged `// NO-PROTOTYPE: composed from system`. Deviating from the prototype without a logged decision is a build defect, not a creative choice.

## 3. Design invariants

- `verified-green` (#1E9E6A) appears ONLY on legally-true/compliant states and primary CTAs. Green is earned, never decorative. Decorative green fails CI (class-usage grep gate).
- Every statutory claim rendered in UI copy carries a `StatutoryReceipt` chip (ref + plain-English popover + official link).
- Signal red is reserved for overdue/at-risk states and is always calm — this audience is anxiety-prone; red never shouts.
- Reward register is **relief, not celebration**. No confetti, no gamification.
- Guidance copy at reading age 9. en-GB spelling everywhere. Tabular figures on all numeric UI. Body text ≥17px. Tap targets ≥44px. WCAG 2.2 AA.
- Documents render as tactile artefacts (paper-grain treatment per prototype). Examined documents carry the `VerificationSeal` (timestamp + checklist hash).
- Mobile 375px first on every app screen; desktop-first only for `/admin`.

## 4. Stack (locked — deviations logged in DECISIONS.md)

Next.js 14 App Router, TypeScript strict. Supabase: Postgres, Auth (magic link primary), Storage, RLS on every table. Tailwind + shadcn/ui. Claude API `claude-sonnet-4-6`, temperature 0 for generation and examination. Stripe subscriptions (monthly only, 7-day trial without card). Resend email. Vercel deploy. PostHog analytics. Server-side PDF generation. Route groups: `(marketing)`, `(app)/app`, `(admin)/admin`.

## 5. Domain model (canonical entities)

`businesses` (type sole_trader|limited drives checklist instantiation; tier; subscription state) → `employees` (age band derived from DOB; pay {amount, period, hours}) → `determinations` (immutable; verdict, confidence band, factors, rules_version, reference FE-DET-YYYY-NNNN) → `documents` (status draft|examining|approved|human_review|superseded; version chain) → `examinations` (immutable; attempt, 13 check results, defects, generator/examiner/config versions, checklist_hash) → `obligations` (the dashboard's engine: type, state, due_date, evidence link) → `rtw_records` (immutable; statutory excuse evidence; expiry → follow-up obligation) → `evidence` (retention_class governs deletion behaviour) → `config_versions` → `events` (append-only audit).

Obligation set per business: employment status · HMRC PAYE · payroll · pension (declaration deadline first-class) · EL insurance (expiry tracked) · contract · right to work (expiry tracked) · record-keeping.

## 6. Testing gates (all run under `pnpm gate`; CI blocks on any failure)

1. Status Advisor golden suite: 40 cases, 40/40.
2. Examiner adversarial suite: 15 seeded-defect documents, 15/15 caught. Release gate.
3. Deadline/date-math goldens (pension declaration from start date; RTW alert schedule 60/30/7).
4. **Canonical uprating fixture:** config 2026.1 → 2026.2 (NLW £12.21 → £12.71) end-to-end: seeded business flagged overnight, gap shown, examined variation letter, dashboard returns green. This is J4 P0 acceptance.
5. Config resolver goldens (2026-03-31 → 2026.1; 2026-04-01 → 2026.2).
6. Assistant adversarial suite: 10 prompts (dismissal advice extraction, unsourced statutory claims, non-UK law) — all boundary or ground correctly.
7. RLS cross-tenant suite: two seeded businesses, zero cross-access.
8. Grep gates: no statutory literals outside config seeds/tests; no decorative verified-green class usage.
9. Lighthouse budgets on Home + pillar guide: LCP <2.0s, CLS <0.05, INP <200ms throttled mobile; SEO ≥95; PWA checks pass.

## 7. Working rules for every session

- Read this file, then the named prototype file(s), before writing UI code.
- One prompt-pack task per session; do not begin the next until the current VERIFY gate passes; commit at every gate as `feat(pNN): summary — gate passed`.
- Save-and-resume (FR-8.6) is P0 on every multi-step flow: persist journey state server-side per step; killed-tab resume is a required test.
- The Assistant reads state and never mutates it; it never computes a deadline itself — it quotes the obligations engine.
- No new packages outside the locked stack without a DECISIONS.md entry.
- Never invent statutory content. If a template, threshold, or legal rule is needed and not in config or the clause library, flag `// LEGAL-REVIEW` and stub — solicitor sign-off is a launch blocker, not a formality.
- The boundary between guidance and advice is a product position: dismissal, discrimination, and dispute topics are Assistant boundary topics (`/lib/ai/assistant-boundaries.ts`) — signpost to ACAS/solicitor, never advise.

## 8. Launch blockers (honest state — do not mark done aspirationally)

Solicitor sign-off on the clause library (`// LEGAL-REVIEW` flags resolved) · ICO registration live · DPIA complete — pending Open Question 7 (controller vs processor for employee personal data; owner Oludayo + solicitor) · Stripe live keys · production domain/SSL · support inbox.

## 9. Escalation

Stop and ask the founder (do not decide unilaterally) when: a change would weaken Rules 1–3; a statutory interpretation is genuinely ambiguous; the PRD and prototype conflict on behaviour (not appearance); a third-party service in the critical compliance path is being added; or anything would cause a user to see an unexamined document.
