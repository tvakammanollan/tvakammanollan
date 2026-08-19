/**
 * Vem får behålla sin tid i kalendern?
 *
 * Ordningen i coachningsköpet är tid först, betalning sedan — ett medvetet val
 * med en känd baksida: den som bokar och sedan stänger Stripe-fliken har en tid
 * gratis. Fram till 2026-08-19 var enda motmedlet att avboka för hand ur vyn
 * `coaching_obetalda_bokningar`, och det hann hända på riktigt.
 *
 * Beslutet ligger här, som ren logik utan API-anrop, därför att det handlar om
 * att *avboka någon annans möte*. Det ska gå att läsa, testa och tvista om utan
 * att något nätverk är inblandat; själva avbokandet ligger i
 * `coaching-sweep.server.ts`.
 */

/**
 * Hur länge en obetald bokning får stå kvar.
 *
 * Måste vara längre än Checkout-sessionens livslängd (`CHECKOUT_TTL_MIN` i
 * `coaching.server.ts`), annars kan någon betala för en tid vi just släppt och
 * få en betald rad utan tid i kalendern.
 */
export const UNPAID_GRACE_MS = 45 * 60 * 1000;

/**
 * Hur länge en bokning utan rad hos oss får stå kvar.
 *
 * Kort, för det finns bara ett legitimt skäl till att en bokning saknar rad:
 * `completeCoachingBooking` hinner inte skriva den förrän någon sekund efter
 * att Calendly bekräftat. Allt bortom det är någon som bokat på en länk utan
 * att passera kassan.
 */
export const ORPHAN_GRACE_MS = 15 * 60 * 1000;

/** En bokad tid, så som Calendly rapporterar den. */
export interface SweepBooking {
  eventUri: string;
  /** När bokningen gjordes (ISO, UTC). Fristen räknas härifrån. */
  createdAt: string;
  startTime: string;
}

/** Raden i `coaching_requests` som bokningen hör till, om den finns. */
export interface SweepRow {
  id: string;
  paidAt: string | null;
  status: string | null;
}

export type SweepKeepReason = "betald" | "inom-frist" | "redan-avbokad";
export type SweepCancelReason = "obetald" | "utanför-köpflödet";

export type SweepVerdict =
  | { action: "keep"; reason: SweepKeepReason }
  | { action: "cancel"; reason: SweepCancelReason };

export interface SweepDecision {
  booking: SweepBooking;
  row: SweepRow | null;
  verdict: SweepVerdict;
}

/** Status vi själva satt när städaren redan rivit raden en gång. */
export const CANCELED_STATUS = "canceled";

/**
 * Texten som mejlas till den som bokat. Calendly skickar den ordagrant, och
 * det är enda beskedet de får — den måste därför säga både varför tiden är
 * borta och hur man gör rätt i stället.
 */
export const CANCEL_MESSAGES: Record<SweepCancelReason, string> = {
  obetald:
    "Tiden släpptes eftersom köpet av studieupplägget aldrig slutfördes i kassan. " +
    "Du är varmt välkommen att boka om på tvakommanollan.se — tiden är din så snart betalningen är klar.",
  "utanför-köpflödet":
    "Den här tiden går bara att boka i samband med köp av studieupplägget på tvakommanollan.se. " +
    "Gör gärna om bokningen därifrån, så är allt klart på en gång.",
};

function elapsed(fromIso: string, now: Date): number {
  const then = Date.parse(fromIso);
  // Ett datum vi inte kan tolka får aldrig läsas som "oändligt gammalt" — då
  // hade en formändring hos Calendly avbokat allt på en gång.
  return Number.isNaN(then) ? 0 : now.getTime() - then;
}

/**
 * Vad ska hända med en enskild bokning?
 *
 * Två fall leder till avbokning, och de har olika frist därför att de är olika
 * säkra: en obetald rad är bevisligen vår och bevisligen obetald, medan en
 * bokning utan rad kan vara sekunder från att få sin.
 */
export function decideBooking(
  booking: SweepBooking,
  row: SweepRow | null,
  now: Date,
): SweepVerdict {
  if (row?.paidAt) return { action: "keep", reason: "betald" };

  if (!row) {
    return elapsed(booking.createdAt, now) < ORPHAN_GRACE_MS
      ? { action: "keep", reason: "inom-frist" }
      : { action: "cancel", reason: "utanför-köpflödet" };
  }

  // Raden är redan riven en gång men tiden lever — avbokningen mot Calendly
  // måste ha fallerat. Försök igen; det är hela poängen med att köra ofta.
  if (row.status === CANCELED_STATUS) return { action: "cancel", reason: "obetald" };

  return elapsed(booking.createdAt, now) < UNPAID_GRACE_MS
    ? { action: "keep", reason: "inom-frist" }
    : { action: "cancel", reason: "obetald" };
}

/**
 * Hela svepet: bokningarna från Calendly mot raderna i databasen.
 *
 * Kopplingen görs på `calendly_event_uri`, inte på `utm_content`, eftersom det
 * är den kolumn vi själva skrivit och som har ett unikt index bakom sig.
 */
export function planSweep(
  bookings: SweepBooking[],
  rowsByEventUri: Map<string, SweepRow>,
  now: Date,
): SweepDecision[] {
  return bookings.map((booking) => {
    const row = rowsByEventUri.get(booking.eventUri) ?? null;
    return { booking, row, verdict: decideBooking(booking, row, now) };
  });
}
