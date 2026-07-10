import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { getCurrentBusiness } from "@/lib/data/business";

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w[0] ?? ""));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "FE";
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Middleware guarantees a session for /app/**. A user without a business still
  // needs onboarding.
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");

  return (
    <>
      <AppShell businessName={business.name} initials={initialsOf(business.name)}>
        {children}
      </AppShell>
      <InstallPrompt />
    </>
  );
}
