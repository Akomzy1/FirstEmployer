/**
 * Statutory and case-law references for employment-status factors.
 * Plain-English at reading age 9 (StatutoryReceipt copy). Shared by the rules
 * engine (factor.refs) and the verdict screen. These are legal REFERENCES, not
 * statutory config values — they don't change with the April uprating, so they
 * live here, not in config_versions.
 */

export interface Reference {
  reference: string;
  plainEnglish: string;
  guidanceUrl: string;
}

export const REFERENCES = {
  era_230: {
    reference: "ERA 1996 s.230",
    plainEnglish:
      "The law splits people into employees, workers, and the self-employed. Each group gets different rights, so getting this right matters.",
    guidanceUrl: "https://www.gov.uk/employment-status",
  },
  ready_mixed_concrete: {
    reference: "Ready Mixed Concrete (1968)",
    plainEnglish:
      "A leading case set three tests for being an employee: the person must do the work themselves, be under your control, and there must be an ongoing give-and-take of work.",
    guidanceUrl: "https://www.gov.uk/employment-status/employee",
  },
  control: {
    reference: "Ready Mixed Concrete (1968)",
    plainEnglish:
      "The more you control when, where, and how someone works, the more they look like an employee. A contractor decides how to do the job themselves.",
    guidanceUrl: "https://www.gov.uk/employment-status/employee",
  },
  personal_service: {
    reference: "Pimlico Plumbers (2018)",
    plainEnglish:
      "If someone must do the work themselves and can't freely send a substitute, that points to employee or worker status. A genuine right to send anyone points to self-employment.",
    guidanceUrl: "https://www.gov.uk/employment-status/worker",
  },
  mutuality: {
    reference: "Carmichael v National Power (1999)",
    plainEnglish:
      "This case is about whether there's an ongoing promise of work on both sides. If you must offer work and they must accept it, that points to employment. No mutual promise between jobs usually means no employment contract.",
    guidanceUrl: "https://www.gov.uk/employment-status/employee",
  },
  worker_status: {
    reference: "Uber v Aslam (2021)",
    plainEnglish:
      "A worker does the work personally but isn't running their own business dealing with you as a client. Workers get holiday pay and the minimum wage.",
    guidanceUrl: "https://www.gov.uk/employment-status/worker",
  },
  financial_risk: {
    reference: "Autoclenz v Belcher (2011)",
    plainEnglish:
      "Someone who can make a profit or a loss from how they run the work, and invests their own money, is more likely self-employed. Courts look at what really happens, not just the label on the contract.",
    guidanceUrl: "https://www.gov.uk/employment-status/selfemployed-contractor",
  },
  in_business: {
    reference: "ERA 1996 s.230",
    plainEnglish:
      "Someone genuinely in business for themselves — own tools, own clients, own risk — is self-employed, and you are their customer rather than their employer.",
    guidanceUrl: "https://www.gov.uk/employment-status/selfemployed-contractor",
  },
} as const satisfies Record<string, Reference>;

export type ReferenceKey = keyof typeof REFERENCES;
