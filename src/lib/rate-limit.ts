/**
 * Lightweight in-memory rate limiter for Cloudflare Workers + browser.
 * Per-process, so OK for single-region deployments. For multi-region
 * later, swap the `memory` Map for a KV store.
 *
 * Usage:
 *   const r = await rateLimit(`signin:${ip}`, limits.guestSignup);
 *   if (!r.ok) throw new Error(`Försök igen om ${r.resetIn / 1000}s`);
 */

interface Bucket {
  count: number;
  resetAt: number;
}
const memory = new Map<string, Bucket>();

export interface LimitConfig {
  max: number;
  windowMs: number;
}

export interface LimitResult {
  ok: boolean;
  remaining: number;
  resetIn: number;
}

export function rateLimit(key: string, cfg: LimitConfig): LimitResult {
  const now = Date.now();
  const b = memory.get(key);

  if (!b || b.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + cfg.windowMs });
    // Opportunistic cleanup of expired buckets (every ~100 inserts)
    if (memory.size > 1000 && Math.random() < 0.01) {
      for (const [k, v] of memory) {
        if (v.resetAt < now) memory.delete(k);
      }
    }
    return { ok: true, remaining: cfg.max - 1, resetIn: cfg.windowMs };
  }

  if (b.count >= cfg.max) {
    return { ok: false, remaining: 0, resetIn: b.resetAt - now };
  }

  b.count += 1;
  return { ok: true, remaining: cfg.max - b.count, resetIn: b.resetAt - now };
}

/** Pre-configured limits for known endpoints. */
export const limits = {
  /** Guest sign-in: prevent abuse of anonymous account creation. */
  guestSignup: { max: 5, windowMs: 60 * 60 * 1000 } as LimitConfig, // 5/hour
  /** Joining matchmaking queue. */
  matchmaking: { max: 10, windowMs: 60 * 1000 } as LimitConfig, // 10/min
  /**
   * Matchskapande. OBS: precis som forumet är detta bara det billiga första
   * lagret — den riktiga kvoten räknas ur `matches` via `checkMatchQuota`
   * (se `match-abuse.ts`), eftersom limitern här lever per Cloudflare-isolat.
   */
  matchCreate: { max: 10, windowMs: 5 * 60 * 1000 } as LimitConfig, // 10/5min
  /** Sending friend requests. */
  friendRequest: { max: 20, windowMs: 60 * 60 * 1000 } as LimitConfig, // 20/hour
  /** Bug reports. */
  bugReport: { max: 1, windowMs: 15 * 60 * 1000 } as LimitConfig, // 1/15min
  /** Inviting a friend to a match. */
  matchInvite: { max: 30, windowMs: 60 * 60 * 1000 } as LimitConfig, // 30/hour
  /** Publika läs-endpoints (topplistor m.m.) — per IP, stoppar hamring. */
  publicRead: { max: 120, windowMs: 60 * 1000 } as LimitConfig, // 120/min
  /** Ordbatch-hämtning (tung query) — per IP. */
  wordBatch: { max: 30, windowMs: 60 * 1000 } as LimitConfig, // 30/min
  /**
   * Forum. OBS: detta är bara det billiga första lagret — den riktiga kvoten
   * räknas ur tabellerna inuti forum_create_thread/-post (se migrationen),
   * eftersom limitern här lever per Cloudflare-isolat.
   */
  forumThread: { max: 5, windowMs: 60 * 60 * 1000 } as LimitConfig, // 5/h
  forumPost: { max: 20, windowMs: 60 * 60 * 1000 } as LimitConfig, // 20/h
  forumEdit: { max: 30, windowMs: 60 * 60 * 1000 } as LimitConfig, // 30/h
  forumReport: { max: 10, windowMs: 60 * 60 * 1000 } as LimitConfig, // 10/h
  /** Följ/sluta följ och markera läst — billiga, men klickbara i en loop. */
  forumSubscribe: { max: 60, windowMs: 60 * 60 * 1000 } as LimitConfig, // 60/h
  /** Sök — tyngre än en vanlig läsning (två GIN-uppslag + union), per IP. */
  forumSearch: { max: 30, windowMs: 60 * 1000 } as LimitConfig, // 30/min
};
