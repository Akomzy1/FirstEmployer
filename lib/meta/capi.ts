import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Meta Conversions API sender (server side of the pixel). Dual-fired events
 * share an event_id with the browser fbq call so Meta deduplicates them.
 * No-op unless NEXT_PUBLIC_META_PIXEL_ID and META_CONVERSIONS_API_TOKEN are
 * set; never throws — ad measurement must not break product flows.
 */

const GRAPH_URL = "https://graph.facebook.com/v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export interface MetaServerEvent {
  eventName: "Lead" | "ViewContent" | "StartTrial";
  eventId: string;
  /** Plaintext email — hashed here before it leaves the server. */
  email?: string;
  eventSourceUrl?: string;
  customData?: Record<string, string | number>;
}

export async function sendMetaEvent(event: MetaServerEvent): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CONVERSIONS_API_TOKEN;
  if (!pixelId || !token) return;

  try {
    // Browser context improves match quality; absent on webhooks/jobs.
    let clientIp: string | undefined;
    let userAgent: string | undefined;
    try {
      const h = headers();
      clientIp = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
      userAgent = h.get("user-agent") ?? undefined;
    } catch {
      // Not in a request context (e.g. background job) — send without.
    }

    const userData: Record<string, unknown> = {};
    if (event.email) userData.em = [sha256(event.email)];
    if (clientIp) userData.client_ip_address = clientIp;
    if (userAgent) userData.client_user_agent = userAgent;

    const body = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          action_source: "website",
          event_source_url: event.eventSourceUrl,
          user_data: userData,
          custom_data: event.customData,
        },
      ],
    };

    const res = await fetch(`${GRAPH_URL}/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`meta capi ${event.eventName} rejected: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.warn(`meta capi ${event.eventName} failed: ${(err as Error).message}`);
  }
}
