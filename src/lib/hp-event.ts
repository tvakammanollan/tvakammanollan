/**
 * Event-strukturerad data för högskoleprovets provdatum.
 *
 * Ligger för sig, och inte i route-filen, av två skäl: den ska gå att testa
 * utan att rendera en sida, och den beskriver ett prov som någon annan håller
 * i — påståendena här hamnar i Googles sökresultat och ska vara kontrollerade
 * mot UHR, inte hopskrivna i en `head()`.
 *
 * Bakgrund (2026-08-20): Search Console rapporterade fyra "mindre allvarliga"
 * varningar på /hogskoleprovet-datum — `image`, `offers`, `endDate` och
 * `performer` saknades. Alla fyra är rekommenderade fält i Googles
 * Event-dokumentation. De är tillagda här; ändrar du objektet, kontrollera
 * mot https://search.google.com/test/rich-results innan du pushar.
 */
import {
  HP_CURRENCY,
  HP_DATES,
  HP_DAY_END,
  HP_DAY_START,
  HP_FEE_SEK,
  HP_INFO_URL,
  HP_REGISTRATION_URL,
  hpDateLong,
  hpDateTime,
  type HpExamDate,
} from "./hp-dates";
import { formatDate } from "./sv-format";

const ORIGIN = "https://tvakommanollan.se";
const PATH = "/hogskoleprovet-datum";
const UHR = "Universitets- och högskolerådet (UHR)";

/**
 * Bilder i Googles tre önskade bildformat (16:9, 4:3, 1:1), alla 1200 px
 * breda. Ritas av `scripts/build-event-image.py` — redigera inte PNG:erna
 * för hand. De måste vara crawl-bara; ligger de bakom en Disallow i
 * robots.txt räknas `image` som saknat igen.
 */
export const HP_EVENT_IMAGES = [
  "/hp-event-16x9.png",
  "/hp-event-4x3.png",
  "/hp-event-1x1.png",
] as const;

/** Provtillfälle med publicerad anmälningsperiod. */
export type HpExamDateWithWindow = HpExamDate &
  Required<Pick<HpExamDate, "registrationOpens" | "registrationCloses">>;

export function hasRegistrationWindow(
  entry: HpExamDate,
): entry is HpExamDateWithWindow {
  return Boolean(entry.registrationOpens && entry.registrationCloses);
}

/**
 * Anmälan öppnar 08:00 och stänger vid midnatt sista anmälningsdagen — det
 * är UHR:s egen formulering ("stänger vid midnatt den 14 januari").
 */
const OPENS_AT = "08:00";
const CLOSES_AT = "23:59";

/**
 * `offers.availability` speglar anmälningsperioden.
 *
 * `SoldOut` betyder här "anmälan är stängd". Det är inte ordagrant sant —
 * provet blev inte slutsålt, perioden tog slut — men Google känner bara igen
 * InStock, PreOrder och SoldOut, och av de tre är det bara SoldOut som säger
 * "du kan inte anmäla dig nu". Att låta den stå kvar på InStock hade skickat
 * folk till en anmälan som inte går att göra.
 */
export function offerAvailability(
  entry: HpExamDateWithWindow,
  now: Date = new Date(),
): string {
  const t = now.getTime();
  if (t < Date.parse(hpDateTime(entry.registrationOpens, OPENS_AT))) {
    return "https://schema.org/PreOrder";
  }
  if (t <= Date.parse(hpDateTime(entry.registrationCloses, CLOSES_AT))) {
    return "https://schema.org/InStock";
  }
  return "https://schema.org/SoldOut";
}

/**
 * Anmälningsperioden i löptext: "11–18 augusti 2026", eller
 * "28 mars–4 april 2027" när perioden spänner över ett månadsskifte.
 *
 * Samma UTC-låsning som `hpDateLong` — se kommentaren där.
 */
export function registrationPeriodText(entry: HpExamDateWithWindow): string {
  const from = new Date(`${entry.registrationOpens}T12:00:00Z`);
  const to = new Date(`${entry.registrationCloses}T12:00:00Z`);
  const fromText =
    from.getUTCMonth() === to.getUTCMonth()
      ? String(from.getUTCDate())
      : formatDate(from, { day: "numeric", month: "long", timeZone: "UTC" });
  const toText = formatDate(to, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${fromText}–${toText}`;
}

export function hpEventJsonLd(
  entry: HpExamDateWithWindow,
  now: Date = new Date(),
): Record<string, unknown> {
  const provdag = hpDateLong(entry.date);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    // Stabil identitet per provtillfälle. Tre Event på samma sida utan @id
    // är tre anonyma noder som Google får para ihop själv.
    "@id": `${ORIGIN}${PATH}#${entry.date}`,
    url: `${ORIGIN}${PATH}`,
    name: `Högskoleprovet – ${entry.label}`,
    startDate: hpDateTime(entry.date, HP_DAY_START),
    endDate: hpDateTime(entry.date, HP_DAY_END),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    inLanguage: "sv-SE",
    image: HP_EVENT_IMAGES.map((p) => ORIGIN + p),
    location: {
      "@type": "Place",
      name: "Provorter i hela Sverige",
      address: { "@type": "PostalAddress", addressCountry: "SE" },
    },
    organizer: {
      "@type": "Organization",
      name: UHR,
      url: HP_INFO_URL,
    },
    // UHR är både den som anordnar provet och den som genomför det på ~120
    // provorter. `performer` är skriven för konserter, men schema.org
    // tillåter Organization och UHR är det enda ärliga svaret på "vem
    // utför det här".
    performer: {
      "@type": "Organization",
      name: UHR,
      url: HP_INFO_URL,
    },
    offers: {
      "@type": "Offer",
      name: "Anmälan till högskoleprovet",
      url: HP_REGISTRATION_URL,
      price: String(HP_FEE_SEK),
      priceCurrency: HP_CURRENCY,
      availability: offerAvailability(entry, now),
      validFrom: hpDateTime(entry.registrationOpens, OPENS_AT),
      validThrough: hpDateTime(entry.registrationCloses, CLOSES_AT),
    },
    description:
      `Högskoleprovet ${entry.label} skrivs ${provdag} på cirka 120 provorter i Sverige. ` +
      `Provdagen börjar 08.10 och slutar cirka 16.55. Anmälan ${registrationPeriodText(entry)} ` +
      `på hogskoleprov.nu, provavgift ${HP_FEE_SEK} kronor.`,
  };
}

/** Alla provtillfällen som får Event-data (de med publicerad anmälningsperiod). */
export function hpEvents(now: Date = new Date()): Record<string, unknown>[] {
  return HP_DATES.filter(hasRegistrationWindow).map((e) => hpEventJsonLd(e, now));
}
