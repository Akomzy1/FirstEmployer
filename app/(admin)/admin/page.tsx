import "../admin.css";
import { requireAdmin } from "@/lib/admin/guard";
import { loadAdminData } from "@/lib/admin/data";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata = { title: "FE Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Hard block: non-allowlisted users get a 404 (the surface doesn't exist for them).
  const admin = await requireAdmin();
  const data = await loadAdminData();
  return <AdminConsole data={data} adminEmail={admin.email} />;
}
