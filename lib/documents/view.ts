/**
 * Client-facing, serialisable shapes for the Documents UI. No server-only imports,
 * so both the server action and the client flow can share them.
 */
export interface ExamCheckView {
  id: number;
  name: string;
  status: "pass" | "fail";
  statutoryRef: string;
  detail?: string;
}

export interface GenerationResultView {
  documentId: string;
  status: "approved" | "human_review";
  outcome: "approve" | "fix" | "human";
  attempts: number;
  /** The final attempt's 13 check results (drives the report reveal). */
  finalChecks: ExamCheckView[];
  /** The check that first failed (for the fix/human animation), if any. */
  firstFailCheckId?: number;
  defect?: { issue: string; statutoryBasis: string; clauseRef: string };
  /** Present only when approved — the VerificationSeal content. */
  seal?: { timestamp: string; hash: string };
  employeeName: string;
}

export interface DocumentListItemView {
  id: string;
  type: string;
  typeLabel: string;
  employeeName: string;
  dateLabel: string;
  status: string;
  verified: boolean;
  seal?: { timestamp: string; hash: string };
}
