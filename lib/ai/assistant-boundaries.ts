/**
 * Assistant boundary topics (CLAUDE.md §7, skill gotcha #4). The line between
 * guidance and advice is a PRODUCT POSITION: dismissal, discrimination and
 * dispute questions get a boundary card (Acas + solicitor signposts), never an
 * answer — and non-UK law gets a polite scope signpost.
 *
 * Detection is DETERMINISTIC and runs BEFORE any Claude call: a boundary
 * question never reaches the model at all, so no prompt injection can talk the
 * assistant past the line. The system prompt repeats the rule as defence in
 * depth, but this module is the enforcement.
 */
export type BoundaryTopic = "dismissal" | "discrimination" | "dispute";

export interface BoundaryHit {
  topic: BoundaryTopic;
  /** Why this is out of scope, phrased for the boundary card (reading age 9). */
  body: string;
}

const BOUNDARY_PATTERNS: { topic: BoundaryTopic; pattern: RegExp }[] = [
  {
    topic: "dismissal",
    pattern:
      /\b(sack|sacking|fire|firing|fired|dismiss\w*|terminat\w*|let\s+(him|her|them|someone|(my|an?)\s+\w+)\s+go|get\s+rid\s+of|redundan\w*|p45\s+(him|her|them))\b/i,
  },
  {
    topic: "discrimination",
    pattern: /\b(discriminat\w*|racis\w*|sexis\w*|harass\w*|victimis\w*|ageis\w*|only\s+hire\s+(men|women)|because\s+(she|he)('s| is)\s+pregnant)\b/i,
  },
  {
    topic: "dispute",
    pattern: /\b(tribunal|sue|suing|sued|lawsuit|legal\s+claim|claim\s+against|grievance\s+(against|about)|settlement\s+agreement|acas\s+early\s+conciliation|constructive\s+dismissal)\b/i,
  },
];

const BOUNDARY_BODY: Record<BoundaryTopic, string> = {
  dismissal:
    "Letting someone go is a legal decision — and even in a probation period it can go to a tribunal if it's handled wrong. I won't guess on something that could cost you thousands. The right next move is a free, confidential chat with people who do this every day.",
  discrimination:
    "Questions about treating people differently touch discrimination law, and getting that wrong is serious for you and unfair on them. I won't guess here. Talk it through with Acas first — it's free and confidential.",
  dispute:
    "Once a dispute or claim is in the air, exact words matter and I'd be guessing at yours. The safe move is a free, confidential call with Acas before you say or write anything else.",
};

/** Deterministic boundary check. Returns the hit, or null when in scope. */
export function checkBoundary(question: string): BoundaryHit | null {
  for (const { topic, pattern } of BOUNDARY_PATTERNS) {
    if (pattern.test(question)) return { topic, body: BOUNDARY_BODY[topic] };
  }
  return null;
}

/** Non-UK jurisdiction detection — the assistant covers UK employment law only. */
const NON_UK_PATTERN =
  /\b(at[- ]will|us\s+(federal|labor)\s+law|california|new\s+york\s+law|irish\s+employment\s+law|eu\s+directive|w-?2|1099|fair\s+labor\s+standards|fmla|osha)\b/i;

export function isNonUkQuestion(question: string): boolean {
  return NON_UK_PATTERN.test(question);
}

/** The boundary card's fixed signposts (FR-6.3). */
export const BOUNDARY_HELPLINE = {
  name: "Acas helpline",
  detail: "Free, confidential advice on dismissals and disputes",
  phone: "0300 123 1100",
  hours: "Monday to Friday, 8am to 6pm",
};

export const BOUNDARY_LINK = {
  label: "Find an employment solicitor",
  url: "https://solicitors.lawsociety.org.uk/",
};

export const BOUNDARY_TITLE = "This is where I stop and a professional starts";
