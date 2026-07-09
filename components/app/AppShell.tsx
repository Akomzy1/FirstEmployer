"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/system";

const NAV = [
  { id: "home", label: "Home", icon: "home", href: "/app" },
  { id: "dashboard", label: "Dashboard", icon: "monitoring", href: "/app/dashboard" },
  { id: "documents", label: "Documents", icon: "description", href: "/app/documents" },
  { id: "assistant", label: "Assistant", icon: "forum", href: "/app/assistant" },
  { id: "more", label: "More", icon: "more_horiz", href: "/app/more" },
];

function activeId(pathname: string): string {
  // Longest-prefix match so /app/documents/… highlights Documents, /app highlights Home.
  const match = [...NAV]
    .filter((n) => pathname === n.href || pathname.startsWith(n.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.id ?? "home";
}

export function AppShell({
  businessName,
  initials,
  children,
}: {
  businessName: string;
  initials: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = activeId(pathname);

  return (
    <div className="fe-app-shell">
      {/* Desktop left rail */}
      <aside
        className="fe-app-rail"
        style={{
          width: 268,
          flex: "none",
          background: "var(--surface-raised)",
          borderRight: "1px solid var(--border-hairline)",
          flexDirection: "column",
          padding: "26px 18px 22px",
          gap: 4,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 10px 20px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.svg" alt="" width={30} height={30} style={{ display: "block", flex: "none" }} />
          <span style={{ font: "600 19px/1 var(--font-display)", letterSpacing: "-0.01em" }}>FirstEmployer</span>
        </div>

        <div style={{ padding: "14px 14px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border-hairline)", marginBottom: 14 }}>
          <div style={{ font: "600 11px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 6 }}>Business</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, background: "var(--ink-900)", color: "var(--bone-50)", display: "grid", placeItems: "center", font: "600 13px/1 var(--font-body)", flex: "none" }}>{initials}</div>
            <div style={{ font: "600 15px/1.25 var(--font-body)", color: "var(--ink-900)" }}>{businessName}</div>
          </div>
        </div>

        {NAV.map((item) => {
          const on = item.id === active;
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                padding: "12px 14px",
                borderRadius: 999,
                width: "100%",
                textAlign: "left",
                textDecoration: "none",
                font: on ? "600 16px/1 var(--font-body)" : "500 16px/1 var(--font-body)",
                background: on ? "rgba(14,27,44,0.08)" : "transparent",
                color: on ? "var(--ink-900)" : "var(--neutral-500)",
              }}
            >
              <Icon name={item.icon} size={23} fill={on} />
              {item.label}
            </Link>
          );
        })}

        <form action="/auth/signout" method="post" style={{ marginTop: "auto" }}>
          <button
            type="submit"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", color: "var(--neutral-500)", font: "500 14px/1.3 var(--font-body)", background: "none", border: "none", cursor: "pointer", width: "100%" }}
          >
            <Icon name="logout" size={17} />
            Sign out
          </button>
        </form>
      </aside>

      {/* Content */}
      <main className="fe-app-main">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav
        className="fe-app-tabbar"
        style={{
          flex: "none",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          borderTop: "1px solid var(--border-hairline)",
          background: "rgba(247,244,238,0.94)",
          backdropFilter: "blur(12px)",
          paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
          paddingTop: 8,
          position: "sticky",
          bottom: 0,
          zIndex: 20,
        }}
      >
        {NAV.map((item) => {
          const on = item.id === active;
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "4px 0",
                textDecoration: "none",
                color: on ? "var(--ink-900)" : "var(--neutral-500)",
              }}
            >
              <Icon name={item.icon} size={25} fill={on} />
              <span style={{ font: on ? "600 11px/1 var(--font-body)" : "500 11px/1 var(--font-body)", letterSpacing: "0.01em" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
