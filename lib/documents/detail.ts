import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBusiness } from "@/lib/data/business";
import { EXAMINER_CHECKS } from "@/lib/rules/examiner-checklist";
import type { GeneratedContract } from "@/lib/templates/contract/types";
import type { ExaminationCheck } from "@/lib/ai/examiner-types";

export interface DetailCheckRow {
  id: number;
  name: string;
  status: "pass" | "fail";
  statutoryRef: string;
  plainEnglish: string;
  detail: string;
}
export interface DetailAttempt {
  n: number;
  ok: boolean;
  title: string;
  body: string;
  timeLabel: string;
}
export interface DetailClause {
  id: string;
  n: number;
  title: string;
  statutoryRef?: string;
  body: string[];
}
export interface DocumentDetailData {
  id: string;
  status: string;
  employeeName: string;
  employerName: string;
  typeLabel: string;
  createdLabel: string;
  seal: { timestamp: string; hash: string } | null;
  examinerVersion: string | null;
  configVersion: string | null;
  checks: DetailCheckRow[];
  attempts: DetailAttempt[];
  fixedCheckId?: number;
  clauses: DetailClause[];
  contract: GeneratedContract | null;
}

const TYPE_LABEL: Record<string, string> = {
  employment_contract: "Employment contract",
  variation_letter: "Variation letter",
};

interface ExamRow {
  attempt: number;
  verdict: string;
  checks: ExaminationCheck[];
  defects: { clauseRef: string; issue: string }[];
  examiner_version: string;
  config_version: string;
  checklist_hash: string;
  created_at: string;
}

function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](\s|$)/);
  const s = (m ? m[0] : text).trim();
  return s.length > 160 ? s.slice(0, 157) + "…" : s;
}
function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", year: "numeric" });
}

export async function loadDocumentDetail(documentId: string): Promise<DocumentDetailData | null> {
  const supabase = createClient();
  const business = await getCurrentBusiness();
  if (!business) return null;

  const { data: doc } = await supabase
    .from("documents")
    .select("id, type, status, created_at, employee_id, content_path, examinations(attempt, verdict, checks, defects, examiner_version, config_version, checklist_hash, created_at)")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return null;

  let employeeName = "your employee";
  if (doc.employee_id) {
    const { data: emp } = await supabase.from("employees").select("full_name").eq("id", doc.employee_id).maybeSingle();
    if (emp?.full_name) employeeName = emp.full_name;
  }

  // Load the stored artefact (service client; RLS on storage is path-scoped).
  let contract: GeneratedContract | null = null;
  if (doc.content_path) {
    const svc = createServiceClient();
    const { data: blob } = await svc.storage.from("evidence").download(doc.content_path);
    if (blob) {
      try {
        contract = JSON.parse(await blob.text()) as GeneratedContract;
      } catch {
        contract = null;
      }
    }
  }

  const exams = ((doc.examinations ?? []) as ExamRow[]).slice().sort((a, b) => a.attempt - b.attempt);
  const passExam = exams.filter((e) => e.verdict === "pass").sort((a, b) => b.attempt - a.attempt)[0];
  const failExam = exams.find((e) => e.verdict === "fail");
  const fixedCheckId = failExam
    ? failExam.checks.find((c) => c.status === "fail")?.id ??
      (parseInt(String(failExam.defects[0]?.clauseRef ?? "").replace(/\D/g, ""), 10) || undefined)
    : undefined;

  // Affirmative per-check detail, derived from the examined clause bodies.
  const detailByCheck: Record<number, string> = {};
  for (const cl of contract?.clauses ?? []) detailByCheck[cl.checkId] = firstSentence(cl.body);

  const finalChecks = passExam?.checks ?? exams[exams.length - 1]?.checks ?? [];
  const checks: DetailCheckRow[] = EXAMINER_CHECKS.map((def) => {
    const c = finalChecks.find((x) => x.id === def.id);
    const detail = detailByCheck[def.id] ?? (def.id === 3 ? detailByCheck[4] : undefined) ?? def.plain_english;
    return {
      id: def.id,
      name: def.name,
      status: (c?.status ?? "pass") as "pass" | "fail",
      statutoryRef: def.statutory_ref,
      plainEnglish: def.plain_english,
      detail: c?.detail && c.status === "fail" ? c.detail : detail,
    };
  });

  const attempts: DetailAttempt[] = exams.map((e) => ({
    n: e.attempt,
    ok: e.verdict === "pass",
    title: e.verdict === "pass" ? "Approved" : `${e.defects.length} defect${e.defects.length === 1 ? "" : "s"} found`,
    body:
      e.verdict === "pass"
        ? "All 13 statutory checks passed."
        : `${e.defects[0]?.issue ?? "A defect was found."} Contract rejected — never sent to you.`,
    timeLabel: timeLabel(e.created_at),
  }));

  const clauses: DetailClause[] = (contract?.clauses ?? []).map((cl, i) => ({
    id: cl.id,
    n: i + 1,
    title: cl.heading.replace(/^\d+\.\s*/, ""),
    statutoryRef: cl.statutoryRef,
    body: cl.body.split(/\n+/).filter(Boolean),
  }));

  return {
    id: doc.id,
    status: doc.status,
    employeeName,
    employerName: business.name,
    typeLabel: TYPE_LABEL[doc.type] ?? doc.type,
    createdLabel: new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    seal: passExam ? { timestamp: timeLabel(passExam.created_at), hash: passExam.checklist_hash } : null,
    examinerVersion: passExam?.examiner_version ?? null,
    configVersion: passExam?.config_version ?? null,
    checks,
    attempts,
    fixedCheckId,
    clauses,
    contract,
  };
}
