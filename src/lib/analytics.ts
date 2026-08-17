/**
 * PostHog — produktanalys bakom samtycke.
 *
 * Två regler styr hela filen:
 *
 * 1. posthog-js får ALDRIG importeras statiskt. En statisk import hamnar i
 *    huvudbundlen och körs vid sidladdning, alltså innan användaren hunnit
 *    svara — vilket är precis det ePrivacy förbjuder. Paketet hämtas därför
 *    med dynamisk import() först efter ett ja (se consent.ts).
 * 2. Analys får aldrig kunna krascha appen. Allt är best-effort: saknas nyckel,
 *    blockeras skriptet eller failar nätverket så fortsätter sajten som vanligt.
 *
 * Instansen hostas i EU (eu.i.posthog.com) — ingen tredjelandsöverföring.
 */
// consent.ts är ren logik utan react och utan posthog-beroende — ingen cykel,
// och inget av posthog dras in i huvudbundlen av den här importen.
import { hasAnalyticsConsent } from "./consent";

/**
 * Typen härleds ur modulen istället för att importeras vid namn. posthog-js
 * har flyttat runt på sina exporter mellan versioner (PostHog vs.
 * PostHogInterface), medan default-exporten legat still — den här formen
 * följer med utan att behöva rättas.
 */
type PostHogClient = (typeof import("posthog-js"))["default"];

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) || "https://eu.i.posthog.com";

/** Utan nyckel finns inget att samtycka till — då ska bannern inte ens visas. */
export function analyticsConfigured(): boolean {
  return typeof POSTHOG_KEY === "string" && POSTHOG_KEY.length > 0;
}

let client: PostHogClient | null = null;
let starting: Promise<PostHogClient | null> | null = null;

/**
 * Händelser som hann avfyras innan skriptet laddat.
 *
 * posthog-js köar egna anrop internt, men bara sådana som gjorts på instansen —
 * och instansen finns inte förrän dynamiska import() gått i mål. Allt som
 * händer under de första hundradelarna (sidvisningen, en händelse i en
 * useEffect vid montering) träffade `client?.capture` med client === null och
 * försvann utan spår. Kön är hård taket 50 poster: utan samtycke töms den
 * aldrig, och då ska den inte heller kunna växa.
 */
const queued: Array<{ event: string; props?: Record<string, unknown> }> = [];
const MAX_QUEUED = 50;

function flushQueued(ph: PostHogClient): void {
  if (queued.length === 0) return;
  const batch = queued.splice(0, queued.length);
  for (const item of batch) {
    try {
      ph.capture(item.event, item.props);
    } catch {
      /* best-effort */
    }
  }
}

/**
 * Laddar och startar PostHog. Idempotent — upprepade anrop returnerar samma
 * instans, och parallella anrop delar samma pågående laddning.
 *
 * Anropas bara från platser som redan kontrollerat samtycke.
 */
export async function startAnalytics(): Promise<PostHogClient | null> {
  if (typeof window === "undefined") return null;
  // Redan laddat. Instansen kan ha stängts av av stopAnalytics (samtycket togs
  // tillbaka och sattes tillbaka igen inom samma sidvisning) — då räcker det
  // inte att returnera den, opt-outen måste hävas först.
  if (client) {
    try {
      if (client.has_opted_out_capturing?.()) client.opt_in_capturing?.();
      client.startSessionRecording?.();
    } catch {
      /* best-effort */
    }
    flushQueued(client);
    return client;
  }
  if (starting) return starting;
  if (!analyticsConfigured()) return null;

  starting = (async () => {
    try {
      const { default: posthog } = await import("posthog-js");
      posthog.init(POSTHOG_KEY as string, {
        api_host: POSTHOG_HOST,
        ui_host: "https://eu.posthog.com",
        // Vi laddas först efter ja — ingen anledning att starta avstängd.
        opt_out_capturing_by_default: false,
        // SPA: PostHogs egen sidvisningsdetektering missar TanStack Routers
        // navigeringar, så $pageview skickas manuellt från <Analytics />.
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
        // Hette enable_heatmaps förr — den nyckeln finns inte kvar i typerna.
        capture_heatmaps: true,
        // Klick som inte ledde till någonting. Det är så man hittar en knapp
        // som ser klickbar ut men inte är det — autocapture räknar bara de
        // klick som faktiskt träffade något.
        capture_dead_clicks: true,
        // Web vitals (LCP/CLS/INP/FCP) + nätverkstider i inspelningarna. Utan
        // den här är "sidan känns seg" en åsikt i stället för en siffra.
        capture_performance: { web_vitals: true, network_timing: true },
        // Fel har en egen väg (/api/telemetry) och ska inte in i produkt-
        // analysen — de dränker funnels och kostar events. Uttryckligen av, så
        // att PostHogs fjärrkonfiguration inte slår på det i vårt ställe.
        capture_exceptions: false,
        // "always" skulle göra varje anonym sökbesökare till en person och
        // varje händelse till ett identifierat event — upp till 4x dyrare per
        // event, och personsiffrorna blir oläsbara på en sajt som lever på
        // organisk trafik. Inloggade identifieras ändå explicit via
        // identifyAnalyticsUser() i <Analytics />, så ingenting går förlorat.
        person_profiles: "identified_only",
        persistence: "localStorage+cookie",
        session_recording: {
          // Fritextfält på sajten är i praktiken mejl, användarnamn och
          // rumskoder — inget av det ska hamna i en inspelning. Svaren är
          // knapptryck och syns ändå.
          maskAllInputs: true,
          maskTextSelector: "[data-ph-mask]",
        },
      });
      // Ingen `loaded`-callback behövs: default-exporten ÄR singletonen, och
      // anrop före laddning köas internt av posthog-js.
      client = posthog;
      // Allt som avfyrades medan importen pågick.
      flushQueued(posthog);
      return posthog;
    } catch (error) {
      console.warn("[analytics] kunde inte starta PostHog:", error);
      return null;
    } finally {
      starting = null;
    }
  })();

  return starting;
}

/**
 * Stoppar insamlingen och slänger den lokala identiteten. Används när
 * användaren tar tillbaka sitt samtycke — skriptet ligger kvar i minnet till
 * nästa sidladdning, men slutar skicka och glömmer vem det såg.
 */
export function stopAnalytics(): void {
  // Återtaget samtycke gäller också det som ligger och väntar — annars skulle
  // kön tömmas mot PostHog nästa gång någon säger ja.
  queued.length = 0;
  try {
    client?.stopSessionRecording?.();
    client?.opt_out_capturing?.();
    client?.reset?.();
  } catch {
    /* best-effort */
  }
}

/**
 * Kopplar händelserna till Supabase-användaren. Gäst-ID:n är också riktiga
 * ID:n — de skiljer inte i PostHog, men `is_guest` gör dem filtrerbara.
 */
export function identifyAnalyticsUser(
  userId: string,
  props?: { is_guest?: boolean; username?: string | null },
): void {
  try {
    client?.identify(userId, {
      is_guest: props?.is_guest ?? false,
      // Användarnamnet är självvalt och visas redan publikt på topplistan.
      username: props?.username ?? undefined,
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Egenskaper som hängs på VARJE händelse tills sidan laddas om.
 *
 * Skillnaden mot personegenskaper spelar roll: super properties följer med in i
 * händelsen och gör den filtrerbar i efterhand ("visa bara matcher spelade av
 * gäster"), medan personegenskaper alltid speglar nuläget och därför inte går
 * att bygga historik på.
 */
export function registerAnalyticsProperties(props: Record<string, unknown>): void {
  try {
    client?.register(props);
  } catch {
    /* best-effort */
  }
}

/**
 * Nuläget för användaren — ELO, rank, streak. Används för kohorter och
 * segmentering, inte för enskilda händelser.
 *
 * Bara identifierade profiler har en personpost (`person_profiles:
 * "identified_only"`), så det här är en no-op för utloggade besökare.
 */
export function setAnalyticsPersonProperties(props: Record<string, unknown>): void {
  try {
    client?.setPersonProperties(props);
  } catch {
    /* best-effort */
  }
}

/** Vid utloggning: nollställ identiteten så nästa besökare inte ärver den. */
export function resetAnalyticsUser(): void {
  try {
    client?.reset();
  } catch {
    /* best-effort */
  }
}

export function captureAnalytics(event: string, props?: Record<string, unknown>): void {
  try {
    if (client) {
      client.capture(event, props);
      return;
    }
    // Inget samtycke → händelsen ska inte ens sparas undan. Grinden ligger kvar
    // exakt som förut; det enda som ändrats är att ett ja inte längre kräver
    // att skriptet redan hunnit ladda.
    if (typeof window === "undefined" || !analyticsConfigured()) return;
    if (!hasAnalyticsConsent()) return;
    if (queued.length < MAX_QUEUED) queued.push({ event, props });
  } catch {
    /* best-effort */
  }
}

export function capturePageview(path: string): void {
  captureAnalytics("$pageview", { $current_url: window.location.href, path });
}
