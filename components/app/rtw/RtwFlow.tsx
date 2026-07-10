"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, DateInput, DeadlineChip, DocumentCard, Icon, StatutoryReceipt, StatusPill, TextInput } from "@/components/system";
import { recordRtwCheck, type RecordRtwInput, type RecordRtwResult } from "@/app/(app)/app/right-to-work/actions";
import type { RtwWorkerOverview } from "@/lib/data/rtw";
import type { RtwRoute } from "@/lib/rules/rtw";

export interface RtwFlowProps {
  workers: RtwWorkerOverview[];
  checkerName: string;
  todayIso: string;
  penalties: { first: string; repeat: string };
}

type View = "home" | "route" | "guidance" | "sharecode" | "manual" | "record" | "done" | "worker";

const scroll: React.CSSProperties = { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" };
const wrap: React.CSSProperties = { maxWidth: 680, margin: "0 auto", width: "100%", boxSizing: "border-box" };

/* Downscale a captured photo to a small JPEG data URL so evidence rides in the
   server action without hitting body-size limits (and is lighter to store). */
async function downscale(file: File, max = 1600, quality = 0.8): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function TopBar({ eyebrow, onBack, right }: { eyebrow: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 6, padding: "10px 12px 10px 8px", background: "rgba(247,244,238,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-hairline)" }}>
      {onBack ? (
        <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "none", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--ink-900)", flex: "none" }}>
          <Icon name="arrow_back" size={24} />
        </button>
      ) : <span style={{ width: 8 }} />}
      <span style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)" }}>{eyebrow}</span>
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

function Avatar({ initials, size = 46 }: { initials: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 999, flex: "none", background: "var(--ink-900)", color: "var(--bone-50)", display: "grid", placeItems: "center", font: `600 ${Math.round(size * 0.36)}px/1 var(--font-body)` }}>{initials}</div>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 14, ...style }}>{children}</div>;
}

function StepHeader({ label, title, lede }: { label: string; title: string; lede: string }) {
  return (
    <header style={{ margin: "18px 0 22px" }}>
      <div style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)", marginBottom: 10 }}>{label}</div>
      <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>{title}</h1>
      <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "10px 0 0" }}>{lede}</p>
    </header>
  );
}

/* Annotated GOV.UK browser frame. */
function WalkFrame({ n, title, browserUrl, children, note }: { n: string; title: string; browserUrl: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 999, background: "var(--ink-900)", color: "var(--bone-50)", display: "grid", placeItems: "center", font: "600 13px/1 var(--font-body)", flex: "none" }}>{n}</span>
        <h3 style={{ font: "600 17px/1.3 var(--font-body)", margin: 0, color: "var(--ink-900)" }}>{title}</h3>
      </div>
      <div style={{ border: "1px solid var(--border-hairline)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-card)", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--neutral-100)", borderBottom: "1px solid var(--border-hairline)" }}>
          <Icon name="lock" size={13} style={{ color: "var(--neutral-500)" }} />
          <span className="fe-tabular" style={{ font: "500 13px/1 var(--font-body)", color: "var(--neutral-500)" }}>{browserUrl}</span>
        </div>
        <div style={{ padding: "14px 16px" }}>{children}</div>
      </div>
      {note}
    </div>
  );
}

function GovButton({ children }: { children: React.ReactNode }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#00703c", color: "#fff", font: "600 15px/1 var(--font-body)", padding: "10px 14px", borderRadius: 3 }}>{children}</span>;
}
function GovField({ label }: { label: string }) {
  return (
    <div>
      <div style={{ font: "600 14px/1.3 var(--font-body)", color: "#0b0c0c", marginBottom: 6 }}>{label}</div>
      <div style={{ height: 40, border: "2px solid #0b0c0c", borderRadius: 0, background: "#fff", maxWidth: 220 }} />
    </div>
  );
}

/* Faux GOV.UK / passport previews (illustrative guidance in the walkthrough). */
function GovResultPreview({ name, fullName, expiryLabel, checkedLabel }: { name: string; fullName: string; expiryLabel: string | null; checkedLabel: string }) {
  return (
    <div style={{ background: "#fff", padding: "16px 16px 18px" }}>
      <div style={{ height: 5, background: "#00703c", width: 44, marginBottom: 12 }} />
      <div style={{ font: "600 15px/1.3 var(--font-body)", color: "#0b0c0c", marginBottom: 3 }}>Right to work check</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#00703c", color: "#fff", font: "700 12px/1 var(--font-body)", padding: "6px 9px", borderRadius: 2, textTransform: "uppercase", letterSpacing: "0.03em", margin: "4px 0 12px" }}>
        <Icon name="check" size={15} />{name} can work in the UK
      </div>
      <div className="fe-tabular" style={{ font: "400 13px/1.55 var(--font-body)", color: "#0b0c0c" }}>
        <div><strong style={{ fontWeight: 600 }}>{fullName}</strong></div>
        <div style={{ color: "#505a5f" }}>Date checked: {checkedLabel}</div>
        {expiryLabel ? <div style={{ color: "#505a5f" }}>Permission until: {expiryLabel}</div> : <div style={{ color: "#505a5f" }}>No time limit on this person&apos;s stay</div>}
        <div style={{ color: "#505a5f" }}>Can do the work in question: Yes</div>
      </div>
    </div>
  );
}

/* Camera-first evidence capture (real file input with capture attribute). */
function CameraEvidence({ dataUrl, onCapture, onRetake, hint }: { dataUrl: string | null; onCapture: (url: string) => void; onRetake: () => void; hint?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onCapture(await downscale(file));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: "none" }} />
      {!dataUrl ? (
        <button type="button" className="fe-upload" onClick={() => inputRef.current?.click()} style={{ minHeight: 168 }} disabled={busy}>
          <Icon name="photo_camera" size={40} style={{ color: "var(--ink-900)" }} />
          <span style={{ font: "var(--text-body)", fontWeight: 600, color: "var(--ink-900)" }}>{busy ? "Processing…" : hint || "Take a photo now"}</span>
          <span style={{ font: "var(--text-caption)", color: "var(--text-secondary)" }}>Uses your camera · nothing leaves your phone until you save</span>
        </button>
      ) : (
        <div style={{ border: "1px solid var(--verified-green-600)", borderRadius: 12, overflow: "hidden", background: "var(--surface-raised)", boxShadow: "var(--shadow-card)" }}>
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="Captured right to work evidence" style={{ display: "block", width: "100%" }} />
            <span style={{ position: "absolute", top: 10, right: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "var(--verified-green-600)", color: "#fff", font: "600 13px/1 var(--font-body)", padding: "7px 11px", borderRadius: 999 }}>
              <Icon name="check" size={16} />Captured
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "12px 14px", borderTop: "1px solid var(--border-hairline)" }}>
            <button type="button" onClick={onRetake} style={{ border: "none", background: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, font: "600 14px/1 var(--font-body)", color: "var(--ink-900)" }}>
              <Icon name="photo_camera" size={17} />Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmChecklist({ items, checked, onToggle }: { items: { title: string; desc?: string }[]; checked: number[]; onToggle: (i: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it, i) => {
        const on = checked.includes(i);
        return (
          <button key={i} type="button" role="checkbox" aria-checked={on} onClick={() => onToggle(i)} style={{ display: "flex", alignItems: "flex-start", gap: 13, width: "100%", textAlign: "left", background: on ? "var(--verified-green-50)" : "var(--surface-raised)", border: "1px solid " + (on ? "var(--verified-green-600)" : "var(--border-hairline)"), borderRadius: 12, padding: "15px 16px", cursor: "pointer", boxSizing: "border-box" }}>
            <span style={{ width: 26, height: 26, borderRadius: 999, flex: "none", marginTop: 1, border: on ? "none" : "2px solid var(--neutral-200)", background: on ? "var(--verified-green-600)" : "transparent", display: "grid", placeItems: "center" }}>
              {on && <Icon name="check" size={16} style={{ color: "#fff" }} />}
            </span>
            <span>
              <span style={{ font: "600 17px/1.35 var(--font-body)", color: "var(--ink-900)", display: "block" }}>{it.title}</span>
              {it.desc && <span style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-500)", display: "block", marginTop: 2 }}>{it.desc}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* "What the result must show" + capture gate. */
function ResultGate({ worker, items, checked, setChecked, evidence, setEvidence, preview, onContinue }: {
  worker: RtwWorkerOverview; items: { title: string; desc?: string }[]; checked: number[]; setChecked: (f: (c: number[]) => number[]) => void;
  evidence: string | null; setEvidence: (v: string | null) => void; preview: React.ReactNode; onContinue: () => void;
}) {
  const ready = checked.length === items.length && !!evidence;
  return (
    <>
      <Label style={{ marginTop: 34 }}>What the result must show</Label>
      <p style={{ font: "var(--text-body)", color: "var(--neutral-700)", margin: "-4px 0 16px" }}>With {worker.name} in front of you, check each one. Tick it only if it&apos;s true.</p>
      <ConfirmChecklist items={items} checked={checked} onToggle={(i) => setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]))} />
      <div style={{ margin: "16px 0 6px", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Icon name="info" size={18} style={{ color: "var(--neutral-400)", marginTop: 2, flex: "none" }} />
        <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-500)", margin: 0 }}>
          If any one of these isn&apos;t true, stop and don&apos;t let {worker.name} start.{" "}
          <StatutoryReceipt reference="IANA 2006 s.15" plainEnglish="You only get a legal defence if you did the check correctly. A photo that doesn't match, or permission that doesn't cover the job, means the check hasn't passed." guidanceUrl="https://www.gov.uk/check-job-applicant-right-to-work" />
        </p>
      </div>
      <Label style={{ marginTop: 30 }}>Photograph the evidence</Label>
      <p style={{ font: "var(--text-body)", color: "var(--neutral-700)", margin: "-4px 0 12px" }}>Take a clear photo now. This is the proof that keeps your legal defence.</p>
      {preview && <div style={{ marginBottom: 12, opacity: 0.9 }}>{preview}</div>}
      <CameraEvidence dataUrl={evidence} onCapture={setEvidence} onRetake={() => setEvidence(null)} hint="Take a photo of the result" />
      <div style={{ marginTop: 26 }}>
        <Button variant="primary" disabled={!ready} style={{ width: "100%" }} onClick={onContinue}>Save the check record</Button>
        {!ready && <p style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--neutral-500)", margin: "12px 0 0", textAlign: "center" }}>{checked.length < items.length ? "Tick everything you've checked" : "Add the photo"} to carry on.</p>}
      </div>
    </>
  );
}

export function RtwFlow({ workers, checkerName, todayIso, penalties }: RtwFlowProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [activeId, setActiveId] = useState<string | null>(workers[0]?.employeeId ?? null);
  const [route, setRoute] = useState<RtwRoute>("manual");
  const [whatChecked, setWhatChecked] = useState("");
  const [isRecheck, setIsRecheck] = useState(false);
  const [evidence, setEvidence] = useState<string | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [resultChoice, setResultChoice] = useState<"continuous" | "time_limited">("continuous");
  const [expiry, setExpiry] = useState("");
  const [checker, setChecker] = useState(checkerName);
  const [done, setDone] = useState<RecordRtwResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const worker = workers.find((w) => w.employeeId === activeId) ?? workers[0];

  function startCheck(id: string, recheck = false, supersedes = false) {
    setActiveId(id);
    setIsRecheck(recheck);
    setEvidence(null);
    setChecked([]);
    setResultChoice("continuous");
    setExpiry("");
    setChecker(checkerName);
    void supersedes;
    setView("route");
  }

  function pickRoute(r: RtwRoute | "guidance") {
    if (r === "guidance") { setView("guidance"); return; }
    setRoute(r);
    setWhatChecked(r === "manual" ? "British passport (original, in person)" : "Online check (share code) on GOV.UK");
    setView(r === "manual" ? "manual" : "sharecode");
  }

  async function create() {
    if (!worker) return;
    setSaving(true);
    setError(null);
    try {
      const input: RecordRtwInput = {
        employeeId: worker.employeeId,
        route,
        whatChecked,
        checkedBy: checker,
        checkedDate: todayIso,
        result: resultChoice,
        expiryDate: resultChoice === "time_limited" ? expiry : undefined,
        evidenceDataUrl: evidence ?? undefined,
        isRecheck,
        supersedesId: isRecheck ? worker.recordId ?? undefined : undefined,
      };
      const res = await recordRtwCheck(input);
      setDone(res);
      setView("done");
    } catch (e) {
      setError((e as Error).message || "Something went wrong. Nothing was lost — try again.");
    } finally {
      setSaving(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>{children}</div>
  );

  /* -------- HOME -------- */
  if (view === "home") {
    return shell(
      <div style={scroll}>
        <div style={{ padding: "0 20px 34px" }}>
          <div style={wrap}>
            <header style={{ margin: "26px 0 20px" }}>
              <Label style={{ marginBottom: 10 }}>Right to work</Label>
              <h1 style={{ font: "var(--text-h1)", letterSpacing: "var(--tracking-h)", margin: 0 }}>Who can work for you</h1>
              <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "10px 0 0" }}>
                Before anyone starts, you must check they can work in the UK — and keep the proof. We do the check with you, in a few minutes.
              </p>
            </header>

            {workers.filter((w) => w.followUpDue).map((w) => (
              <div key={w.employeeId} style={{ marginBottom: 22 }}>
                <Alert kind="warning" title={`${w.name}'s permission to work expires ${new Date(w.followUpDue! + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`}
                  action={<Button variant="secondary" onClick={() => { setActiveId(w.employeeId); setView("worker"); }}>Start follow-up check</Button>}>
                  You need a follow-up check before that date to keep your legal defence. We remind you 90, 30 and 7 days before — and it&apos;s on your dashboard.
                </Alert>
              </div>
            ))}

            <Label>Your people</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 26 }}>
              {workers.map((w) => (
                <button key={w.employeeId} type="button" onClick={() => (w.recordId ? (setActiveId(w.employeeId), setView("worker")) : startCheck(w.employeeId))}
                  style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "16px 16px", cursor: "pointer", boxSizing: "border-box" }}>
                  <Avatar initials={w.initials} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ font: "600 17px/1.2 var(--font-body)", color: "var(--ink-900)" }}>{w.fullName}</span>
                      <StatusPill status={w.status} />
                    </div>
                    {w.followUpDue && <div style={{ marginBottom: 6 }}><DeadlineChip dueDate={w.followUpDue}>Follow-up due</DeadlineChip></div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, font: "var(--text-caption)", fontSize: 14, color: "var(--neutral-500)" }}>
                      {w.status === "complete" && <Icon name="check" size={15} style={{ color: "var(--verified-green-700)" }} />}
                      {w.detail}
                    </div>
                  </div>
                  <Icon name="chevron_right" size={22} style={{ color: "var(--neutral-400)", flex: "none" }} />
                </button>
              ))}
            </div>

            <div style={{ background: "var(--ink-900)", borderRadius: "var(--radius-card)", padding: "22px 20px", marginBottom: 24, boxShadow: "var(--shadow-card)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--verified-green-600)", marginBottom: 10 }}>
                <Icon name="how_to_reg" size={20} fill />
                <span style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.08em" }}>New check</span>
              </div>
              <h2 style={{ font: "var(--text-h3)", letterSpacing: "var(--tracking-h)", color: "var(--bone-50)", margin: "0 0 6px" }}>Someone new starting?</h2>
              <p style={{ font: "var(--text-body)", color: "rgba(247,244,238,0.82)", margin: "0 0 16px" }}>Do the check with the person in front of you. We&apos;ll ask what document they&apos;re showing and take it from there.</p>
              <Button variant="primary" style={{ width: "100%" }} onClick={() => worker && startCheck(worker.employeeId)}>Start a right to work check</Button>
            </div>

            <PenaltyPanel penalties={penalties} />
          </div>
        </div>
      </div>,
    );
  }

  if (!worker) return shell(<div style={{ padding: 24 }}>No employees yet.</div>);

  /* -------- ROUTE SELECT -------- */
  if (view === "route") {
    return shell(<>
      <TopBar eyebrow={isRecheck ? "Follow-up check" : "Right to work check"} onBack={() => setView(isRecheck ? "worker" : "home")} />
      <div style={scroll}><div style={{ padding: "0 20px 40px" }}><div style={wrap}>
        <header style={{ margin: "18px 0 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Avatar initials={worker.initials} size={44} />
            <div><div style={{ font: "600 15px/1.2 var(--font-body)", color: "var(--ink-900)" }}>{worker.fullName}</div></div>
          </div>
          <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>What is {worker.name} showing you?</h1>
          <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "10px 0 0" }}>Ask to see one document. Pick what they have in front of you now.</p>
        </header>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
          <RouteCard icon="book_2" title="A British or Irish passport" desc="Or an Irish passport card. You check the document by hand." meta="Manual check · about 3 minutes" onClick={() => pickRoute("manual")} />
          <RouteCard icon="badge" title="A share code, eVisa or biometric permit" desc="You check their status online, on the free GOV.UK service." meta="Online check · about 4 minutes" onClick={() => pickRoute("share_code")} />
          <RouteCard icon="help" title="Something else, or not sure" desc="A visa sticker, an old document, or you can't tell. We'll guide you." onClick={() => pickRoute("guidance")} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Icon name="info" size={18} style={{ color: "var(--neutral-400)", marginTop: 2, flex: "none" }} />
          <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-500)", margin: 0 }}>
            You must never single anyone out. Every worker gets the same check — that&apos;s the law too.{" "}
            <StatutoryReceipt reference="Equality Act 2010" plainEnglish="You must check everyone the same way, whatever they look like or where they're from. Treating people differently can be discrimination." guidanceUrl="https://www.gov.uk/government/publications/right-to-work-checks-employers-guide" />
          </p>
        </div>
      </div></div></div>
    </>);
  }

  /* -------- GUIDANCE -------- */
  if (view === "guidance") {
    return shell(<>
      <TopBar eyebrow="Right to work check" onBack={() => setView("route")} />
      <div style={scroll}><div style={{ padding: "0 20px 40px" }}><div style={wrap}>
        <StepHeader label="" title="Let's find the right way to check" lede="Most people can be checked online, even without a passport. Here's what to do." />
        <div style={{ marginBottom: 20 }}>
          <Alert kind="info" title="Almost everyone has a share code">If {worker.name} was born outside the UK and Ireland, they can get a free share code at gov.uk/prove-right-to-work. It&apos;s the safest way — ask them to bring one.</Alert>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {[
            { icon: "smartphone", t: "Ask for a share code", s: `${worker.name} gets it in minutes on GOV.UK and reads it to you. Then check it online.` },
            { icon: "hourglass_top", t: "Waiting on the Home Office?", s: "If their application is still being decided, we can request a check from the Home Office for you." },
            { icon: "support_agent", t: "Still stuck?", s: `Ask our assistant, or don't let ${worker.name} start until the check is done. Starting first is the risk.` },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "16px 18px" }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}><Icon name={p.icon} size={21} style={{ color: "var(--ink-900)" }} /></div>
              <div><div style={{ font: "600 17px/1.3 var(--font-body)", color: "var(--ink-900)" }}>{p.t}</div><div style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-500)", marginTop: 2 }}>{p.s}</div></div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button variant="primary" style={{ width: "100%" }} onClick={() => pickRoute("share_code")}>{worker.name} has a share code</Button>
          <Button variant="tertiary" style={{ width: "100%" }} onClick={() => setView("route")}>Go back</Button>
        </div>
      </div></div></div>
    </>);
  }

  const todayLabel = new Date(todayIso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  /* -------- SHARE-CODE WALK -------- */
  if (view === "sharecode") {
    const items = [
      { title: "The photo matches the person in front of you", desc: `Look up from the screen at ${worker.name}. Same face.` },
      { title: "The name matches", desc: `The name on screen is ${worker.fullName}.` },
      { title: "The work permission covers this job", desc: "It doesn't limit the hours or type of work below what you need." },
    ];
    const preview = <GovResultPreview name={worker.name} fullName={worker.fullName} expiryLabel={null} checkedLabel={todayLabel} />;
    return shell(<>
      <TopBar eyebrow={isRecheck ? "Follow-up check" : "Online check"} onBack={() => setView("route")} />
      <div style={scroll}><div style={{ padding: "0 20px 40px" }}><div style={wrap}>
        <StepHeader label="Online right to work check" title={`Check ${worker.name} on GOV.UK`} lede={`You'll need the share code ${worker.name} gives you, and their date of birth. The service is free. We'll walk you through it.`} />
        <div style={{ marginBottom: 22 }}>
          <StatutoryReceipt reference="RTW Scheme 2022" plainEnglish="For anyone with an eVisa or biometric permit, the online check is the only way to get a legal defence. A photocopy of the card is not enough." guidanceUrl="https://www.gov.uk/view-right-to-work" />
        </div>
        <Label>The GOV.UK walkthrough</Label>
        <WalkFrame n="1" title={`Ask ${worker.name} for the share code`} browserUrl="gov.uk/prove-right-to-work">
          <div style={{ font: "600 16px/1.35 var(--font-body)", color: "#0b0c0c", marginBottom: 6 }}>Share codes start with a W</div>
          <div style={{ font: "400 15px/1.5 var(--font-body)", color: "#505a5f" }}>It looks like <span className="fe-tabular" style={{ fontWeight: 600, color: "#0b0c0c" }}>W7A 2LP 4RD</span>. They get it free at gov.uk/prove-right-to-work.</div>
        </WalkFrame>
        <WalkFrame n="2" title="Open the free checking service" browserUrl="gov.uk/view-right-to-work">
          <div style={{ font: "600 17px/1.3 var(--font-body)", color: "#0b0c0c", marginBottom: 4 }}>View a job applicant&apos;s right to work details</div>
          <div style={{ font: "400 15px/1.5 var(--font-body)", color: "#505a5f", marginBottom: 14 }}>Use this service to check someone can work for you.</div>
          <GovButton>Start now <Icon name="chevron_right" size={18} /></GovButton>
        </WalkFrame>
        <WalkFrame n="3" title="Enter the code and date of birth" browserUrl="gov.uk/view-right-to-work/enter-code">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}><GovField label="Share code" /><GovField label="Date of birth" /><GovButton>Continue</GovButton></div>
        </WalkFrame>
        <WalkFrame n="4" title="Read the result carefully" browserUrl="gov.uk/view-right-to-work/result"
          note={<div style={{ marginTop: 14 }}><Alert kind="info" title="If it shows a date, it's time-limited">If the result gives a &quot;permission until&quot; date, {worker.name} can work now but you must check again before then. We set the reminder up for you.</Alert></div>}>
          {preview}
        </WalkFrame>
        <ResultGate worker={worker} items={items} checked={checked} setChecked={setChecked} evidence={evidence} setEvidence={setEvidence} preview={preview} onContinue={() => setView("record")} />
      </div></div></div>
    </>);
  }

  /* -------- MANUAL WALK -------- */
  if (view === "manual") {
    const items = [
      { title: "The photo matches the person in front of you", desc: `Compare the passport photo to ${worker.name}'s face.` },
      { title: "The dates are still valid", desc: "The passport hasn't expired." },
      { title: "The document isn't damaged or altered", desc: "Photo, dates and name haven't been tampered with." },
      { title: "The date of birth is the same across the document", desc: "It matches on the photo page and anywhere else it appears." },
    ];
    const steps = [
      { icon: "pan_tool", t: "Take the original in your hands", s: "Not a photocopy and not a photo on a phone — the actual passport." },
      { icon: "face", t: `Look at the photo, then at ${worker.name}`, s: "Make sure it's clearly the same person standing with you." },
      { icon: "event", t: "Check it hasn't expired", s: "A British or Irish passport gives a permanent right to work even if expired — but check the person is who it says." },
    ];
    return shell(<>
      <TopBar eyebrow="Manual check" onBack={() => setView("route")} />
      <div style={scroll}><div style={{ padding: "0 20px 40px" }}><div style={wrap}>
        <StepHeader label="Manual document check" title={`Check ${worker.name}'s passport`} lede={`A British or Irish passport is all you need — it proves a permanent right to work. Do this with ${worker.name} and the original document in front of you.`} />
        <div style={{ marginBottom: 22 }}>
          <StatutoryReceipt reference="IANA 2006 s.15" plainEnglish="Checking an original British or Irish passport, with the person present, gives you a legal defence. You must see the real document, not a copy." guidanceUrl="https://www.gov.uk/check-job-applicant-right-to-work" />
        </div>
        <Label>How to check it</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {steps.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "16px 18px" }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}><Icon name={p.icon} size={21} style={{ color: "var(--ink-900)" }} /></div>
              <div><div style={{ font: "600 17px/1.3 var(--font-body)", color: "var(--ink-900)" }}>{p.t}</div><div style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-500)", marginTop: 2 }}>{p.s}</div></div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 6 }}><Alert kind="info" title="An Irish passport counts too">British and Irish citizens have a permanent right to work. If it&apos;s any other passport, go back and use the online check instead.</Alert></div>
        <ResultGate worker={worker} items={items} checked={checked} setChecked={setChecked} evidence={evidence} setEvidence={setEvidence} preview={null} onContinue={() => setView("record")} />
      </div></div></div>
    </>);
  }

  /* -------- RECORD FORM -------- */
  if (view === "record") {
    return shell(<>
      <TopBar eyebrow={isRecheck ? "Follow-up record" : "Check record"} onBack={() => setView(route === "manual" ? "manual" : "sharecode")} />
      <div style={scroll}><div style={{ padding: "0 20px 40px" }}><div style={wrap}>
        <StepHeader label="Almost done" title="Save the check record" lede="This is what the law asks you to keep. We've filled in most of it — just check it's right." />
        <Label>The check</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 8 }}>
          <TextInput label="Who did the check" value={checker} onChange={(e) => setChecker(e.target.value)} hint="This is you — the person who saw the document." />
          <div>
            <span className="fe-label">Who was checked</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--neutral-100)", borderRadius: 10, padding: "12px 14px" }}>
              <Avatar initials={worker.initials} size={38} />
              <div style={{ font: "600 16px/1.2 var(--font-body)", color: "var(--ink-900)" }}>{worker.fullName}</div>
            </div>
          </div>
          <div>
            <span className="fe-label">What was checked</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--neutral-100)", borderRadius: 10, padding: "13px 14px", font: "500 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>
              <Icon name={route === "manual" ? "book_2" : "badge"} size={20} style={{ color: "var(--neutral-500)", flex: "none" }} />
              {whatChecked}
            </div>
          </div>
          <DateInput label="Date of the check" value={todayIso} readOnly hint={`Today — ${todayLabel}.`} />
        </div>
        <Label style={{ marginTop: 28 }}>The result</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { v: "continuous" as const, title: "Passed — no time limit", desc: `${worker.name} has a permanent right to work. No follow-up needed.` },
            { v: "time_limited" as const, title: "Passed — time-limited", desc: `${worker.name} can work until a set date. A follow-up check is due before then.` },
          ].map((o) => {
            const on = resultChoice === o.v;
            return (
              <button key={o.v} type="button" role="radio" aria-checked={on} onClick={() => setResultChoice(o.v)} className="fe-radio-card" style={on ? { border: "2px solid var(--ink-900)", padding: "13px 17px" } : undefined}>
                <span className="fe-radio-dot" aria-hidden="true" />
                <span><span style={{ fontWeight: 600, display: "block" }}>{o.title}</span><span style={{ font: "var(--text-caption)", fontSize: 15, color: "var(--text-secondary)", display: "block", marginTop: 2 }}>{o.desc}</span></span>
              </button>
            );
          })}
        </div>
        {resultChoice === "time_limited" && (
          <div style={{ marginTop: 16, animation: "fe-view-in 200ms var(--ease)" }}>
            <DateInput label="Follow-up check due by" value={expiry} onChange={(e) => setExpiry(e.target.value)} hint="From the result page. We'll remind you 90, 30 and 7 days before." />
          </div>
        )}
        <Label style={{ marginTop: 28 }}>Evidence attached</Label>
        <CameraEvidence dataUrl={evidence} onCapture={setEvidence} onRetake={() => setEvidence(null)} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "20px 0 24px" }}>
          <Icon name="lock" size={18} style={{ color: "var(--neutral-400)", marginTop: 2, flex: "none" }} />
          <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-500)", margin: 0 }}>
            We store this securely in the UK for as long as the law needs it, plus two years after {worker.name} leaves.{" "}
            <StatutoryReceipt reference="Immigration Act 2016" plainEnglish="Keeping a dated record of a correct check is what gives you a statutory excuse — your legal defence against a fine." guidanceUrl="https://www.gov.uk/check-job-applicant-right-to-work" />
          </p>
        </div>
        {error && <div style={{ marginBottom: 16 }}><Alert kind="warning" title="Couldn't save just now">{error}</Alert></div>}
        <Button variant="primary" style={{ width: "100%" }} disabled={saving || (resultChoice === "time_limited" && !expiry)} onClick={create}>
          {saving ? "Saving…" : "Create the record"}
        </Button>
      </div></div></div>
    </>);
  }

  /* -------- DONE -------- */
  if (view === "done" && done) {
    const timeLimited = done.result === "follow_up_required";
    return shell(
      <div style={scroll}><div style={{ padding: "0 20px 40px" }}><div style={{ ...wrap, maxWidth: 620 }}>
        <header style={{ margin: "30px 0 8px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: 999, background: "var(--verified-green-50)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Icon name="check" size={30} style={{ color: "var(--verified-green-700)" }} />
          </div>
          <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>{worker.name}&apos;s check is done</h1>
          <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "10px 0 0" }}>{done.isRecheck ? "Your follow-up record is saved." : `Your record is saved. You can let ${worker.name} start.`}</p>
        </header>
        <div style={{ margin: "30px 0 20px" }}>
          <DocumentCard title="Right to Work Check Record" verified sealProps={{ timestamp: `${done.checkedDateLabel}`, hash: done.reference }} meta={`Statutory excuse · ${worker.fullName} · checked ${done.checkedDateLabel}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["Who checked", done.checkedBy], ["What was checked", done.whatChecked], ["Result", done.resultLabel], ["Evidence", `${done.evidenceCount} photo${done.evidenceCount === 1 ? "" : "s"} attached`]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, font: "var(--text-body)", fontSize: 15 }}>
                  <span style={{ color: "var(--neutral-500)", flex: "none" }}>{k}</span>
                  <span className="fe-tabular" style={{ color: "var(--ink-900)", fontWeight: 500, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>
          </DocumentCard>
        </div>
        <div style={{ marginBottom: 18 }}>
          <Alert kind="success" title="This record is your legal defence">Keep it and you have a statutory excuse — a complete defence if anyone ever questions {worker.name}&apos;s right to work.</Alert>
        </div>
        {timeLimited && done.followUpDue && (
          <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "18px 18px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <span style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>Follow-up check</span>
              <DeadlineChip dueDate={expiry}>Due {done.followUpDue}</DeadlineChip>
            </div>
            <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)", margin: 0, display: "flex", gap: 8 }}>
              <Icon name="notifications" size={18} style={{ color: "var(--neutral-500)", flex: "none", marginTop: 1 }} />
              This is now on your dashboard. We&apos;ll remind you 90, 30 and 7 days before — you&apos;ll redo the same check when the time comes.
            </p>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "var(--neutral-100)", borderRadius: 12, marginBottom: 24, font: "500 15px/1.4 var(--font-body)", color: "var(--neutral-700)" }}>
          <Icon name="inventory_2" size={20} style={{ color: "var(--neutral-500)", flex: "none" }} />
          Saved to your document vault, encrypted in the UK.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button variant="primary" style={{ width: "100%" }} onClick={() => router.refresh()}>Back to right to work</Button>
        </div>
      </div></div></div>,
    );
  }

  /* -------- WORKER DETAIL -------- */
  if (view === "worker") {
    return shell(<>
      <TopBar eyebrow="Right to work" onBack={() => setView("home")} right={worker.followUpDue ? <DeadlineChip dueDate={worker.followUpDue}>Due</DeadlineChip> : undefined} />
      <div style={scroll}><div style={{ padding: "0 20px 40px" }}><div style={{ ...wrap, maxWidth: 620 }}>
        <header style={{ margin: "18px 0 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar initials={worker.initials} size={54} />
          <div><h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0 }}>{worker.fullName}</h1></div>
        </header>
        {worker.followUpDue && (
          <div style={{ marginBottom: 22 }}>
            <Alert kind="warning" title={`${worker.name}'s permission expires ${new Date(worker.followUpDue + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`}>
              {worker.name} can work now. To keep your legal defence you must do a follow-up check before that date. It&apos;s the same quick check you did before.
            </Alert>
          </div>
        )}
        <Label>Your current record</Label>
        <div style={{ marginBottom: 24 }}>
          <DocumentCard title="Right to Work Check Record" verified sealProps={{ timestamp: worker.checkedAt ? new Date(worker.checkedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "", hash: worker.recordId ? worker.recordId.slice(0, 4).toUpperCase() : "" }}
            meta={`Statutory excuse · ${worker.fullName}`}>
            <div style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)" }}>{worker.detail}</div>
          </DocumentCard>
        </div>
        <div style={{ background: "var(--ink-900)", borderRadius: "var(--radius-card)", padding: "20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--verified-green-600)", marginBottom: 8 }}>
            <Icon name="autorenew" size={19} fill />
            <span style={{ font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Follow-up check</span>
          </div>
          <p style={{ font: "var(--text-body)", color: "rgba(247,244,238,0.82)", margin: "0 0 16px" }}>You&apos;ll redo the check and save a fresh record. Takes a few minutes with {worker.name} present.</p>
          <Button variant="primary" style={{ width: "100%" }} onClick={() => startCheck(worker.employeeId, true, true)}>Start {worker.name}&apos;s follow-up check</Button>
        </div>
      </div></div></div>
    </>);
  }

  return shell(<div style={{ padding: 24 }} />);
}

/* ---- route decision card ---- */
function RouteCard({ icon, title, desc, meta, onClick }: { icon: string; title: string; desc: string; meta?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "left", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "20px 18px", cursor: "pointer", boxSizing: "border-box" }}>
      <div style={{ width: 54, height: 54, borderRadius: 14, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}><Icon name={icon} size={28} style={{ color: "var(--ink-900)" }} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "600 18px/1.3 var(--font-body)", color: "var(--ink-900)" }}>{title}</div>
        <div style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-500)", marginTop: 3 }}>{desc}</div>
        {meta && <div style={{ font: "500 13px/1 var(--font-body)", color: "var(--neutral-400)", marginTop: 8 }}>{meta}</div>}
      </div>
      <Icon name="chevron_right" size={24} style={{ color: "var(--neutral-400)", flex: "none" }} />
    </button>
  );
}

/* ---- collapsible penalty context (config-sourced figures) ---- */
function PenaltyPanel({ penalties }: { penalties: { first: string; repeat: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", background: "var(--surface-raised)", overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "16px 18px" }}>
        <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--neutral-100)", display: "grid", placeItems: "center", flex: "none" }}><Icon name="gavel" size={20} style={{ color: "var(--neutral-700)" }} /></div>
        <span style={{ flex: 1 }}>
          <span style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--ink-900)", display: "block" }}>Why this matters</span>
          <span style={{ font: "var(--text-caption)", fontSize: 14, color: "var(--neutral-500)" }}>The penalty for getting it wrong</span>
        </span>
        <Icon name={open ? "expand_less" : "expand_more"} size={24} style={{ color: "var(--neutral-400)", flex: "none" }} />
      </button>
      {open && (
        <div style={{ padding: "0 18px 20px", animation: "fe-view-in 200ms var(--ease)" }}>
          <p style={{ font: "var(--text-body)", color: "var(--neutral-700)", margin: "0 0 14px" }}>If you employ someone who cannot legally work here and you did not check properly, you can be fined:</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {[[penalties.first, "per worker, first breach"], [penalties.repeat, "per worker, repeat breach"]].map(([n, l]) => (
              <div key={l} className="fe-tabular" style={{ flex: 1, background: "var(--neutral-100)", borderRadius: 12, padding: "14px 14px" }}>
                <div style={{ font: "700 24px/1 var(--font-display)", color: "var(--ink-900)", letterSpacing: "-0.01em" }}>{n}</div>
                <div style={{ font: "var(--text-caption)", fontSize: 13, color: "var(--neutral-500)", marginTop: 6 }}>{l}</div>
              </div>
            ))}
          </div>
          <p style={{ font: "var(--text-body)", fontSize: 15, color: "var(--neutral-700)", margin: "0 0 12px" }}>
            A correct check gives you a <strong>statutory excuse</strong> — a complete legal defence, even if it later turns out the person was not allowed to work. That is what this module builds for you.
          </p>
          <StatutoryReceipt reference="Immigration Act 2016 s.35" plainEnglish="It is a criminal offence to employ someone you know, or had reasonable cause to believe, cannot work in the UK. Doing the check properly protects you." guidanceUrl="https://www.gov.uk/penalties-for-employing-illegal-workers" />
        </div>
      )}
    </div>
  );
}
