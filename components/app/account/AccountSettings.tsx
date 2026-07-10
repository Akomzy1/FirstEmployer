"use client";

import { useState } from "react";
import { Alert, Button, Icon, RadioCards, StatutoryReceipt } from "@/components/system";
import { createCheckoutSession, createPortalSession, deleteAccount, saveSettings } from "@/app/(app)/app/account/actions";
import type { TierDef, TierId } from "@/lib/pricing";

export interface RetentionRowCopy {
  icon: string;
  title: string;
  keep: string;
  why: string;
  ref: string;
  plain: string;
  url: string;
}

export interface AccountSettingsProps {
  tab: "account" | "settings";
  tiers: TierDef[];
  currentTier: TierDef;
  subscriptionState: string;
  trialEndsLabel: string | null;
  employeesUsed: number;
  businessName: string;
  businessType: string;
  sector: string;
  email: string;
  prefs: { cadence: string; email: boolean; sms: boolean; push: boolean };
  retention: RetentionRowCopy[];
}

const wrap: React.CSSProperties = { maxWidth: 620, margin: "0 auto", width: "100%", boxSizing: "border-box" };

function Section({ label, children, style }: { label?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{ marginBottom: 28, ...style }}>
      {label && <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 12 }}>{label}</div>}
      {children}
    </section>
  );
}

function RowGroup({ children }: { children: React.ReactNode[] }) {
  const rows = children.filter(Boolean);
  return (
    <div style={{ borderRadius: 12, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", overflow: "hidden" }}>
      {rows.map((r, i) => (
        <div key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border-hairline)" : "none" }}>{r}</div>
      ))}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 18px" }}>
      <Icon name={icon} size={22} style={{ color: "var(--neutral-500)", flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "600 13px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--neutral-500)", marginBottom: 4 }}>{label}</div>
        <div style={{ font: "500 16px/1.3 var(--font-body)", color: "var(--ink-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      </div>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} style={{ width: 50, height: 30, borderRadius: 999, border: "none", cursor: "pointer", flex: "none", background: on ? "var(--verified-green-600)" : "var(--neutral-200)", position: "relative", transition: "background-color 180ms var(--ease)", padding: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 24, height: 24, borderRadius: 999, background: "#fff", boxShadow: "0 1px 3px rgba(14,27,44,0.3)", transition: "left 180ms var(--ease)" }} />
    </button>
  );
}

function ToggleRow({ title, sub, on, onChange }: { title: string; sub?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "500 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>{title}</div>
        {sub && <div style={{ font: "400 14px/1.4 var(--font-body)", color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle on={on} onChange={onChange} label={title} />
    </div>
  );
}

function UsageMeter({ used, cap, nextName }: { used: number; cap: number; nextName: string | null }) {
  const pct = Math.min(100, Math.round((used / cap) * 100));
  const nearGate = used >= cap - 1;
  const room = cap - used;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ font: "var(--text-label)", color: "var(--bone-50)" }}>Employees</span>
        <span className="fe-tabular" style={{ font: "600 14px/1 var(--font-body)", color: "var(--bone-50)" }}>{used} of {cap} used</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(247,244,238,0.18)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", borderRadius: 999, background: nearGate ? "var(--amber-500)" : "var(--verified-green-600)", transition: "width var(--motion-slow) var(--ease)" }} />
      </div>
      <div className="fe-tabular" style={{ font: "var(--text-caption)", color: "rgba(247,244,238,0.75)", marginTop: 8 }}>
        {room <= 0
          ? nextName ? `Plan full — upgrade to ${nextName} for more room.` : "Plan full."
          : room === 1 ? "Room for 1 more employee on this plan." : `Room for ${room} more employees on this plan.`}
      </div>
    </div>
  );
}

export function AccountSettings(props: AccountSettingsProps) {
  const [tab, setTab] = useState<"account" | "settings">(props.tab);
  const [prefs, setPrefs] = useState(props.prefs);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const upgrades = props.tiers.filter((t) => t.cap > props.currentTier.cap);
  const trialing = props.subscriptionState === "trialing";
  const canceled = props.subscriptionState === "canceled";

  async function go(fn: () => Promise<{ url: string }>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const { url } = await fn();
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  function updatePrefs(next: typeof prefs) {
    setPrefs(next);
    saveSettings(next).catch(() => {});
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      window.location.href = "/auth";
    } catch (e) {
      setError((e as Error).message);
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, position: "relative" }}>
      {/* segmented top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "rgba(247,244,238,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-hairline)" }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--ink-900)", display: "grid", placeItems: "center", flex: "none" }}>
          <Icon name="verified" size={16} fill style={{ color: "var(--verified-green-600)" }} />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "inline-flex", background: "rgba(14,27,44,0.06)", borderRadius: 999, padding: 3 }}>
          {(["account", "settings"] as const).map((id) => (
            <button key={id} onClick={() => setTab(id)} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 18px", font: "600 14px/1 var(--font-body)", background: tab === id ? "var(--surface-raised)" : "transparent", color: tab === id ? "var(--ink-900)" : "var(--neutral-500)", boxShadow: tab === id ? "var(--shadow-card)" : "none", transition: "background-color 150ms var(--ease), color 150ms var(--ease)" }}>
              {id === "account" ? "Account" : "Settings"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ padding: "16px 20px 30px", boxSizing: "border-box", animation: "fe-view-in 220ms var(--ease)" }}>
          <div style={wrap}>
            {error && <div style={{ marginBottom: 16 }}><Alert kind="warning" title="That didn't work">{error}</Alert></div>}

            {tab === "account" ? (
              <>
                <header style={{ margin: "4px 0 22px" }}>
                  <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>Account</h1>
                  <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "6px 0 0" }}>Your plan, billing and business details.</p>
                </header>

                <Section label="Your plan">
                  <div style={{ background: "var(--ink-900)", color: "var(--bone-50)", borderRadius: "var(--radius-card)", padding: "22px 22px 24px", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--verified-green-600)", marginBottom: 8 }}>Current plan</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", color: "var(--bone-50)" }}>{props.currentTier.name}</span>
                          <span className="fe-tabular" style={{ font: "500 16px/1 var(--font-body)", color: "rgba(247,244,238,0.75)" }}>£{props.currentTier.price}/mo</span>
                        </div>
                      </div>
                      {canceled ? (
                        <span className="fe-pill" style={{ background: "var(--red-50)", color: "var(--red-600)" }}><Icon name="error" size={15} />Ended</span>
                      ) : trialing ? (
                        <span className="fe-pill" style={{ background: "var(--amber-50)", color: "var(--amber-700)" }}><Icon name="hourglass_top" size={15} />Trial</span>
                      ) : props.subscriptionState === "past_due" ? (
                        <span className="fe-pill" style={{ background: "var(--amber-50)", color: "var(--amber-700)" }}><Icon name="schedule" size={15} />Payment due</span>
                      ) : (
                        <span className="fe-pill" style={{ background: "var(--verified-green-50)", color: "var(--verified-green-700)" }}><Icon name="check_circle" size={15} />Active</span>
                      )}
                    </div>
                    <UsageMeter used={props.employeesUsed} cap={props.currentTier.cap} nextName={upgrades[0]?.name ?? null} />
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 18, font: "var(--text-caption)", color: "rgba(247,244,238,0.75)" }}>
                      <Icon name={trialing ? "hourglass_top" : "event_repeat"} size={15} />
                      <span className="fe-tabular">
                        {trialing && props.trialEndsLabel
                          ? `Trial ends ${props.trialEndsLabel} — no card taken until you subscribe.`
                          : canceled ? "Your account is read-only. Documents stay downloadable." : `Billed monthly · £${props.currentTier.price}`}
                      </span>
                    </div>
                    {(trialing || canceled) && (
                      <div style={{ marginTop: 16 }}>
                        <Button variant="primary" style={{ width: "100%" }} loading={busy === "subscribe"} onClick={() => go(() => createCheckoutSession(props.currentTier.id as TierId), "subscribe")}>
                          {canceled ? "Restart my plan" : `Subscribe to ${props.currentTier.name}`}
                        </Button>
                      </div>
                    )}
                  </div>
                </Section>

                {upgrades.length > 0 && (
                  <Section label="Need more room?">
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {upgrades.map((t) => (
                        <div key={t.id} className="fe-card" style={{ padding: "20px 20px 22px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                            <span style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)" }}>{t.name}</span>
                            <span className="fe-tabular" style={{ font: "600 16px/1 var(--font-body)", color: "var(--neutral-500)" }}>£{t.price}/mo</span>
                          </div>
                          <p style={{ font: "400 15px/1.45 var(--font-body)", color: "var(--text-secondary)", margin: "0 0 14px" }}>{t.for}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, font: "500 15px/1.3 var(--font-body)", color: "var(--ink-900)" }}>
                            <Icon name="group" size={18} style={{ color: "var(--neutral-500)" }} />
                            Up to {t.cap} employees
                          </div>
                          <Button variant="secondary" style={{ width: "100%" }} loading={busy === t.id} onClick={() => go(() => createCheckoutSession(t.id as TierId), t.id)}>
                            Upgrade to {t.name}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p style={{ font: "var(--text-caption)", color: "var(--text-secondary)", margin: "12px 2px 0" }}>
                      Changing plan takes effect straight away. We only ever charge the difference.
                    </p>
                  </Section>
                )}

                <Section label="Billing">
                  <button onClick={() => go(createPortalSession, "portal")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "17px 18px", width: "100%", borderRadius: 12, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}>
                      <Icon name="credit_card" size={21} style={{ color: "var(--ink-900)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>Manage billing</div>
                      <div style={{ font: "400 14px/1.4 var(--font-body)", color: "var(--text-secondary)", marginTop: 2 }}>Cards, invoices and receipts on Stripe, our secure payment partner.</div>
                    </div>
                    <Icon name="open_in_new" size={20} style={{ color: "var(--neutral-400)", flex: "none" }} />
                  </button>
                </Section>

                <Section label="Business details" style={{ marginBottom: 10 }}>
                  <RowGroup>
                    <InfoRow icon="storefront" label="Business name" value={props.businessName} />
                    <InfoRow icon="account_balance" label="Business structure" value={props.businessType} />
                    <InfoRow icon="handyman" label="Sector" value={props.sector} />
                    <InfoRow icon="mail" label="Contact email" value={props.email} />
                  </RowGroup>
                  <p style={{ display: "flex", alignItems: "flex-start", gap: 6, font: "var(--text-caption)", color: "var(--text-secondary)", margin: "12px 2px 0" }}>
                    <Icon name="info" size={15} style={{ flex: "none", marginTop: 1 }} />
                    <span>
                      Changing your structure may change your checklist.{" "}
                      <StatutoryReceipt reference="PAYE Regs 2003" plainEnglish="A limited company must run PAYE and put its director on the payroll. A sole trader only registers once they pay staff." guidanceUrl="https://www.gov.uk/register-employer" />
                    </span>
                  </p>
                </Section>
              </>
            ) : (
              <>
                <header style={{ margin: "4px 0 22px" }}>
                  <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>Settings</h1>
                  <p style={{ font: "var(--text-body)", color: "var(--text-secondary)", margin: "6px 0 0" }}>How we reach you, and what happens to your data.</p>
                </header>

                <Section label="Deadline alerts">
                  <div className="fe-card" style={{ padding: 20 }}>
                    <RadioCards
                      label="When should we remind you?"
                      options={[
                        { value: "approaching", title: "As deadlines approach", description: "We nudge you in good time — recommended." },
                        { value: "weekly", title: "A weekly summary", description: "One digest every Monday morning." },
                        { value: "urgent", title: "Only when something's urgent", description: "The quietest option. You'll hear from us rarely." },
                      ]}
                      value={prefs.cadence}
                      onChange={(v) => updatePrefs({ ...prefs, cadence: v })}
                    />
                  </div>
                </Section>

                <Section label="How to reach you">
                  <RowGroup>
                    <ToggleRow title="Email" sub={props.email} on={prefs.email} onChange={(v) => updatePrefs({ ...prefs, email: v })} />
                    <ToggleRow title="Text message" sub="For urgent deadlines only" on={prefs.sms} onChange={(v) => updatePrefs({ ...prefs, sms: v })} />
                    <ToggleRow title="Push notifications" sub="On this device" on={prefs.push} onChange={(v) => updatePrefs({ ...prefs, push: v })} />
                  </RowGroup>
                </Section>

                <Section label="Your data">
                  <a href="/app/settings/export" style={{ display: "flex", alignItems: "center", gap: 14, padding: "17px 18px", width: "100%", borderRadius: 12, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", cursor: "pointer", textAlign: "left", marginBottom: 16, textDecoration: "none", boxSizing: "border-box" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}>
                      <Icon name="download" size={21} style={{ color: "var(--ink-900)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>Download all my data</div>
                      <div style={{ font: "400 14px/1.4 var(--font-body)", color: "var(--text-secondary)", marginTop: 2 }}>Everything we hold, as a file you can keep. Ready in about a minute.</div>
                    </div>
                    <Icon name="chevron_right" size={20} style={{ color: "var(--neutral-400)", flex: "none" }} />
                  </a>

                  <div className="fe-card" style={{ padding: 20 }}>
                    <div style={{ font: "600 16px/1.35 var(--font-body)", color: "var(--ink-900)", marginBottom: 6 }}>What we must keep, and for how long</div>
                    <p style={{ font: "400 15px/1.5 var(--font-body)", color: "var(--text-secondary)", margin: "0 0 16px" }}>
                      Even after you leave, the law asks us to hold some records for a set time. We keep only these, locked away, then delete them on schedule.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {props.retention.map((r) => (
                        <div key={r.ref} style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}>
                            <Icon name={r.icon} size={20} style={{ color: "var(--ink-900)" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>{r.title}</span>
                              <span className="fe-tabular" style={{ font: "600 13px/1 var(--font-body)", color: "var(--amber-700)", background: "var(--amber-50)", padding: "5px 9px", borderRadius: 999 }}>{r.keep}</span>
                            </div>
                            <p style={{ font: "400 14px/1.45 var(--font-body)", color: "var(--text-secondary)", margin: "4px 0 8px" }}>{r.why}</p>
                            <StatutoryReceipt reference={r.ref} plainEnglish={r.plain} guidanceUrl={r.url} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>

                <Section label="Leaving" style={{ marginBottom: 8 }}>
                  <button onClick={() => setConfirmOpen(true)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "17px 18px", width: "100%", borderRadius: 12, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 999, background: "var(--red-50)", display: "grid", placeItems: "center", flex: "none" }}>
                      <Icon name="delete" size={21} style={{ color: "var(--red-600)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--red-600)" }}>Delete my account</div>
                      <div style={{ font: "400 14px/1.4 var(--font-body)", color: "var(--text-secondary)", marginTop: 2 }}>We&apos;ll explain exactly what happens before anything is removed.</div>
                    </div>
                    <Icon name="chevron_right" size={20} style={{ color: "var(--neutral-400)", flex: "none" }} />
                  </button>
                </Section>

                <div className="fe-tabular" style={{ font: "var(--text-caption)", color: "var(--neutral-400)", textAlign: "center", marginTop: 18 }}>
                  Data stored in the UK · FirstEmployer v1.0
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* honest delete-confirmation sheet */}
      {confirmOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
          <div onClick={() => !deleting && setConfirmOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(14,27,44,0.34)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "var(--surface-raised)", boxShadow: "var(--shadow-popover)", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "12px 22px 30px", animation: "fe-view-in 200ms var(--ease)" }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--neutral-200)", margin: "0 auto 18px" }} />
            <h3 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", margin: "0 0 10px" }}>Delete your account?</h3>
            <p style={{ font: "var(--text-body)", fontSize: 16, color: "var(--text-secondary)", margin: "0 0 14px" }}>
              We&apos;ll remove your login and everything we&apos;re free to delete within 30 days. We&apos;ll email you when it&apos;s done.
            </p>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9, background: "var(--amber-50)", border: "1px solid rgba(217,122,8,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
              <Icon name="gavel" size={19} style={{ color: "var(--amber-700)", flex: "none", marginTop: 1 }} />
              <span style={{ font: "500 14px/1.45 var(--font-body)", color: "var(--ink-900)" }}>
                Some records we must keep by law for a set time, even after you leave. We&apos;ll keep only those, locked away, and delete them on schedule.
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Button variant="destructive" style={{ width: "100%" }} loading={deleting} onClick={confirmDelete}>Delete my account</Button>
              <Button variant="tertiary" style={{ width: "100%" }} disabled={deleting} onClick={() => setConfirmOpen(false)}>Keep my account</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
