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

## 2026-07-07 · P01 · shadcn/ui initialised as configuration only

components.json + lib/utils.ts (cn) + tailwindcss-animate are in place so `npx shadcn add` works when a primitive is genuinely needed, but no shadcn components are installed: the system library is bespoke, ported one-to-one from the prototype's own component sources (which the export embeds as JSX). Adding shadcn primitives that would restyle system components is prohibited by Rule 6.
Approved by: build session.
