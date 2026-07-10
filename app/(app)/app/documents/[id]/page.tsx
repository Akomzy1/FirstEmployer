import { notFound } from "next/navigation";
import { loadDocumentDetail } from "@/lib/documents/detail";
import { DocumentDetail } from "@/components/app/documents/DocumentDetail";

export const metadata = { title: "Examiner report" };

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const data = await loadDocumentDetail(params.id);
  if (!data) notFound();

  // The heavy `contract` object stays server-side; the client gets view data only.
  const { contract: _contract, ...view } = data;
  return <DocumentDetail {...view} pdfHref={`/app/documents/${data.id}/pdf`} />;
}
