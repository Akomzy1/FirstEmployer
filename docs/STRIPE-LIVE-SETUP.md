# Stripe live setup — FirstEmployer (launch blocker #4)

Step-by-step for the Stripe dashboard, then a paste-ready env block at the end.
Everything the code expects is already built (P12) — this is configuration only.

RULE: real keys NEVER go in this file or in git. They go in two places only:
  1. `.env.local` at the repo root (gitignored) — for local runs
  2. Vercel → Project → Settings → Environment Variables — for production
The secrets-audit CI gate will fail the build if a live key lands in the repo.

---

## Step 1 — Activate live mode

Dashboard: https://dashboard.stripe.com
Complete business activation (FirstEmployer Ltd details, bank account for payouts).
Then use the toggle at the top-left to make sure you are in **Live mode**
(not Test mode) for every step below.

## Step 2 — Create the product and three prices

Product catalogue → + Add product. One product, three prices — or three
products, either works; the code only cares about the three price IDs.

Amounts MUST match `lib/pricing.ts` exactly (single source of truth):

  | Tier    | Price          | Billing            |
  |---------|----------------|--------------------|
  | Starter | £9.99 GBP      | Recurring, monthly |
  | Launch  | £14.99 GBP     | Recurring, monthly |
  | Growth  | £24.99 GBP     | Recurring, monthly |

IMPORTANT — do NOT add a free-trial period on the Stripe prices.
The 7-day no-card trial is handled inside the app (`trial_ends_at` on the
business); Stripe checkout is deliberately the moment a card enters.

After saving, open each price and copy its ID (starts `price_...`).
That gives you STRIPE_PRICE_STARTER / _LAUNCH / _GROWTH.

## Step 3 — Copy the live secret key

Developers → API keys → Secret key → Reveal live key.
Starts `sk_live_...`. That is STRIPE_SECRET_KEY.
(The publishable key `pk_live_...` is not needed — checkout is server-side.)

## Step 4 — Register the webhook

Developers → Webhooks → + Add endpoint.

  Endpoint URL:  https://firstemployer.co.uk/api/stripe/webhook
                 (domain secured 2026-07-10: firstemployer.co.uk — www redirects to apex)

  Events to send (exactly these four; everything else is ignored by the code):
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted

After creating it, click the endpoint → Signing secret → Reveal.
Starts `whsec_...`. That is STRIPE_WEBHOOK_SECRET.

## Step 5 — Set the env vars

Paste this block into `.env.local` AND into Vercel (Production environment),
filling in the real values:

```
STRIPE_SECRET_KEY=sk_live_<paste-your-key>
STRIPE_WEBHOOK_SECRET=whsec_<paste-your-secret>
STRIPE_PRICE_STARTER=price_<paste-the-id>
STRIPE_PRICE_LAUNCH=price_<paste-the-id>
STRIPE_PRICE_GROWTH=price_<paste-the-id>
```

Also required for checkout redirects (part of launch blocker #5):

```
NEXT_PUBLIC_APP_URL=https://firstemployer.co.uk
```

Redeploy on Vercel after saving env vars (they only apply to new builds).

## Step 6 — Verify (the test-clock pass)

The subscription state machine (trial → active → past_due → canceled) is
already unit-tested offline. The live verification, once keys + domain exist:

  1. Sign up with a fresh account, pick Launch on /app/account, complete
     checkout with a real card (you can immediately cancel — or use Stripe's
     test clock in Test mode first for the full lifecycle rehearsal).
  2. Check the business row flips to `active` / tier `launch`, and an
     `events` row `billing.subscription_updated` appears.
  3. Developers → Webhooks → the endpoint should show 200s, no failures.
  4. Cancel via "Manage billing" (the Stripe portal) — the business should
     go `canceled` and the app read-only (documents still downloadable).

When done: tick launch blocker #4 in docs/LAUNCH-CHECKLIST.md.
