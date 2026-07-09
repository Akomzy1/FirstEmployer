import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <ComingSoon
      title="Documents"
      prompt="Prompts 6–7"
      blurb="Generate employment contracts, each independently checked by the examiner before you ever see it."
    />
  );
}
