/**
 * Guards CLAUDE.md Rule 3: the examiner is architecturally independent of the
 * generator. This test fails the build if the examiner ever imports generator
 * internals (prompt, reasoning, message history) — the escalation path in §9.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(join(__dirname, p), "utf8");

describe("examiner independence (Rule 3)", () => {
  const core = read("examiner-core.ts");
  const wrapper = read("examiner.ts");

  it("the examiner never imports the generator", () => {
    for (const src of [core, wrapper]) {
      expect(src).not.toMatch(/from\s+["'].*generator["']/);
      expect(src).not.toMatch(/import\(["'].*generator["']\)/);
    }
  });

  it("the examiner imports no generator context types or helpers", () => {
    // It may import the shared document/facts/config types and its own checklist,
    // but none of the generator's prompt/option symbols.
    expect(core).not.toMatch(/GeneratorTransport|buildGeneratorPrompt|GenerateOptions|GENERATOR_VERSION/);
  });

  it("the examiner runs its own Claude call, not a shared one", () => {
    // Its own system prompt + its own messages.create — separate from the generator.
    expect(core).toMatch(/messages\.create/);
    expect(core).toMatch(/independent Examiner/i);
  });
});
