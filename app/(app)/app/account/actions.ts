"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBusiness } from "@/lib/data/business";
import { getStripe, priceIdForTier } from "@/lib/billing/stripe";
import type { TierId } from "@/lib/pricing";

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

async function loadContext() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  const business = await getCurrentBusiness();
  if (!business) throw new Error("no business");
  return { supabase, user, business };
}

/** Stripe Checkout for a tier (subscription mode). Trial runs card-free in-app;
 *  checkout is the moment a card enters. */
export async function createCheckoutSession(tier: TierId): Promise<{ url: string }> {
  const { user, business } = await loadContext();
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceIdForTier(tier), quantity: 1 }],
    customer_email: user.email ?? undefined,
    metadata: { business_id: business.id, tier },
    subscription_data: { metadata: { business_id: business.id, tier } },
    success_url: appUrl("/app/account?checkout=success"),
    cancel_url: appUrl("/app/account?checkout=cancelled"),
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url };
}

/** Stripe customer portal (cards, invoices, cancellation). */
export async function createPortalSession(): Promise<{ url: string }> {
  const { supabase, business } = await loadContext();
  const { data: biz } = await supabase
    .from("businesses")
    .select("stripe_customer_id")
    .eq("id", business.id)
    .single();
  if (!biz?.stripe_customer_id) throw new Error("No billing account yet — subscribe first.");
  const session = await getStripe().billingPortal.sessions.create({
    customer: biz.stripe_customer_id,
    return_url: appUrl("/app/account"),
  });
  return { url: session.url };
}

/** Persist notification preferences (product settings, journey_state.settings). */
export async function saveSettings(prefs: { cadence: string; email: boolean; sms: boolean; push: boolean }): Promise<void> {
  const { supabase, business } = await loadContext();
  const journey = { ...(business.journey_state ?? {}) };
  journey.settings = prefs;
  await supabase.from("businesses").update({ journey_state: journey }).eq("id", business.id);
}

/**
 * Account deletion honouring statutory retention: the SECURITY DEFINER function
 * purges what we are free to delete and returns the storage paths to remove;
 * retention-class records survive with the owner anonymised. Finally the auth
 * user is removed and the client signs out.
 */
export async function deleteAccount(): Promise<{ done: true }> {
  const { supabase, user, business } = await loadContext();

  const { data: purgedPaths, error } = await supabase.rpc("delete_account_with_retention", {
    p_business_id: business.id,
  });
  if (error) throw new Error(`deletion failed: ${error.message}`);

  const svc = createServiceClient();
  const paths = (purgedPaths ?? []) as string[];
  if (paths.length) await svc.storage.from("evidence").remove(paths);

  await svc.from("events").insert({
    business_id: business.id,
    actor_kind: "user",
    actor_id: user.id,
    action: "account.deleted",
    entity: "business",
    entity_id: business.id,
    payload: { purged_files: paths.length, retention_honoured: true },
  });

  // Remove the login itself (service role); the client then signs out.
  await svc.auth.admin.deleteUser(user.id);
  return { done: true };
}
