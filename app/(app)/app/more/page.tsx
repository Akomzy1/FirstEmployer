import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata = { title: "More" };

export default function MorePage() {
  return (
    <ComingSoon
      title="More"
      prompt="Prompt 12"
      blurb="Your account, plan, evidence vault, and settings live here."
    />
  );
}
