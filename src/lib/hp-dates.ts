/**
 * Officiella Högskoleprovs-datum.
 *
 * Provet hålls två gånger per år: **vårprovet på en lördag i april** och
 * **höstprovet på en söndag i oktober** (söndag sedan 2022 — listan hade
 * lördagsdatum för båda fram till 2026-08-20, alltså fel dag *och* fel
 * datum på samtliga tre poster).
 *
 * Datumen kommer från UHR och publiceras ~1 år i förväg. Kontrollera mot
 * uhr.se:s kalender, studera.nu och hogskoleprov.nu — alla tre ska säga
 * samma sak innan ett datum läggs in här.
 *
 * **Lägg aldrig in ett gissat datum.** Listan matas rakt in i
 * Event-strukturerad data på /hogskoleprovet-datum, alltså i det Google kan
 * visa som provdatum i sökresultatet. Ett datum som inte är publicerat hör
 * inte hemma här — sidan skriver då i stället ut att kommande datum
 * publiceras senare.
 */
import { formatDate } from "./sv-format";

export type HpSession = "vår" | "höst";

export interface HpExamDate {
  /** ISO YYYY-MM-DD i Europe/Stockholm. */
  date: string;
  /** Etikett som visas i UI (ex. "HP Höst 2026"). */
  label: string;
  session: HpSession;
  /**
   * Anmälan öppnar / sista anmälningsdag (ISO-datum, anmälan stänger vid
   * midnatt sista dagen).
   *
   * Frivilliga, men utan dem får provtillfället **ingen** Event-data — se
   * `hasRegistrationWindow` i `hp-event.ts`. Google vill ha `validFrom` på
   * ett `offers`, och ett halvt `offers` ger tillbaka exakt den varning
   * fältet finns för att ta bort.
   */
  registrationOpens?: string;
  registrationCloses?: string;
}

export const HP_DATES: readonly HpExamDate[] = [
  {
    date: "2026-10-18",
    label: "HP Höst 2026",
    session: "höst",
    registrationOpens: "2026-08-11",
    registrationCloses: "2026-08-18",
  },
  {
    date: "2027-04-10",
    label: "HP Vår 2027",
    session: "vår",
    registrationOpens: "2027-01-07",
    registrationCloses: "2027-01-14",
  },
] as const;

/** Provavgift i kronor. Betalas i samband med anmälan och återbetalas inte. */
export const HP_FEE_SEK = 550;
export const HP_CURRENCY = "SEK";

/**
 * Anmälan sker på hogskoleprov.nu — **inte** på antagning.se, som är ansökan
 * till utbildningar. Sidan hänvisade fel fram till 2026-08-20.
 */
export const HP_REGISTRATION_URL = "https://www.hogskoleprov.nu/";
/** UHR:s egen informationssida om provet. */
export const HP_INFO_URL = "https://www.studera.nu/hogskoleprov/";

/**
 * Provdagens ram enligt UHR:s egen kalenderpost: 08:00–17:00.
 *
 * Deltagaren ska vara på plats 08:10, första provpasset börjar 09:00, fem
 * pass à 55 minuter, och dagen avslutas ~16:55. Ramen är den som används i
 * `startDate`/`endDate` — ett prov utan sluttid är en av de fyra varningar
 * Search Console rapporterade 2026-08-20.
 */
export const HP_DAY_START = "08:00";
export const HP_DAY_END = "17:00";

/** Sista söndagen i en månad, kl 01:00 UTC — EU:s tidpunkt för sommartidsbytet. */
function lastSundayAt01Utc(year: number, month0: number): number {
  const lastDay = new Date(Date.UTC(year, month0 + 1, 0));
  const day = lastDay.getUTCDate() - lastDay.getUTCDay();
  return Date.UTC(year, month0, day, 1);
}

/**
 * UTC-offset för Europe/Stockholm ett givet kalenderdatum.
 *
 * Hårdkodat "+02:00" var fel så snart ett prov landar efter sista söndagen i
 * oktober: höstprovet 2025 skrevs 26 oktober, dagen efter bytet, alltså
 * +01:00. Nedräkningen hade då legat en timme fel och Event-datan pekat ut
 * fel klockslag. Sommartid gäller från sista söndagen i mars 01:00 UTC till
 * sista söndagen i oktober 01:00 UTC.
 */
export function stockholmOffset(isoDate: string): "+01:00" | "+02:00" {
  const [y, m, d] = isoDate.split("-").map(Number);
  // Mät mitt på dagen: bytet sker nattetid, så middag kan aldrig hamna i
  // den timme som är tvetydig.
  const noonUtc = Date.UTC(y, m - 1, d, 12);
  const summer = noonUtc >= lastSundayAt01Utc(y, 2) && noonUtc < lastSundayAt01Utc(y, 9);
  return summer ? "+02:00" : "+01:00";
}

/** ISO-8601 med rätt svensk offset, ex. `2026-10-18T08:00:00+02:00`. */
export function hpDateTime(isoDate: string, hhmm: string): string {
  return `${isoDate}T${hhmm}:00${stockholmOffset(isoDate)}`;
}

/**
 * "söndag 18 oktober 2026" — samma sträng oavsett var koden kör.
 *
 * Datumet formas från kl 12:00 UTC och skrivs ut i UTC. Utan den låsningen
 * beror texten på läsarens tidszon: servern renderar i UTC och webbläsaren i
 * sin egen, vilket ger en hydreringsmiss för alla öster om Sverige — och
 * `timeZone: "Europe/Stockholm"` löser det bara om runtime har full ICU,
 * vilket inte är något att förlita sig på i en Worker.
 */
export function hpDateLong(isoDate: string): string {
  return formatDate(new Date(`${isoDate}T12:00:00Z`), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "18 oktober 2026" — samma UTC-låsning som `hpDateLong`, utan veckodag. */
export function hpDateShort(isoDate: string): string {
  return formatDate(new Date(`${isoDate}T12:00:00Z`), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Svaret på "När är nästa högskoleprov?", byggt ur listan.
 *
 * Samma mening stod handskriven på tre ställen — FAQ-sidan, FAQPage-datan i
 * `__root.tsx` och `public/llms.txt` — och alla tre bar kvar de gamla, felaktiga
 * datumen och hänvisade dessutom till antagning.se. Två av dem är
 * strukturerad data, alltså text Google kan visa som ett svar.
 *
 * `llms.txt` är en statisk fil och måste fortfarande rättas för hand.
 */
export function hpDatesAnswer(): string {
  const parts = HP_DATES.map(
    (d) => `${hpDateShort(d.date)} (${d.session === "höst" ? "höstprovet" : "vårprovet"})`,
  );
  const list =
    parts.length > 1
      ? `${parts.slice(0, -1).join(", ")} och ${parts[parts.length - 1]}`
      : (parts[0] ?? "");
  return (
    "Högskoleprovet ges två gånger per år: vårprovet på en lördag i april och " +
    `höstprovet på en söndag i oktober. Kommande datum: ${list}. Anmälan görs på ` +
    `hogskoleprov.nu under en kort period ett par månader före provdagen och ` +
    `provavgiften är ${HP_FEE_SEK} kronor.`
  );
}

/**
 * Returnerar nästa kommande HP, eller null om listan är tom/utgången.
 * Räknas mot provdagens början.
 */
export function getNextHpDate(now: Date = new Date()): {
  date: Date;
  label: string;
  session: HpSession;
  entry: HpExamDate;
} | null {
  const nowTime = now.getTime();
  for (const entry of HP_DATES) {
    const d = new Date(hpDateTime(entry.date, HP_DAY_START));
    if (d.getTime() > nowTime) {
      return { date: d, label: entry.label, session: entry.session, entry };
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
