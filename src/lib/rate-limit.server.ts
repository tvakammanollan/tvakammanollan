// Server-only rate-limit-hjälpare (följer *.server.ts-konventionen).
// Bygger på den rena in-memory-limitern i ./rate-limit — per-isolate/region
// på Cloudflare, dvs. en absolut spärr mot hamring, inte en exakt global kvot.
import { getRequest } from "@tanstack/react-start/server";
import { rateLimit, type LimitConfig } from "./rate-limit";

/**
 * Nyckel per klient-IP (Cloudflare `cf-connecting-ip`, fallback
 * `x-forwarded-for`). Utan IP: global nyckel per isolate.
 */
export function ipKey(prefix: string): string {
  try {
    const req = getRequest();
    const ip =
      req?.headers?.get("cf-connecting-ip") ??
      req?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
    return `${prefix}:${ip ?? "global"}`;
  } catch {
    return `${prefix}:global`;
  }
}

/** Kasta ett användarvänligt svenskt fel om gränsen är nådd. */
export function assertRateLimit(key: string, cfg: LimitConfig): void {
  const r = rateLimit(key, cfg);
  if (!r.ok) {
    const s = Math.max(1, Math.ceil(r.resetIn / 1000));
    throw new Error(`Lugna dig lite. Försök igen om ${s} sekunder.`);
  }
}
