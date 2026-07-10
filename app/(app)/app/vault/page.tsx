import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/data/business";
import { loadVault } from "@/lib/data/vault";
import { getLiveConfig } from "@/lib/config";
import { VaultFlow, type RetentionCopy } from "@/components/app/vault/VaultFlow";

export const metadata = { title: "Evidence vault" };

export default async function VaultPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");

  const [artefacts, config] = await Promise.all([loadVault(business.id), getLiveConfig()]);
  const v = config.values;

  // Retention copy assembled server-side. Periods that are statutory config values
  // come from config (Rule 4); the RTW "+2 years" mirrors the retention_class the
  // row is stored under (data-model semantics, enforced on deletion).
  const sixYears = v.holiday.pay_record_retention_years;
  const threeYears = v.employment_penalties.pay_record_retention_years;
  const retention: Record<string, RetentionCopy> = {
    rtw: {
      text: "We keep right-to-work records for the length of employment plus 2 years — it's the law.",
      reference: "Immigration Order 2007",
      plainEnglish: "You must keep a copy of the right-to-work check while the person works for you, and for 2 years after they leave. It's your evidence if the Home Office ever asks.",
      guidanceUrl: "https://www.gov.uk/check-job-applicant-right-to-work",
    },
    contract: {
      text: `We keep the written statement and contract for the length of employment plus ${sixYears} years.`,
      reference: "Limitation Act 1980 s.5",
      plainEnglish: `Someone can bring a claim about their contract for up to ${sixYears} years. Keeping the papers that long means you can always show what was agreed.`,
      guidanceUrl: "https://www.gov.uk/employment-contracts-and-conditions",
    },
    payroll: {
      text: `We keep pay and PAYE records for the current year plus ${threeYears} years.`,
      reference: "Income Tax (PAYE) Regs 2003",
      plainEnglish: `HMRC can look back ${threeYears} years at your pay records. We hold them for you so an inspection is nothing to fear.`,
      guidanceUrl: "https://www.gov.uk/running-payroll",
    },
    pension: {
      text: `We keep auto-enrolment records for ${sixYears} years.`,
      reference: "Pensions Act 2008",
      plainEnglish: `The Pensions Regulator can ask you to prove you enrolled your worker correctly. We keep the proof for ${sixYears} years.`,
      guidanceUrl: "https://www.thepensionsregulator.gov.uk/en/employers",
    },
  };

  return <VaultFlow artefacts={artefacts} retention={retention} rtwReminderCopy="90, 30 and 7 days" />;
}
