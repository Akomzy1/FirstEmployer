/**
 * Audit-pack scope goldens (P10 VERIFY): HMRC excludes RTW evidence; Home Office
 * includes it. Fixture mirrors the prototype's full artefact set.
 */
import { describe, expect, it } from "vitest";
import { inScope, scopeArtefacts, type ScopeItem } from "./audit-pack";

type Fixture = ScopeItem & { id: string; iso: string };

/** The prototype's 14 artefacts, classified by kind + tags. */
const DOCS: Fixture[] = [
  { id: "det-aisha", kind: "determination", tags: [], iso: "2026-01-28" },
  { id: "offer-aisha", kind: "letter", tags: ["offer"], iso: "2026-02-02" },
  { id: "rtw-aisha", kind: "rtw", tags: [], iso: "2026-02-05" },
  { id: "contract-aisha", kind: "contract", tags: [], iso: "2026-02-10" },
  { id: "el-cert", kind: "certificate", tags: ["el_insurance"], iso: "2026-02-20" },
  { id: "paye-cert", kind: "certificate", tags: ["paye"], iso: "2026-03-02" },
  { id: "det-liam", kind: "determination", tags: [], iso: "2026-03-06" },
  { id: "offer-liam", kind: "letter", tags: ["offer"], iso: "2026-03-08" },
  { id: "rtw-liam", kind: "rtw", tags: [], iso: "2026-03-12" },
  { id: "sop-liam", kind: "contract", tags: [], iso: "2026-03-14" },
  { id: "pension-cert", kind: "certificate", tags: ["pension"], iso: "2026-03-15" },
  { id: "ae-letter", kind: "letter", tags: ["pension"], iso: "2026-03-15" },
  { id: "contract-liam-v2", kind: "contract", tags: ["variation"], iso: "2026-04-06" },
  { id: "variation-letter", kind: "letter", tags: ["variation"], iso: "2026-04-06" },
];

const ids = (preset: Parameters<typeof inScope>[0]) => scopeArtefacts(preset, DOCS).map((d) => d.id);

describe("audit-pack scope rules", () => {
  it("HMRC preset EXCLUDES right-to-work evidence (the release assertion)", () => {
    const hmrc = ids("hmrc");
    expect(hmrc).not.toContain("rtw-aisha");
    expect(hmrc).not.toContain("rtw-liam");
  });

  it("Home Office preset INCLUDES right-to-work evidence (the release assertion)", () => {
    const ho = ids("homeoffice");
    expect(ho).toContain("rtw-aisha");
    expect(ho).toContain("rtw-liam");
  });

  it("HMRC pack matches the prototype's membership exactly", () => {
    // determinations + contracts + PAYE/pension certificates + pension/variation
    // letters — no RTW, no EL certificate, no offer letters.
    expect(ids("hmrc")).toEqual([
      "det-aisha", "contract-aisha", "paye-cert", "det-liam", "sop-liam",
      "pension-cert", "ae-letter", "contract-liam-v2", "variation-letter",
    ]);
  });

  it("Home Office pack is determinations + RTW only, chronological", () => {
    expect(ids("homeoffice")).toEqual(["det-aisha", "rtw-aisha", "det-liam", "rtw-liam"]);
  });

  it("Pensions Regulator pack is pension artefacts + contracts", () => {
    expect(ids("pensions")).toEqual([
      "contract-aisha", "sop-liam", "pension-cert", "ae-letter", "contract-liam-v2",
    ]);
  });

  it("Everything includes all artefacts, oldest first", () => {
    const all = ids("everything");
    expect(all).toHaveLength(DOCS.length);
    expect(all[0]).toBe("det-aisha");
    expect(all[all.length - 1]).toMatch(/contract-liam-v2|variation-letter/);
  });

  it("is deterministic", () => {
    expect(ids("hmrc")).toEqual(ids("hmrc"));
  });
});
