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
