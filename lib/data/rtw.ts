import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getEmployees } from "@/lib/data/employee";

export interface RtwWorkerOverview {
  employeeId: string;
  name: string;
  fullName: string;
  initials: string;
  startDate: string | null;
  /** RTW state for this worker. */
  status: "not-started" | "complete" | "blocked";
  detail: string;
  /** Latest non-superseded record id (for re-check / detail). */
  recordId: string | null;
  route: string | null;
  result: string | null;
  checkedAt: string | null;
  /** Follow-up due date (time-limited permission), else null. */
  followUpDue: string | null;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

interface RtwRow {
  id: string;
  employee_id: string;
  route: string;
  result: string;
  checked_at: string;
  follow_up_due: string | null;
  supersedes: string | null;
}

/** Per-employee right-to-work overview for the module home. */
export async function getRtwOverview(businessId: string): Promise<RtwWorkerOverview[]> {
  const supabase = createClient();
  const employees = await getEmployees(businessId);
  const ids = employees.map((e) => e.id);
  const byEmployee = new Map<string, RtwRow>();

  if (ids.length) {
    const { data: rows } = await supabase
      .from("rtw_records")
      .select("id, employee_id, route, result, checked_at, follow_up_due, supersedes")
      .in("employee_id", ids)
      .order("checked_at", { ascending: false });
    const superseded = new Set((rows ?? []).map((r) => r.supersedes).filter(Boolean) as string[]);
    for (const r of (rows ?? []) as RtwRow[]) {
      // Latest current (non-superseded) record per employee — rows are newest-first.
      if (superseded.has(r.id)) continue;
      if (!byEmployee.has(r.employee_id)) byEmployee.set(r.employee_id, r);
    }
  }

  return employees.map((e) => {
    const rec = byEmployee.get(e.id) ?? null;
    let status: RtwWorkerOverview["status"] = "not-started";
    let detail = "Do this before their first day";
    if (rec) {
      if (rec.result === "pass") {
        status = "complete";
        detail = "Checked · permanent right to work";
      } else if (rec.result === "follow_up_required") {
        status = "complete";
        detail = "Checked · time-limited permission";
      } else {
        status = "blocked";
        detail = "Not permitted to work — do not employ";
      }
    }
    return {
      employeeId: e.id,
      name: e.full_name.split(/\s+/)[0] || e.full_name,
      fullName: e.full_name,
      initials: initialsOf(e.full_name),
      startDate: e.start_date,
      status,
      detail,
      recordId: rec?.id ?? null,
      route: rec?.route ?? null,
      result: rec?.result ?? null,
      checkedAt: rec?.checked_at ?? null,
      followUpDue: rec?.follow_up_due ?? null,
    };
  });
}
