/**
 * Rate limiting for the AI endpoints (P16 security pass). Token bucket keyed by
 * business — the two Claude callers (generation, assistant) burn real money and
 * must not be spammable.
 *
 * In-memory per server instance: honest for a single-region Vercel deployment
 * at launch scale (each instance enforces independently, so the effective limit
 * is limit × instances — still a hard ceiling). Swapping the store for a shared
 * one (e.g. Upstash) changes only `buckets`. Logged on the launch checklist.
 */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitRule {
  /** Bucket capacity (burst). */
  capacity: number;
  /** Tokens refilled per minute. */
  refillPerMinute: number;
}

export const AI_LIMITS: Record<"generation" | "assistant", RateLimitRule> = {
  generation: { capacity: 5, refillPerMinute: 2 }, // documents are heavyweight
  assistant: { capacity: 20, refillPerMinute: 10 },
};

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("You're doing that a little fast — give it a moment and try again.");
    this.name = "RateLimitError";
  }
}

/** Consume one token or throw RateLimitError. Pure math over an injectable clock. */
export function consumeToken(key: string, rule: RateLimitRule, now = Date.now()): void {
  const bucket = buckets.get(key) ?? { tokens: rule.capacity, updatedAt: now };
  const elapsedMinutes = (now - bucket.updatedAt) / 60_000;
  const tokens = Math.min(rule.capacity, bucket.tokens + elapsedMinutes * rule.refillPerMinute);
  if (tokens < 1) {
    const needed = 1 - tokens;
    const retryAfter = Math.ceil((needed / rule.refillPerMinute) * 60);
    buckets.set(key, { tokens, updatedAt: now });
    throw new RateLimitError(retryAfter);
  }
  buckets.set(key, { tokens: tokens - 1, updatedAt: now });
}

/** Test helper. */
export function __resetRateLimits() {
  buckets.clear();
}
