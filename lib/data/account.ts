import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { getLiveConfig } from "@/lib/config";
import { TIERS, getTier, type TierId } from "@/lib/pricing";
import type { AccountSettingsProps, RetentionRowCopy } from "@/components/app/account/AccountSettings";

/** Assemble everything the Account/Settings surface needs (shared by both routes). */
export async function loadAccountSettings(): Promise<Omit<AccountSettingsProps, "tab">> {
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");

  const supabase = createClient();
  const [{ data: { user } }, { count }, config] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    getLiveConfig(),
  ]);

  const prefs = ((business.journey_state?.settings as AccountSettingsProps["prefs"]) ?? null) || {
    cadence: "approaching",
    email: true,
    sms: false,
    push: false,
  };

  // Retention copy: statutory periods from config where they exist (Rule 4).
  const payYears = config.values.employment_penalties.pay_record_retention_years;
  const holidayYears = config.values.holiday.pay_record_retention_years;
  const retention: RetentionRowCopy[] = [
    {
      icon: "badge",
      title: "Right-to-work records",
      keep: "Employment + 2 years",
      why: "Proof you checked someone could work in the UK — your defence against a fine.",
      ref: "IANA 2006 s.15",
      plain: "You must keep right-to-work evidence for the whole employment and for two years after it ends.",
      url: "https://www.gov.uk/check-job-applicant-right-to-work",
    },
    {
      icon: "beach_access",
      title: "Holiday-pay records",
      keep: `${holidayYears} years`,
      why: "Shows staff were paid the holiday they were owed.",
      ref: "WTR 1998 reg 9",
      plain: `Records showing holiday and working-time rules were met must be kept for ${holidayYears} years.`,
      url: "https://www.gov.uk/holiday-entitlement-rights",
    },
    {
      icon: "payments",
      title: "Pay & PAYE records",
      keep: `${payYears} years`,
      why: "HMRC can ask to see what you paid and the tax you handled.",
      ref: "PAYE Regs 2003 reg 97",
      plain: `You must keep payroll records for the current tax year plus the ${payYears} years before it.`,
      url: "https://www.gov.uk/running-payroll",
    },
  ];

  return {
    tiers: TIERS,
    currentTier: getTier(business.tier as TierId),
    subscriptionState: business.subscription_state,
    trialEndsLabel: business.trial_ends_at
      ? new Date(business.trial_ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : null,
    employeesUsed: count ?? 0,
    businessName: business.name,
    businessType: business.type === "limited" ? "Limited company" : "Sole trader",
    sector: business.sector ?? "—",
    email: user?.email ?? "",
    prefs,
    retention,
  };
}
