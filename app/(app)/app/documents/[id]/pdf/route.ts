import { NextResponse, type NextRequest } from "next/server";
import { loadDocumentDetail } from "@/lib/documents/detail";
import { renderContractPdf } from "@/lib/pdf/contract";

export const runtime = "nodejs";

/**
 * On-demand contract PDF, rendered from the stored, examined artefact and stamped
 * with the examiner seal. Authorisation runs through the RLS-scoped loader; a
 * document with no examiner PASS has no seal and is not downloadable (fail closed).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const data = await loadDocumentDetail(params.id);
  if (!data || !data.contract || !data.seal) return new NextResponse("Not found", { status: 404 });

  const pdf = await renderContractPdf({
    title: data.contract.title,
    employerName: data.employerName,
    employeeName: data.employeeName,
    clauses: data.contract.clauses.map((c) => ({ heading: c.heading, statutoryRef: c.statutoryRef, body: c.body })),
    seal: data.seal,
    examinerVersion: data.examinerVersion ?? "",
    configVersion: data.configVersion ?? "",
  });

  const safeName = data.employeeName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="contract-${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
