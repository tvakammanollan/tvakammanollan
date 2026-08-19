/**
 * Städaren som river obetalda tider ur Calendly.
 *
 * Bakgrund: coachningen bokas före den betalas (se `coaching.functions.ts`),
 * och 2026-08-18 tog någon en tid och stängde sedan Stripe-fliken. Ordningen
 * står kvar — den som redan har en tid i kalendern slutför köpet oftare — men
 * baksidan städas nu av sig själv i stället för för hand.
 *
 * Två saker rivs, med olika frist (se `coaching-sweep.ts`):
 *   1. tider vars rad är obetald när betalfönstret hunnit stänga,
 *   2. tider som saknar rad hos oss helt — alltså bokade utanför köpflödet.
 *
 * Städaren tittar BARA på coachningens egen event-typ. Vill du boka in någon
 * för hand, gör det på en annan event-typ i Calendly — annars river den här
 * din bokning, och personen får ett avbokningsmejl.
 */
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { cancelCalendlyBooking, calendlyConfigured, listCoachingBookings } from "./calendly.server";
import {
  CANCELED_STATUS,
  CANCEL_MESSAGES,
  planSweep,
  type SweepDecision,
  type SweepRow,
} from "./coaching-sweep";

type CoachingUpdate = Database["public"]["Tables"]["coaching_requests"]["Update"];

/**
 * Grinden, inte en flagga att städa bort — samma tanke som
 * `CANONICAL_REDIRECT`. Städaren avbokar riktiga människors möten, så den ska
 * gå att köra i torrläge först och stängas av utan deploy om den beter sig
 * fel.
 *
 * Osatt betyder `off`, och det är avsiktligt: `.env.local` bär
 * produktionstoken, så en lokal utvecklingsserver skulle annars kunna avboka
 * skarpa tider. Värdet sätts i `wrangler.jsonc`, alltså bara i Workern.
 */
export type SweepMode = "off" | "report" | "on";

export function sweepMode(): SweepMode {
  const raw = process.env.COACHING_SWEEP?.trim().toLowerCase();
  if (raw === "on") return "on";
  if (raw === "report" || raw === "dry") return "report";
  return "off";
}

/**
 * Minsta tid mellan två riktiga svep i samma isolat.
 *
 * Endpointen är hemlighetsskyddad, men ett svep kostar ett par Calendly-anrop
 * och tokenets kvot delas med själva köpflödet. Att bränna den så att ingen
 * kan boka vore en märklig sorts självmål.
 */
const MIN_INTERVAL_MS = 60 * 1000;
let lastSweepAt = 0;

export interface SweepAction {
  eventUri: string;
  startTime: string;
  rowId: string | null;
  reason: string;
  /** false = Calendly avvisade avbokningen; raden lämnas orörd och tas nästa gång. */
  ok: boolean;
}

export interface SweepResult {
  mode: SweepMode;
  /** Antal kommande, aktiva tider på coachningens event-typ. */
  checked: number;
  kept: number;
  canceled: SweepAction[];
  errors: number;
  /** Satt när svepet inte gjorde något, med skälet. */
  skipped?: "avstängd" | "calendly-saknas" | "nyligen-körd";
}

const EMPTY: Omit<SweepResult, "mode" | "skipped"> = {
  checked: 0,
  kept: 0,
  canceled: [],
  errors: 0,
};

/** Radernas kolumner — en enda strängliteral, annars tappar supabase-js radtypen. */
const ROW_COLUMNS = "id,paid_at,status,calendly_event_uri";

/**
 * Hur många event-URI:er som får ligga i ett `in.(…)`-filter.
 *
 * Filtret hamnar i frågesträngen och varje URI blir ~110 tecken urlkodad. Ett
 * fullt svep (100 bokningar) hade gett en URL på nästan tio kilobyte, alltså
 * över gränsen — och då kastar `loadRows`, vilket är rätt men gör städaren
 * obrukbar just när den behövs som mest.
 */
const ROW_CHUNK = 25;

async function loadRows(eventUris: string[]): Promise<Map<string, SweepRow>> {
  const byEventUri = new Map<string, SweepRow>();

  for (let i = 0; i < eventUris.length; i += ROW_CHUNK) {
    const chunk = eventUris.slice(i, i + ROW_CHUNK);
    const { data, error } = await supabaseAdmin
      .from("coaching_requests")
      .select(ROW_COLUMNS)
      .in("calendly_event_uri", chunk);

    if (error) {
      // Utan raderna ser varje bokning ut att sakna köp, och då hade städaren
      // avbokat allihop. Ett databasfel måste stoppa svepet, inte tolkas.
      console.error("[coaching] städaren kunde inte läsa raderna:", error.message);
      throw new Error("Kunde inte läsa coachningsraderna.");
    }

    for (const row of data ?? []) {
      if (!row.calendly_event_uri) continue;
      byEventUri.set(row.calendly_event_uri, {
        id: row.id,
        paidAt: row.paid_at,
        status: row.status,
      });
    }
  }
  return byEventUri;
}

async function applyCancellation(decision: SweepDecision, now: Date): Promise<SweepAction> {
  const { booking, row, verdict } = decision;
  const reason = verdict.reason;
  const base: SweepAction = {
    eventUri: booking.eventUri,
    startTime: booking.startTime,
    rowId: row?.id ?? null,
    reason,
    ok: false,
  };

  if (verdict.action !== "cancel") return { ...base, ok: true };

  try {
    await cancelCalendlyBooking(booking.eventUri, CANCEL_MESSAGES[verdict.reason]);
  } catch (e) {
    console.error(`[coaching] kunde inte avboka ${booking.eventUri}:`, e);
    return base;
  }

  if (row) {
    // Först efter att Calendly sagt ja — annars ser raden avbokad ut medan
    // tiden fortfarande står i kalendern, vilket är det enda utfallet som är
    // sämre än att inte städa alls.
    const patch: CoachingUpdate = { status: CANCELED_STATUS, canceled_at: now.toISOString() };
    const { error } = await supabaseAdmin
      .from("coaching_requests")
      .update(patch)
      .eq("id", row.id)
      .is("paid_at", null);
    if (error) {
      console.error(
        `[coaching] avbokade ${booking.eventUri} men kunde inte märka raden:`,
        error.message,
      );
    }
  }

  return { ...base, ok: true };
}

/**
 * Kör svepet.
 *
 * `force` går förbi isolatets minimiintervall och används av den manuella
 * körningen — den som felsöker ska slippa vänta en minut mellan försöken.
 */
export async function sweepUnpaidCoachingBookings(options?: {
  now?: Date;
  force?: boolean;
  /** Övertrumfar `COACHING_SWEEP` för en enskild körning (torrkörning på begäran). */
  mode?: SweepMode;
}): Promise<SweepResult> {
  const now = options?.now ?? new Date();
  const mode = options?.mode ?? sweepMode();

  if (mode === "off") return { mode, ...EMPTY, skipped: "avstängd" };
  if (!calendlyConfigured()) return { mode, ...EMPTY, skipped: "calendly-saknas" };
  if (!options?.force && now.getTime() - lastSweepAt < MIN_INTERVAL_MS) {
    return { mode, ...EMPTY, skipped: "nyligen-körd" };
  }
  lastSweepAt = now.getTime();

  const bookings = await listCoachingBookings(now);
  const rows = await loadRows(bookings.map((b) => b.eventUri));
  const plan = planSweep(bookings, rows, now);

  const canceled: SweepAction[] = [];
  let kept = 0;
  let errors = 0;

  // Sekventiellt och inte parallellt: kvoten delas med köpflödet, och ett svep
  // som stryper bokningsknappen har gjort mer skada än nytta.
  for (const decision of plan) {
    if (decision.verdict.action === "keep") {
      kept += 1;
      continue;
    }
    if (mode === "report") {
      canceled.push({
        eventUri: decision.booking.eventUri,
        startTime: decision.booking.startTime,
        rowId: decision.row?.id ?? null,
        reason: decision.verdict.reason,
        ok: false,
      });
      continue;
    }
    const action = await applyCancellation(decision, now);
    if (!action.ok) errors += 1;
    canceled.push(action);
  }

  const result: SweepResult = { mode, checked: plan.length, kept, canceled, errors };

  if (canceled.length > 0 || errors > 0) {
    console.log(
      JSON.stringify({
        type: "metric",
        message: "coaching_sweep",
        context: {
          mode,
          checked: result.checked,
          kept: result.kept,
          canceled: canceled.length,
          errors,
          reasons: canceled.map((c) => c.reason),
        },
      }),
    );
  }

  return result;
}

/**
 * Släpper tiden för ett enskilt köp — anropas när Stripe säger att
 * Checkout-sessionen gått ut.
 *
 * Det är den precisa vägen: svepet är ett skyddsnät som går var femtonde
 * minut, men `checkout.session.expired` är exakt beskedet "den här köparen
 * kommer inte att betala", och då kan tiden släppas i samma sekund.
 */
export async function releaseBookingForExpiredCheckout(requestId: string): Promise<boolean> {
  if (sweepMode() !== "on") return false;

  const { data, error } = await supabaseAdmin
    .from("coaching_requests")
    .select("id,paid_at,status,calendly_event_uri")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    console.error("[coaching] kunde inte läsa raden för utgången kassa:", error.message);
    return false;
  }
  // Betald, redan riven, eller aldrig bokad — inget att släppa.
  if (!data?.calendly_event_uri || data.paid_at || data.status === CANCELED_STATUS) return false;

  try {
    await cancelCalendlyBooking(data.calendly_event_uri, CANCEL_MESSAGES.obetald);
  } catch (e) {
    // Svepet tar den om en stund; det här är genvägen, inte enda vägen.
    console.error(`[coaching] kunde inte släppa ${data.calendly_event_uri}:`, e);
    return false;
  }

  const patch: CoachingUpdate = {
    status: CANCELED_STATUS,
    canceled_at: new Date().toISOString(),
  };
  await supabaseAdmin.from("coaching_requests").update(patch).eq("id", data.id).is("paid_at", null);

  console.log(
    JSON.stringify({
      type: "metric",
      message: "coaching_booking_released",
      context: { request_id: data.id, trigger: "checkout.session.expired" },
    }),
  );
  return true;
}
