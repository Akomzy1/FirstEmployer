import { createClient } from "@/lib/supabase/server";

export interface EmployeeRow {
  id: string;
  full_name: string;
  dob: string | null;
  is_apprentice: boolean;
  apprenticeship_start: string | null;
  start_date: string | null;
  pay_amount: number | null;
  pay_period: string | null;
  weekly_hours: number | null;
  status: string;
}

const EMPLOYEE_COLUMNS =
  "id, full_name, dob, is_apprentice, apprenticeship_start, start_date, pay_amount, pay_period, weekly_hours, status";

/** All employees for a business, oldest first. RLS scopes to membership. */
export async function getEmployees(businessId: string): Promise<EmployeeRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("employees")
    .select(EMPLOYEE_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  return (data ?? []) as EmployeeRow[];
}

/**
 * The employee currently being taken through the journey for a business —
 * prospective hire first, else the most recent. RLS scopes to membership.
 */
export async function getPrimaryEmployee(businessId: string): Promise<EmployeeRow | null> {
  const list = await getEmployees(businessId);
  if (list.length === 0) return null;
  return list.find((e) => e.status === "prospective") ?? list[0];
}
