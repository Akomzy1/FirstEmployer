import { createClient } from "@/lib/supabase/server";

export interface BusinessRow {
  id: string;
  name: string;
  type: "sole_trader" | "limited";
  sector: string | null;
  tier: "starter" | "launch" | "growth";
  subscription_state: string;
  trial_ends_at: string | null;
  journey_state: Record<string, unknown>;
}

/**
 * The signed-in user's business, or null. RLS scopes `businesses` to membership,
 * so a first-time employer sees exactly their own row.
 */
export async function getCurrentBusiness(): Promise<BusinessRow | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("businesses")
    .select("id, name, type, sector, tier, subscription_state, trial_ends_at, journey_state")
    .limit(1)
    .maybeSingle();

  return (data as BusinessRow) ?? null;
}
