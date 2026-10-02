/**
 * Produkthändelser — katalogen, inte spridda strängar.
 *
 * Allt går genom `track({ type: "metric" })`, som redan har bryggan vidare till
 * PostHog (se telemetry.ts). Poängen med den här filen är att namnen och deras
 * egenskaper står på ETT ställe: ett stavfel eller ett `match_type` som ibland
 * heter `matchType` gör en funnel obrukbar i efterhand, och det syns inte
 * förrän någon försöker bygga insikten i PostHog tre veckor senare.
 *
 * Regler för nya händelser:
 * - `substantiv_verb` i imperfekt (`match_created`, inte `createMatch`).
 * - Egenskaper i snake_case, samma namn för samma sak överallt.
 * - Bara det som går att räkna eller gruppera på. Fritext hör inte hemma här,
 *   med undantag för sådant som ändå redan ligger i URL:en (forumsökningen).
 * - Aldrig PII: inga mejladresser, inga användarnamn, ingen inläggstext.
 */
import { track } from "./telemetry";
import type { CheckoutStep, LeadBlockReason, LeadField, QuizStage } from "./coaching-funnel";

export type MatchType = "verbal" | "math";
export type MatchMode = "bot" | "private" | "ranked";
// Oavgjort finns inte längre: vid lika poäng vinner den som lämnade in först
// (`decideWinnerSide` i `match-outcome.ts`). Gamla "draw"-händelser ligger kvar
// i PostHog och är korrekta för sin tid — nya kan inte uppstå.
export type MatchOutcome = "win" | "loss";
export type TrainingTrack = "verbal" | "math";
/** Ytan köpet startade från — samma värden som serverfunktionen validerar. */
export type CoachingSource = "dashboard" | "landing" | "popup";
/** Vad som tröskade fram nudgen. Speglar PromptTrigger i coaching-prompt.ts. */
export type CoachingPromptTrigger = "pageviews" | "matches";

export interface ProductEvents {
  /* ── Samtycke ─────────────────────────────────────────────────────────
     Bara "granted" når PostHog (ett nej laddar aldrig skriptet). Båda utfallen
     hamnar i våra egna loggar via /api/telemetry, och det är där kvoten
     ja/nej går att läsa. */
  consent_decided: { choice: "granted" | "denied" };

  /* ── Konto & konvertering ────────────────────────────────────────────── */
  signup_submitted: { from_guest: boolean };
  signup_completed: { from_guest: boolean; needs_email_confirm: boolean };
  signup_failed: { from_guest: boolean };
  login_completed: { from_guest: boolean };
  login_failed: Record<string, never>;
  onboarding_completed: {
    skipped: boolean;
    target_score?: number | null;
    preferred_type?: string | null;
    started_match?: boolean;
  };

  /* ── Match ───────────────────────────────────────────────────────────── */
  guest_match_started: { match_type: MatchType };
  match_created: { match_type: MatchType; mode: MatchMode; is_guest: boolean };
  match_joined: { via: "room_code" | "invite_link" };
  matchmaking_started: { match_type: MatchType };
  /** Ingen människa hittades — kön gav upp och la in en bot i stället. */
  matchmaking_bot_fallback: { match_type: MatchType; waited_s: number };
  matchmaking_abandoned: { match_type: MatchType; waited_s: number };
  match_submitted: {
    match_type?: MatchType;
    is_bot_match?: boolean;
    auto_submitted: boolean;
    answered: number;
    total_questions: number;
    seconds_used: number;
  };
  match_result_viewed: {
    match_type: MatchType;
    is_bot_match: boolean;
    outcome: MatchOutcome;
    elo_change: number | null;
  };
  rematch_clicked: { pvp: boolean; match_type: MatchType };
  result_share_clicked: { outcome: MatchOutcome; match_type: MatchType };

  /* ── Träning (/train) ────────────────────────────────────────────────── */
  training_started: {
    track: TrainingTrack;
    subs: string;
    sub_count: number;
    count: number;
    difficulty: number | null;
  };
  training_completed: {
    track: TrainingTrack;
    answered: number;
    correct: number;
    pct: number;
    duration_s: number;
  };
  /** Avbruten mitt i — skillnaden mot completed är hela retentionfrågan. */
  training_abandoned: { track: TrainingTrack; answered: number; total: number };

  /* ── Ordträning (/ord) ───────────────────────────────────────────────── */
  ord_session_started: {
    count: number;
    failed_mode: boolean;
    source_filter: string;
    difficulty_count: number;
  };
  ord_paywall_shown: { answered: number };
  ord_paywall_checkout_started: { embedded: boolean };
  ord_purchase_completed: { via: "return" };
  ord_session_completed: {
    answered: number;
    correct: number;
    pct: number;
    failed_mode: boolean;
  };

  /* ── Gamla prov ──────────────────────────────────────────────────────── */
  gamla_prov_started: { term: string; provpass: number; mode: string; resumed: boolean };
  gamla_prov_submit: {
    term: string;
    provpass: number;
    mode: string;
    score: number;
    total: number;
    duration_s: number;
  };

  /* ── Coachning (Stripe) ────────────────────────────────────────────── */
  /** Kortet eller blocket syntes på skärmen. Nämnaren till allt nedan: utan den
      går "ingen vill köpa" inte att skilja från "ingen skrollade dit". */
  coaching_card_viewed: { source: CoachingSource };
  /** `available: false` betyder att priset inte gick att läsa ur Stripe och att
      användaren fick kontaktvägen i stället — den kvoten är skillnaden mellan
      "ingen vill köpa" och "ingen kunde köpa". */
  coaching_offer_opened: { source: CoachingSource; available: boolean };
  coaching_checkout_started: { source: CoachingSource; is_guest: boolean };
  coaching_checkout_failed: { source: CoachingSource };
  /** Modalen stängdes. Fyras vid VARJE stängning, även den som skedde efter ett
      klick vidare till Stripe: `step` säger var personen stod, och utan den är
      "stängde på erbjudandet" omöjligt att skilja från "stängde i kassan" —
      båda ser i en tratt ut som ett steg som saknas. `seconds` skiljer den som
      klickade fel från den som läste och tvekade. */
  coaching_checkout_exited: {
    source: CoachingSource;
    step: CheckoutStep;
    step_index: number;
    seconds: number;
    /** En tid var bokad i Calendly när rutan stängdes, dvs. städaren får jobb. */
    booked: boolean;
  };
  /** Tidsväljaren begärdes. `scheduling: false` = Calendly är inte påslaget. */
  coaching_booking_opened: { source: CoachingSource; scheduling: boolean };
  /** Calendlys väljare renderade inne i iframen. Öppningar utan den här är
      måttet på en trasig event-typ-slug — den felar annars helt tyst. */
  coaching_calendar_viewed: { source: CoachingSource };
  /** En ledig tid klickades, före Calendlys eget formulär. */
  coaching_time_selected: { source: CoachingSource };
  /** En tid valdes i Calendly. Klyftan hit från `booking_opened` är tratten
      som säger om tidsvalet säljer eller stoppar. */
  coaching_time_booked: { source: CoachingSource };
  /** Fyras på tacksidan, en gång per köp (inte per omladdning). */
  coaching_purchase_completed: { amount: number | null; currency: string | null };

  /* --- Kvalificeringsformuläret ("ring mig") ------------------------------
     Egen tratt bredvid köptratten, med samma `source`, eftersom den säljer
     till en annan person: den som inte är redo att betala men vill prata.
     Utan `viewed` som nämnare betyder få inskick antingen "ingen vill" eller
     "ingen såg boxen", och de två kräver motsatta åtgärder. */
  coaching_quiz_viewed: { source: CoachingSource };
  coaching_quiz_started: { source: CoachingSource };
  /** Ett av de två stegen besvarades. `step` är 1 eller 2. */
  coaching_quiz_answered: { source: CoachingSource; step: number; value: string };
  /** Sammanfattningen visades, dvs. båda frågorna är besvarade. */
  coaching_quiz_qualified: { source: CoachingSource };
  /** Första tecknet i något av kontaktfälten, en gång per ifyllnad.
      Det är svaret på "hur många fyllde i det alls": klyftan från `qualified`
      hit är "läste sammanfattningen och stängde", klyftan härifrån till
      `lead_submitted` är "började skriva och skickade ändå inte". */
  coaching_form_started: { source: CoachingSource; field: LeadField };
  /** Klientvalideringen stoppade inskicket. Fyras vid varje försök, inte en
      gång per person: samma fel tre gånger i rad är en annan historia än ett
      fel som rättades direkt. Detta är INTE ett serverfel — knappen trycktes,
      men inget lämnade webbläsaren. */
  coaching_lead_blocked: { source: CoachingSource; reason: LeadBlockReason };
  /** Numret skickades in. Detta är leadet. `fields` visar vad personen orkade
      fylla i utöver numret, `seconds` hur lång vägen dit var. */
  coaching_lead_submitted: {
    source: CoachingSource;
    is_guest: boolean;
    fields: string;
    field_count: number;
    seconds: number;
  };
  /** Servern avvisade inskicket. `reason` skiljer kvoten (någon försöker om och
      om igen) från allt annat — numret är redan validerat i klienten, så ett
      serverfel här betyder att något är trasigt, inte att fältet var fel. */
  coaching_lead_failed: { source: CoachingSource; reason: "rate_limit" | "server" };
  /** Personen lämnade kvalificeringen utan att skicka in.
      Fyras EN gång per påbörjad ifyllnad, aldrig för den som bara såg kortet
      (`coaching_quiz_viewed` utan `coaching_quiz_started` täcker redan det, och
      allt annat hade lagt en händelse på varje dashboardbesök).
      `stage` är avsedd som breakdown: den delar upp formuläret i orört,
      påbörjat och färdigskrivet-men-oskickat. Se coaching-funnel.ts.

      OBS vid analys: `via: "pagehide"` fyras också när mobilen byter app, och
      den som kommer tillbaka och skickar in får då BÅDA händelserna. Tratten
      `quiz_started → lead_submitted` påverkas inte (inskicket kommer senare),
      men ett stadiediagram måste sålla bort personer som även har
      `coaching_lead_submitted`, annars räknas de som avhopp de inte gjorde. */
  coaching_quiz_exited: {
    source: CoachingSource;
    stage: QuizStage;
    step: number;
    /** Antal besvarade frågor, 0-2. */
    answered: number;
    /** Ifyllda fält i kanonisk ordning (`"name,phone"`), aldrig deras värden. */
    fields: string;
    field_count: number;
    seconds: number;
    /** Hur avhoppet upptäcktes. `pagehide` = stängd flik eller navigering bort. */
    via: "pagehide" | "unmount";
  };
  /** Nudgen kom upp av sig själv. `trigger` skiljer sidbläddraren från spelaren. */
  coaching_prompt_shown: { trigger: CoachingPromptTrigger };
  /** Klick på nudgens knapp. Kvoten mot `shown` är hela dess existensberättigande. */
  coaching_prompt_clicked: { trigger: CoachingPromptTrigger };
  coaching_prompt_dismissed: { trigger: CoachingPromptTrigger };

  /* Lojalitetsrabatten — 20 % vid tredje sessionen. Se coaching-discount.ts.

     `sessions` är räkningen som tröskade fram rutan. Den ska stå på 3 i
     praktiken; gör den inte det är det sessionsräkningen som är fel, inte
     rabatten, och det går bara att upptäcka om talet följer med. */
  coaching_discount_shown: { sessions: number };
  /** Klick på knappen. Kvoten mot `shown` säger om rabatten faktiskt biter. */
  coaching_discount_clicked: { sessions: number };
  coaching_discount_dismissed: { sessions: number };
  /** Koden kopierades. Utan den syns bara "öppnade kassan", inte "tog koden med sig". */
  coaching_discount_copied: { source: CoachingSource };

  /* ── Forum ───────────────────────────────────────────────────────────── */
  forum_thread_created: {
    category: string;
    pending: boolean;
    body_length: number;
    has_exam_quote: boolean;
    has_prov_term: boolean;
  };
  forum_post_created: {
    pending: boolean;
    body_length: number;
    quoted: boolean;
    has_exam_quote: boolean;
  };
  /** Skrivrutan vägrade. Sajtens tydligaste "skapa konto"-läge — mät varför. */
  forum_post_blocked: { reason: string };
  /** Söktermen ligger redan i URL:en, och därmed i $pageview. Inget nytt läcker. */
  forum_search: { term: string; term_length: number; hits: number };
  forum_best_answer_set: { cleared: boolean };
  forum_reaction: { kind: string; added: boolean };
}

/** `[[uppgift:2024ht/3/12]]` — samma form som forum-markdown.ts letar efter. */
const EXAM_QUOTE_RE = /\[\[uppgift:/;

export function hasExamQuote(body: string): boolean {
  return EXAM_QUOTE_RE.test(body);
}

/**
 * Skickar en produkthändelse. Best-effort hela vägen: `track` sväljer sina egna
 * fel, och PostHog-bryggan är en no-op utan samtycke.
 */
export function trackEvent<K extends keyof ProductEvents>(
  name: K,
  props: ProductEvents[K] = {} as ProductEvents[K],
): void {
  track({
    type: "metric",
    message: name,
    context: props as Record<string, unknown>,
  });
}
