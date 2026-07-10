import { NextResponse } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentBusiness } from "@/lib/data/business";

export const runtime = "nodejs";

/**
 * Data export (P12, UK GDPR access/portability): one zip with data.json (every
 * table the business owns) plus the stored files. Authorised via the user's
 * RLS-scoped client; files fetched under the business's own path prefix only.
 */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const business = await getCurrentBusiness();
  if (!business) return new NextResponse("No business", { status: 404 });

  // Everything the user can see under RLS.
  const [employees, obligations, documents, evidence, threads] = await Promise.all([
    supabase.from("employees").select("*").eq("business_id", business.id),
    supabase.from("obligations").select("*").eq("business_id", business.id),
    supabase.from("documents").select("*").eq("business_id", business.id),
    supabase.from("evidence").select("*").eq("business_id", business.id),
    supabase.from("assistant_threads").select("*, assistant_messages(*)").eq("business_id", business.id),
  ]);

  const zip = new JSZip();
  zip.file(
    "data.json",
    JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        business,
        employees: employees.data ?? [],
        obligations: obligations.data ?? [],
        documents: documents.data ?? [],
        evidence: evidence.data ?? [],
        assistant_threads: threads.data ?? [],
      },
      null,
      2,
    ),
  );

  // Stored files, under this business's prefix only.
  const svc = createServiceClient();
  const files = zip.folder("files")!;
  for (const ev of evidence.data ?? []) {
    const path = (ev as { file_path: string | null }).file_path;
    if (!path || !path.startsWith(`${business.id}/`)) continue;
    const { data: blob } = await svc.storage.from("evidence").download(path);
    if (blob) files.file(path.replace(`${business.id}/`, ""), await blob.arrayBuffer());
  }

  const bytes = await zip.generateAsync({ type: "uint8array" });
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="firstemployer-export-${new Date().toISOString().slice(0, 10)}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
