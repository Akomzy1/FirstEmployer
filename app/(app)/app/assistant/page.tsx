import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata = { title: "Assistant" };

export default function AssistantPage() {
  return (
    <ComingSoon
      title="Assistant"
      prompt="Prompt 11"
      blurb="Plain-English answers about hiring, grounded in your own obligations and the law — never guesswork."
    />
  );
}
