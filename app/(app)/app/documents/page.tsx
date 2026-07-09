import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { getPrimaryEmployee } from "@/lib/data/employee";
import { getLiveConfig } from "@/lib/config";
import { deriveWageBand, floorForBand } from "@/lib/rules/contract/pay-floor";
import { holidayFloorDays } from "@/lib/rules/contract/holiday";
import { DocumentsFlow } from "@/components/app/documents/DocumentsFlow";
import { ComingSoon } from "@/components/app/ComingSoon";
import type { ContractForm } from "@/app/(app)/app/documents/actions";
import type { DocumentListItemView } from "@/lib/documents/view";

export const metadata = { title: "Documents" };

const TYPE_LABEL: Record<string, string> = {
  employment_contract: "Employment contract",
  offer_letter: "Offer letter",
  new_starter_checklist: "New starter checklist",
  variation_letter: "Variation letter",
  status_determination: "Status determination",
  rtw_statutory_excuse: "Right to work record",
};

function gbp(n: number): string {
  return "£" + n.toFixed(2);
}

export default async function DocumentsPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");

  const employee = await getPrimaryEmployee(business.id);
  if (!employee) {
    return (
      <ComingSoon
        title="Documents"
        prompt="Add who you're hiring"
        blurb="Run the Status Advisor first to add the person you're taking on. Their contract is generated and examined here."
      />
    );
  }

  const config = await getLiveConfig();
  const on = employee.start_date ?? new Date().toISOString().slice(0, 10);
  const { band } = deriveWageBand({
    dob: employee.dob,
    isApprentice: employee.is_apprentice,
    apprenticeshipStart: employee.apprenticeship_start,
    on,
  });
  const payFloor = floorForBand(config.values, band);
  const holidayFloor = holidayFloorDays(config.values, 5);
  const payBandLabel = band === "apprentice" ? "apprentice" : band === "nlw_21_plus" ? "21 and over" : band === "nmw_18_20" ? "18 to 20" : "16 to 17";
  const pensionTotal = config.values.pension.min_total_contribution_pct;
  const pensionEmployer = config.values.pension.min_employer_contribution_pct;
  const name = employee.full_name.split(/\s+/)[0] || employee.full_name;

  // Statutory copy assembled server-side from config (Rule 4 — no literals reach the client).
  const floors = {
    payFloor,
    payBandLabel,
    holidayFloor,
    receipts: {
      nmw: {
        reference: "NMWA 1998 s.1",
        plainEnglish: `Everyone must be paid at least the minimum wage for their age or apprentice band. For the ${payBandLabel} band, that is ${gbp(payFloor)} an hour.`,
        guidanceUrl: "https://www.gov.uk/national-minimum-wage-rates",
      },
      wtr: {
        reference: "WTR 1998 reg 13",
        plainEnglish: `Full-time workers get at least ${holidayFloor} days' paid holiday a year. Bank holidays can count towards this.`,
        guidanceUrl: "https://www.gov.uk/holiday-entitlement-rights",
      },
      notice: {
        reference: "ERA 1996 s.86",
        plainEnglish: `After one month, you must give at least one week's notice. This rises with each full year ${name} works for you.`,
        guidanceUrl: "https://www.gov.uk/handing-in-your-notice",
      },
      place: {
        reference: "ERA 1996 s.1(4)(h)",
        plainEnglish: `The contract must say where ${name} will work. If they work in more than one place, say that too.`,
        guidanceUrl: "https://www.gov.uk/employment-contracts-and-conditions",
      },
      pension: {
        reference: "PA 2008 s.3",
        plainEnglish: `You must put ${name} into a workplace pension once they qualify. The minimum total is ${pensionTotal}% of qualifying earnings, with at least ${pensionEmployer}% paid by you.`,
        guidanceUrl: "https://www.gov.uk/workplace-pensions-employers",
      },
    },
  };

  const defaults: ContractForm = {
    jobTitle: "",
    duties: "",
    place: "",
    rate: employee.pay_amount != null ? Number(employee.pay_amount).toFixed(2) : "",
    hours: employee.weekly_hours != null ? String(Number(employee.weekly_hours)) : "",
    interval: "Monthly",
    start: employee.start_date ?? "",
    probation: "3 months",
    notice: "1 week",
    holiday: String(holidayFloor),
    sickPay: "ssp",
    pension: "nest",
  };

  const draft = (business.journey_state?.contract ?? {}) as Partial<ContractForm>;

  // Existing documents with their latest examination (for the seal).
  const supabase = createClient();
  const { data: docRows } = await supabase
    .from("documents")
    .select("id, type, status, created_at, examinations(verdict, checklist_hash, created_at)")
    .eq("business_id", business.id)
    .neq("status", "superseded")
    .order("created_at", { ascending: false });

  const documents: DocumentListItemView[] = (docRows ?? [])
    .filter((d) => d.status === "approved")
    .map((d) => {
      const exams = (d.examinations ?? []) as { verdict: string; checklist_hash: string; created_at: string }[];
      const pass = exams.filter((e) => e.verdict === "pass").sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
      const dateLabel = new Date(d.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      return {
        id: d.id,
        type: d.type,
        typeLabel: TYPE_LABEL[d.type] ?? d.type,
        employeeName: employee.full_name,
        dateLabel,
        status: d.status,
        verified: !!pass,
        seal: pass
          ? {
              timestamp: new Date(pass.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
              hash: pass.checklist_hash,
            }
          : undefined,
      };
    });

  return (
    <DocumentsFlow
      employeeName={employee.full_name}
      documents={documents}
      draft={draft}
      defaults={defaults}
      floors={floors}
    />
  );
}
