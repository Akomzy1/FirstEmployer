"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";

/** Flow-completion feedback (FR-8.5). Best-effort; a duplicate rating from the
 *  same completion just updates the picture — no dedupe ceremony needed. */
export async function submitFeedback(input: {
  flow: "status" | "setup" | "contracts" | "rtw" | "dashboard";
  rating: number;
  comment?: string;
}): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // feedback never blocks or errors a flow
  const business = await getCurrentBusiness();
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  await supabase.from("feedback").insert({
    business_id: business?.id ?? null,
    flow: input.flow,
    rating,
    comment: input.comment?.trim() || null,
  });
}
