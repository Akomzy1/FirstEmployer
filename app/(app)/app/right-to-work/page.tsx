import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { getRtwOverview } from "@/lib/data/rtw";
import { getLiveConfig } from "@/lib/config";
import { RtwFlow } from "@/components/app/rtw/RtwFlow";
import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata = { title: "Right to work" };

function gbp(n: number): string {
  return "£" + n.toLocaleString("en-GB");
}

export default async function RightToWorkPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");

  const workers = await getRtwOverview(business.id);
  if (workers.length === 0) {
    return (
      <ComingSoon
        title="Right to work"
        prompt="Add who you're hiring"
        blurb="Add the person you're taking on first. You must check they can work in the UK before they start — we do the check with you here."
      />
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let checkerName = "";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    checkerName = profile?.full_name ?? "";
  }

  const config = await getLiveConfig();
  const penalties = {
    first: gbp(config.values.right_to_work.penalty_first_breach),
    repeat: gbp(config.values.right_to_work.penalty_repeat_breach),
  };

  return (
    <RtwFlow
      workers={workers}
      checkerName={checkerName}
      todayIso={new Date().toISOString().slice(0, 10)}
      penalties={penalties}
    />
  );
}
