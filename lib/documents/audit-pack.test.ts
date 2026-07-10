/**
 * Audit-pack bundle verification (P10 VERIFY: "bundle PDF opens with working
 * index"). Runs fully offline: artefact PDFs are rendered in-memory, the
 * downloader is a map, and the finished bundle is parsed back with pdf-lib to
 * prove it opens and its page arithmetic (cover + index + artefacts) holds.
 */
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import versionsData from "../config/versions.json";
import type { StatutoryConfig, StatutoryConfigVersion } from "../config/types";
import type { ContractFacts } from "../templates/contract/types";
import { renderContractFromTemplates } from "../templates/contract/render";
import { renderRtwRecordPdf } from "../pdf/rtw-record";
import { buildAuditBundle } from "./audit-pack";
import type { VaultArtefact } from "@/lib/data/vault";

const CONFIG = ((versionsData as { versions: StatutoryConfigVersion[] }).versions.find((v) => v.label === "2026.2") as StatutoryConfigVersion).values as StatutoryConfig;

const LIAM: ContractFacts = {
  employerName: "DO Plumbing & Heating Ltd",
  employerType: "limited",
  employeeName: "Liam Carter",
  wageBand: { dob: "1999-05-14", isApprentice: true, apprenticeshipStart: "2026-08-03", on: "2026-08-03" },
  jobTitle: "Apprentice plumber",
  duties: "Assisting on domestic heating and plumbing jobs under supervision.",
  place: "Various customer sites across Walsall.",
  hourlyRate: 8.0,
  weeklyHours: 40,
  payInterval: "Monthly",
  startDate: "2026-08-03",
  probation: "3 months",
  notice: "1 week",
  holidayDays: 28,
  daysPerWeek: 5,
  sickPay: "ssp",
  pension: "nest",
};

function artefact(partial: Partial<VaultArtefact> & Pick<VaultArtefact, "id" | "kind" | "title" | "iso" | "filePath">): VaultArtefact {
  return {
    source: "evidence",
    sourceId: partial.id,
    tags: [],
    employeeId: "e1",
    personName: "Liam Carter",
    dateLabel: "3 Aug 2026",
    version: "v1",
    current: true,
    examined: false,
    seal: null,
    summary: "",
    contentIsJson: false,
    retention: null,
    followUpDue: null,
    versions: [],
    ...partial,
  } as VaultArtefact;
}

describe("buildAuditBundle", () => {
  it("merges cover + index + artefacts; the bundle opens and page counts add up", async () => {
    // Two real artefact PDFs + one clause-JSON document rendered at export time.
    const rtwPdf = await renderRtwRecordPdf({
      businessName: "DO Plumbing & Heating Ltd",
      personName: "Liam Carter",
      method: "Manual check",
      whatChecked: "British passport (original, in person)",
      checkedBy: "Dave Okonkwo",
      checkedDate: "3 August 2026",
      resultLabel: "Passed — permanent right to work",
      followUpDue: null,
      evidenceCount: 1,
      reference: "6D1A-9E44",
    });
    const contractJson = Buffer.from(JSON.stringify(renderContractFromTemplates(LIAM, CONFIG)));

    const files = new Map<string, Uint8Array>([
      ["biz/rtw.pdf", new Uint8Array(rtwPdf)],
      ["biz/contract.json", new Uint8Array(contractJson)],
    ]);

    const result = await buildAuditBundle({
      businessName: "DO Plumbing & Heating Ltd",
      presetLabel: "HMRC inspection",
      artefacts: [
        artefact({ id: "a1", kind: "contract", title: "Employment contract", iso: "2026-08-03", filePath: "biz/contract.json", contentIsJson: true, examined: true, seal: { timestamp: "3 Aug 2026, 09:41", hash: "3F9A-C21E" } }),
        artefact({ id: "a2", kind: "rtw", title: "Right to work record", iso: "2026-08-04", filePath: "biz/rtw.pdf" }),
        artefact({ id: "a3", kind: "letter", title: "Missing file", iso: "2026-08-05", filePath: "biz/missing.pdf" }),
      ],
      download: async (path) => files.get(path) ?? null,
    });

    // Missing-file artefact is skipped, honestly counted.
    expect(result.included).toBe(2);
    expect(result.skipped).toBe(1);

    // The bundle parses, and pages = cover+index + each artefact's real pages.
    const bundle = await PDFDocument.load(result.bytes);
    const rtwPages = (await PDFDocument.load(new Uint8Array(rtwPdf))).getPageCount();
    expect(bundle.getPageCount()).toBe(result.pageCount);
    expect(bundle.getPageCount()).toBeGreaterThanOrEqual(2 + 1 + rtwPages); // cover+index + contract(≥1) + rtw
  });

  it("an empty scope produces a cover + index only (still a valid PDF)", async () => {
    const result = await buildAuditBundle({
      businessName: "DO Plumbing & Heating Ltd",
      presetLabel: "Everything",
      artefacts: [],
      download: async () => null,
    });
    const bundle = await PDFDocument.load(result.bytes);
    expect(bundle.getPageCount()).toBe(2);
    expect(result.included).toBe(0);
  });
});
