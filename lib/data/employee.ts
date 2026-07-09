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

/**
 * The employee currently being taken through the journey for a business —
 * prospective hire first, else the most recent. RLS scopes to membership.
 */
export async function getPrimaryEmployee(businessId: string): Promise<EmployeeRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, full_name, dob, is_apprentice, apprenticeship_start, start_date, pay_amount, pay_period, weekly_hours, status")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (!data || data.length === 0) return null;
  const prospective = data.find((e) => e.status === "prospective");
  return (prospective ?? data[0]) as EmployeeRow;
}
