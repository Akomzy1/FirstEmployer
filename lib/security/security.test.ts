import { describe, expect, it, beforeEach } from "vitest";
import { consumeToken, RateLimitError, AI_LIMITS, __resetRateLimits } from "./rate-limit";
import { validateDataUrlUpload, UploadValidationError, MAX_UPLOAD_BYTES } from "./upload";

describe("AI rate limiting (token bucket)", () => {
  beforeEach(() => __resetRateLimits());
  const t0 = 1_000_000;

  it("allows the burst then blocks with a retry-after", () => {
    for (let i = 0; i < AI_LIMITS.generation.capacity; i++) {
      consumeToken("biz-1:generation", AI_LIMITS.generation, t0);
    }
    try {
      consumeToken("biz-1:generation", AI_LIMITS.generation, t0);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("refills over time", () => {
    for (let i = 0; i < AI_LIMITS.generation.capacity; i++) consumeToken("biz-2:generation", AI_LIMITS.generation, t0);
    // One token refills after 1/refillPerMinute minutes.
    const later = t0 + (60_000 / AI_LIMITS.generation.refillPerMinute) + 1;
    expect(() => consumeToken("biz-2:generation", AI_LIMITS.generation, later)).not.toThrow();
  });

  it("buckets are per key — one business cannot exhaust another's", () => {
    for (let i = 0; i < AI_LIMITS.generation.capacity; i++) consumeToken("biz-3:generation", AI_LIMITS.generation, t0);
    expect(() => consumeToken("biz-4:generation", AI_LIMITS.generation, t0)).not.toThrow();
  });
});

describe("upload validation", () => {
  const jpeg = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");
  const png = "data:image/png;base64," + Buffer.from([0x89, 0x50, 0x4e, 0x47, 1]).toString("base64");

  it("accepts real JPEG/PNG data URLs", () => {
    expect(validateDataUrlUpload(jpeg).contentType).toBe("image/jpeg");
    expect(validateDataUrlUpload(png).contentType).toBe("image/png");
  });

  it("rejects disallowed types, spoofed magic bytes, and oversized files", () => {
    const svg = "data:image/svg+xml;base64," + Buffer.from("<svg/>").toString("base64");
    expect(() => validateDataUrlUpload(svg)).toThrowError(UploadValidationError);

    const spoofed = "data:image/jpeg;base64," + Buffer.from("MZ-not-a-jpeg").toString("base64");
    expect(() => validateDataUrlUpload(spoofed)).toThrowError(/doesn't look like/);

    const big = "data:image/jpeg;base64," + Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(MAX_UPLOAD_BYTES)]).toString("base64");
    expect(() => validateDataUrlUpload(big)).toThrowError(/too large/);
  });

  it("rejects non-data-URL payloads", () => {
    expect(() => validateDataUrlUpload("https://evil.example/x.jpg")).toThrowError(UploadValidationError);
  });
});
