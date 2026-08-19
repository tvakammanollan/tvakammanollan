/**
 * Datumräkningen bakom streaken — ren, testbar och i svensk tid.
 *
 * Streaken räknades tidigare med `new Date().toISOString().slice(0,10)`, alltså
 * i UTC. Sverige ligger en eller två timmar före, och det ger ett fönster varje
 * kväll där appen och användaren inte är överens om vilken dag det är:
 *
 *   * Ett pass klockan 00:30 natten till tisdag skrevs som *måndag*. Spelade
 *     man sedan igen på tisdagen räknades det inte — `last_active_date` stod
 *     redan på måndag, alltså "redan räknad idag", och streaken stod stilla.
 *   * Omvänt: den som spelade 00:30 på tisdag och sedan 23:00 på onsdag hade
 *     enligt UTC hoppat över en dag (måndag → onsdag) och fick streaken nollad
 *     trots att hen spelat två dagar i rad.
 *
 * Allt räknas därför i `Europe/Stockholm`. Datumsträngen är fortfarande
 * `YYYY-MM-DD` och jämförs som text, precis som kolumnen i databasen.
 */

export const STREAK_TIMEZONE = "Europe/Stockholm";

/**
 * Kalenderdatumet i svensk tid, som `YYYY-MM-DD`.
 *
 * `sv-SE` ger redan ISO-formatet, så ingen egen hopsättning av delar behövs —
 * och det är just hopsättningen som brukar bli fel över årsskiften.
 */
export function stockholmDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: STREAK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** Dagen före ett `YYYY-MM-DD`-datum. Räknar på datumet, inte på klockan. */
export function previousDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  // UTC-midnatt som räknehjälp: datumet är redan omvandlat till svensk tid,
  // så här handlar det bara om att backa ett dygn i kalendern. Att göra det i
  // UTC gör att sommartidsskiftet inte kan flytta resultatet.
  const at = new Date(Date.UTC(y, m - 1, d));
  at.setUTCDate(at.getUTCDate() - 1);
  return at.toISOString().slice(0, 10);
}

export type StreakStep =
  | { kind: "already-counted" }
  | { kind: "continued"; streak: number }
  | { kind: "restarted"; broken: boolean };

/**
 * Vad ett pass idag gör med streaken.
 *
 * `lastActive` är `users.last_active_date` (eller null för den som aldrig
 * spelat). Returnerar bara beslutet — skrivningen sker i `updateStreak`.
 */
export function streakStep(
  lastActive: string | null,
  currentStreak: number,
  today: string = stockholmDate(),
): StreakStep {
  if (lastActive === today) return { kind: "already-counted" };
  if (lastActive === previousDate(today)) {
    return { kind: "continued", streak: Math.max(0, currentStreak) + 1 };
  }
  // Framtida datum (klockan har gått fel, eller raden är importerad) behandlas
  // som ett avbrott och inte som "fortsatt" — annars kan en felställd klocka
  // ge en streak som växer utan att någon spelar.
  return { kind: "restarted", broken: currentStreak >= 1 && lastActive !== null };
}
