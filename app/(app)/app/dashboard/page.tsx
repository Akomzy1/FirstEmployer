import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { getPrimaryEmployee } from "@/lib/data/employee";
import { getLiveConfig } from "@/lib/config";
import { loadDashboard } from "@/lib/data/dashboard";
import { Dashboard, type SegmentCopy } from "@/components/app/dashboard/Dashboard";

export const metadata = { title: "Dashboard" };

const gbpShort = (n: number) => "£" + (n >= 1_000_000 ? n / 1_000_000 + " million" : n.toLocaleString("en-GB"));
const gbp = (n: number) => "£" + n.toFixed(2);

export default async function DashboardPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let firstName = "there";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    firstName = profile?.full_name?.split(/\s+/)[0] || "there";
  }

  const config = await getLiveConfig();
  const v = config.values;
  const employee = await getPrimaryEmployee(business.id);
  const name = employee?.full_name.split(/\s+/)[0] ?? "your employee";

  // Statutory copy assembled server-side from config (Rule 4 — no literals in the client).
  const copy: SegmentCopy[] = [
    {
      id: "status", label: "Employment status", href: "/app/status-advisor",
      receipt: { ref: "ERA 1996 s.230", plain: `The law splits people into employees and workers. Their status decides which rights ${name} gets.` },
      verified: `Confirmed — ${name}'s employment status is checked and recorded.`,
      needed: `Answer the status questions about how ${name} works so we can confirm their status.`,
      fix: "Check status",
    },
    {
      id: "paye", label: "HMRC PAYE", href: "/app/setup",
      receipt: { ref: "PAYE Regs 2003 reg 2", plain: `If you pay ${name} more than ${gbp(v.paye.lel_weekly)} a week, you must run PAYE and report it to HMRC.` },
      verified: "Registered with HMRC — your employer reference is captured.",
      needed: "Finish your PAYE registration with HMRC — it takes about 10 minutes.",
      fix: "Finish PAYE registration",
    },
    {
      id: "payroll", label: "Payroll", href: "/app/setup",
      receipt: { ref: "PAYE Regs 2003 reg 67", plain: `Every payday you must tell HMRC what you paid ${name}, on or before the day you pay them.` },
      verified: "Running — HMRC is told on or before every payday.",
      needed: "Set up your first payroll run so HMRC is told on payday.",
      fix: "Set up payroll",
    },
    {
      id: "pension", label: "Pension", href: "/app/setup",
      receipt: { ref: "Pensions Act 2008 s.3", plain: `You must put ${name} into a workplace pension and pay in at least ${v.pension.min_employer_contribution_pct}% of their qualifying wages.` },
      verified: `${name} is enrolled and your declaration of compliance is done.`,
      needed: "Complete your pension step, including the declaration of compliance.",
      fix: "Complete your declaration",
    },
    {
      id: "insurance", label: "EL insurance", href: "/app/setup",
      receipt: { ref: "ELCI Act 1969 s.1", plain: `You must hold at least ${gbpShort(v.insurance.el_min_cover)} of employers' liability cover from ${name}'s first day.` },
      verified: "Cover in place — we track the renewal date for you.",
      needed: "Add your employers' liability certificate so we can confirm your cover.",
      fix: "Add certificate",
    },
    {
      id: "contract", label: "Contract", href: "/app/documents",
      receipt: { ref: "ERA 1996 s.1", plain: `You must give ${name} a written statement of their main terms, on or before their first day.` },
      verified: "Issued and checked by the Examiner. Pay meets the current legal minimum.",
      needed: `Generate ${name}'s contract — an examiner checks it before they see it. If the law changed, issue the variation letter below.`,
      fix: "Sort the contract",
    },
    {
      id: "rtw", label: "Right to work", href: "/app/right-to-work",
      receipt: { ref: "IANA 2006 s.15", plain: `You must check ${name} can legally work in the UK and keep the proof. A correct check protects you from a fine of up to ${gbpShort(v.right_to_work.penalty_first_breach)}.` },
      verified: "Checked, with the statutory-excuse record stored.",
      needed: `Do ${name}'s right to work check before their first day.`,
      fix: "Do the check",
    },
    {
      id: "records", label: "Records", href: "/app/setup",
      receipt: { ref: "PAYE Regs 2003 reg 97", plain: `You must keep ${name}'s pay records for ${v.employment_penalties.pay_record_retention_years} years. HMRC can ask to see them at any time.` },
      verified: "Kept automatically and stored in the UK.",
      needed: "Confirm how your pay records are kept.",
      fix: "Review records",
    },
  ];

  const data = await loadDashboard(business.id, firstName, gbp(v.minimum_wage.nlw_21_plus));

  return <Dashboard result={data.result} copy={copy} legalChange={data.legalChange} todayLabel={data.todayLabel} />;
}
