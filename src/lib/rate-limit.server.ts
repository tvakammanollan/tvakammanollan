// Server-only rate-limit-hjälpare (följer *.server.ts-konventionen).
// Bygger på den rena in-memory-limitern i ./rate-limit — per-isolate/region
// på Cloudflare, dvs. en absolut spärr mot hamring, inte en exakt global kvot.
import { getRequest } from "@tanstack/react-start/server";
import { rateLimit, type LimitConfig } from "./rate-limit";
import { formatWaitTime } from "./wait-time";

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

/**
 * Kasta ett användarvänligt svenskt fel om gränsen är nådd.
 *
 * Väntetiden skrevs tidigare alltid i sekunder, vilket gav "Försök igen om
 * 3501 sekunder" på en timkvot: rätt tal, fel enhet, och det läser som en bugg
 * i stället för som en gräns. `formatWaitTime` väljer enhet.
 */
export function assertRateLimit(key: string, cfg: LimitConfig): void {
  const r = rateLimit(key, cfg);
  if (!r.ok) {
    throw new Error(`För många försök. Försök igen om ${formatWaitTime(r.resetIn)}.`);
  }
}
