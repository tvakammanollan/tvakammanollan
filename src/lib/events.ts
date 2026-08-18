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

export type MatchType = "verbal" | "math";
export type MatchMode = "bot" | "private" | "ranked";
export type MatchOutcome = "win" | "loss" | "draw";
export type TrainingTrack = "verbal" | "math";
/** Ytan köpet startade från — samma värden som serverfunktionen validerar. */
export type CoachingSource = "dashboard" | "landing";

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

  /* ── Coachning (Stripe) ──────────────────────────────────────────────
     `available: false` betyder att priset inte gick att läsa ur Stripe och att
     användaren fick kontaktvägen i stället — den kvoten är skillnaden mellan
     "ingen vill köpa" och "ingen kunde köpa". */
  coaching_offer_opened: { source: CoachingSource; available: boolean };
  coaching_checkout_started: { source: CoachingSource; is_guest: boolean };
  coaching_checkout_failed: { source: CoachingSource };
  /** Tidsväljaren visades. `scheduling: false` = Calendly är inte påslaget. */
  coaching_booking_opened: { source: CoachingSource; scheduling: boolean };
  /** En tid valdes i Calendly. Klyftan hit från `booking_opened` är tratten
      som säger om tidsvalet säljer eller stoppar. */
  coaching_time_booked: { source: CoachingSource };
  /** Fyras på tacksidan, en gång per köp (inte per omladdning). */
  coaching_purchase_completed: { amount: number | null; currency: string | null };

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
