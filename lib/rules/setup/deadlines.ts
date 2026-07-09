/**
 * Deterministic date math for setup deadlines (CLAUDE.md Rule 1, testing gate 3).
 * Operates on ISO date strings (YYYY-MM-DD) via UTC to avoid timezone drift —
 * identical inputs always yield the identical deadline.
 */

interface YMD {
  y: number;
  m: number; // 1-12
  d: number;
}

function parse(iso: string): YMD {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}
function fmt({ y, m, d }: YMD): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${y}-${p(m)}-${p(d)}`;
}
function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Add months, clamping the day to the target month's last day (e.g. 31 Jan +1mo → 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
  const { y, m, d } = parse(iso);
  const total = (y * 12 + (m - 1)) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return fmt({ y: ny, m: nm, d: nd });
}

/** Add (or subtract) whole days. UTC-safe. */
export function addDays(iso: string, days: number): string {
  const { y, m, d } = parse(iso);
  const t = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const dt = new Date(t);
  return fmt({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() });
}

/**
 * Declaration of compliance deadline: within `months` (config, default 5) of the
 * duties start date — the last day of that period (TPR computes it as
 * start + N months, minus one day). e.g. duties start 2026-08-03, 5 months →
 * 2027-01-02.
 */
export function pensionDeclarationDeadline(dutiesStartIso: string, months: number): string {
  return addDays(addMonths(dutiesStartIso, months), -1);
}

/** Add N working days (Mon-Fri), skipping weekends. Bank holidays are not modelled. */
export function addWorkingDays(iso: string, workingDays: number): string {
  let cur = iso;
  let added = 0;
  while (added < workingDays) {
    cur = addDays(cur, 1);
    const { y, m, d } = parse(cur);
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 Sun .. 6 Sat
    if (dow !== 0 && dow !== 6) added++;
  }
  return cur;
}
