/**
 * Hur långt någon kom i studieupplägget — den delen av tratten som annars
 * bara syns som frånvaro.
 *
 * Bakgrund: båda vägarna in i produkten mätte tidigare bara det som gick
 * FRAMÅT. Kvalificeringen fyrade `viewed → started → answered → qualified →
 * lead_submitted`, och köpmodalen `offer_opened → booking_opened → …`. Den som
 * läste sammanfattningen och stängde fliken, eller skrev in halva sitt nummer
 * och ångrade sig, lämnade inte ett enda spår: i PostHog syntes det som att
 * steget efter saknades, vilket ser likadant ut vare sig personen tänkte efter
 * i tio minuter eller aldrig såg fältet. "Hur många fyllde i det alls" gick
 * därför inte att svara på.
 *
 * Den här modulen äger språket för det: ett **steg** (jämförbart tal) och ett
 * **stadium** (grupperbar sträng) per avhopp. Ren och testad av samma skäl som
 * `coaching-quiz.ts` — den bestämmer vad siffrorna betyder, och det ska gå att
 * granska utan att starta appen. Namnen är dessutom det som ligger i PostHog
 * för alltid: ett stadium som byter innebörd gör historiken osann i efterhand.
 */

/* ── Kvalificeringen (CoachingQuizCard) ─────────────────────────────────── */

/** Rutans lägen, i den ordning de nås. Speglar `Phase` i CoachingQuizCard. */
export type QuizPhase = "teaser" | "q1" | "q2" | "form" | "done";

export const QUIZ_PHASE_ORDER: readonly QuizPhase[] = [
  "teaser",
  "q1",
  "q2",
  "form",
  "done",
] as const;

/**
 * Fasen som ett tal, så att "kom längre" går att uttrycka som en jämförelse.
 * Okända värden ger 0 i stället för att kasta: en mätning får aldrig kunna ta
 * ner rutan den mäter.
 */
export function quizPhaseStep(phase: QuizPhase): number {
  const i = QUIZ_PHASE_ORDER.indexOf(phase);
  return i < 0 ? 0 : i;
}

/** Den av två faser som ligger längst fram. Används för "längst kom personen". */
export function furthestQuizPhase(a: QuizPhase, b: QuizPhase): QuizPhase {
  return quizPhaseStep(b) > quizPhaseStep(a) ? b : a;
}

/** Kontaktfälten i formuläret. Bara `phone` är obligatoriskt. */
export type LeadField = "name" | "phone" | "email" | "message";

export const LEAD_FIELDS: readonly LeadField[] = ["name", "phone", "email", "message"] as const;

/**
 * Vilka fält som faktiskt har innehåll. Trimmat, eftersom ett fält med bara
 * mellanslag är ett tomt fält för allt utom `.length`.
 *
 * Returnerar fältnamn, aldrig värden: det som skickas vidare till PostHog är
 * "personen fyllde i e-post", inte adressen.
 */
export function filledLeadFields(values: Partial<Record<LeadField, string>>): LeadField[] {
  return LEAD_FIELDS.filter((f) => (values[f] ?? "").trim().length > 0);
}

/**
 * Ett grupperbart stadium — svaret på "hur långt kom de?" i en enda sträng som
 * går att lägga som breakdown i PostHog.
 *
 * Formuläret delas i tre därför att de tre kräver olika åtgärder:
 *   - `form_untouched`: sammanfattningen övertygade inte, eller så skrämde
 *     fälten. Copy- eller formproblem.
 *   - `form_partial`: började skriva men numret kom aldrig i. Friktion i
 *     fälten.
 *   - `form_ready`: hade ett nummer skrivet och skickade ändå inte. Det är den
 *     dyraste gruppen, och den enda där ett sista knapptryck skiljer oss från
 *     ett samtal.
 */
export type QuizStage =
  | "teaser"
  | "q1"
  | "q2"
  | "form_untouched"
  | "form_partial"
  | "form_ready"
  | "done";

export function quizStage(phase: QuizPhase, filled: readonly LeadField[]): QuizStage {
  if (phase !== "form") return phase;
  if (filled.length === 0) return "form_untouched";
  return filled.includes("phone") ? "form_ready" : "form_partial";
}

/** Varför klientvalideringen stoppade inskicket. */
export type LeadBlockReason = "phone" | "email" | "incomplete";

/**
 * Varför servern avvisade inskicket.
 *
 * Strängen kommer från `assertRateLimit` och är den enda av serverns
 * felmeddelanden som betyder något annat än "det gick fel": kvoten är tre i
 * timmen, och slår den upp i mätningen är det inte formuläret som är
 * problemet utan att någon försöker om och om igen. Allt annat är `server` —
 * numret är redan validerat i klienten innan det skickas.
 */
export function leadFailureReason(message: string | undefined): "rate_limit" | "server" {
  return message?.startsWith("För många försök") ? "rate_limit" : "server";
}

/* ── Köpmodalen (CoachingModal) ─────────────────────────────────────────── */

/** Modalens steg, i ordning. Speglar `Steg` i CoachingModal. */
export type CheckoutStep = "erbjudande" | "tid" | "kassa";

export const CHECKOUT_STEP_ORDER: readonly CheckoutStep[] = ["erbjudande", "tid", "kassa"] as const;

export function checkoutStepIndex(step: CheckoutStep): number {
  const i = CHECKOUT_STEP_ORDER.indexOf(step);
  return i < 0 ? 0 : i;
}

/* ── Gemensamt ──────────────────────────────────────────────────────────── */

/**
 * Sekunder sedan en starttidpunkt, avrundat.
 *
 * Klämd nedåt till 0: klockan kan gå bakåt (NTP-justering, viloläge), och en
 * negativ varaktighet i en tratt är värre än en avrundad nolla. Utan tak — en
 * flik som stått öppen i timmar är ett riktigt beteende och ska synas som det.
 */
export function elapsedSeconds(startedAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.round((now - startedAt) / 1000));
}

/** Fältlistan som en stabil, grupperbar sträng (`"name,phone"`). */
export function fieldList(fields: readonly LeadField[]): string {
  return LEAD_FIELDS.filter((f) => fields.includes(f)).join(",");
}
