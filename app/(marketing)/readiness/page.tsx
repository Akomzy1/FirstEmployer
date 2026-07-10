import type { Metadata } from "next";
import { ReadinessFlow } from "@/components/marketing/ReadinessFlow";
import { SITE_URL } from "@/lib/marketing/entity";

export const metadata: Metadata = {
  title: "Are you ready to hire? Free 2-minute check | FirstEmployer",
  description: "Eight questions covering every legal duty of a first hire. Get a plain-English list of exactly what is left to do.",
  alternates: { canonical: SITE_URL + "/readiness" },
};

export default function ReadinessPage() {
  return (
    <main className="section">
      <ReadinessFlow />
    </main>
  );
}
