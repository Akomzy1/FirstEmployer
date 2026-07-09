/**
 * Employer PAYE reference validation. HMRC's employer PAYE reference is a
 * 3-digit tax-office number, a slash, then the office reference (letters and
 * digits), e.g. "123/AB456". Deterministic; used to validate the captured ref.
 */
const PAYE_REF = /^\d{3}\/[A-Za-z0-9]{1,10}$/;

export function isValidPayeReference(ref: string): boolean {
  return PAYE_REF.test(ref.trim());
}

/** Normalise a PAYE ref (trim, uppercase the office reference part). */
export function normalisePayeReference(ref: string): string {
  const t = ref.trim().toUpperCase();
  return t;
}
