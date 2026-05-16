/**
 * Officiella Högskoleprovs-datum.
 *
 * Provet hålls två gånger per år (vår + höst), oftast en lördag.
 * Datumen kommer från Universitets- och högskolerådet (UHR) och
 * publiceras ~1 år i förväg på studera.nu / studera.se. Uppdatera
 * den här listan i takt med att nya datum officialiseras.
 */
export type HpSession = "vår" | "höst";

export interface HpExamDate {
  /** ISO YYYY-MM-DD i Europe/Stockholm. */
  date: string;
  /** Etikett som visas i UI (ex. "HP Höst 2026"). */
  label: string;
  session: HpSession;
}

export const HP_DATES: readonly HpExamDate[] = [
  // 2026
  { date: "2026-10-24", label: "HP Höst 2026", session: "höst" },
  // 2027 (preliminära — uppdatera när UHR officialiserat)
  { date: "2027-03-27", label: "HP Vår 2027", session: "vår" },
  { date: "2027-10-23", label: "HP Höst 2027", session: "höst" },
] as const;

/**
 * Returnerar nästa kommande HP, eller null om listan är tom/utgången.
 * Räknas mot provets dag (start 08:00 stockholmstid).
 */
export function getNextHpDate(now: Date = new Date()): {
  date: Date;
  label: string;
  session: HpSession;
} | null {
  const nowTime = now.getTime();
  for (const entry of HP_DATES) {
    // Provet startar typiskt 08:00 svensk tid.
    const d = new Date(entry.date + "T08:00:00+02:00");
    if (d.getTime() > nowTime) {
      return { date: d, label: entry.label, session: entry.session };
    }
  }
  return null;
}

/**
 * Räknar ut dagar/timmar/minuter/sekunder kvar till ett målddatum.
 */
export function timeUntil(target: Date, now: Date = new Date()) {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const totalHours = Math.floor(diff / 3600000);
  return { days, hours, minutes, seconds, totalHours, totalMs: diff };
}
