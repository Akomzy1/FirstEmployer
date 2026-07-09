/**
 * Setup checklist instantiation (FR-2.1/2.6) — pure, deterministic (Rule 1).
 * Steps and their guidance are derived from business type; state is derived from
 * recorded progress with dependency gating (e.g. the contract is blocked until
 * pension setup is complete). No LLM, no I/O.
 */

export const SETUP_RULES_VERSION = "setup-1.0";

export type BusinessType = "sole_trader" | "limited";
export type StepState = "blocked" | "not_started" | "in_progress" | "complete";

/** Which module owns the step's detail screen. */
export type StepOwner = "setup" | "contract" | "right_to_work" | "records";

export interface SetupStep {
  id: string;
  /** Obligation type this step maps to (for the obligations engine). */
  obligationType: string;
  name: string;
  owner: StepOwner;
  /** Statutory step with a deadline or hard legal requirement. */
  statutory: boolean;
  /** Business-type-specific plain-English guidance. */
  guidance: string;
  /** True where the limited-company director is themselves in scope. */
  directorConsideration: boolean;
  /** Dependency: this step is blocked until `dependsOn` reaches `requires`. */
  dependsOn?: { step: string; requires: StepState };
}

interface StepDef {
  id: string;
  obligationType: string;
  name: string;
  owner: StepOwner;
  statutory: boolean;
  guidance: Record<BusinessType, string>;
  director?: boolean;
  dependsOn?: { step: string; requires: StepState };
}

const STEP_DEFS: StepDef[] = [
  {
    id: "hmrc_paye",
    obligationType: "hmrc_paye",
    name: "Register as an employer with HMRC",
    owner: "setup",
    statutory: true,
    director: true,
    guidance: {
      limited:
        "Register your company as an employer. You'll need your company registration number. As a director you usually go on the payroll too.",
      sole_trader:
        "Register as an employer for your staff. You don't put yourself on the payroll — as a sole trader you pay your own tax through Self Assessment.",
    },
  },
  {
    id: "payroll",
    obligationType: "payroll",
    name: "Choose payroll software",
    owner: "setup",
    statutory: false,
    dependsOn: { step: "hmrc_paye", requires: "in_progress" },
    guidance: {
      limited: "Pick software that HMRC recognises. It works out tax and reports every payday.",
      sole_trader: "Pick software that HMRC recognises. It works out your staff's tax and reports every payday.",
    },
  },
  {
    id: "pension",
    obligationType: "pension_enrolment",
    name: "Set up workplace pension",
    owner: "setup",
    statutory: true,
    director: true,
    guidance: {
      limited:
        "Enrol eligible staff into a workplace pension — and, if you're on the payroll, that can include you as a director.",
      sole_trader:
        "Enrol your eligible staff into a workplace pension. It doesn't apply to you as the owner.",
    },
  },
  {
    id: "el_insurance",
    obligationType: "el_insurance",
    name: "Employer's liability insurance",
    owner: "setup",
    statutory: true,
    guidance: {
      limited: "Hold at least the statutory minimum cover from your employee's first day.",
      sole_trader: "Hold at least the statutory minimum cover from your employee's first day.",
    },
  },
  {
    id: "ico_registration",
    obligationType: "ico_registration",
    name: "Register with the ICO",
    owner: "setup",
    statutory: true,
    guidance: {
      limited: "You process staff personal data, so you almost certainly need to register with the ICO and pay the data-protection fee.",
      sole_trader: "You process staff personal data, so check whether you need to register with the ICO and pay the data-protection fee.",
    },
  },
  {
    id: "health_safety",
    obligationType: "health_safety",
    name: "Basic health & safety",
    owner: "setup",
    statutory: true,
    guidance: {
      limited: "Do a simple risk assessment and display the health-and-safety law poster (or give staff the leaflet).",
      sole_trader: "Do a simple risk assessment and display the health-and-safety law poster (or give staff the leaflet).",
    },
  },
  {
    id: "contract",
    obligationType: "written_statement",
    name: "Employment contract",
    owner: "contract",
    statutory: true,
    dependsOn: { step: "pension", requires: "complete" },
    guidance: {
      limited: "Generate a written statement of terms, checked by the examiner. Unlocks once pension setup is done.",
      sole_trader: "Generate a written statement of terms, checked by the examiner. Unlocks once pension setup is done.",
    },
  },
  {
    id: "right_to_work",
    obligationType: "right_to_work",
    name: "Right-to-work check",
    owner: "right_to_work",
    statutory: true,
    guidance: {
      limited: "Check your new hire can legally work in the UK — before their first day.",
      sole_trader: "Check your new hire can legally work in the UK — before their first day.",
    },
  },
  {
    id: "record_keeping",
    obligationType: "record_keeping",
    name: "Keep records",
    owner: "records",
    statutory: true,
    guidance: {
      limited: "We set most of this up automatically as you go.",
      sole_trader: "We set most of this up automatically as you go.",
    },
  },
];

/** Instantiate the ordered checklist for a business type (FR-2.1). */
export function instantiateChecklist(type: BusinessType): SetupStep[] {
  return STEP_DEFS.map((d) => ({
    id: d.id,
    obligationType: d.obligationType,
    name: d.name,
    owner: d.owner,
    statutory: d.statutory,
    guidance: d.guidance[type],
    directorConsideration: !!d.director && type === "limited",
    dependsOn: d.dependsOn,
  }));
}

const RANK: Record<StepState, number> = { blocked: 0, not_started: 1, in_progress: 2, complete: 3 };

/**
 * Effective state per step, applying dependency gating. `recorded` is each
 * step's own state from the obligations engine (default not_started).
 */
export function deriveChecklistStates(
  steps: SetupStep[],
  recorded: Record<string, StepState>,
): Record<string, StepState> {
  const out: Record<string, StepState> = {};
  for (const step of steps) {
    const own = recorded[step.id] ?? "not_started";
    if (step.dependsOn) {
      const depState = recorded[step.dependsOn.step] ?? "not_started";
      if (RANK[depState] < RANK[step.dependsOn.requires]) {
        out[step.id] = "blocked";
        continue;
      }
    }
    out[step.id] = own;
  }
  return out;
}

/** Progress = completed setup-owned steps ÷ total setup-owned steps. */
export function setupProgress(steps: SetupStep[], states: Record<string, StepState>): { done: number; total: number } {
  const owned = steps.filter((s) => s.owner === "setup");
  const done = owned.filter((s) => states[s.id] === "complete").length;
  return { done, total: owned.length };
}
