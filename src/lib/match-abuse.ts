/**
 * Spärrar mot matchspam och ELO-odling.
 *
 * Bakgrund (2026-08-16): fyra anonyma konton körde 20–300 botmatcher var på ett
 * dygn och tog hela toppen av den verbala topplistan, det översta på 2226 ELO.
 * Inget stoppade dem:
 *   - `createMatch` hade en 30-sekunderscooldown som uttryckligen **hoppade
 *     över botmatcher**, vilket är exakt det läge som ger ELO utan motpart.
 *   - `assertRateLimit` lever per Cloudflare-isolat och är därför en broms mot
 *     hamring, inte en kvot. Samma trick som forumet löste i databasen.
 *
 * Två lager, båda räknade mot riktiga rader:
 *   1. Volymkvot på hur många matcher ett konto får *skapa* (timme/dygn).
 *   2. Tidsgolv innan en match får ge ELO — en match som "spelats" på under två
 *      sekunder per fråga är automatiserad, oavsett hur många det är.
 *
 * Modulen är avsiktligt ren (inga DB-anrop) så den kan enhetstestas; anroparen
 * hämtar siffrorna och verkställer beslutet.
 */

/** Hur många matcher ett konto får skapa per tidsfönster. */
export const MATCH_QUOTA = {
  /** En match är 5 minuter, så 12/h är taket för någon som faktiskt spelar. */
  perHour: 20,
  /** ~7 timmars sammanhängande spel. Odlaren låg på 300/dygn. */
  perDay: 80,
} as const;

/**
 * Minsta rimliga sekunder per fråga innan en match får ge ELO.
 * Ett verbalt pass har 8 frågor → golvet blir 16 sekunder. Att läsa och
 * besvara en ORD-uppgift på under två sekunder går inte; att klicka igenom
 * åtta av dem gör det bara om en maskin gör det.
 */
export const MIN_SECONDS_PER_QUESTION = 2;

export type QuotaVerdict = { ok: true } | { ok: false; message: string };

/**
 * Avgör om ett konto får skapa ännu en match.
 *
 * Meddelandet går rakt till användaren och ska vara svenskt och begripligt —
 * en riktig spelare som råkar slå i taket ska förstå att det är en paus, inte
 * ett fel.
 */
export function checkMatchQuota(createdLastHour: number, createdLastDay: number): QuotaVerdict {
  if (createdLastDay >= MATCH_QUOTA.perDay) {
    return {
      ok: false,
      message: `Du har startat ${MATCH_QUOTA.perDay} matcher det senaste dygnet. Ta en paus och kom tillbaka imorgon.`,
    };
  }
  if (createdLastHour >= MATCH_QUOTA.perHour) {
    return {
      ok: false,
      message: `Du har startat ${MATCH_QUOTA.perHour} matcher den senaste timmen. Vänta en stund innan du startar fler.`,
    };
  }
  return { ok: true };
}

/**
 * Är matchen avklarad så snabbt att ingen människa kan ha spelat den?
 *
 * `elapsedSeconds` mäts från matchens `created_at` till inlämningen. För
 * privata rum är den tiden alltid *längre* än speltiden (rummet står och väntar
 * på motståndaren), så golvet kan aldrig slå fel där — bara på botmatcher, som
 * startar och spelas direkt.
 */
export function isImplausiblyFast(elapsedSeconds: number, questionCount: number): boolean {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) return true;
  if (questionCount <= 0) return false;
  return elapsedSeconds < questionCount * MIN_SECONDS_PER_QUESTION;
}
