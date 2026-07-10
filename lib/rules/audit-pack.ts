/**
 * Audit-pack scope rules (Build Prompt 10, FR-5.4). Pure rules code: which
 * artefact kinds each inspector preset includes. Golden-tested — the HMRC pack
 * must NEVER contain right-to-work evidence (irrelevant to a tax inspection and
 * needlessly shares immigration data); the Home Office pack must ALWAYS include it.
 *
 * Artefacts are classified by kind (the vault's five facets) plus tags that
 * mark what they evidence (paye, pension, el_insurance, variation, offer…).
 */
export type VaultKind = "determination" | "contract" | "rtw" | "certificate" | "letter";
export type AuditPresetId = "hmrc" | "homeoffice" | "pensions" | "everything";

export interface ScopeItem {
  kind: VaultKind;
  tags: string[];
}

export interface AuditPresetDef {
  id: AuditPresetId;
  label: string;
  icon: string;
  desc: string;
}

export const AUDIT_PRESETS: AuditPresetDef[] = [
  { id: "hmrc", label: "HMRC inspection", icon: "account_balance", desc: "PAYE, pay and contracts — what a tax inspector asks to see." },
  { id: "homeoffice", label: "Home Office right to work audit", icon: "badge", desc: "Your right-to-work checks and the statutory excuse they build." },
  { id: "pensions", label: "The Pensions Regulator", icon: "savings", desc: "Auto-enrolment: the scheme, the assessment and the proof." },
  { id: "everything", label: "Everything", icon: "inventory_2", desc: "Every document you hold, in one indexed file." },
];

const has = (item: ScopeItem, tag: string) => item.tags.includes(tag);

/**
 * Scope predicate per preset:
 * - hmrc: pay-and-tax evidence — determinations (status drives tax treatment),
 *   contracts (the pay terms), PAYE/pension certificates, and pay/pension letters.
 *   Never RTW records (immigration data has no place in a tax pack) and not the
 *   EL insurance certificate (HSE's domain, not HMRC's).
 * - homeoffice: the statutory-excuse trail — RTW records plus the status
 *   determinations that anchor who was employed.
 * - pensions: auto-enrolment proof — pension certificates/letters and the
 *   contracts that state the pension arrangement.
 * - everything: all artefacts.
 */
export function inScope(preset: AuditPresetId, item: ScopeItem): boolean {
  switch (preset) {
    case "hmrc":
      if (item.kind === "rtw") return false;
      if (item.kind === "determination" || item.kind === "contract") return true;
      if (item.kind === "certificate") return has(item, "paye") || has(item, "pension");
      if (item.kind === "letter") return has(item, "pension") || has(item, "variation");
      return false;
    case "homeoffice":
      return item.kind === "rtw" || item.kind === "determination";
    case "pensions":
      if (item.kind === "contract") return true;
      if (item.kind === "certificate" || item.kind === "letter") return has(item, "pension");
      return false;
    case "everything":
    default:
      return true;
  }
}

/** Filter + chronological (oldest first — how an inspector reads a file). */
export function scopeArtefacts<T extends ScopeItem & { iso: string }>(preset: AuditPresetId, items: T[]): T[] {
  return items.filter((i) => inScope(preset, i)).sort((a, b) => a.iso.localeCompare(b.iso));
}
