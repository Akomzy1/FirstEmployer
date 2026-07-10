import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripePriceIds } from "@/lib/billing/stripe";
import { applySubscriptionFacts, tierFromPriceId } from "@/lib/billing/state";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Stripe webhook → the subscription state machine on businesses (P12).
 * Signature-verified; unrecognised events are acknowledged and ignored.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    return new NextResponse(`Invalid signature: ${(err as Error).message}`, { status: 400 });
  }

  const svc = createServiceClient();

  async function patchBusiness(customerId: string, patch: Record<string, unknown>) {
    const { data: biz } = await svc.from("businesses").select("id").eq("stripe_customer_id", customerId).maybeSingle();
    if (!biz) return; // customer not linked to a business — nothing to do
    await svc.from("businesses").update(patch).eq("id", biz.id);
    await svc.from("events").insert({
      business_id: biz.id,
      actor_kind: "system",
      action: "billing.subscription_updated",
      entity: "business",
      entity_id: biz.id,
      payload: { stripe_event: event.type, ...patch },
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const businessId = session.metadata?.business_id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (businessId && customerId) {
        // Link the customer to the business on first checkout.
        await svc.from("businesses").update({
          stripe_customer_id: customerId,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
        }).eq("id", businessId);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const priceId = sub.items.data[0]?.price?.id;
      const patch = applySubscriptionFacts({
        status: sub.status as Parameters<typeof applySubscriptionFacts>[0]["status"],
        tier: tierFromPriceId(priceId, stripePriceIds()),
      });
      await patchBusiness(customerId, {
        ...patch,
        stripe_subscription_id: event.type === "customer.subscription.deleted" ? null : sub.id,
      });
      break;
    }
    default:
      break; // acknowledged, ignored
  }

  return NextResponse.json({ received: true });
}
