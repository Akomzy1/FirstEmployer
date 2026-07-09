import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { JourneyHome, type JourneyModule } from "@/components/app/JourneyHome";
import { formatDeadline, gradeFromDueDate } from "@/components/system";

export const metadata = { title: "Your journey" };

export default async function JourneyHomePage() {
  const supabase = createClient();
  const business = (await getCurrentBusiness())!; // layout guarantees it exists

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .maybeSingle();
  const ownerName = (profile?.full_name?.trim().split(/\s+/)[0]) || "there";

  // Real module state, derived from live data (no LLM, deterministic).
  const [{ count: determinationCount }, { data: obligations }] = await Promise.all([
    supabase.from("determinations").select("id", { count: "exact", head: true }),
    supabase.from("obligations").select("type, state, due_date"),
  ]);

  const hasDetermination = (determinationCount ?? 0) > 0;
  const obl = obligations ?? [];
  const openObligations = obl.filter((o) => o.state !== "complete");
  const hasSetupWork = obl.length > 0;

  const modules: JourneyModule[] = [
    {
      id: "status",
      n: "1",
      title: "Status Advisor",
      state: hasDetermination ? "complete" : "available",
      note: hasDetermination
        ? "You've checked your new hire's employment status."
        : "Check whether your new hire is an employee, a worker, or self-employed.",
      route: "/app/status-advisor",
    },
    {
      id: "setup",
      n: "2",
      title: "Employer setup",
      state: hasSetupWork
        ? openObligations.length === 0
          ? "complete"
          : "in-progress"
        : hasDetermination
          ? "available"
          : "locked",
      note: hasSetupWork
        ? `${openObligations.length} of ${obl.length} steps still need you.`
        : "Register with HMRC, set up payroll, pension and insurance.",
      route: "/app/setup",
    },
    {
      id: "contracts",
      n: "3",
      title: "Contracts",
      state: hasDetermination ? "available" : "locked",
      note: "Generate an employment contract, checked by an examiner.",
      route: "/app/documents",
    },
    {
      id: "rtw",
      n: "4",
      title: "Right to work",
      state: "locked",
      note: "Unlocks after your contract is issued.",
      route: null,
    },
    {
      id: "dashboard",
      n: "5",
      title: "Compliance dashboard",
      state: hasSetupWork ? "available" : "locked",
      note: hasSetupWork
        ? "See where you stand and what's due next."
        : "Unlocks once your setup is under way.",
      route: "/app/dashboard",
    },
    {
      id: "assistant",
      n: "6",
      title: "Assistant",
      state: "always",
      note: "Ask anything about hiring, any time.",
      route: "/app/assistant",
    },
  ];

  const next = modules.find((m) => m.state === "available" || m.state === "in-progress") ?? null;
  const completed = modules.filter((m) => m.state === "complete").length;

  const now = new Date();
  const deadlines = obl
    .filter((o) => o.due_date)
    .map((o) => ({
      label: labelForObligation(o.type),
      grade: gradeFromDueDate(o.due_date as string, now),
      due: formatDeadline(o.due_date as string, now),
    }));

  return (
    <JourneyHome
      ownerName={ownerName}
      businessName={business.name}
      modules={modules}
      nextStepTitle={next?.title ?? null}
      completedCount={completed}
      totalCount={modules.length}
      deadlines={deadlines}
    />
  );
}

function labelForObligation(type: string): string {
  const map: Record<string, string> = {
    el_insurance: "Employers' liability insurance",
    hmrc_paye: "PAYE registration",
    written_statement: "Written contracts",
    right_to_work: "Right-to-work checks",
    pension_enrolment: "Workplace pension",
    pension_declaration: "Pension declaration",
    record_keeping: "Pay & holiday records",
  };
  return map[type] ?? type;
}
