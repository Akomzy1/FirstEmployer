/**
 * Audit-pack assembler (FR-5.4). Gathers each in-scope artefact's PDF (stored
 * PDFs are merged as-is; clause-JSON documents are rendered; evidence images are
 * embedded on an A4 page), computes real start pages, renders the cover + index,
 * and merges everything into one bundle with pdf-lib.
 *
 * Two-pass page numbering: artefact PDFs are loaded FIRST so the index can carry
 * the true page each item starts at ("bundle PDF opens with a working index").
 */
// Server-agnostic on purpose (mirrors the examiner-core pattern): the storage
// downloader is injected, so the bundle logic is fully testable offline.
import { PDFDocument } from "pdf-lib";
import { renderAuditCover, type AuditIndexRow } from "../pdf/audit-pack";
import { renderContractPdf } from "../pdf/contract";
import type { GeneratedContract } from "../templates/contract/types";
import type { VaultArtefact } from "@/lib/data/vault";

const COVER_AND_INDEX_PAGES = 2; // cover + single index page (re-measured after render)

/** Fetches a stored file's bytes; null when missing. Injected by the caller. */
export type DownloadBytes = (path: string) => Promise<Uint8Array | null>;

/** An artefact's PDF bytes: stored PDF, rendered clause JSON, or an image page. */
async function artefactPdf(a: VaultArtefact, businessName: string, download: DownloadBytes): Promise<Uint8Array | null> {
  if (!a.filePath) return null;
  const bytes = await download(a.filePath);
  if (!bytes) return null;

  if (a.contentIsJson) {
    try {
      const contract = JSON.parse(new TextDecoder().decode(bytes)) as GeneratedContract;
      const pdf = await renderContractPdf({
        title: contract.title,
        employerName: businessName,
        employeeName: a.personName,
        clauses: contract.clauses.map((c) => ({ heading: c.heading, statutoryRef: c.statutoryRef, body: c.body })),
        seal: a.seal ?? { timestamp: a.dateLabel, hash: "—" },
        examinerVersion: "",
        configVersion: "",
      });
      return new Uint8Array(pdf);
    } catch {
      return null;
    }
  }

  if (a.filePath.endsWith(".pdf")) return bytes;

  // Image evidence → embed on an A4 page.
  try {
    const doc = await PDFDocument.create();
    const img = a.filePath.endsWith(".png") ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([595.28, 841.89]); // A4 pt
    const margin = 48;
    const maxW = page.getWidth() - margin * 2;
    const maxH = page.getHeight() - margin * 2;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = img.width * scale;
    const h = img.height * scale;
    page.drawImage(img, { x: (page.getWidth() - w) / 2, y: (page.getHeight() - h) / 2, width: w, height: h });
    return await doc.save();
  } catch {
    return null;
  }
}

export interface AuditBundleInput {
  businessName: string;
  presetLabel: string;
  artefacts: VaultArtefact[]; // already scoped + chronological
  download: DownloadBytes;
}

export interface AuditBundleResult {
  bytes: Uint8Array;
  pageCount: number;
  included: number;
  skipped: number;
}

export async function buildAuditBundle(input: AuditBundleInput): Promise<AuditBundleResult> {
  const { businessName, presetLabel, artefacts, download } = input;

  // Pass 1 — load every artefact PDF and its page count.
  const loaded: { a: VaultArtefact; doc: PDFDocument; pages: number }[] = [];
  let skipped = 0;
  for (const a of artefacts) {
    const bytes = await artefactPdf(a, businessName, download);
    if (!bytes) {
      skipped += 1;
      continue;
    }
    const doc = await PDFDocument.load(bytes);
    loaded.push({ a, doc, pages: doc.getPageCount() });
  }

  // Pass 2 — compute start pages, render cover + index, merge.
  let cursor = COVER_AND_INDEX_PAGES + 1;
  const rows: AuditIndexRow[] = loaded.map(({ a, pages }, i) => {
    const row: AuditIndexRow = {
      n: i + 1,
      title: a.title,
      personName: a.personName,
      dateLabel: a.dateLabel,
      examined: a.examined,
      startPage: cursor,
    };
    cursor += pages;
    return row;
  });

  const isoDates = loaded.map(({ a }) => a.iso).sort();
  const range = isoDates.length
    ? `${new Date(isoDates[0]).toLocaleDateString("en-GB", { month: "short", year: "numeric" })} – ${new Date(isoDates[isoDates.length - 1]).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`
    : "—";
  const cover = await renderAuditCover({
    businessName,
    presetLabel,
    generatedLabel: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    dateRangeLabel: range,
    count: loaded.length,
    rows,
  });

  const bundle = await PDFDocument.create();
  const coverDoc = await PDFDocument.load(new Uint8Array(cover));
  for (const p of await bundle.copyPages(coverDoc, coverDoc.getPageIndices())) bundle.addPage(p);
  // If the index spilled past one page, the promised start pages shift — re-run
  // once with the corrected offset so the index is always true.
  const coverPages = coverDoc.getPageCount();
  if (coverPages !== COVER_AND_INDEX_PAGES && loaded.length) {
    const delta = coverPages - COVER_AND_INDEX_PAGES;
    rows.forEach((r) => (r.startPage += delta));
    const cover2 = await renderAuditCover({
      businessName,
      presetLabel,
      generatedLabel: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      dateRangeLabel: range,
      count: loaded.length,
      rows,
    });
    const coverDoc2 = await PDFDocument.load(new Uint8Array(cover2));
    while (bundle.getPageCount() > 0) bundle.removePage(0);
    for (const p of await bundle.copyPages(coverDoc2, coverDoc2.getPageIndices())) bundle.addPage(p);
  }

  for (const { doc } of loaded) {
    for (const p of await bundle.copyPages(doc, doc.getPageIndices())) bundle.addPage(p);
  }

  const bytes = await bundle.save();
  return { bytes, pageCount: bundle.getPageCount(), included: loaded.length, skipped };
}
