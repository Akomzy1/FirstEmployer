/**
 * The vault's unified view model (FR-5.4): one artefact list over documents,
 * determinations, rtw_records and standalone evidence, with seals where
 * examined, version chains, tags for the audit-pack scope rules, and the
 * storage path each artefact's PDF/image lives at.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getEmployees } from "@/lib/data/employee";
import type { VaultKind } from "@/lib/rules/audit-pack";

export interface VaultVersion {
  v: string;
  dateLabel: string;
  iso: string;
  current: boolean;
  note: string;
  sealHash: string | null;
}

export interface VaultArtefact {
  id: string; // "<source>:<row id>"
  source: "determination" | "document" | "rtw" | "evidence";
  sourceId: string;
  kind: VaultKind;
  tags: string[];
  title: string;
  employeeId: string | null; // null → business-wide
  personName: string;
  iso: string;
  dateLabel: string;
  version: string;
  current: boolean;
  examined: boolean;
  seal: { timestamp: string; hash: string } | null;
  summary: string;
  /** Storage path of the artefact's file (pdf/image/json), if stored. */
  filePath: string | null;
  /** For documents stored as clause JSON — rendered to PDF at export time. */
  contentIsJson: boolean;
  retention: "rtw" | "contract" | "payroll" | "pension" | null;
  followUpDue: string | null;
  versions: VaultVersion[];
}

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

interface DocRow {
  id: string;
  employee_id: string | null;
  type: string;
  status: string;
  version: number;
  supersedes: string | null;
  content_path: string | null;
  created_at: string;
  examinations: { verdict: string; checklist_hash: string; created_at: string; attempt: number }[];
}

export async function loadVault(businessId: string): Promise<VaultArtefact[]> {
  const supabase = createClient();
  const employees = await getEmployees(businessId);
  const nameOf = new Map(employees.map((e) => [e.id, e.full_name]));
  const person = (id: string | null) => (id && nameOf.get(id)) || "Business-wide";
  const artefacts: VaultArtefact[] = [];

  const [{ data: dets }, { data: docs }, { data: rtws }, { data: evidence }] = await Promise.all([
    supabase
      .from("determinations")
      .select("id, employee_id, verdict, reference, rules_version, pdf_path, created_at, employees!inner(business_id, full_name)")
      .eq("employees.business_id", businessId),
    supabase
      .from("documents")
      .select("id, employee_id, type, status, version, supersedes, content_path, created_at, examinations(verdict, checklist_hash, created_at, attempt)")
      .eq("business_id", businessId),
    supabase
      .from("rtw_records")
      .select("id, employee_id, route, result, checked_at, follow_up_due, supersedes, employees!inner(business_id, full_name)")
      .eq("employees.business_id", businessId),
    supabase.from("evidence").select("id, type, file_path, meta, created_at").eq("business_id", businessId),
  ]);

  /* ---- determinations ---- */
  for (const d of dets ?? []) {
    const name = person(d.employee_id);
    const first = name.split(/\s+/)[0];
    artefacts.push({
      id: `determination:${d.id}`,
      source: "determination",
      sourceId: d.id,
      kind: "determination",
      tags: [],
      title: "Employment status determination",
      employeeId: d.employee_id,
      personName: name,
      iso: d.created_at.slice(0, 10),
      dateLabel: dateLabel(d.created_at),
      version: "v1",
      current: true,
      examined: false, // determinations are calculated, not examined (Rule 1)
      seal: null,
      summary: `${first}'s employment status, decided by the rules engine (${d.rules_version}) and recorded as ${d.reference}.`,
      filePath: d.pdf_path,
      contentIsJson: false,
      retention: null,
      followUpDue: null,
      versions: [{ v: "v1", dateLabel: dateLabel(d.created_at), iso: d.created_at.slice(0, 10), current: true, note: `Determination ${d.reference}, ${d.rules_version}.`, sealHash: null }],
    });
  }

  /* ---- documents (contracts + variation letters), with version chains ---- */
  const docRows = (docs ?? []) as DocRow[];
  const byId = new Map(docRows.map((d) => [d.id, d]));
  const supersededIds = new Set(docRows.map((d) => d.supersedes).filter(Boolean) as string[]);
  const passOf = (d: DocRow) =>
    d.examinations.filter((e) => e.verdict === "pass").sort((a, b) => b.attempt - a.attempt)[0] ?? null;

  for (const d of docRows) {
    // Version-chain heads only; prior versions render inside the timeline.
    if (supersededIds.has(d.id)) continue;
    if (d.status !== "approved") continue; // fail closed: unapproved artefacts never surface in the vault
    const pass = passOf(d);
    const isVariation = d.type === "variation_letter";
    const name = person(d.employee_id);

    // Walk the supersede chain oldest→newest.
    const chain: DocRow[] = [];
    let cursor: DocRow | undefined = d;
    while (cursor) {
      chain.unshift(cursor);
      cursor = cursor.supersedes ? byId.get(cursor.supersedes) : undefined;
    }
    const versions: VaultVersion[] = chain
      .map((c, i) => {
        const p = passOf(c);
        const current = c.id === d.id;
        return {
          v: `v${i + 1}`,
          dateLabel: dateLabel(c.created_at),
          iso: c.created_at.slice(0, 10),
          current,
          note: current
            ? isVariation
              ? "Pay uprated to the new statutory minimum. Re-examined against all 13 requirements and verified."
              : "Examined against all 13 statutory requirements and verified."
            : "Superseded by the later version above.",
          sealHash: p?.checklist_hash ?? null,
        };
      })
      .reverse(); // newest first, as the prototype renders

    artefacts.push({
      id: `document:${d.id}`,
      source: "document",
      sourceId: d.id,
      kind: isVariation ? "letter" : "contract",
      tags: isVariation ? ["variation"] : [],
      title: isVariation ? "Pay uprating variation letter" : "Employment contract",
      employeeId: d.employee_id,
      personName: name,
      iso: d.created_at.slice(0, 10),
      dateLabel: dateLabel(d.created_at),
      version: `v${chain.length}`,
      current: true,
      examined: !!pass,
      seal: pass ? { timestamp: timeLabel(pass.created_at), hash: pass.checklist_hash } : null,
      summary: isVariation
        ? `${name.split(/\s+/)[0]}'s pay change, examined against 13 statutory requirements before it reached you.`
        : `${name.split(/\s+/)[0]}'s contract, checked against 13 statutory requirements before it reached you.`,
      filePath: d.content_path,
      contentIsJson: true,
      retention: "contract",
      followUpDue: null,
      versions,
    });
  }

  /* ---- RTW records (current, non-superseded) ---- */
  const rtwRows = rtws ?? [];
  const rtwSuperseded = new Set(rtwRows.map((r) => r.supersedes).filter(Boolean) as string[]);
  // The statutory-excuse PDFs live in evidence rows keyed by record_id.
  const rtwPdfByRecord = new Map<string, string>();
  for (const ev of evidence ?? []) {
    if (ev.type === "rtw_record" && ev.file_path) {
      const rid = (ev.meta as { record_id?: string })?.record_id;
      if (rid) rtwPdfByRecord.set(rid, ev.file_path);
    }
  }
  for (const r of rtwRows) {
    if (rtwSuperseded.has(r.id)) continue;
    const name = person(r.employee_id);
    const first = name.split(/\s+/)[0];
    const routeLabel = r.route === "manual" ? "British/Irish passport" : r.route === "share_code" ? "eVisa" : "Home Office check";
    artefacts.push({
      id: `rtw:${r.id}`,
      source: "rtw",
      sourceId: r.id,
      kind: "rtw",
      tags: [],
      title: `Right to work record — ${routeLabel}`,
      employeeId: r.employee_id,
      personName: name,
      iso: String(r.checked_at).slice(0, 10),
      dateLabel: dateLabel(r.checked_at),
      version: r.supersedes ? "v2" : "v1",
      current: true,
      examined: false,
      seal: null,
      summary:
        r.result === "follow_up_required"
          ? `${first} can work in the UK — permission is time-limited${r.follow_up_due ? ` to ${dateLabel(r.follow_up_due)}` : ""}.`
          : r.result === "pass"
            ? `${first} can work in the UK, with no time limit. The record is your statutory excuse.`
            : `The check did not pass — ${first} must not start work.`,
      filePath: rtwPdfByRecord.get(r.id) ?? null,
      contentIsJson: false,
      retention: "rtw",
      followUpDue: r.follow_up_due,
      versions: [{ v: r.supersedes ? "v2" : "v1", dateLabel: dateLabel(r.checked_at), iso: String(r.checked_at).slice(0, 10), current: true, note: "The recorded check. Re-checks add a new record; nothing is overwritten.", sealHash: null }],
    });
  }

  /* ---- standalone evidence (certificates) ---- */
  for (const ev of evidence ?? []) {
    if (ev.type === "el_insurance_certificate" && ev.file_path) {
      artefacts.push({
        id: `evidence:${ev.id}`,
        source: "evidence",
        sourceId: ev.id,
        kind: "certificate",
        tags: ["el_insurance"],
        title: "Employer's liability insurance",
        employeeId: null,
        personName: "Business-wide",
        iso: ev.created_at.slice(0, 10),
        dateLabel: dateLabel(ev.created_at),
        version: "v1",
        current: true,
        examined: false,
        seal: null,
        summary: "Your employers' liability certificate — the law requires this cover once you employ anyone.",
        filePath: ev.file_path,
        contentIsJson: false,
        retention: null,
        followUpDue: null,
        versions: [{ v: "v1", dateLabel: dateLabel(ev.created_at), iso: ev.created_at.slice(0, 10), current: true, note: "Certificate uploaded to the vault.", sealHash: null }],
      });
    }
  }

  return artefacts.sort((a, b) => b.iso.localeCompare(a.iso));
}
