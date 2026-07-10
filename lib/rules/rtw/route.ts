/**
 * Right to Work route decision tree (FR-4.1). Pure rules code (CLAUDE.md Rule 1):
 * the document the person shows determines HOW the check is done and which route
 * gives a statutory excuse. No LLM, deterministic.
 *
 * Three routes map to the `rtw_route` enum:
 * - manual                    → British/Irish passport, checked by hand in person
 * - share_code                → eVisa / BRP / share code, checked on the GOV.UK service
 * - employer_checking_service → outstanding application or unclear document; the
 *                               employer requests a check from the Home Office (guidance)
 */
export type RtwDocumentChoice = "passport_british_irish" | "share_code_evisa_brp" | "outstanding_or_other";
export type RtwRoute = "manual" | "share_code" | "employer_checking_service";

export interface RtwRouteResult {
  route: RtwRoute;
  /** Plain-English method name shown in the UI. */
  method: string;
  /** Why this route (reading age 9). */
  reason: string;
  statutoryBasis: string;
}

export function determineRtwRoute(choice: RtwDocumentChoice): RtwRouteResult {
  switch (choice) {
    case "passport_british_irish":
      return {
        route: "manual",
        method: "Manual check",
        reason: "A British or Irish passport proves a permanent right to work. You check the original document by hand, with the person present.",
        statutoryBasis: "IANA 2006 s.15",
      };
    case "share_code_evisa_brp":
      return {
        route: "share_code",
        method: "Online check",
        reason: "For an eVisa, biometric permit or share code, the free GOV.UK online check is the only way to get a legal defence. A photocopy is not enough.",
        statutoryBasis: "RTW Scheme 2022",
      };
    case "outstanding_or_other":
    default:
      return {
        route: "employer_checking_service",
        method: "Home Office check",
        reason: "If the application is still being decided, or the document is unclear, request a check from the Home Office Employer Checking Service.",
        statutoryBasis: "Immigration Act 2016",
      };
  }
}

/** Map the questionnaire result choice to the immutable `rtw_result` enum. */
export type RtwResultChoice = "continuous" | "time_limited" | "not_permitted";
export function toRtwResult(choice: RtwResultChoice): "pass" | "follow_up_required" | "fail" {
  if (choice === "continuous") return "pass";
  if (choice === "time_limited") return "follow_up_required";
  return "fail";
}
