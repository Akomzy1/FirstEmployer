import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <ComingSoon
      title="Compliance dashboard"
      prompt="Prompt 9"
      blurb="Your compliance ring, obligations, and deadlines — one screen answering 'am I compliant right now?'"
    />
  );
}
