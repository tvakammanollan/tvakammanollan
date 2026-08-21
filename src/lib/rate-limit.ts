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
   * Öppna Stripe-kassan. Varje anrop kostar ett API-anrop hos Stripe och en rad
   * i coaching_requests, och ingen människa behöver fem kassor på tio minuter.
   * Nyckeln är användar-id för inloggade, annars IP — landningssidan säljer
   * även till utloggade besökare.
   */
  coachingCheckout: { max: 5, windowMs: 10 * 60 * 1000 } as LimitConfig, // 5/10min
  /** Prisuppslaget bakom coachningskortet — cachat i isolatet, men publikt. */
  coachingOffer: { max: 60, windowMs: 60 * 1000 } as LimitConfig, // 60/min
  /**
   * Öppna tidsväljaren. Generösare än kassan: varje anrop är bara en rad och en
   * länk, och den som backar ur bokningen och försöker igen ska inte låsas ute
   * från ett köp. Raden i sig kostar ingenting förrän en tid faktiskt bokas.
   */
  coachingBooking: { max: 15, windowMs: 10 * 60 * 1000 } as LimitConfig, // 15/10min
  /**
   * Kvalificeringsformuläret ("ring mig om studieupplägget"). Snävare än
   * kassan: varje rad blir ett telefonsamtal någon faktiskt ska ringa, så
   * skräp kostar arbetstid och inte bara diskutrymme. Nyckeln är IP —
   * formuläret är öppet för utloggade.
   */
  coachingLead: { max: 3, windowMs: 60 * 60 * 1000 } as LimitConfig, // 3/h
  /**
   * Verifieringsmejl. Utskicket kostar pengar och mottagarens tålamod, så
   * "skicka igen" får gå några gånger i timmen men inte i en loop. Nyckeln är
   * användar-id och inte IP: två personer på samma skolnät ska inte kunna
   * låsa varandra ute från sitt eget konto.
   */
  verificationEmail: { max: 5, windowMs: 60 * 60 * 1000 } as LimitConfig, // 5/h
  /**
   * Inlösen av verifieringslänk. Per IP, och rundligt tilltaget — en riktig
   * användare klickar en gång, men mejlklienter förhandshämtar länkar.
   * Gissning av token är ändå ogörligt (32 byte slump).
   */
  verificationRedeem: { max: 30, windowMs: 60 * 60 * 1000 } as LimitConfig, // 30/h
  /**
   * Sparat provförsök. Ett provpass tar 55 minuter att skriva, så taket är
   * rundligt tilltaget även för den som skriver om ett pass flera gånger —
   * det är inte den här som ska hindra spam, det är unikindexet på
   * (user_id, term, pass) som gör att raderna inte kan bli fler än proven.
   */
  provAttempt: { max: 40, windowMs: 60 * 60 * 1000 } as LimitConfig, // 40/h
  /**
   * Påbörjat provpass. Öppen för utloggade och nyckeln är därför IP, vilket
   * gör taket rundligt: ett skolnät ligger bakom en adress. Ett provpass tar
   * 55 minuter att skriva, så det som faktiskt bromsas är någon som anropar
   * endpointen i en loop — och den är värd att bromsa, eftersom varje rad
   * räknas in i "matcher spelade" på landningssidan.
   */
  provStart: { max: 60, windowMs: 60 * 60 * 1000 } as LimitConfig, // 60/h
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
