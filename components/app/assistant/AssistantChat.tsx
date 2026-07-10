"use client";

import { useEffect, useRef, useState } from "react";
import { Button, DeadlineChip, Icon, StatutoryReceipt } from "@/components/system";
import { askAssistant } from "@/app/(app)/app/assistant/actions";
import type { AssistantResponse } from "@/lib/ai/assistant-core";

/** Deterministic proactive card — selected and phrased by the obligations
 *  engine server-side; the assistant never computes or words a deadline. */
export interface ContextCardData {
  title: string;
  body: string;
  dueDate: string;
  source: { label: string; url: string };
  receipt: { reference: string; plainEnglish: string; guidanceUrl: string } | null;
  actionLabel: string;
}

export interface AssistantChatProps {
  contextCard: ContextCardData | null;
  starters: { id: string; label: string; icon: string }[];
}

type ChatItem =
  | { kind: "user"; text: string }
  | { kind: "typing" }
  | { kind: "response"; response: AssistantResponse };

function AstAvatar({ size = 34 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 999, flex: "none", background: "var(--ink-900)", display: "grid", placeItems: "center" }}>
      <Icon name="assistant" size={Math.round(size * 0.56)} fill style={{ color: "var(--verified-green-600)" }} />
    </div>
  );
}

function SourceChip({ label, url }: { label: string; url: string }) {
  return (
    <a href={url || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", font: "600 13px/1.2 var(--font-body)", color: "var(--neutral-700)", background: "var(--neutral-100)", border: "1px solid var(--border-hairline)", borderRadius: 999, padding: "7px 12px", maxWidth: "100%" }}>
      <Icon name="menu_book" size={15} style={{ color: "var(--neutral-500)", flex: "none" }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        <span style={{ color: "var(--neutral-500)" }}>From: </span>{label}
      </span>
      <Icon name="open_in_new" size={14} style={{ color: "var(--neutral-400)", flex: "none" }} />
    </a>
  );
}

function PriorityBadge({ level = "P1" }: { level?: string }) {
  return (
    <span className="fe-tabular" style={{ display: "inline-flex", alignItems: "center", font: "700 11px/1 var(--font-body)", letterSpacing: "0.04em", color: "var(--amber-700)", background: "var(--amber-50)", border: "1px solid rgba(217,122,8,0.28)", borderRadius: 999, padding: "4px 8px" }}>{level}</span>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "5px 18px 18px 18px", padding: "15px 17px", boxShadow: "var(--shadow-card)" }}>
      {children}
    </div>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((p, i) => (
        <p key={i} style={{ font: "400 17px/1.6 var(--font-body)", color: "var(--ink-900)", margin: i === 0 ? "0" : "12px 0 0" }}>{p}</p>
      ))}
    </>
  );
}

function ResponseBlock({ response }: { response: AssistantResponse }) {
  if (response.kind === "boundary") {
    return (
      <div style={{ display: "flex", gap: 11, alignItems: "flex-start", margin: "10px 0" }}>
        <AstAvatar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "5px 18px 18px 18px", padding: "18px 18px 16px", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--neutral-100)", display: "grid", placeItems: "center", flex: "none" }}>
                <Icon name="pan_tool" size={21} style={{ color: "var(--neutral-700)" }} />
              </div>
              <h3 style={{ font: "600 18px/1.25 var(--font-display)", letterSpacing: "var(--tracking-h)", color: "var(--ink-900)", margin: 0 }}>{response.title}</h3>
            </div>
            <p style={{ font: "400 16px/1.6 var(--font-body)", color: "var(--neutral-700)", margin: "0 0 16px" }}>{response.body}</p>
            <div style={{ display: "flex", gap: 13, alignItems: "flex-start", background: "var(--neutral-100)", border: "1px solid var(--border-hairline)", borderRadius: 12, padding: "14px 15px" }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", display: "grid", placeItems: "center", flex: "none" }}>
                <Icon name="support_agent" size={21} style={{ color: "var(--ink-900)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "600 16px/1.3 var(--font-body)", color: "var(--ink-900)" }}>{response.helpline.name}</div>
                <div style={{ font: "400 14px/1.4 var(--font-body)", color: "var(--neutral-500)", marginTop: 2 }}>{response.helpline.detail}</div>
                <a href={"tel:" + response.helpline.phone.replace(/\s/g, "")} className="fe-tabular" style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", font: "600 18px/1.2 var(--font-body)", color: "var(--ink-900)", marginTop: 10 }}>
                  <Icon name="call" size={18} style={{ color: "var(--verified-green-700)" }} />
                  {response.helpline.phone}
                </a>
                <div className="fe-tabular" style={{ font: "400 13px/1.3 var(--font-body)", color: "var(--neutral-400)", marginTop: 4 }}>{response.helpline.hours}</div>
              </div>
            </div>
            <a href={response.link.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", font: "600 16px/1 var(--font-body)", color: "var(--ink-900)", marginTop: 15 }}>
              {response.link.label}
              <Icon name="open_in_new" size={17} style={{ color: "var(--neutral-500)" }} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const sources = response.sources;
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", margin: "10px 0" }}>
      <AstAvatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Bubble>
          <Paragraphs text={response.text} />
        </Bubble>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" }}>
          {sources.map((s, i) => <SourceChip key={i} label={s.label} url={s.url} />)}
          {response.kind === "answer" && response.receipt && (
            <StatutoryReceipt reference={response.receipt.reference} plainEnglish={response.receipt.plainEnglish} guidanceUrl={response.receipt.guidanceUrl} />
          )}
        </div>
      </div>
    </div>
  );
}

function ContextCardBlock({ card }: { card: ContextCardData }) {
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", margin: "10px 0" }}>
      <AstAvatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "500 14px/1.4 var(--font-body)", color: "var(--neutral-500)", margin: "2px 0 8px" }}>By the way —</div>
        <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "5px 18px 18px 18px", padding: "17px 18px", boxShadow: "var(--shadow-card)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }}>
            <PriorityBadge />
            <DeadlineChip dueDate={card.dueDate} />
          </div>
          <h3 style={{ font: "600 19px/1.3 var(--font-display)", letterSpacing: "var(--tracking-h)", color: "var(--ink-900)", margin: "0 0 8px" }}>{card.title}</h3>
          <p style={{ font: "400 16px/1.55 var(--font-body)", color: "var(--neutral-700)", margin: "0 0 16px" }}>{card.body}</p>
          {/* Assistant action buttons are P1 — visible, badged, disabled (never silently omitted). */}
          <Button variant="primary" style={{ width: "100%" }} disabled title="Coming soon">
            {card.actionLabel}
            <Icon name="arrow_forward" size={19} />
          </Button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" }}>
          <SourceChip label={card.source.label} url={card.source.url} />
          {card.receipt && <StatutoryReceipt reference={card.receipt.reference} plainEnglish={card.receipt.plainEnglish} guidanceUrl={card.receipt.guidanceUrl} />}
        </div>
      </div>
    </div>
  );
}

export function AssistantChat({ contextCard, starters }: AssistantChatProps) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setValue("");
    setBusy(true);
    setItems((prev) => [...prev, { kind: "user", text }, { kind: "typing" }]);
    try {
      const result = await askAssistant(text, threadId);
      setThreadId(result.threadId);
      setItems((prev) => [...prev.filter((i) => i.kind !== "typing"), { kind: "response", response: result.response }]);
    } catch {
      setItems((prev) => [
        ...prev.filter((i) => i.kind !== "typing"),
        {
          kind: "response",
          response: {
            kind: "signpost",
            text: "Something went wrong on my side — nothing you typed is lost. Try again in a moment, or use the official guidance below.",
            sources: [{ label: "GOV.UK — Employing staff for the first time", url: "https://www.gov.uk/employing-staff" }],
          },
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const empty = items.length === 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {empty ? (
          <div style={{ padding: "28px 20px 16px", maxWidth: 640, margin: "0 auto" }}>
            <div style={{ display: "grid", placeItems: "center", marginBottom: 18 }}>
              <div style={{ width: 60, height: 60, borderRadius: 999, background: "var(--ink-900)", display: "grid", placeItems: "center", boxShadow: "var(--shadow-card)" }}>
                <Icon name="assistant" size={34} fill style={{ color: "var(--verified-green-600)" }} />
              </div>
            </div>
            <h1 style={{ font: "var(--text-h2)", letterSpacing: "var(--tracking-h)", margin: 0, textAlign: "center", textWrap: "balance" }}>Ask me anything about being an employer</h1>
            <p style={{ font: "var(--text-body-lg)", color: "var(--text-secondary)", margin: "12px auto 0", textAlign: "center", maxWidth: 440 }}>
              Plain answers, in plain English — and I always show you where each one comes from. No jargon, no guessing.
            </p>
            {contextCard && <div style={{ marginTop: 24 }}><ContextCardBlock card={contextCard} /></div>}
            <div style={{ margin: "28px 0 8px", font: "600 12px/1 var(--font-body)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--neutral-500)" }}>Try one of these</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {starters.map((s) => (
                <button key={s.id} type="button" onClick={() => send(s.label)} className="fe-starter" style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", padding: "15px 16px", cursor: "pointer", boxSizing: "border-box", transition: "border-color 150ms var(--ease)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(14,27,44,0.06)", display: "grid", placeItems: "center", flex: "none" }}>
                    <Icon name={s.icon} size={20} style={{ color: "var(--ink-900)" }} />
                  </div>
                  <span style={{ flex: 1, font: "600 17px/1.35 var(--font-body)", color: "var(--ink-900)" }}>{s.label}</span>
                  <Icon name="arrow_outward" size={19} style={{ color: "var(--neutral-400)", flex: "none" }} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: "16px 16px 12px", maxWidth: 640, margin: "0 auto" }}>
            {items.map((item, i) => {
              if (item.kind === "user") {
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "flex-end", margin: "4px 0" }}>
                    <div style={{ maxWidth: "82%", background: "var(--ink-900)", color: "var(--bone-50)", borderRadius: "18px 18px 5px 18px", padding: "12px 16px", font: "400 17px/1.5 var(--font-body)" }}>{item.text}</div>
                  </div>
                );
              }
              if (item.kind === "typing") {
                return (
                  <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", margin: "10px 0" }}>
                    <AstAvatar />
                    <div style={{ background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: "5px 18px 18px 18px", padding: "16px 18px", boxShadow: "var(--shadow-card)", display: "flex", gap: 6 }}>
                      {[0, 1, 2].map((d) => (
                        <span key={d} style={{ width: 8, height: 8, borderRadius: 999, background: "var(--neutral-400)", animation: "ast-typing 1.1s var(--ease) infinite", animationDelay: d * 0.16 + "s" }} />
                      ))}
                    </div>
                  </div>
                );
              }
              return <ResponseBlock key={i} response={item.response} />;
            })}
          </div>
        )}
      </div>

      {/* composer */}
      <div style={{ flex: "none", padding: "10px 16px calc(12px + env(safe-area-inset-bottom))", borderTop: "1px solid var(--border-hairline)", background: "rgba(247,244,238,0.96)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 9, background: "var(--surface-raised)", border: "1px solid var(--border-hairline)", borderRadius: 24, padding: "6px 6px 6px 16px", boxShadow: "var(--shadow-card)" }}>
            <textarea
              rows={1}
              value={value}
              placeholder="Ask a question…"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(value.trim()); } }}
              style={{ flex: 1, border: "none", outline: "none", resize: "none", background: "transparent", font: "400 17px/1.4 var(--font-body)", color: "var(--ink-900)", padding: "9px 0", maxHeight: 120 }}
            />
            <button type="button" onClick={() => send(value.trim())} aria-label="Send" disabled={!value.trim() || busy} style={{ width: 44, height: 44, borderRadius: 999, border: "none", flex: "none", background: value.trim() && !busy ? "var(--verified-green-600)" : "var(--neutral-200)", color: "#fff", display: "grid", placeItems: "center", cursor: value.trim() && !busy ? "pointer" : "default", transition: "background-color 150ms var(--ease)" }}>
              <Icon name="arrow_upward" size={22} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 9, font: "400 12px/1.3 var(--font-body)", color: "var(--neutral-400)", textAlign: "center" }}>
            <Icon name="lock" size={13} />
            Answers are guidance, not legal advice. I always show my sources.
          </div>
        </div>
      </div>
    </div>
  );
}
