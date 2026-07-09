import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Determination PDF download. Authorises via the user's RLS-scoped client (they
 * can only read their own determination), then streams the stored PDF from the
 * private evidence bucket using a short-lived service-role signed URL.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: det } = await supabase
    .from("determinations")
    .select("pdf_path, reference")
    .eq("id", params.id)
    .maybeSingle();

  if (!det?.pdf_path) return new NextResponse("Not found", { status: 404 });

  const svc = createServiceClient();
  const { data: signed, error } = await svc.storage.from("evidence").createSignedUrl(det.pdf_path, 60, {
    download: `${det.reference}.pdf`,
  });
  if (error || !signed) return new NextResponse("Unavailable", { status: 500 });

  return NextResponse.redirect(signed.signedUrl);
}
