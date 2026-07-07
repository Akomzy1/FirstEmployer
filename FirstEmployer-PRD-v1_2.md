# FirstEmployer — Product Requirements Document

**Version:** 1.2
**Status:** Locked for build
**Changelog v1.1 → v1.2 (additive; no FR renumbering):** §4b Design Language added ("Get to Green" system, invariants, signature components); Module 2 orchestration position stated explicitly (guidance orchestration, never agent execution); §7 examiner evaluation refined to hybrid model (deterministic evaluators + LLM language checks); Module 8 Acquisition & Content Engine added (FR-9.x: marketing site, sector pages, guides, lead tools, SEO/GEO); homepage positioning and existing-employer qualifier recorded; canonical build fixture defined (Dave Okonkwo / Liam Carter, apprentice-rate edge case); marketing performance budgets added to NFRs; acquisition funnel metric added to §11; Appendix B formalised config version labels 2026.1/2026.2; Appendix C document map added.
**Changelog v1.0 → v1.1:** Appendix B statutory values corrected to post-April 2026 position (NLW £12.71); April 2026 uprating adopted as canonical golden-suite scenario; Phase 0 TRL claim aligned with business plan ladder (TRL 3–5 trajectory); Regulatory Change Monitor timing aligned to business plan Y2 Q1 R&D line; staff handbook P1 sequencing rationale recorded; controller/processor position added as Open Question 7; FR-2.4 terminology corrected (duties start date, not staging); FR-8.6 save-and-resume promoted to P0; delivery surface locked as installable PWA, WhatsApp-native capture layer out of scope (NG6).
**Owner:** Tokunbo Akomolede (CEO & Technical Lead)
**Compliance review:** Oludayo Akomolede (COO & Compliance Lead)
**Date:** July 2026
**Related documents:** Business Plan (FINAL-RECONCILED), Financial Forecast (UKES template), Demo Build Spec, Competitive Verification Report (July 2026), Relume Wireframe Brief v1.0, Claude Design Prompt Pack v1.0, Claude Code Build Prompt Pack v1.0, CLAUDE.md (build constitution), firstemployer SKILL.md — see Appendix C for authority order.

---

## 1. Product Vision

FirstEmployer is the UK's first end-to-end guided platform for becoming an employer. It takes a sole trader or micro-business owner from "I think I need to hire someone" to "I am a fully compliant employer" through one connected workflow, then keeps them compliant for as long as they employ people.

The product replaces a fragmented journey across five government agencies, £500 to £2,000 in accountancy fees, and a set of risks most first-time employers do not know exist (up to £45,000 per illegal worker, £2,500 per day for missing employer's liability insurance, escalating Pensions Regulator penalties) with a single subscription costing less than a monthly phone contract.

**One-line positioning:** The compliance layer of employment, from first hire onward. Not HR administration.

**The strategic wedge (validated July 2026):** no UK product bundles the full journey below roughly £40 per month. Employment Hero enforces a 10-user minimum. BrightHR's realistic entry is about £83 per month. Go-Legal AI does documents only. Tide does payroll and pension but no contracts, status, RTW, or monitoring. GOV.UK is static guidance. FirstEmployer owns the sub-£25, zero-to-one-employee segment.

## 2. Goals and Non-Goals

### Goals
1. G1. A first-time employer with no prior knowledge can complete every legal obligation of hiring, correctly, without external help.
2. G2. Every generated document is verified by an independent AI examiner before the user sees it; zero non-compliant documents reach users.
3. G3. The platform detects relevant regulatory change within 24 hours and updates guidance and templates through a human-approved pipeline.
4. G4. Ongoing compliance state is always visible and always current: a user can answer "am I compliant right now?" in one glance.
5. G5. Unit economics support the price point: marginal cost per active subscriber under £0.60 per month at scale (API plus infrastructure).
6. G6. Evidence trail by design: every check, determination, and document is timestamped, versioned, and exportable for HMRC, Home Office, or Pensions Regulator scrutiny.

### Non-Goals (explicit, permanent unless revisited)
1. NG1. Payroll processing. We guide setup and selection; we never run payroll. Xero, Sage, BrightPay are partners, not competitors.
2. NG2. HR administration: leave tracking, rotas, performance reviews, disciplinary workflow tooling. CharlieHR and BrightHR territory; we refer graduating customers onward.
3. NG3. Regulated legal advice. The platform generates documents and explains obligations; contentious matters are signposted to solicitors.
4. NG4. Acting as employer of record. HeroForce-style managed employment is a different business.
5. NG5. Identity document verification technology. We orchestrate the RTW process and record evidence; certified IDSP verification (Yoti, TrustID) is integrated or linked, not rebuilt.
6. NG6. Native mobile apps and WhatsApp-native capture layers. FirstEmployer ships as an installable Progressive Web App (PWA): one responsive codebase, add-to-home-screen install, journey state saved server-side so sessions survive interruption on mobile. No iOS/Android native builds and no WhatsApp Business API surface at launch; revisit only if beta evidence shows the PWA failing Dave/Yusuf mobile completion targets.

## 3. Target Users and Personas

Drawn from the 20-business survey (construction 7, hospitality 5, retail 4, professional services 4; turnover £40,000 to £600,000).

### Persona 1: Dave, 38, plumber, Leeds (Tradesperson)
Sole trader, seven years, turnover £160,000. Winning more work than he can do; taking on an apprentice. Does his own invoicing, uses an accountant once a year. Does not know employer's liability insurance is legally required from day one. Will do everything on his phone, evenings. Anxiety: "I don't want HMRC or anyone coming after me because I ticked the wrong box."
Primary modules: Status Advisor, Setup Engine, Document Generator, Dashboard. Device: mobile-first.

### Persona 2: Amara, 31, salon owner, Birmingham (Service business)
Limited company, two years, hiring her first stylist. Confused about PAYE registration ("I already have a Government Gateway, why do I need another one?") and terrified of the pension rules. Price-sensitive; her benchmark is her £12.99 software subscriptions.
Primary modules: Setup Engine (PAYE path for limited companies), pension setup, Document Generator, AI Assistant. Device: mobile and laptop.

### Persona 3: Yusuf, 45, takeaway owner, Manchester (Retail/hospitality)
Employs two family members informally; formalising and adding a first non-family hire. Highest-risk sector for right-to-work enforcement. Needs the RTW module to be idiot-proof and the evidence trail to be bulletproof, including share code verification for a candidate with pre-settled status.
Primary modules: RTW Module, Document Generator, Dashboard, ongoing monitoring. Device: mobile only.

### Secondary persona: Priya, accountant, 4-partner practice (B2B channel, Phase 2+)
Serves 300 sole traders. Fields "I want to hire someone" calls weekly; the work is low-margin. Wants a white-label or referral tool she can hand clients, with visibility into their compliance state.

## 4. Product Principles

1. **Deterministic core, AI at the edges.** Anything that must be identical for identical inputs (status logic, deadlines, obligation states, statutory rates) is code, not model. AI explains, drafts, and converses; it never decides a legal outcome alone.
2. **Action, not advice.** Every flow ends in an artefact or a recorded state change: a determination PDF, a contract, a check record, a completed registration step.
3. **Nothing unverified ships to the user.** All generated documents pass the independent Examiner agent. Fail closed: if examination cannot complete, the document is not released.
4. **Evidence by default.** Timestamps, versions, actor, and statutory basis on everything. The user's audit pack is a byproduct of normal use, not an extra task.
5. **Plain English, statutory receipts.** Every explanation is written for Dave, with the statutory reference one tap away for the sceptic (or the inspector).
6. **Never pretend to be a lawyer.** Confidence boundaries are explicit; contentious or ambiguous cases route to human professionals.
7. **Regulation is a moving target; the product moves with it.** Statutory rates and rules live in versioned configuration, updated through the Regulatory Change Monitor pipeline, never hardcoded.

## 4b. Design Language: "Get to Green"

The all-green compliance dashboard is the product's emotional payoff and the brand's core device. The visual system earns green rather than decorating with it; the reward register is **relief, not celebration** — this audience is anxiety-prone by survey evidence.

**Invariants (enforced in CI, not taste):**
1. Verified green (#1E9E6A range) appears only on legally-true/compliant states and primary CTAs. Decorative green is a build defect.
2. Every statutory claim in UI copy carries a tappable StatutoryReceipt chip (reference + plain-English popover + official link).
3. Signal red is reserved for overdue/at-risk and always calm; red never shouts.
4. Guidance copy at reading age 9; en-GB spelling; tabular figures on all numeric UI; body ≥17px; tap targets ≥44px; WCAG 2.2 AA.
5. Documents render as tactile artefacts; examiner-approved documents carry the VerificationSeal (timestamp + checklist hash).
6. No confetti, no gamification, no streaks.

**Signature components (named, reused everywhere):** ComplianceRing (dashboard hero), ExaminerReveal (13 checks ticking before a document unlocks — the trust theatre, always full-screen, never a toast), DeadlineChip (four grades computed from due date), StatutoryReceipt, StatusPill, VerificationSeal.

Palette and typography are specified in the design-system prototype (`/design/prototype/design-system.html`), which is the binding visual source per the Prototype Fidelity Rule in CLAUDE.md.

**Canonical build fixture:** all seeded, demo, and test data uses one continuous scenario — Dave Okonkwo, DO Plumbing & Heating Ltd (limited company, Walsall), hiring Liam Carter, apprentice plumber, £8.00/hour, 40 hrs/week, start date 3 August 2026. Liam is deliberately an apprentice-rate edge case: legal at £8.00 (16–17/apprentice band) while below blanket NLW, so age-band derivation is exercised by default. Do not "correct" his pay. (The fixture is distinct from Persona 1; personas describe the market, the fixture seeds the build.)

## 5. Product Scope: Modules and Functional Requirements

Requirement IDs: FR-[module].[number]. Priority: P0 (MVP launch), P1 (fast follow, months 4 to 9), P2 (growth, months 10+). The pre-visa demo prototype covers a subset marked [DEMO] (see Demo Build Spec).

### Module 1: Status Advisor [DEMO]

Purpose: determine whether the person being engaged is an employee, a worker, or a self-employed contractor, and produce a written determination.

- FR-1.1 (P0): Guided questionnaire, 8 to 12 plain-English questions covering control, personal service and substitution, mutuality of obligation, equipment, financial risk, integration, and exclusivity. Branching logic; no legal jargon in questions.
- FR-1.2 (P0): Deterministic rules engine (TypeScript decision table mirroring HMRC status indicators and leading case-law factors) produces: verdict, confidence band (clear / leaning / ambiguous), and factor breakdown. Unit-tested against a golden case suite (minimum 40 cases including employee, worker, contractor, and edge cases).
- FR-1.3 (P0): LLM explanation layer converts the factor breakdown into plain-English reasoning. The LLM receives the verdict and factors; it may not alter the verdict.
- FR-1.4 (P0): Written Status Determination document (PDF): inputs, verdict, reasoning, date, disclaimer, unique reference. Stored and versioned.
- FR-1.5 (P0): Ambiguous outcomes route to a "get professional advice" interstitial with explanation of why the case is ambiguous. The journey can continue only with an explicit user acknowledgement, which is recorded.
- FR-1.6 (P1): Re-run and compare: if working arrangements change, re-determination with a diff against the prior determination.
- FR-1.7 (P2): CEST cross-reference: show how the same inputs map to HMRC's tool, for users who want the government artefact too.

### Module 2: Employer Setup Engine

Purpose: walk the user through every registration and setup step, tracking state to completion.

**Product position — orchestration, not execution:** FirstEmployer never performs registrations or account setups on the user's behalf (no public APIs exist for HMRC employer registration or pension scheme creation, and acting-as-agent is a liability line we do not cross at launch). The user performs each official action; the product sequences it, de-risks it with annotated walkthroughs, captures the output as structured evidence (PAYE reference, certificates, dates), and converts it into monitored obligations. This is a selling point for the audience, not a limitation: nobody anxious about HMRC wants a black box acting invisibly for them. Marketing copy must reflect this honestly ("You click the buttons on GOV.UK. We make sure you click the right ones, in the right order, and keep the proof.").

- FR-2.1 (P0): Setup checklist instantiated from the determination and business type (sole trader vs limited company): HMRC employer registration, payroll software selection, pension scheme setup, employer's liability insurance, ICO registration check, H&S risk assessment basics.
- FR-2.2 (P0): HMRC registration walkthrough with annotated step-by-step guidance for the correct Government Gateway path per business type, including the "organisation vs individual account" trap, expected timescales (PAYE reference within 5 working days), and what to do while waiting.
- FR-2.3 (P0): Payroll software selection: filtered comparison of HMRC-recognised options (including free Basic PAYE Tools for under 10 employees) by business profile. Outbound referral links tagged (revenue stream, disclosed to user).
- FR-2.4 (P0): Pension setup guidance: duties start date logic computed from the first employee's employment start date (automatic enrolment duties begin immediately on employing staff; "staging dates" are legacy and never used in product copy), provider comparison (NEST, People's Partnership, Smart Pension), duties checklist, declaration of compliance reminder wired into the Dashboard.
- FR-2.5 (P0): Employer's liability insurance: requirement explanation (£5m minimum, day-one, £2,500 per day penalty), comparison referral links, certificate upload to evidence store, expiry captured for monitoring.
- FR-2.6 (P0): Each step has status (Not started / In progress / Blocked / Complete), evidence attachment slot, and a deadline where statutory.
- FR-2.7 (P1): "I've already done some of this" fast path for partially set up employers (Starter tier onboarding).
- FR-2.8 (P2): Companies House and HMRC API integrations to verify registration states automatically where APIs permit.

### Module 3: Document Generator with Examiner [DEMO]

Purpose: produce legally grounded employment documents, independently examined before release.

- FR-3.1 (P0): Role questionnaire: title, duties summary, pay (rate and interval), hours and pattern, start date, location and mobility, probation, notice, holiday, sick pay approach, pension scheme reference.
- FR-3.2 (P0): Clause library: versioned JSON clause set keyed to ERA 1996 s.1 particulars (as amended, including 2024 probation and training particulars), each clause carrying template text, typed slots, statutory reference, and validation rules.
- FR-3.3 (P0): Generator agent: builds the contract from clause library plus inputs via Claude API at temperature 0; output is structured JSON (clauses keyed by particular) plus rendered document.
- FR-3.4 (P0): Examiner agent: separate prompt, separate module, zero shared context. Audits the generated document against the hard checklist (Appendix A): presence of all mandatory particulars, internal consistency, statutory floors (NLW cross-check pay ÷ hours, 5.6 weeks holiday pro rata, statutory notice minimums). Strict JSON verdict with defects array.
- FR-3.5 (P0): Rejection loop: defects returned to Generator, maximum 2 retries, every attempt logged to examination_log with timestamps. Terminal failure surfaces a human-review path, never a silent release.
- FR-3.6 (P0): Document set at launch: employment contract (written statement of particulars), offer letter, new starter checklist. P1 adds: staff handbook (core policies: disciplinary, grievance, absence, data protection, equal opportunities), probation review letters, right-to-work follow-up letters. *Sequencing note:* the business plan's Step 3 narrative includes the handbook; it is deliberately sequenced to P1 (not descoped) because multi-policy handbooks are the hardest artefact to examine mechanically — the examiner checklist for handbooks requires the solicitor-reviewed policy library, which lands in Phase 1. The contract, offer letter, and starter checklist cover every day-one statutory obligation.
- FR-3.7 (P0): Examiner Report visible to the user: checklist with pass marks, statutory references, and audit trail including any rejected attempts. This is a trust feature, not just a log.
- FR-3.8 (P0): PDF export with document reference, version, examiner approval stamp (timestamp plus checklist hash). E-signature integration (P1).
- FR-3.9 (P1): Document update flows: pay rise, hours change, role change generate compliant variation letters and a re-examined consolidated statement.
- FR-3.10 (P2): One-off purchase path (£29 to £49 per document) without subscription; same examiner pipeline, no monitoring.

### Module 4: Right-to-Work Module

Purpose: orchestrate a compliant RTW check and hold the statutory excuse evidence.

- FR-4.1 (P0): Route selector by nationality and document situation: British/Irish passport (manual or IDVT), eVisa/BRP holders via Home Office share code, outstanding applications via Employer Checking Service guidance.
- FR-4.2 (P0): Share code walkthrough: what to request, how to run the online check, what the result must show, with screenshot-annotated guidance kept current by the Monitor agent.
- FR-4.3 (P0): Check record: who checked, what was checked, date, result, evidence images/PDFs stored encrypted; generates the statutory excuse record document.
- FR-4.4 (P0): Time-limited permission handling: follow-up check date calculated automatically, wired into Dashboard alerts (90/30/7 days).
- FR-4.5 (P1): Integrated certified IDSP verification (Yoti or TrustID) for British/Irish digital checks, per-check pass-through pricing.
- FR-4.6 (P2): Sponsor licence guidance surface (education only; routes to specialists).

### Module 5: Compliance Dashboard and Monitoring [DEMO partial]

Purpose: one screen answering "am I compliant right now, and what is due next?"

- FR-5.1 (P0): Obligation state machine per employer covering: written statement issued on/before day one; EL insurance active and displayed; pension duties (assessment, enrolment, declaration of compliance within 5 months); RTW checks current; minimum wage compliance at current rates; payroll registration; ICO registration; H&S risk assessment; and from April 2026, ERA 2025 items (day-one SSP and parental leave acknowledgements, holiday-pay record-keeping with the 6-year retention duty).
- FR-5.2 (P0): Deterministic deadline engine: every deadline computed from start dates and statutory offsets held in versioned configuration; countdown chips (green / amber / red / overdue).
- FR-5.3 (P0): Alerting: email plus in-app at 30/14/7/1 days and on statutory rate changes (each April NLW/NMW uprating triggers a per-employee pay compliance re-check with a one-tap "confirm updated" or "generate pay variation letter" action).
- FR-5.4 (P0): Evidence vault: all documents, check records, certificates, and acknowledgements, filterable, with one-click Audit Pack export (chronological PDF bundle with index) for HMRC, Home Office, or TPR requests.
- FR-5.5 (P1): Multi-employee view (Growth tier): per-employee compliance rows, bulk actions.
- FR-5.6 (P1): Weekly compliance digest email; monthly "state of your compliance" summary.
- FR-5.7 (P2): Accountant/adviser read-only share link (feeds B2B channel).

### Module 6: AI Compliance Assistant

Purpose: plain-English answers to employment obligation questions, grounded and bounded.

- FR-6.1 (P0): Conversational assistant grounded via retrieval over a curated corpus: statutory summaries, GOV.UK and ACAS guidance digests, our own module explainers, all versioned by the Monitor pipeline. Answers cite sources and statutory references.
- FR-6.2 (P0): Hard boundaries: no advice on live disputes, dismissals of specific individuals, discrimination claims, TUPE, or anything contentious; these trigger a signpost response (ACAS, solicitor referral, P1 premium legal review marketplace). Boundary triggers are tested with an adversarial prompt suite.
- FR-6.3 (P0): Context awareness: the assistant can read the user's own compliance state ("your pension declaration is due in 12 days") but never invents state.
- FR-6.4 (P1): Suggested actions: answers can deep-link into flows ("generate the variation letter now").
- FR-6.5 (P2): Voice note input (mobile) transcribed to query.

### Module 7: Regulatory Change Monitor (internal agent)

Purpose: keep the entire platform current with employment law automatically, with human sign-off.

- FR-7.1 (P1): Scheduled crawl and diff of designated sources: GOV.UK employment pages, HMRC rates and thresholds, TPR, Home Office RTW guidance, ACAS. Configurable frequency (daily default).
- FR-7.2 (P1): Change classification: which clause templates, rate configs, guidance pages, and checklist items are affected; severity grading.
- FR-7.3 (P1): Draft remediation: proposed template/config/guidance edits queued in a review console for the compliance lead (Oludayo, later the Compliance Analyst); nothing auto-publishes.
- FR-7.4 (P1): On approval: versioned publish, affected users flagged on Dashboard ("law changed, here is what it means for you"), audit trail of change-to-publish.
- FR-7.5 (P0 stopgap): until the agent ships, a manual monthly regulatory review checklist with the same publish pipeline (the pipeline is P0; the autonomous detection is P1).

### Cross-cutting: Accounts, Onboarding, Billing, Admin

- FR-8.1 (P0): Auth: email magic link plus optional password; single business per account at launch; roles (owner, P1: adviser read-only).
- FR-8.2 (P0): Onboarding fork: "Hiring my first employee" (full journey) vs "Already an employer" (Starter fast path, FR-2.7).
- FR-8.3 (P0): Billing (Stripe): Starter £9.99, Launch £14.99, Growth £24.99 monthly; 7-day free trial; tier gates by employee count (3/5/15); upgrade prompts state-aware. One-off document purchases (P2, FR-3.10).
- FR-8.4 (P0): Admin console: user/subscription view, examination_log inspection, template/config version publish, feedback review, Monitor review queue (P1).
- FR-8.5 (P0): Feedback widget on every flow completion (rating plus text), stored with flow context.
- FR-8.6 (P0): Save-and-resume on every multi-step flow: journey state persisted server-side at each step, resumable across sessions and devices, with a "continue where you left off" entry point on login and Dashboard. J1's under-90-minutes-across-sessions acceptance depends on this; it is a launch requirement, not a resilience nice-to-have.

### Module 8: Acquisition & Content Engine (marketing surface as product scope)

Purpose: own the organic acquisition funnel end-to-end. The marketing site is a product surface with requirements, not a brochure; it shares the design system and reads the same statutory config as the app. Full page-level specification lives in the Relume Wireframe Brief v1.0 (sitemap of 20 marketing pages); this section states the requirements that brief must satisfy.

- FR-9.1 (P0): Marketing site (SSG/ISR): Home, How it Works, six feature pages (shared template; Contracts variant adds examiner-anatomy and two-AIs sections), Pricing, Trust, About, Legal, Contact, 404.
- FR-9.2 (P0): **Positioning lock.** Homepage leads with the first-time-employer wedge (H1: "Hire your first employee. Legally. Without a £2,000 accountant bill."); the existing-employer segment is addressed by a sub-hero qualifier line ("Already employing people? FirstEmployer checks what you've got, finds the gaps, and keeps you compliant — from £9.99 a month.") plus a homepage FAQ entry, never by diluting the H1. The Starter segment earns a dedicated landing page only on traction evidence.
- FR-9.3 (P0): Lead tool 1 — Employer Readiness Check: 8-question full-screen assessment reusing the app's question components; results show a severity-ordered gap list; email gate for full report (nurture sequence per business plan funnel); trial CTA hands gaps into onboarding as pre-seeded obligations.
- FR-9.4 (P0): Lead tool 2 — First Employee Cost Calculator: true-annual-cost breakdown (gross, employer NI with Employment Allowance note, pension 3%, EL estimate) computed by pure functions over live config; shareable result; email-gated PDF.
- FR-9.5 (P0): Guides hub + article system: MDX content collections; every article carries an answer-first summary box (40–60 words), question-shaped H2s, statutory callouts with receipts, reviewer byline ("Reviewed by Oludayo A., former HMRC compliance officer") and last-reviewed date. Launch set: pillar guide fully written + 11 articles minimum viable.
- FR-9.6 (P0): Programmatic sector pages ×8 (plumber, electrician, builder, salon, café, takeaway, shop, cleaner): one template, ≥800 words genuinely differentiated per sector, sector-specific risk callouts. Thin/doorway content is a defect.
- FR-9.7 (P0): **Marketing reads config.** Every statutory value rendered on any marketing page (calculator, risk stats, guide prose) resolves via getLiveConfig at build/revalidate with a "Rates current as of {version}" badge. Hardcoded rates on marketing pages fail the same grep gate as app code. When config publishes, affected guides re-render and re-date automatically — freshness as a structural moat.
- FR-9.8 (P0): SEO architecture: per-page metadata patterns; JSON-LD (Organization + SoftwareApplication sitewide; Product + Offer on pricing; FAQPage; HowTo; Article with author and dateModified; BreadcrumbList); segmented XML sitemaps; canonicals; robots allowing public routes and AI crawlers (GPTBot, ClaudeBot, PerplexityBot — deliberate policy: being ingested is the strategy), disallowing /app and /admin.
- FR-9.9 (P0): GEO (generative engine optimisation): llms.txt and llms-full.txt generated from content collections at build; one canonical entity descriptor rendered verbatim in footer, About, and llms.txt; answer-box components as the extractable unit; all statutory facts dated ("£12.71/hour from 1 April 2026").
- FR-9.10 (P1): Comparison guide set ("vs an accountant", "vs BrightHR", "vs doing it yourself") — honest treatment; highest-intent GEO surface.
- FR-9.11 (P1): /for/accountants partner page with waitlist capture (activates with the referral programme, Phase 2).

## 6. Primary User Journeys (acceptance narratives)

### J1: Dave's first hire (happy path, P0 acceptance)
Sign up → onboarding fork "first employee" → Status Advisor (12 questions, verdict: employee, clear) → determination PDF stored → Setup checklist instantiated → HMRC registration walkthrough (marks In progress, returns 4 days later to mark Complete with PAYE ref captured) → payroll selection (chooses BrightPay via referral) → pension guidance (NEST, duties timeline from start date) → EL insurance (buys via comparison link, uploads certificate, expiry captured) → Document Generator (role details; first generation fails examiner on notice-period inconsistency; auto-corrected; approved second pass; Dave sees the Examiner Report) → contract PDF issued and signed before day one → RTW check (British passport, manual route, record stored) → Dashboard fully green, next deadline: pension declaration of compliance in 4 months and 12 days.
Acceptance: entire journey completable in under 90 minutes of active time across sessions; zero external help; every artefact in the vault.

### J2: Yusuf's share-code hire (P0 acceptance)
Existing account → new hire → Status Advisor (worker verdict for casual arrangement, explanation of the difference) → RTW route: pre-settled status share code walkthrough → check recorded with follow-up date → follow-up alert fires at 90 days pre-expiry → re-check flow completes and re-records.
Acceptance: the statutory excuse record for both checks exports correctly in the Audit Pack.

### J3: Amara joins on Starter (P1 acceptance)
"Already an employer" path → fast-path questionnaire imports current state (PAYE yes, pension yes but declaration never filed, contracts "somewhere") → Dashboard shows two red items with fix flows → upgrades to Launch when hiring stylist number two.

### J4: April uprating event (P0 acceptance)
NLW rises → config published via pipeline → every account with pay data re-checked overnight → affected users alerted with per-employee gap shown → one-tap variation letter generation (examined) → Dashboard returns green.
*Canonical test scenario:* the 1 April 2026 uprating (NLW £12.21 → £12.71; 18–20 rate £10.00 → £10.85; 16–17/apprentice £7.55 → £8.00) is the golden-suite fixture for this journey: seeded accounts with pay at or near the old floors must be flagged, re-checked against the new config version, and resolved via the variation-letter flow.

## 7. AI Architecture

- **Model:** Claude (claude-sonnet-4-6) via API for Generator, Examiner explanation-of-defects, Status explanation, and Assistant. Temperature 0 for Generator and Examiner; low temperature for Assistant.
- **Separation guarantee:** Generator and Examiner are separate modules with separate system prompts in separate files, no shared conversation state; the Examiner receives only the candidate document, the questionnaire facts, live config values, and the checklist version. On a FAIL, only the structured defect list returns to the Generator — never examiner reasoning. This separation is a demonstrable, documented property (patent narrative and trust page).
- **Hybrid examination:** the 13-check checklist is structure, not vibes. Mechanically checkable requirements use deterministic evaluators in code (pay ≥ config floor for the employee's age band; holiday ≥ 5.6 weeks pro-rata; parties named and matching the questionnaire; all s.1 particulars present; notice ≥ statutory; dates coherent). Only language-level checks (inter-clause consistency, plain-English standard) go to the examiner LLM, at temperature 0, answering per-check pass/fail JSON. Any single FAIL fails the document. Release gate: the examiner catches 15/15 seeded-defect adversarial fixtures.
- **Structured outputs:** Generator emits clause-keyed JSON; Examiner emits strict verdict JSON validated against schema; malformed output triggers retry then human-review fallback. Fail closed everywhere.
- **Grounding:** Assistant uses retrieval over the versioned guidance corpus only; no open-web answers. Every answer carries source attributions. Refusal behaviour for out-of-corpus questions.
- **Determinism and drift control:** golden test suite (40+ status cases, 25+ contract scenarios, adversarial assistant prompts) runs on every prompt or model version change; releases blocked on regression.
- **Cost envelope:** target ≤ £0.35 API cost per full first-hire journey, ≤ £0.05 per assistant query, enforced via prompt budgets and caching of static explainers.
- **Privacy:** no customer personal data used for model training; API calls under zero-retention terms; PII minimised in prompts (structured fields, not free-text dumps, wherever possible).

## 8. Data Model (core tables)

accounts, businesses (type, sector, size), users, subscriptions (Stripe refs, tier, state), employees (minimal PII, start dates), status_determinations (inputs, factors, verdict, confidence, doc ref), setup_steps (type, state, evidence refs, deadline), documents (type, version, clause JSON, rendered ref, examiner status), examination_log (document version, attempt, verdict JSON, defects, timestamps), rtw_checks (route, evidence refs, result, follow_up_date), obligations (type, state, statutory basis, deadline, source config version), alerts (obligation ref, schedule, sent state), config_versions (statutory rates, clause library, guidance corpus; effective dates; publish audit), monitor_findings (P1: source, diff, classification, remediation draft, review state), feedback, audit_events (append-only actor/action/entity/timestamp).

Retention: employment compliance records retained per statutory need (RTW: duration of employment plus 2 years; holiday pay records: 6 years per ERA 2025); user deletion honours GDPR with statutory-retention carve-outs explained in-product.

## 9. Non-Functional Requirements

- **Security:** UK-region Supabase (Postgres) with row-level security per account; encryption at rest and in transit; evidence files in private buckets with signed URLs; secrets in platform vault; admin actions audited. Cyber Essentials certification in Year 1.
- **Data protection:** ICO registration before launch; DPIA completed before processing employee personal data; privacy notice in plain English; data minimisation (we store what compliance requires, nothing more); DSR tooling (export, deletion with statutory carve-outs).
- **Availability and performance:** 99.5% monthly availability target at launch; page interactive under 2.5s on mid-range mobile; document generation round-trip under 60s including examination (P50), with progress UI.
- **Marketing performance budgets (FR-9.x surfaces):** Core Web Vitals on throttled mid-range mobile — LCP < 2.0s, CLS < 0.05, INP < 200ms; Lighthouse SEO ≥ 95 on Home and pillar guide; budgets enforced by Lighthouse CI as part of the release gate.
- **Accessibility:** WCAG 2.2 AA; the audience includes users with low digital confidence; reading age target: 9 for all guidance copy.
- **Mobile:** delivered as an installable PWA (web app manifest, add-to-home-screen prompt at the right moment in onboarding, service worker for shell caching and resilient save/resume on flaky connections; no native app stores, per NG6); fully responsive; J1 journey completable end-to-end on a phone (Dave and Yusuf are mobile-first/only).
- **Auditability:** every compliance-relevant state change written to audit_events; Audit Pack export deterministic and complete.
- **Legal posture:** persistent "guidance and document generation, not legal advice" framing; terms reviewed by employment solicitor; professional indemnity £1m from launch.

## 10. Pricing and Packaging

| Tier | Price | Employees | Includes |
|---|---|---|---|
| Starter | £9.99/mo | Up to 3 | Dashboard, monitoring, alerts, Assistant, evidence vault (no setup journey, no generation) |
| Launch | £14.99/mo | Up to 5 | Everything: full journey, Document Generator with Examiner, RTW module, monitoring |
| Growth | £24.99/mo | Up to 15 | Launch plus multi-employee dashboard, bulk documents, priority support, adviser share link (P1) |
| One-off documents | £29 to £49 | n/a | Single examined document, no subscription (P2) |

Price anchored on survey evidence (18/20 would pay up to £20/mo) and validated against the competitive floor (nearest bundled alternative ~£40/mo with a 10-user minimum). 7-day free trial; no card for trial start (test in beta).

## 11. Metrics and Success Criteria

**North star:** compliant employers actively monitored (accounts with all-green dashboards).

Launch-phase targets (mirroring the business plan KPIs): trial-to-paid ≥ 25% (M3) rising to 30% (M6); monthly churn < 8% (M3), < 6% (M6); CAC < £40 falling to < £30; 200 paid subscribers by M6, 860 by M12; NPS ≥ 45 by M6.

**Product health:** J1 completion rate ≥ 70% of started journeys; examiner first-pass approval ≥ 85% (with 100% of released documents passing); assistant boundary-violation rate 0 in adversarial suite; regulatory change publish latency < 5 working days from source change (manual pipeline), < 48 hours (Monitor agent, P1); API cost per journey within envelope.

**Acquisition funnel (Module 8):** readiness-check completion rate ≥ 60% of starts; readiness-check → trial conversion ≥ 15%; organic (search + AI-assistant referral) share of trials ≥ 40% by M9 — the content engine exists to make CAC fall from < £40 to < £30, so paid-channel dependence trending down is the health signal.

**Evidence for the visa checkpoints:** MRR, subscriber count, examiner logs, and audit-pack usage exportable as endorsement evidence at 12 and 24 months.

## 12. Release Plan

- **Phase 0: Demo prototype (pre-submission, built).** Status Advisor, Generator/Examiner with live rejection demo, Dashboard with seeded data, passcode-gated, DEMO-watermarked, 20 attributable beta passcodes. Per Demo Build Spec. Evidence of the TRL 3–5 trajectory: the business plan states TRL 3 at application with TRL 5 reached at MVP completion (Month 6); the demo de-risks that path and must not be described as TRL 5 in any submission material.
- **Phase 1: MVP launch, England (Months 1 to 6 post-visa).** All P0 requirements; Launch and Starter tiers; manual regulatory pipeline; solicitor-reviewed clause library v1; ICO/DPIA/insurance in place; beta cohort converts to founding customers (free period honoured, then paid).
- **Phase 2: Fast follow (Months 4 to 9, overlapping).** P1 set: staff handbook and variation flows, IDSP integration, Growth tier multi-employee views, adviser share links, accountant referral programme. The Regulatory Change Monitor agent targets Months 9 to 12, aligned with the business plan's Y2 Q1 R&D line (£10,000); until it ships, the manual pipeline (FR-7.5) carries the obligation. Shipping it earlier than the plan promises is acceptable; describing it as due earlier than the plan's budgeted milestone is not.
- **Phase 3: Growth (Months 10 to 18).** Scotland and Wales configuration (legal review, jurisdiction-aware clause library), payroll integrations (Xero, Sage, BrightPay), one-off document storefront, white-label pilot with 3 accountancy practices, premium legal review marketplace.
- **Phase 4: Expansion research (Months 18+).** Ireland feasibility per business plan; ERA 2025 later-phase obligations (October 2026 harassment duties, 2027 unfair dismissal changes) absorbed as Monitor-driven updates.

## 13. Product Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Generated document contains a legal defect despite examiner | Dual control (deterministic validation rules plus examiner), solicitor-reviewed clause library, golden test suite, PI insurance, incident runbook with template recall and user notification |
| Statutory rate or rule changes missed | Versioned config with effective dates, manual monthly review (P0), Monitor agent (P1), April uprating treated as a rehearsed annual event |
| Users treat guidance as legal advice in disputes | Boundary tests, contentious-topic signposting, terms language, assistant refusal suite |
| Tide or an accounting platform launches a guided employer flow | Watch-item from verification report; response: depth (status determination plus examiner trust) and speed; partnership conversations pre-emptively opened with formation agents and one bank |
| Employment Hero drops a sub-£25 sole-trader tier | Compete on first-hire UX specificity and the examiner trust layer; our cost base supports price defence |
| Examiner adds latency/cost that hurts conversion | 60s P50 budget with progress UI, prompt/caching optimisation, first-pass approval target ≥ 85% |
| Low digital confidence users stall mid-journey | Reading age 9 copy, mobile-first J1, save-and-resume everywhere, human support hours in beta |

## 14. Open Questions (owner, due)

1. IDSP partner selection and per-check pricing pass-through (Tokunbo, Phase 2 start).
2. E-signature: build on provider (SignWell pattern from CompliLet) vs native (Tokunbo, Phase 1).
3. Handbook scope at P1: core five policies vs sector packs (Oludayo with solicitor, Phase 1).
4. Beta-to-paid conversion mechanics for the 20 founding businesses: founding-member pricing? (Both, pre-launch.)
5. Whether Starter tier risks anchoring too low for later B2B pricing (review with real data, M6).
6. Trademark and company registration timing: "FirstEmployer Ltd" Companies House and UK IPO Classes 42/35 (Tokunbo, pre-submission checklist already noted).
7. Data protection role: is FirstEmployer a processor acting on the employer-customer's instructions for employee personal data (RTW evidence, contract details), an independent controller, or joint? The answer determines the DPIA structure, privacy notices (including whether employees — who have no relationship with us — must be notified and by whom), the data processing terms in our contract, and ICO registration scope. (Oludayo with employment solicitor, pre-launch; blocks DPIA sign-off.)

---

## Appendix A: Examiner Hard Checklist (ERA 1996 s.1 particulars, as amended)

1. Names of employer and employee. 2. Start date and continuous employment date. 3. Pay: rate or calculation method, and interval. 4. Hours, normal working hours, variability terms. 5. Holiday entitlement and pay, precisely calculable; ≥ 5.6 weeks pro rata. 6. Sick pay and incapacity terms (day-one SSP compliant from April 2026). 7. Pension terms and scheme. 8. Notice both directions, ≥ statutory floors for stated tenure. 9. Job title or brief work description. 10. Place of work, mobility, employer address. 11. Probation: existence, conditions, duration. 12. Training entitlement and mandatory training. 13. Cross-checks: pay ÷ hours ≥ current NLW/NMW for age band; no inter-clause contradictions; start date coherent with issue date; references resolve (pension scheme named, notice tables consistent).

Verdict schema: `{verdict: PASS|FAIL, checks: [{id, name, status, detail, statutoryRef}], defects: [{clauseRef, issue, statutoryBasis, suggestedFix}]}`

## Appendix B: Statutory Configuration (versioned; live version "2026.2")

Live config version **"2026.2"** (effective 1 April 2026): NLW £12.71 (21+); NMW £10.85 (18–20), £8.00 (16–17 and apprentice); statutory holiday 5.6 weeks; auto-enrolment earnings trigger £10,000 and qualifying band £6,240 to £50,270 (all AE thresholds held at 2025/26 levels for 2026/27), minimum 8% (3% employer); EL insurance £5m minimum; SSP day-one (from April 2026); RTW civil penalty £45,000 first breach / £60,000 repeat; holiday-pay record retention 6 years (ERA 2025); pension declaration of compliance within 5 months of duties start date.

Superseded version **"2026.1"** (NLW £12.21; 18–20 £10.00; apprentice £7.55) is retained deliberately: the 2026.1 → 2026.2 transition is the canonical config-version fixture for the J4 golden suite, uprating-job tests, and demos.

All values live in config_versions with effective dates; this appendix is a snapshot, never a source of truth. If £12.21 renders anywhere in UI, it is a defect, not history.

## Appendix C: Document Map (authority order)

1. **This PRD (v1.2)** — wins on WHAT the product does. FR numbering is stable; downstream documents reference it and must not be broken by renumbering.
2. **Prototype HTML** (`/design/prototype/`, Claude Design exports) — wins on HOW it looks (Prototype Fidelity Rule).
3. **CLAUDE.md** — build constitution at repo root; six non-negotiable rules, testing gates, escalation clause. Every build session reads it first.
4. **firstemployer SKILL.md** — working domain reference for build sessions (law-as-implemented, patterns, gotchas).
5. **Relume Wireframe Brief v1.0** — marketing sitemap and page/section specification (satisfies FR-9.x).
6. **Claude Design Prompt Pack v1.0** — produces the prototype HTML (16 prompts, design system first).
7. **Claude Code Build Prompt Pack v1.0** — produces the product (17 gated prompts, Prompt 0 installs CLAUDE.md).
8. **Business Plan (FINAL-RECONCILED)** — governs external commitments (visa/endorsement); the PRD must not contradict it; known reconciliations logged in v1.1 changelog.

Conflicts between documents are logged in DECISIONS.md and resolved by the founder, never silently.
