"use client";

/* Admin console (P14) — desktop-first, dark a-* theme from the Admin Console
 * export (Rule 6). Five views: users, examination log (flight recorder,
 * read-only), config publisher (the only config write path), monitor review
 * queue (manual entry; nothing auto-publishes), and feedback. */
import { useMemo, useState } from "react";
import type { AdminData, AdminConfigRow, AdminExamRow, AdminMonitorRow } from "@/lib/admin/data";
import { publishConfigAction, addMonitorFinding, resolveMonitorFinding } from "@/app/(admin)/admin/actions";

function AIcon({ name, size = 20, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return <span className="fe-icon" aria-hidden style={{ fontSize: size, ...style }}>{name}</span>;
}

const NAV = [
  { id: "users", label: "Users & subscriptions", icon: "group" },
  { id: "exams", label: "Examination log", icon: "balance" },
  { id: "config", label: "Config publisher", icon: "tune" },
  { id: "monitor", label: "Monitor queue", icon: "radar" },
  { id: "feedback", label: "Feedback", icon: "reviews" },
] as const;
type ViewId = (typeof NAV)[number]["id"];

const chip = (tone: "green" | "amber" | "red" | "grey"): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 5, font: "600 12px/1 var(--font-body)", padding: "5px 10px", borderRadius: 999,
  color: tone === "green" ? "var(--a-green, #34c486)" : tone === "amber" ? "#e0a83a" : tone === "red" ? "#e05648" : "var(--a-text-2, #98a2b3)",
  background: tone === "green" ? "rgba(52,196,134,0.12)" : tone === "amber" ? "rgba(224,168,58,0.12)" : tone === "red" ? "rgba(224,86,72,0.12)" : "rgba(152,162,179,0.12)",
});

const td: React.CSSProperties = { padding: "12px 14px", font: "400 13px/1.4 var(--font-body)", color: "var(--a-text-2, #98a2b3)", borderBottom: "1px solid var(--a-border, #26303f)", verticalAlign: "top" };
const th: React.CSSProperties = { ...td, font: "600 11px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--a-text-3, #667085)" };
const strong: React.CSSProperties = { color: "var(--a-text, #e6eaf0)", fontWeight: 600 };

export function AdminConsole({ data, adminEmail }: { data: AdminData; adminEmail: string }) {
  const [view, setView] = useState<ViewId>("users");
  return (
    <div className="adm" style={{ minHeight: "100vh", display: "flex" }}>
      {/* left rail */}
      <aside style={{ width: 250, flex: "none", borderRight: "1px solid var(--a-border, #26303f)", padding: "22px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 10px 18px" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--verified-green-600)", display: "grid", placeItems: "center" }}>
            <AIcon name="verified" size={17} style={{ color: "#fff" }} />
          </span>
          <span style={{ font: "600 16px/1 var(--font-display)", color: "var(--a-text, #e6eaf0)" }}>FE Admin</span>
        </div>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setView(n.id)} style={{
            display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
            font: view === n.id ? "600 14px/1 var(--font-body)" : "500 14px/1 var(--font-body)",
            background: view === n.id ? "rgba(255,255,255,0.06)" : "transparent",
            color: view === n.id ? "var(--a-text, #e6eaf0)" : "var(--a-text-2, #98a2b3)",
          }}>
            <AIcon name={n.icon} size={19} />
            {n.label}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "12px 10px", font: "500 12px/1.4 var(--font-body)", color: "var(--a-text-3, #667085)" }}>
          {adminEmail}
          <br />Flight recorder: read-only except publish &amp; queue.
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: "26px 30px 60px", overflowX: "auto" }}>
        {view === "users" && <UsersView data={data} />}
        {view === "exams" && <ExamsView data={data} />}
        {view === "config" && <ConfigView data={data} adminEmail={adminEmail} />}
        {view === "monitor" && <MonitorView data={data} />}
        {view === "feedback" && <FeedbackView data={data} />}
      </main>
    </div>
  );
}

function Head({ title, count, sub }: { title: string; count?: number; sub?: string }) {
  return (
    <header style={{ marginBottom: 18 }}>
      <h1 style={{ font: "600 22px/1.2 var(--font-display)", color: "var(--a-text, #e6eaf0)", margin: 0 }}>
        {title}{count != null && <span className="fe-tabular" style={{ color: "var(--a-text-3, #667085)", marginLeft: 10, font: "500 15px/1 var(--font-body)" }}>{count}</span>}
      </h1>
      {sub && <p style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--a-text-2, #98a2b3)", margin: "6px 0 0" }}>{sub}</p>}
    </header>
  );
}

/* ------------------------- users ------------------------- */
function UsersView({ data }: { data: AdminData }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <Head title="Users & subscriptions" count={data.users.length} sub="Every business, its plan and its people." />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={th}>Business</th><th style={th}>Owner</th><th style={th}>Tier</th><th style={th}>State</th><th style={th}>Employees</th><th style={th}>Joined</th></tr></thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u.businessId} onClick={() => setOpen(open === u.businessId ? null : u.businessId)} style={{ cursor: "pointer" }}>
              <td style={td}><span style={strong}>{u.business}</span>{open === u.businessId && <div style={{ marginTop: 6, font: "400 12px/1.5 var(--font-body)" }}>id {u.businessId}</div>}</td>
              <td style={td}>{u.owner}</td>
              <td style={td}><span style={chip("grey")}>{u.tier}</span></td>
              <td style={td}><span style={chip(u.state === "active" ? "green" : u.state === "canceled" ? "red" : "amber")}>{u.state}</span></td>
              <td style={{ ...td, textAlign: "right" }} className="fe-tabular">{u.employees}</td>
              <td style={td} className="fe-tabular">{u.createdLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ------------------------- examinations ------------------------- */
function ExamsView({ data }: { data: AdminData }) {
  const [verdict, setVerdict] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(
    () => data.exams.filter((e) => (verdict === "all" || e.verdict === verdict) && (!q || e.business.toLowerCase().includes(q.toLowerCase()) || e.defects.some((d) => d.issue.toLowerCase().includes(q.toLowerCase())))),
    [data.exams, verdict, q],
  );
  return (
    <>
      <Head title="Examination log" count={rows.length} sub="The flight recorder. Every attempt, verdict and defect — read-only." />
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {["all", "pass", "fail"].map((v) => (
          <button key={v} onClick={() => setVerdict(v)} style={{ ...chip(verdict === v ? "green" : "grey"), border: "none", cursor: "pointer" }}>{v}</button>
        ))}
        <input placeholder="Search business or defect…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.05)", border: "1px solid var(--a-border, #26303f)", borderRadius: 8, color: "var(--a-text, #e6eaf0)", font: "400 13px/1 var(--font-body)", padding: "9px 12px", width: 260 }} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={th}>When</th><th style={th}>Business</th><th style={th}>Document</th><th style={th}>Attempt</th><th style={th}>Verdict</th><th style={th}>Versions</th></tr></thead>
        <tbody>
          {rows.map((e) => (
            <ExamRow key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />
          ))}
        </tbody>
      </table>
    </>
  );
}

function ExamRow({ e, open, onToggle }: { e: AdminExamRow; open: boolean; onToggle: () => void }) {
  return (
    <>
      <tr onClick={onToggle} style={{ cursor: "pointer" }}>
        <td style={td} className="fe-tabular">{e.atLabel}</td>
        <td style={td}><span style={strong}>{e.business}</span></td>
        <td style={td}>{e.docType}</td>
        <td style={{ ...td, textAlign: "center" }} className="fe-tabular">{e.attempt}</td>
        <td style={td}><span style={chip(e.verdict === "pass" ? "green" : "red")}>{e.verdict}</span></td>
        <td style={td} className="fe-tabular">{e.generatorVersion} · {e.examinerVersion} · cfg {e.configVersion} · #{e.checklistHash}</td>
      </tr>
      {open && (
        <tr>
          <td style={{ ...td, background: "rgba(255,255,255,0.03)" }} colSpan={6}>
            {e.defects.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ ...th, padding: "0 0 6px" }}>Defects</div>
                {e.defects.map((d, i) => (
                  <div key={i} style={{ padding: "6px 0", color: "#e05648", font: "500 13px/1.5 var(--font-body)" }}>
                    [{d.clauseRef}] {d.issue} <span style={{ color: "var(--a-text-3, #667085)" }}>({d.statutoryBasis})</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ ...th, padding: "0 0 6px" }}>Checks</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 4 }}>
              {e.checks.map((c) => (
                <span key={c.id} style={{ font: "500 12px/1.5 var(--font-body)", color: c.status === "pass" ? "var(--a-text-2, #98a2b3)" : "#e05648" }}>
                  {c.status === "pass" ? "✓" : "✕"} {c.id}. {c.name}
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------- config publisher ------------------------- */
function ConfigView({ data, adminEmail }: { data: AdminData; adminEmail: string }) {
  const [open, setOpen] = useState<AdminConfigRow | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canPublish = note.trim().length >= 10 && ack;

  async function publish() {
    if (!open || !canPublish) return;
    setBusy(true);
    setError(null);
    try {
      const r = await publishConfigAction(open.id, note.trim());
      setResult(`Published. Uprating re-check ran: ${r.upratingFlagged} employee${r.upratingFlagged === 1 ? "" : "s"} flagged.`);
      setPublishing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head title="Config publisher" count={data.configs.length} sub="The only write path to statutory config. Publishing requires an audit note and runs the uprating re-check." />
      {result && <div style={{ ...chip("green"), marginBottom: 14, padding: "10px 14px" }}>{result} Reload to see updated statuses.</div>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={th}>Version</th><th style={th}>Status</th><th style={th}>Effective</th><th style={th}>Changes vs live</th><th style={th}>Audit note</th></tr></thead>
        <tbody>
          {data.configs.map((c) => (
            <tr key={c.id} onClick={() => { setOpen(open?.id === c.id ? null : c); setPublishing(false); setNote(""); setAck(false); }} style={{ cursor: "pointer", background: open?.id === c.id ? "rgba(255,255,255,0.04)" : "transparent" }}>
              <td style={td}><span style={strong}>{c.label}</span></td>
              <td style={td}><span style={chip(c.status === "live" ? "green" : c.status === "draft" ? "amber" : "grey")}>{c.status}</span></td>
              <td style={td} className="fe-tabular">{c.effectiveFrom}</td>
              <td style={td} className="fe-tabular">{c.status === "live" ? "—" : `${c.changedCount} parameter${c.changedCount === 1 ? "" : "s"}`}</td>
              <td style={{ ...td, maxWidth: 340 }}>{c.auditNote ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && (
        <div style={{ marginTop: 20, border: "1px solid var(--a-border, #26303f)", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
            <span style={{ font: "600 16px/1.2 var(--font-display)", color: "var(--a-text, #e6eaf0)" }}>Diff against live · {open.label}</span>
            {open.status !== "live" && !publishing && (
              <button onClick={() => setPublishing(true)} style={{ ...chip("red"), border: "1px solid rgba(224,86,72,0.4)", cursor: "pointer", padding: "9px 14px" }}>
                <AIcon name="publish" size={16} /> Publish version…
              </button>
            )}
          </div>
          <div>
            {open.diff.filter((d) => d.changed).map((d) => (
              <div key={d.path} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--a-border, #26303f)" }}>
                <span style={{ font: "500 13px/1.3 var(--font-body)", color: "var(--a-text-2, #98a2b3)" }}>{d.key}</span>
                <span className="fe-tabular" style={{ font: "600 13px/1 var(--font-body)" }}>
                  <span style={{ color: "#e05648" }}>{d.from}</span>
                  <span style={{ color: "var(--a-text-3, #667085)", margin: "0 6px" }}>→</span>
                  <span style={{ color: "var(--a-green, #34c486)" }}>{d.to}</span>
                </span>
              </div>
            ))}
            {open.status === "live" && <div style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--a-text-3, #667085)", padding: "8px 0" }}>This is the live version — diffs are shown against it.</div>}
            {open.status !== "live" && open.changedCount === 0 && <div style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--a-text-3, #667085)", padding: "8px 0" }}>No parameter changes against live.</div>}
          </div>

          {publishing && (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--a-border, #26303f)", paddingTop: 16 }}>
              <div style={{ ...th, padding: "0 0 8px" }}>Audit note — required</div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why is this being published now? Cite the HMRC bulletin or source of authority. Recorded permanently against your name."
                style={{ width: "100%", minHeight: 84, boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid var(--a-border, #26303f)", borderRadius: 8, color: "var(--a-text, #e6eaf0)", font: "400 13px/1.5 var(--font-body)", padding: "10px 12px" }} />
              <div style={{ font: "500 12px/1.4 var(--font-body)", color: note.trim().length >= 10 ? "var(--a-text-3, #667085)" : "#e0a83a", marginTop: 6 }}>
                {note.trim().length >= 10 ? `Recorded against ${adminEmail}` : "At least 10 characters. This note is the permanent audit record."}
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 12, cursor: "pointer", font: "400 13px/1.5 var(--font-body)", color: "var(--a-text-2, #98a2b3)" }}>
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, flex: "none" }} />
                I confirm these values match a verified source of authority and are safe to apply to all live accounts.
              </label>
              {error && <div style={{ color: "#e05648", font: "500 13px/1.4 var(--font-body)", marginTop: 10 }}>{error}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                <button onClick={() => setPublishing(false)} style={{ ...chip("grey"), border: "none", cursor: "pointer", padding: "10px 16px" }}>Cancel</button>
                <button disabled={!canPublish || busy} onClick={publish} style={{ ...chip("red"), border: "1px solid rgba(224,86,72,0.4)", cursor: canPublish ? "pointer" : "not-allowed", opacity: canPublish ? 1 : 0.5, padding: "10px 16px" }}>
                  <AIcon name="publish" size={16} /> {busy ? "Publishing…" : "Publish now"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ------------------------- monitor queue ------------------------- */
function MonitorView({ data }: { data: AdminData }) {
  const [form, setForm] = useState({ source: "", url: "", removed: "", added: "", note: "" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function log() {
    setBusyId("new");
    try {
      await addMonitorFinding({
        source: form.source,
        url: form.url || undefined,
        classification: "relevant",
        removed: form.removed || undefined,
        added: form.added || undefined,
        proposalKind: "config",
        proposalNote: form.note || undefined,
      });
      setMsg("Logged. Reload to see it in the queue.");
      setForm({ source: "", url: "", removed: "", added: "", note: "" });
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function resolve(m: AdminMonitorRow, resolution: "approved" | "dismissed") {
    setBusyId(m.id);
    try {
      const r = await resolveMonitorFinding(m.id, resolution);
      setMsg(resolution === "approved" ? (r.draftId ? "Approved — draft config version created (edit it in the publisher, then publish)." : "Approved.") : "Dismissed.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const inputStyle: React.CSSProperties = { background: "rgba(255,255,255,0.05)", border: "1px solid var(--a-border, #26303f)", borderRadius: 8, color: "var(--a-text, #e6eaf0)", font: "400 13px/1.4 var(--font-body)", padding: "9px 12px", width: "100%", boxSizing: "border-box" };

  return (
    <>
      <Head title="Monitor review queue" count={data.monitor.length} sub="Source changes pending human review. Manual entry for now (the Monitor agent is P1). Nothing auto-publishes." />
      {msg && <div style={{ ...chip("green"), marginBottom: 14, padding: "10px 14px" }}>{msg}</div>}

      <div style={{ border: "1px solid var(--a-border, #26303f)", borderRadius: 12, padding: 16, marginBottom: 22 }}>
        <div style={{ ...th, padding: "0 0 10px" }}>Log a source change</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input placeholder="Source (e.g. GOV.UK — NMW rates)" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} style={inputStyle} />
          <input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} style={inputStyle} />
          <input placeholder="Old wording (removed)" value={form.removed} onChange={(e) => setForm({ ...form, removed: e.target.value })} style={inputStyle} />
          <input placeholder="New wording (added)" value={form.added} onChange={(e) => setForm({ ...form, added: e.target.value })} style={inputStyle} />
        </div>
        <input placeholder="Proposal note (what should change in config?)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={{ ...inputStyle, marginTop: 10 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button disabled={!form.source || busyId === "new"} onClick={log} style={{ ...chip("green"), border: "1px solid rgba(52,196,134,0.4)", cursor: "pointer", padding: "10px 16px" }}>
            <AIcon name="add" size={16} /> Log finding
          </button>
        </div>
      </div>

      {data.monitor.map((m) => (
        <div key={m.id} style={{ border: "1px solid var(--a-border, #26303f)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={strong}>{m.source}</span>
            <span style={chip(m.state === "pending" ? "amber" : m.state === "approved" ? "green" : "grey")}>{m.state}</span>
            <span className="fe-tabular" style={{ marginLeft: "auto", font: "500 12px/1 var(--font-body)", color: "var(--a-text-3, #667085)" }}>{m.detectedLabel}</span>
          </div>
          {m.diff.map((d, i) => (
            <div key={i} style={{ font: "400 13px/1.5 var(--font-body)", color: d.type === "add" ? "var(--a-green, #34c486)" : "#e05648", padding: "2px 0" }}>
              {d.type === "add" ? "+ " : "− "}{d.text}
            </div>
          ))}
          {m.proposal.note && <div style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--a-text-2, #98a2b3)", marginTop: 8 }}>Proposal: {m.proposal.note}</div>}
          {m.state === "pending" && (
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button disabled={busyId === m.id} onClick={() => resolve(m, "approved")} style={{ ...chip("green"), border: "1px solid rgba(52,196,134,0.4)", cursor: "pointer", padding: "9px 14px" }}>Approve → create config draft</button>
              <button disabled={busyId === m.id} onClick={() => resolve(m, "dismissed")} style={{ ...chip("grey"), border: "1px solid var(--a-border, #26303f)", cursor: "pointer", padding: "9px 14px" }}>Dismiss</button>
            </div>
          )}
        </div>
      ))}
      {data.monitor.length === 0 && <div style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--a-text-3, #667085)" }}>Queue is empty. Log the first source change above.</div>}
    </>
  );
}

/* ------------------------- feedback ------------------------- */
function FeedbackView({ data }: { data: AdminData }) {
  const [flow, setFlow] = useState("all");
  const flows = ["all", "status", "setup", "contracts", "rtw", "dashboard"];
  const rows = data.feedback.filter((f) => flow === "all" || f.flow === flow);
  return (
    <>
      <Head title="Feedback" count={rows.length} sub="Flow-completion ratings from the in-app widget (FR-8.5)." />
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {flows.map((f) => (
          <button key={f} onClick={() => setFlow(f)} style={{ ...chip(flow === f ? "green" : "grey"), border: "none", cursor: "pointer" }}>{f}</button>
        ))}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={th}>Date</th><th style={th}>Flow</th><th style={th}>Rating</th><th style={th}>Business</th><th style={th}>Comment</th></tr></thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id}>
              <td style={td} className="fe-tabular">{f.dateLabel}</td>
              <td style={td}>{f.flow}</td>
              <td style={td}><span style={chip(f.rating >= 4 ? "green" : f.rating >= 3 ? "amber" : "red")}>{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span></td>
              <td style={td}>{f.business}</td>
              <td style={{ ...td, maxWidth: 420 }}>{f.comment ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div style={{ font: "400 13px/1.5 var(--font-body)", color: "var(--a-text-3, #667085)", marginTop: 10 }}>No feedback yet for this filter.</div>}
    </>
  );
}
