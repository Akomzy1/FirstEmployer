/**
 * Admin console data (P14). Service-role reads across tenants — only ever
 * reached behind requireAdmin(). Read-only flight-recorder framing: the sole
 * admin WRITE paths are the publish RPC and the monitor queue actions.
 */
import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { diffConfigs, type ConfigDiffRow } from "@/lib/rules/config-diff";
import type { StatutoryConfig } from "@/lib/config/types";

export interface AdminUserRow {
  businessId: string;
  business: string;
  owner: string;
  tier: string;
  state: string;
  employees: number;
  createdLabel: string;
}

export interface AdminExamRow {
  id: string;
  documentId: string;
  business: string;
  docType: string;
  attempt: number;
  verdict: string;
  defects: { clauseRef: string; issue: string; statutoryBasis: string }[];
  checks: { id: number; name: string; status: string; detail?: string }[];
  generatorVersion: string;
  examinerVersion: string;
  configVersion: string;
  checklistHash: string;
  atLabel: string;
  dateIso: string;
}

export interface AdminConfigRow {
  id: string;
  label: string;
  status: string;
  effectiveFrom: string;
  auditNote: string | null;
  diff: ConfigDiffRow[];
  changedCount: number;
}

export interface AdminMonitorRow {
  id: string;
  source: string;
  url: string | null;
  detectedLabel: string;
  classification: string;
  diff: { type: "add" | "del"; text: string }[];
  proposal: { kind?: string; target?: string; change?: string; note?: string };
  state: string;
}

export interface AdminFeedbackRow {
  id: string;
  flow: string;
  rating: number;
  comment: string | null;
  business: string;
  dateLabel: string;
}

export interface AdminData {
  users: AdminUserRow[];
  exams: AdminExamRow[];
  configs: AdminConfigRow[];
  monitor: AdminMonitorRow[];
  feedback: AdminFeedbackRow[];
}

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const timeLabel = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export async function loadAdminData(): Promise<AdminData> {
  const svc = createServiceClient();

  const [bizRes, examRes, cfgRes, monRes, fbRes, empRes, memberRes] = await Promise.all([
    svc.from("businesses").select("id, name, tier, subscription_state, created_at").order("created_at", { ascending: false }),
    svc
      .from("examinations")
      .select("id, document_id, attempt, verdict, checks, defects, generator_version, examiner_version, config_version, checklist_hash, created_at, documents!inner(type, business_id, businesses!inner(name))")
      .order("created_at", { ascending: false })
      .limit(200),
    svc.from("config_versions").select("id, label, effective_from, status, audit_note, values").order("effective_from", { ascending: false }),
    svc.from("monitor_findings").select("*").order("detected_at", { ascending: false }),
    svc.from("feedback").select("id, flow, rating, comment, created_at, business_id, businesses(name)").order("created_at", { ascending: false }).limit(200),
    svc.from("employees").select("business_id"),
    svc.from("business_members").select("business_id, profiles(full_name)"),
  ]);

  const empCount = new Map<string, number>();
  for (const e of empRes.data ?? []) empCount.set(e.business_id, (empCount.get(e.business_id) ?? 0) + 1);
  const ownerOf = new Map<string, string>();
  for (const m of memberRes.data ?? []) {
    const name = (m.profiles as { full_name?: string } | null)?.full_name;
    if (name && !ownerOf.has(m.business_id)) ownerOf.set(m.business_id, name);
  }

  const users: AdminUserRow[] = (bizRes.data ?? []).map((b) => ({
    businessId: b.id,
    business: b.name,
    owner: ownerOf.get(b.id) ?? "—",
    tier: b.tier,
    state: b.subscription_state,
    employees: empCount.get(b.id) ?? 0,
    createdLabel: dateLabel(b.created_at),
  }));

  const exams: AdminExamRow[] = (examRes.data ?? []).map((e) => {
    const doc = e.documents as unknown as { type: string; businesses: { name: string } };
    return {
      id: e.id,
      documentId: e.document_id,
      business: doc?.businesses?.name ?? "—",
      docType: doc?.type ?? "—",
      attempt: e.attempt,
      verdict: e.verdict,
      defects: (e.defects ?? []) as AdminExamRow["defects"],
      checks: (e.checks ?? []) as AdminExamRow["checks"],
      generatorVersion: e.generator_version,
      examinerVersion: e.examiner_version,
      configVersion: e.config_version,
      checklistHash: e.checklist_hash,
      atLabel: timeLabel(e.created_at),
      dateIso: e.created_at.slice(0, 10),
    };
  });

  const versions = cfgRes.data ?? [];
  const live = versions.find((v) => v.status === "live");
  const configs: AdminConfigRow[] = versions.map((v) => {
    const diff = live && v.id !== live.id ? diffConfigs(live.values as StatutoryConfig, v.values as StatutoryConfig) : [];
    return {
      id: v.id,
      label: v.label,
      status: v.status,
      effectiveFrom: v.effective_from,
      auditNote: v.audit_note,
      diff,
      changedCount: diff.filter((d) => d.changed).length,
    };
  });

  const monitor: AdminMonitorRow[] = (monRes.data ?? []).map((m) => ({
    id: m.id,
    source: m.source,
    url: m.url,
    detectedLabel: timeLabel(m.detected_at),
    classification: m.classification,
    diff: (m.diff ?? []) as AdminMonitorRow["diff"],
    proposal: (m.proposal ?? {}) as AdminMonitorRow["proposal"],
    state: m.state,
  }));

  const feedback: AdminFeedbackRow[] = (fbRes.data ?? []).map((f) => ({
    id: f.id,
    flow: f.flow,
    rating: f.rating,
    comment: f.comment,
    business: (f.businesses as { name?: string } | null)?.name ?? "—",
    dateLabel: dateLabel(f.created_at),
  }));

  return { users, exams, configs, monitor, feedback };
}
