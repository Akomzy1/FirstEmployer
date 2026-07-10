"use server";

import { createClient } from "@/lib/supabase/server";
import { SUPPORT_EMAIL } from "@/lib/marketing/entity";

/**
 * Readiness-check email gate (FR-8.2): store the lead, and send the results
 * email through Resend when a key is configured (dev/CI degrade honestly to
 * store-only). The lead lands before signup, so this is tenantless.
 */
export async function captureReadinessLead(input: {
  email: string;
  score: number;
  gaps: string[];
}): Promise<{ ok: true }> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("That email doesn't look right.");

  const supabase = createClient();
  const { error } = await supabase.from("marketing_leads").insert({
    email,
    source: "readiness_check",
    payload: { score: input.score, gaps: input.gaps },
  });
  if (error) throw new Error(`lead save failed: ${error.message}`);

  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `FirstEmployer <${SUPPORT_EMAIL}>`,
          to: [email],
          subject: "Your hiring readiness results",
          text:
            `You scored ${input.score} of 8 on the FirstEmployer readiness check.\n\n` +
            (input.gaps.length
              ? `The gaps to close before your first hire:\n${input.gaps.map((g) => `• ${g}`).join("\n")}\n\n`
              : "You look ready — nice work.\n\n") +
            "Start your free 7-day trial (no card needed) and we'll walk you through each step: https://firstemployer.co.uk/onboarding",
        }),
      });
    } catch {
      // The lead is stored; email delivery is best-effort in this phase.
    }
  }
  return { ok: true };
}
