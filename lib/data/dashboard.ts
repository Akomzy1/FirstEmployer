import "server-only";
import { createClient } from "@/lib/supabase/server";
import { deriveDashboard, type DashboardResult, type ObligationRowInput } from "@/lib/rules/obligations";
import type { UpratingImpact } from "@/lib/rules/obligations";

export interface LegalChangeView {
  configLabel: string;
  effectiveFrom: string;
  /** Effective date rendered for the banner eyebrow, e.g. "1 April". */
  effectiveLabel: string;
  /** The headline figure: the new NLW, formatted. Assembled server-side from config. */
  headlineRate: string;
  impacts: UpratingImpact[];
  resolved: boolean;
}

export interface DashboardData {
  result: DashboardResult;
  legalChange: LegalChangeView | null;
  todayLabel: string;
}

/** Assemble the dashboard snapshot from DB rows and run the pure engine. */
export async function loadDashboard(
  businessId: string,
  ownerFirstName: string,
  nlwFormatted: string,
): Promise<DashboardData> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: obligations }, { count: detCount }, { data: upratingEvents }] = await Promise.all([
    supabase.from("obligations").select("type, state, due_date").eq("business_id", businessId),
    supabase
      .from("determinations")
      .select("id, employees!inner(business_id)", { count: "exact", head: true })
      .eq("employees.business_id", businessId),
    supabase
      .from("events")
      .select("payload, created_at")
      .eq("business_id", businessId)
      .eq("action", "config.uprating_checked")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const rows = (obligations ?? []) as ObligationRowInput[];
  const result = deriveDashboard({
    today,
    ownerFirstName,
    hasDetermination: (detCount ?? 0) > 0,
    obligations: rows,
  });

  // Legal-change card: the latest uprating check event. Shown resolved (all
  // green rows) once the minimum_wage obligation is complete again.
  let legalChange: LegalChangeView | null = null;
  const ev = upratingEvents?.[0];
  if (ev) {
    const p = ev.payload as { config_label: string; effective_from: string; impacts: UpratingImpact[]; flagged: number };
    const minWage = rows.find((r) => r.type === "minimum_wage");
    const resolved = !minWage || minWage.state === "complete";
    const effectiveLabel = new Date(p.effective_from + "T00:00:00Z").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
    legalChange = {
      configLabel: p.config_label,
      effectiveFrom: p.effective_from,
      effectiveLabel,
      headlineRate: nlwFormatted,
      impacts: p.impacts ?? [],
      resolved,
    };
  }

  const todayLabel = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return { result, legalChange, todayLabel };
}
