/** P14 VERIFY: non-allowlisted users are hard-blocked. Pure predicate goldens. */
import { describe, expect, it } from "vitest";
import { isAdminEmail } from "./allowlist";

const LIST = ["founder@firstemployer.co.uk", "ops@firstemployer.co.uk"];

describe("admin allowlist", () => {
  it("allows exact allowlisted emails (case/space-insensitive)", () => {
    expect(isAdminEmail("founder@firstemployer.co.uk", LIST)).toBe(true);
    expect(isAdminEmail("  Founder@FirstEmployer.co.uk ", LIST)).toBe(true);
  });
  it("hard-blocks everyone else", () => {
    expect(isAdminEmail("dave@doplumbing.co.uk", LIST)).toBe(false);
    expect(isAdminEmail("founder@firstemployer.co.uk.evil.com", LIST)).toBe(false);
    expect(isAdminEmail("", LIST)).toBe(false);
    expect(isAdminEmail(null, LIST)).toBe(false);
    expect(isAdminEmail(undefined, LIST)).toBe(false);
  });
  it("an empty allowlist blocks everyone (no default admin)", () => {
    expect(isAdminEmail("founder@firstemployer.co.uk", [])).toBe(false);
  });
});
