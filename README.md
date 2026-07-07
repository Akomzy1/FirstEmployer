# FirstEmployer

UK compliance platform for first-time employers. One guided journey: employment status → HMRC setup → examined contract generation → right to work → pension → a continuous compliance dashboard. Installable PWA, mobile-first.

## Repository map

- `CLAUDE.md` — the build constitution. Read it before touching anything.
- `docs/PRD-v1.2.md` — behaviour source of truth.
- `docs/FirstEmployer-Claude-Code-Build-Prompts-v1.md` — the sequenced build plan (one prompt per session).
- `docs/DECISIONS.md` — decision log; every deviation is recorded here.
- `design/prototype/` — Claude Design HTML exports; the binding visual specification.

## Running the app

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

- `/dev/system` — the full component library in every state, mirroring the Style Reference prototype.
- Copy `.env.example` to `.env.local` and fill in keys as modules land (Supabase from Prompt 2).
- Behind a TLS-intercepting proxy, set `NODE_OPTIONS=--use-system-ca` so npm/pnpm can reach the registry.

## Testing

`pnpm gate` runs the gate suite (typecheck + lint today; golden tests, adversarial examiner suite, RLS suite, grep gates and Lighthouse budgets join it prompt by prompt, consolidated in Prompt 16).
