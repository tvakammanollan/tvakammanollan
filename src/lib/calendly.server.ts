/**
 * Calendly över REST — ingen SDK, av samma skäl som Stripe (se `stripe.server.ts`):
 * Workers kör inte Node, vi behöver två GET-anrop, och varje ny dependency
 * betyder att både `package-lock.json` och `bun.lock` måste hållas i synk.
 *
 * Vad den används till: köparen väljer en tid i Calendly-iframen i
 * coachningsmodalen, och webbläsaren får då bara två URI:er via `postMessage`.
 * Själva tiden står inte där — den måste hämtas härifrån. Utan det anropet
 * skulle raden i `coaching_requests` sakna tiden, och tacksidan inte kunna
 * skriva "vi ses tisdag 14:00".
 *
 * `CALENDLY_API_TOKEN` är en hemlighet (krypterad Cloudflare-Secret, lokalt i
 * `.env.local`). `CALENDLY_EVENT_URL` är den publika bokningslänken och ligger
 * i `wrangler.jsonc`.
 */

const CALENDLY_API = "https://api.calendly.com";

/** Publikt felmeddelande. Detaljerna loggas server-side och stannar där. */
const GENERIC_ERROR = "Tiden kunde inte läsas in just nu. Försök igen om en stund.";

/**
 * Invitee-URI:n kommer från webbläsaren och stoppas rakt in i en URL som vi
 * skickar vårt Bearer-token till. Utan det här mönstret är det en SSRF: en
 * klient som skickar `https://elak.example/` får vårt Calendly-token med på
 * köpet. Formen är låst till exakt den resurs vi tänker läsa.
 */
export const INVITEE_URI_PATTERN =
  /^https:\/\/api\.calendly\.com\/scheduled_events\/[0-9a-f-]{36}\/invitees\/[0-9a-f-]{36}$/i;

export function isCalendlyInviteeUri(uri: string): boolean {
  return INVITEE_URI_PATTERN.test(uri.trim());
}

export function calendlyToken(): string | null {
  const token = process.env.CALENDLY_API_TOKEN?.trim();
  return token ? token : null;
}

/** Den publika bokningslänken, t.ex. `https://calendly.com/niklas/studieupplagg`. */
export function calendlyEventUrl(): string | null {
  const raw = process.env.CALENDLY_EVENT_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname.endsWith("calendly.com")) {
      console.error(`[calendly] CALENDLY_EVENT_URL ser inte ut som en Calendly-länk: ${raw}`);
      return null;
    }
    // Frågesträngen sätts av oss (förifyllning + utm_content); en som redan
    // ligger i env skulle skrivas över ändå, så den plockas bort direkt.
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    console.error(`[calendly] CALENDLY_EVENT_URL går inte att tolka: ${raw}`);
    return null;
  }
}

/**
 * Är tidsbokningen påslagen i den här miljön?
 *
 * Båda krävs: utan länken finns inget att bädda in, och utan token går den
 * valda tiden inte att läsa tillbaka. Är svaret false faller köpflödet tillbaka
 * på den gamla vägen (rakt till Stripe) i stället för att gå sönder.
 */
export function calendlyConfigured(): boolean {
  return calendlyEventUrl() !== null && calendlyToken() !== null;
}

/**
 * Bokningslänken som iframen laddar.
 *
 * `embed_domain` krävs av Calendly för att de ska skicka `postMessage` till
 * oss över huvud taget. `utm_content` bär vårt `coaching_requests.id` och är
 * det som knyter bokningen till rätt rad — den kommer tillbaka i invitee-
 * resursens `tracking`.
 */
export function buildSchedulingUrl(input: {
  eventUrl: string;
  /** Värdnamnet iframen bäddas in på, utan protokoll. */
  embedDomain: string;
  requestId: string;
  name?: string | null;
  email?: string | null;
}): string {
  const url = new URL(input.eventUrl);
  url.searchParams.set("embed_domain", input.embedDomain);
  url.searchParams.set("embed_type", "Inline");
  url.searchParams.set("utm_content", input.requestId);
  // Vi har redan sagt vad tjänsten kostar och innehåller i modalen ovanför —
  // Calendlys egen rubrikruta blir en andra, motstridig produktbeskrivning.
  url.searchParams.set("hide_event_type_details", "1");
  url.searchParams.set("hide_gdpr_banner", "1");
  if (input.name) url.searchParams.set("name", input.name);
  if (input.email) url.searchParams.set("email", input.email);
  return url.toString();
}

/* ===================== Typer (bara fälten vi läser) ===================== */

interface CalendlyInviteeResource {
  uri: string;
  event: string;
  name: string | null;
  email: string | null;
  status: string;
  timezone: string | null;
  cancel_url: string | null;
  reschedule_url: string | null;
  questions_and_answers?: { question: string; answer: string; position: number }[] | null;
  tracking?: { utm_content?: string | null } | null;
}

interface CalendlyEventResource {
  uri: string;
  name: string | null;
  status: string;
  start_time: string;
  end_time: string;
  location?: { type?: string | null; location?: string | null; join_url?: string | null } | null;
}

export interface CalendlyBooking {
  eventUri: string;
  inviteeUri: string;
  /** ISO 8601, UTC — precis som Calendly rapporterar den. */
  startTime: string;
  endTime: string;
  name: string | null;
  email: string | null;
  timezone: string | null;
  /** Läsbar plats ("Zoom", ett telefonnummer, en adress) eller null. */
  location: string | null;
  /** `coaching_requests.id` som vi själva la in i länken. */
  utmContent: string | null;
  /** Svaren på Calendlys egna frågor, i ordning. */
  answers: { question: string; answer: string }[];
  cancelUrl: string | null;
  rescheduleUrl: string | null;
  /** "active" eller "canceled". */
  status: string;
}

async function calendlyGet<T>(uri: string): Promise<T> {
  const token = calendlyToken();
  if (!token) {
    console.error("[calendly] CALENDLY_API_TOKEN saknas — tidsbokning är avstängd");
    throw new Error(GENERIC_ERROR);
  }

  let res: Response;
  try {
    res = await fetch(uri, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    console.error(`[calendly] GET ${uri} nådde aldrig fram:`, e);
    throw new Error(GENERIC_ERROR);
  }

  const text = await res.text();
  if (!res.ok) {
    console.error(`[calendly] GET ${uri} → ${res.status}: ${text.slice(0, 300)}`);
    throw new Error(GENERIC_ERROR);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error(`[calendly] GET ${uri} gav inget JSON: ${text.slice(0, 200)}`);
    throw new Error(GENERIC_ERROR);
  }
}

function readLocation(loc: CalendlyEventResource["location"]): string | null {
  if (!loc) return null;
  const value = loc.join_url || loc.location || loc.type || null;
  return value && value.trim() ? value.trim() : null;
}

/**
 * Hämtar den bokade tiden.
 *
 * Bara invitee-URI:n tas emot utifrån; event-URI:n läses ur svaret i stället
 * för ur klientens nyttolast, så det finns bara en sträng att lita på och den
 * är formvaliderad.
 */
export async function fetchCalendlyBooking(inviteeUri: string): Promise<CalendlyBooking> {
  const uri = inviteeUri.trim();
  if (!isCalendlyInviteeUri(uri)) {
    console.error(`[calendly] avvisade invitee-URI med fel form: ${uri.slice(0, 120)}`);
    throw new Error(GENERIC_ERROR);
  }

  const invitee = (await calendlyGet<{ resource: CalendlyInviteeResource }>(uri)).resource;

  // Kommer från Calendly, men kontrolleras ändå: svaret styr nästa hämtning.
  const eventUri = invitee.event?.trim() ?? "";
  if (!isCalendlyEventUri(eventUri)) {
    console.error(
      `[calendly] invitee ${uri} pekar på oväntad event-URI: ${eventUri.slice(0, 120)}`,
    );
    throw new Error(GENERIC_ERROR);
  }

  const event = (await calendlyGet<{ resource: CalendlyEventResource }>(eventUri)).resource;

  return {
    eventUri,
    inviteeUri: invitee.uri ?? uri,
    startTime: event.start_time,
    endTime: event.end_time,
    name: invitee.name?.trim() || null,
    email: invitee.email?.trim() || null,
    timezone: invitee.timezone?.trim() || null,
    location: readLocation(event.location),
    utmContent: invitee.tracking?.utm_content?.trim() || null,
    answers: (invitee.questions_and_answers ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .filter((qa) => qa.answer?.trim())
      .map((qa) => ({ question: qa.question, answer: qa.answer.trim() })),
    cancelUrl: invitee.cancel_url || null,
    rescheduleUrl: invitee.reschedule_url || null,
    status: event.status,
  };
}

/**
 * Calendlys svar → `coaching_requests.goal`.
 *
 * Frågan tas med bara när det finns fler än en, av precis samma skäl som
 * kassan inte upprepar en fråga som redan ställts: ett ensamt svar under en
 * rubrik coachen själv skrivit läser bättre utan rubriken.
 */
export function formatCalendlyAnswers(
  answers: { question: string; answer: string }[],
): string | null {
  if (answers.length === 0) return null;
  if (answers.length === 1) return answers[0].answer;
  return answers.map((a) => `${a.question}: ${a.answer}`).join("\n");
}

/* ===================== Avbokning och städning ===================== */

/**
 * Event-URI:n, samma formlåsning som invitee-URI:n ovan och av samma skäl:
 * den stoppas in i en URL som vi skickar vårt Bearer-token till, och i det här
 * fallet dessutom i en POST som avbokar något.
 */
export const EVENT_URI_PATTERN = /^https:\/\/api\.calendly\.com\/scheduled_events\/[0-9a-f-]{36}$/i;

export function isCalendlyEventUri(uri: string): boolean {
  return EVENT_URI_PATTERN.test(uri.trim());
}

async function calendlyPost<T>(uri: string, body: Record<string, unknown>): Promise<T> {
  const token = calendlyToken();
  if (!token) {
    console.error("[calendly] CALENDLY_API_TOKEN saknas — tidsbokning är avstängd");
    throw new Error(GENERIC_ERROR);
  }

  let res: Response;
  try {
    res = await fetch(uri, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    console.error(`[calendly] POST ${uri} nådde aldrig fram:`, e);
    throw new Error(GENERIC_ERROR);
  }

  const text = await res.text();
  if (!res.ok) {
    console.error(`[calendly] POST ${uri} → ${res.status}: ${text.slice(0, 300)}`);
    throw new Error(GENERIC_ERROR);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error(`[calendly] POST ${uri} gav inget JSON: ${text.slice(0, 200)}`);
    throw new Error(GENERIC_ERROR);
  }
}

/**
 * Avbokar en tid.
 *
 * `reason` mejlas till den som bokat, av Calendly, på svenska — det är enda
 * beskedet de får om att tiden är borta, så texten måste säga *varför* och hur
 * man gör rätt i stället.
 */
export async function cancelCalendlyBooking(eventUri: string, reason: string): Promise<void> {
  const uri = eventUri.trim();
  if (!isCalendlyEventUri(uri)) {
    console.error(`[calendly] vägrade avboka event-URI med fel form: ${uri.slice(0, 120)}`);
    throw new Error(GENERIC_ERROR);
  }
  await calendlyPost(`${uri}/cancellation`, { reason });
}

/** En bokad tid, så som städaren behöver se den. */
export interface CalendlyScheduledEvent {
  eventUri: string;
  /** När bokningen gjordes (ISO, UTC) — fristen räknas härifrån. */
  createdAt: string;
  startTime: string;
  status: string;
}

interface CalendlyEventListResource {
  uri: string;
  created_at: string;
  start_time: string;
  status: string;
}

/* Uppslaget nedan cachas per isolat, precis som Stripe-priset: det svarar
 * likadant varje gång och städaren körs ofta. TTL:n finns för att en ändrad
 * slug ska läka av sig själv i stället för att kräva en deploy. */
const LOOKUP_TTL_MS = 30 * 60 * 1000;

export interface CalendlyCoachingEventType {
  /** Event-typens API-URI. */
  uri: string;
  /**
   * Kontots användar-URI. Följer med därför att `/scheduled_events` kräver
   * `user`, `organization` eller `group` — ett filter på bara `event_type`
   * avvisas med 400, vilket inte syns förrän man kör mot riktiga data.
   */
  userUri: string;
}

let eventTypeCache: { value: CalendlyCoachingEventType | null; at: number } | null = null;

/**
 * Event-typen bakom `CALENDLY_EVENT_URL`.
 *
 * Den står medvetet inte som egen miljövariabel: två strängar som pekar på
 * samma sak glider isär, och slugen är redan känd som en tyst felkälla. Här
 * finns bara en sanning — matchar den publika länken ingen event-typ har
 * slugen bytts, och då säger loggen det rakt ut.
 */
export async function resolveCoachingEventType(): Promise<CalendlyCoachingEventType | null> {
  const wanted = calendlyEventUrl();
  if (!wanted) return null;

  const now = Date.now();
  if (eventTypeCache && now - eventTypeCache.at < LOOKUP_TTL_MS) return eventTypeCache.value;

  let value: CalendlyCoachingEventType | null = null;
  try {
    const me = await calendlyGet<{ resource: { uri: string } }>(`${CALENDLY_API}/users/me`);
    const userUri = me.resource.uri;
    const list = await calendlyGet<{
      collection: { uri: string; scheduling_url: string; active: boolean }[];
    }>(`${CALENDLY_API}/event_types?count=100&user=${encodeURIComponent(userUri)}`);

    const hit = list.collection.find(
      (t) => t.scheduling_url.replace(/\/+$/, "") === wanted.replace(/\/+$/, ""),
    );
    if (!hit) {
      console.error(
        `[calendly] ingen event-typ matchar CALENDLY_EVENT_URL (${wanted}) — har slugen bytts?`,
      );
    }
    value = hit ? { uri: hit.uri, userUri } : null;
  } catch (e) {
    // Cachas inte vid fel: nästa anrop ska få försöka igen.
    console.error("[calendly] kunde inte slå upp event-typen:", e);
    return null;
  }

  eventTypeCache = { value, at: now };
  return value;
}

/** Bara för tester — nollställer isolatets uppslagscache. */
export function clearCalendlyEventTypeCache(): void {
  eventTypeCache = null;
}

/**
 * Kommande, aktiva bokningar på coachningens event-typ.
 *
 * Filtret på event-typ är avsiktligt och viktigt: städaren avbokar saker, och
 * den ska aldrig kunna röra en tid som bokats på någon annan av kontots
 * event-typer. Vill du boka in någon för hand — gör det på en annan event-typ.
 */
export async function listCoachingBookings(fromTime: Date): Promise<CalendlyScheduledEvent[]> {
  const eventType = await resolveCoachingEventType();
  if (!eventType) return [];

  const params = new URLSearchParams({
    user: eventType.userUri,
    event_type: eventType.uri,
    status: "active",
    min_start_time: fromTime.toISOString(),
    sort: "start_time:asc",
    count: "100",
  });

  const res = await calendlyGet<{ collection: CalendlyEventListResource[] }>(
    `${CALENDLY_API}/scheduled_events?${params.toString()}`,
  );

  return res.collection.map((e) => ({
    eventUri: e.uri,
    createdAt: e.created_at,
    startTime: e.start_time,
    status: e.status,
  }));
}

/**
 * En bokningslänk som bara går att använda en gång.
 *
 * Skälet är att den publika `/60min`-länken annars ligger i iframens `src` och
 * går att spara undan och boka på när som helst, utan att passera kassan.
 * Engångslänken är inte hela skyddet — den som redan känner till den publika
 * slugen kommer förbi den — men den tar bort den självklara vägen, och
 * städaren river det som ändå tar sig igenom.
 *
 * Returnerar null i stället för att kasta: en Calendly-hicka får inte ta ner
 * köpet, den får bara falla tillbaka på den publika länken.
 */
export async function createSingleUseSchedulingLink(): Promise<string | null> {
  const eventType = await resolveCoachingEventType();
  if (!eventType) return null;
  try {
    const res = await calendlyPost<{ resource: { booking_url: string } }>(
      `${CALENDLY_API}/scheduling_links`,
      { max_event_count: 1, owner: eventType.uri, owner_type: "EventType" },
    );
    const url = res.resource?.booking_url?.trim();
    return url && url.startsWith("https://calendly.com/") ? url : null;
  } catch (e) {
    console.error("[calendly] kunde inte skapa engångslänk, faller tillbaka på den publika:", e);
    return null;
  }
}
