"use client";

/* Cost calculator (FR-8.3) — client inputs over the PURE config-driven maths
 * (lib/rules/cost-calculator). The statutory inputs arrive as props from the
 * server (Rule 4); results are shareable via querystring. */
import { useMemo, useState } from "react";
import { Button, Icon } from "@/components/system";
import { calculateHiringCost } from "@/lib/rules/cost-calculator";
import type { StatutoryConfig } from "@/lib/config/types";

export interface CalculatorProps {
  config: StatutoryConfig;
  configLabel: string;
  initialRate?: string;
  initialHours?: string;
}

const gbp = (n: number) => "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function CalculatorFlow({ config, configLabel, initialRate, initialHours }: CalculatorProps) {
  const [rate, setRate] = useState(initialRate ?? config.minimum_wage.nlw_21_plus.toFixed(2));
  const [hours, setHours] = useState(initialHours ?? "40");
  const [age, setAge] = useState("25");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const r = parseFloat(rate);
    const h = parseFloat(hours);
    const a = parseInt(age, 10);
    if (isNaN(r) || isNaN(h) || r <= 0 || h <= 0) return null;
    const dobYear = new Date().getFullYear() - (isNaN(a) ? 30 : a);
    return calculateHiringCost(
      { hourlyRate: r, hoursPerWeek: h, band: { dob: `${dobYear}-01-01`, on: new Date().toISOString().slice(0, 10) } },
      config,
    );
  }, [rate, hours, age, config]);

  function share() {
    const url = `${window.location.origin}/calculator?rate=${encodeURIComponent(rate)}&hours=${encodeURIComponent(hours)}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px 72px" }}>
      <span className="eyebrow" style={{ display: "inline-flex" }}><span className="fe-icon">calculate</span> Cost calculator</span>
      <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: "10px 0 12px" }}>
        What does an employee really cost?
      </h1>
      <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "0 0 26px" }}>
        Wages are only part of it. This adds employer National Insurance and the minimum workplace pension — using the live statutory rates, never estimates.
      </p>

      <div className="fe-card" style={{ padding: 22, marginBottom: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div>
            <label className="fe-label" htmlFor="calc-rate">Hourly pay</label>
            <span className="fe-input-wrap">
              <span className="fe-input-affix" aria-hidden="true">£</span>
              <input id="calc-rate" inputMode="decimal" className="fe-input fe-input--prefixed fe-tabular" value={rate} onChange={(e) => setRate(e.target.value)} />
            </span>
          </div>
          <div>
            <label className="fe-label" htmlFor="calc-hours">Hours a week</label>
            <input id="calc-hours" inputMode="numeric" className="fe-input fe-tabular" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div>
            <label className="fe-label" htmlFor="calc-age">Their age</label>
            <input id="calc-age" inputMode="numeric" className="fe-input fe-tabular" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
        </div>
      </div>

      {result && (
        <div className="fe-card fe-card--document" style={{ padding: "24px 24px 20px", marginBottom: 18 }}>
          {!result.payFloorOk && (
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--red-50)", border: "1px solid rgba(192,57,43,0.35)", borderRadius: 10, padding: "10px 12px", marginBottom: 16, font: "500 14px/1.45 var(--font-body)", color: "var(--red-600)" }}>
              <Icon name="error" size={17} style={{ flex: "none", marginTop: 1 }} />
              That rate is below the {result.bandLabel} minimum of {gbp(result.payFloor)} an hour — it would be illegal.
            </div>
          )}
          <div className="fe-tabular" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Gross wages", result.grossAnnual],
              ["Employer National Insurance", result.employerNiBeforeAllowance],
              ["Workplace pension (employer minimum)", result.pensionEmployerAnnual],
            ].map(([k, v]) => (
              <div key={k as string} style={{ display: "flex", justifyContent: "space-between", gap: 16, font: "var(--text-body)", fontSize: 16 }}>
                <span style={{ color: "var(--neutral-500)" }}>{k}</span>
                <span style={{ color: "var(--ink-900)", fontWeight: 600 }}>{gbp(v as number)}</span>
              </div>
            ))}
            {result.employerNiBeforeAllowance > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, font: "var(--text-body)", fontSize: 16 }}>
                <span style={{ color: "var(--verified-green-700)" }}>Employment Allowance (most first employers)</span>
                <span style={{ color: "var(--verified-green-700)", fontWeight: 600 }}>−{gbp(Math.min(result.employerNiBeforeAllowance, result.employmentAllowance))}</span>
              </div>
            )}
          </div>
          <div style={{ borderTop: "1px solid var(--border-hairline)", marginTop: 16, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <span style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>Likely annual cost</span>
            <span className="fe-tabular" style={{ font: "700 28px/1 var(--font-display)", color: "var(--ink-900)", letterSpacing: "-0.01em" }}>{gbp(result.totalAnnual)}</span>
          </div>
          <div className="fe-tabular" style={{ textAlign: "right", font: "var(--text-caption)", color: "var(--neutral-500)", marginTop: 4 }}>
            about {gbp(result.totalMonthly)} a month
          </div>
          <p style={{ font: "var(--text-caption)", fontSize: 13, color: "var(--neutral-500)", marginTop: 14 }}>
            Employers&apos; liability insurance (legally required) is extra — typically a small annual premium from mainstream insurers. Rates current as of config {configLabel}.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button variant="secondary" onClick={share}>
          <Icon name={copied ? "check" : "ios_share"} size={18} />
          {copied ? "Link copied" : "Share this result"}
        </Button>
        <a className="fe-btn fe-btn--primary" href="/readiness">Check if you&apos;re ready to hire</a>
      </div>
    </div>
  );
}
