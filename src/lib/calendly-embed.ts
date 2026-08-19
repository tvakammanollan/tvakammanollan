/**
 * Calendlys inbäddade tidsväljare pratar med sidan via postMessage.
 *
 * Vi använder inte deras `widget.js`: allt scriptet gör är att lyssna på de här
 * meddelandena, och att läsa dem själva håller CSP:n vid `frame-src` — inget
 * `script-src` för Calendly. Parsern är ren och testad därför att den står
 * mellan ett främmande fönster och ett fetch med vårt Bearer-token: nyttolasten
 * innehåller bara URI:er, och vilken URI som helst duger inte (formen låses av
 * `INVITEE_URI_PATTERN` i `calendly.server.ts`).
 *
 * De fyra dokumenterade händelserna, och vad de betyder för oss:
 *
 *   profile_page_viewed    ⎫ väljaren renderade faktiskt → `calendar_viewed`
 *   event_type_viewed      ⎭
 *   date_and_time_selected → en ledig tid klickades      → `time_selected`
 *   event_scheduled        → bokningen är gjord           → `scheduled`
 *
 * `calendar_viewed` är den som gör event-typens slug mätbar. `CALENDLY_EVENT_URL`
 * pekar på något vi inte äger; byts sluggen laddar iframen en 404-sida, ingen kan
 * boka, och ingenting kastar eller loggas. En öppning utan ett `calendar_viewed`
 * efteråt är exakt den signalen.
 */

/** Calendly pratar bara med oss härifrån — allt annat i fönstret ignoreras. */
export const CALENDLY_ORIGIN = "https://calendly.com";

export type CalendlyEmbedEvent = "calendar_viewed" | "time_selected" | "scheduled";

const EVENT_KINDS: Record<string, CalendlyEmbedEvent> = {
  "calendly.profile_page_viewed": "calendar_viewed",
  "calendly.event_type_viewed": "calendar_viewed",
  "calendly.date_and_time_selected": "time_selected",
  "calendly.event_scheduled": "scheduled",
};

export interface CalendlyEmbedMessage {
  kind: CalendlyEmbedEvent;
  /** Bara satt för `scheduled` — och inte ens där garanterat. */
  inviteeUri: string | null;
}

function readInviteeUri(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const invitee = (payload as { invitee?: unknown }).invitee;
  if (!invitee || typeof invitee !== "object") return null;
  const uri = (invitee as { uri?: unknown }).uri;
  return typeof uri === "string" && uri ? uri : null;
}

/** null för allt som inte är en händelse vi bryr oss om. */
export function readCalendlyMessage(data: unknown): CalendlyEmbedMessage | null {
  if (!data || typeof data !== "object") return null;
  const { event, payload } = data as { event?: unknown; payload?: unknown };
  if (typeof event !== "string") return null;
  const kind = EVENT_KINDS[event];
  if (!kind) return null;
  return { kind, inviteeUri: kind === "scheduled" ? readInviteeUri(payload) : null };
}
