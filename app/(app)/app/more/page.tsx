// NO-PROTOTYPE: composed from system. Interim More screen — the prototype's
// MoreScreen rows (business, subscription, settings) land with P12; the vault
// entry is live now (P10). Structure follows the app export's row pattern.
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/business";
import { Icon } from "@/components/system";

export const metadata = { title: "More" };

export default async function MorePage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/onboarding");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let ownerName = "";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    ownerName = profile?.full_name ?? "";
  }
  const initials = business.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const live = [
    { icon: "credit_card", label: "Account & plan", href: "/app/account" },
    { icon: "settings", label: "Settings & privacy", href: "/app/settings" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "18px 20px 28px", boxSizing: "border-box" }}>
        <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: "8px 0 20px" }}>More</h1>

        <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "16px 18px", borderRadius: 12, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--ink-900)", color: "var(--bone-50)", display: "grid", placeItems: "center", font: "600 15px/1 var(--font-body)", flex: "none" }}>{initials}</div>
          <div>
            <div style={{ font: "600 17px/1.2 var(--font-body)" }}>{ownerName || business.name}</div>
            <div style={{ font: "var(--text-caption)", color: "var(--text-secondary)" }}>{business.name}</div>
          </div>
        </div>

        <div style={{ borderRadius: 12, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", overflow: "hidden", marginBottom: 20 }}>
          <Link href="/app/vault" style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 18px", width: "100%", borderBottom: "1px solid var(--border-hairline)", textDecoration: "none", boxSizing: "border-box" }}>
            <Icon name="inventory_2" size={22} style={{ color: "var(--neutral-500)", flex: "none" }} />
            <span style={{ flex: 1, font: "500 16px/1.2 var(--font-body)", color: "var(--ink-900)" }}>Evidence vault</span>
            <span style={{ font: "var(--text-caption)", color: "var(--neutral-400)" }}>Every document, in order</span>
            <Icon name="chevron_right" size={20} style={{ color: "var(--neutral-400)", flex: "none" }} />
          </Link>
          <Link href="/app/right-to-work" style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 18px", width: "100%", borderBottom: "1px solid var(--border-hairline)", textDecoration: "none", boxSizing: "border-box" }}>
            <Icon name="badge" size={22} style={{ color: "var(--neutral-500)", flex: "none" }} />
            <span style={{ flex: 1, font: "500 16px/1.2 var(--font-body)", color: "var(--ink-900)" }}>Right to work</span>
            <Icon name="chevron_right" size={20} style={{ color: "var(--neutral-400)", flex: "none" }} />
          </Link>
          {live.map((r, i) => (
            <Link key={r.label} href={r.href} style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 18px", width: "100%", borderBottom: i < live.length - 1 ? "1px solid var(--border-hairline)" : "none", textDecoration: "none", boxSizing: "border-box" }}>
              <Icon name={r.icon} size={22} style={{ color: "var(--neutral-500)", flex: "none" }} />
              <span style={{ flex: 1, font: "500 16px/1.2 var(--font-body)", color: "var(--ink-900)" }}>{r.label}</span>
              <Icon name="chevron_right" size={20} style={{ color: "var(--neutral-400)", flex: "none" }} />
            </Link>
          ))}
        </div>

        <form action="/auth/signout" method="post">
          <button type="submit" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", width: "100%", borderRadius: 12, border: "1px solid var(--border-hairline)", background: "none", cursor: "pointer", font: "600 16px/1 var(--font-body)", color: "var(--red-600)" }}>
            <Icon name="logout" size={20} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
