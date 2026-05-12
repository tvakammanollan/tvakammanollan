// Server-only helpers for match flow. Imported by *.functions.ts only.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type MatchType = "verbal" | "math";

export interface SelectedQuestion {
  id: string;
  category: string;
  question_text: string;
  passage_text: string | null;
  passage_id: string | null;
  options: unknown;
  difficulty: number | null;
}

const MATH_CATEGORIES = new Set(["XYZ", "KVA", "NOG", "DTK"]);

// ---------- Question selection ----------

async function pickRandom(
  category: string,
  count: number,
  excludeIds: Set<string>,
): Promise<SelectedQuestion[]> {
  const isMath = MATH_CATEGORIES.has(category);
  // Fetch a pool then shuffle in JS (avoids heavy ORDER BY random on large tables).
  let q = supabaseAdmin
    .from("questions")
    .select(
      "id, category, question_text, passage_text, passage_id, options, difficulty, cleaned_question_text, cleaned_options, clean_status",
    )
    .eq("category", category)
    .is("passage_id", null)
    .limit(500);
  if (isMath) q = q.eq("clean_status", "ok");
  const { data, error } = await q;
  if (error) throw error;
  const all = data ?? [];
  // Try with full exclusion first; if not enough, allow recently-seen as fallback.
  let filtered = all.filter((row) => !excludeIds.has(row.id));
  if (filtered.length < count) {
    // Fallback: include all (sorted so least-recently-seen would appear first).
    // We don't have per-question last-seen sorting cheaply here, so just shuffle all.
    filtered = all;
  }
  const pool = filtered.map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = row as any;
      if (isMath && r.cleaned_question_text) {
        return {
          id: r.id,
          category: r.category,
          question_text: r.cleaned_question_text,
          passage_text: r.passage_text,
          passage_id: r.passage_id,
          options: r.cleaned_options ?? r.options,
          difficulty: r.difficulty,
        } as SelectedQuestion;
      }
      return {
        id: r.id,
        category: r.category,
        question_text: r.question_text,
        passage_text: r.passage_text,
        passage_id: r.passage_id,
        options: r.options,
        difficulty: r.difficulty,
      } as SelectedQuestion;
    });
  shuffle(pool);
  return pool.slice(0, count);
}

async function pickPassage(
  category: string,
  excludeIds: Set<string>,
  excludePassageIds: Set<string>,
  maxQuestions = 2,
): Promise<SelectedQuestion[]> {
  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("id, category, question_text, passage_text, passage_id, options, difficulty")
    .eq("category", category)
    .not("passage_id", "is", null)
    .limit(400);
  if (error) throw error;
  const rows = (data ?? []) as SelectedQuestion[];
  const byPassage = new Map<string, SelectedQuestion[]>();
  for (const r of rows) {
    if (!r.passage_id) continue;
    if (excludeIds.has(r.id)) continue;
    const arr = byPassage.get(r.passage_id) ?? [];
    arr.push(r);
    byPassage.set(r.passage_id, arr);
  }
  let candidateIds = [...byPassage.keys()].filter((p) => !excludePassageIds.has(p));
  if (candidateIds.length === 0) candidateIds = [...byPassage.keys()];
  if (candidateIds.length === 0) return [];
  const chosenId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
  const qs = byPassage.get(chosenId) ?? [];
  shuffle(qs);
  return qs.slice(0, maxQuestions);
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

async function recentSeen(
  userId: string,
  days: number,
): Promise<{ questionIds: Set<string>; passageIds: Set<string> }> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: ans } = await supabaseAdmin
    .from("match_answers")
    .select("question_id, questions:question_id(passage_id)")
    .eq("user_id", userId)
    .eq("is_training", false)
    .gte("answered_at", since)
    .limit(2000);
  const qIds = new Set<string>();
  const pIds = new Set<string>();
  for (const a of ans ?? []) {
    if (a.question_id) qIds.add(a.question_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pid = (a as any).questions?.passage_id ?? null;
    if (pid) pIds.add(pid);
  }
  return { questionIds: qIds, passageIds: pIds };
}

export async function selectQuestionsFor(
  matchType: MatchType,
  userId: string,
): Promise<SelectedQuestion[]> {
  // Increasingly larger lookback windows: 14 → 30 → 60 → no exclusion.
  let seen = await recentSeen(userId, 14);
  const out: SelectedQuestion[] = [];
  const target = 8;

  const tryFill = async (excludeQ: Set<string>) => {
    out.length = 0;
    if (matchType === "verbal") {
      out.push(...(await pickRandom("ORD", 5, excludeQ)));
      out.push(...(await pickRandom("MEK", 3, excludeQ)));
    } else {
      out.push(...(await pickRandom("XYZ", 4, excludeQ)));
      out.push(...(await pickRandom("KVA", 2, excludeQ)));
      out.push(...(await pickRandom("NOG", 2, excludeQ)));
    }
  };

  await tryFill(seen.questionIds);
  if (out.length < target) {
    seen = await recentSeen(userId, 30);
    await tryFill(seen.questionIds);
  }
  if (out.length < target) {
    seen = await recentSeen(userId, 60);
    await tryFill(seen.questionIds);
  }
  if (out.length < target) await tryFill(new Set());

  while (out.length > target) out.pop();
  if (out.length < target) {
    const fallback = matchType === "verbal" ? "ORD" : "XYZ";
    const extra = await pickRandom(
      fallback,
      target - out.length,
      new Set(out.map((o) => o.id)),
    );
    out.push(...extra);
  }
  return out.slice(0, target);
}

// Exported for future LAS/ELF/DTK enablement (passage-level dedup).
export async function recentPassageIds(userId: string, days = 14): Promise<Set<string>> {
  const { passageIds } = await recentSeen(userId, days);
  return passageIds;
}
export { pickPassage };

// ---------- Match creation ----------

export async function generateRoomCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = "HP" + Math.floor(1000 + Math.random() * 9000).toString();
    const { data } = await supabaseAdmin
      .from("matches")
      .select("id")
      .eq("room_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate unique room code");
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function calcBotElo(playerElo: number): number {
  const offset = Math.floor(Math.random() * 301) - 150;
  return clamp(playerElo + offset, 600, 1800);
}

export async function insertMatchQuestions(matchId: string, questions: SelectedQuestion[]) {
  const rows = questions.map((q, i) => ({
    match_id: matchId,
    question_id: q.id,
    question_order: i + 1,
  }));
  const { error } = await supabaseAdmin.from("match_questions").insert(rows);
  if (error) throw error;
}

// ---------- Bot simulation ----------

type AccuracyMap = Record<string, number>;
const BOT_ACCURACY: { eloMax: number; map: AccuracyMap; fallback: number }[] = [
  { eloMax: 800,  map: { ORD: 0.35, MEK: 0.30, LAS: 0.25, ELF: 0.25, XYZ: 0.30, KVA: 0.25, NOG: 0.20, DTK: 0.25 }, fallback: 0.30 },
  { eloMax: 1000, map: { ORD: 0.50, MEK: 0.50, LAS: 0.45, ELF: 0.40, XYZ: 0.50, KVA: 0.45, NOG: 0.40, DTK: 0.45 }, fallback: 0.45 },
  { eloMax: 1200, map: { ORD: 0.70, MEK: 0.65, LAS: 0.65, ELF: 0.60, XYZ: 0.65, KVA: 0.60, NOG: 0.55, DTK: 0.60 }, fallback: 0.62 },
  { eloMax: 1400, map: { ORD: 0.82, MEK: 0.80, LAS: 0.78, ELF: 0.75, XYZ: 0.80, KVA: 0.75, NOG: 0.70, DTK: 0.75 }, fallback: 0.77 },
  { eloMax: Infinity, map: { ORD: 0.93, MEK: 0.92, LAS: 0.90, ELF: 0.88, XYZ: 0.92, KVA: 0.88, NOG: 0.85, DTK: 0.88 }, fallback: 0.90 },
];

function botBaseAccuracy(botElo: number, category: string): number {
  const tier = BOT_ACCURACY.find((t) => botElo < t.eloMax) ?? BOT_ACCURACY[BOT_ACCURACY.length - 1];
  return tier.map[category] ?? tier.fallback;
}

export interface BotSimResult {
  score: number;
  correctQuestionIds: string[];
  submitTimeSeconds: number;
}

export function simulateBotMatch(
  botElo: number,
  questions: { id: string; category: string }[],
): BotSimResult {
  const correctIds: string[] = [];
  for (const q of questions) {
    const base = botBaseAccuracy(botElo, q.category);
    // ±10% per-question variation.
    const acc = clamp(base + (Math.random() * 0.20 - 0.10), 0, 1);
    if (Math.random() < acc) correctIds.push(q.id);
  }

  const secondsPerQuestion =
    botElo >= 1400 ? 25 :
    botElo >= 1200 ? 35 :
    botElo >= 1000 ? 50 :
    botElo >= 800  ? 65 : 80;
  const total = Math.max(1, questions.length) * secondsPerQuestion;
  const variation = total * 0.20;
  const submitTimeSeconds = Math.round(
    Math.min(470, Math.max(60, total + (Math.random() * variation * 2 - variation))),
  );

  return { score: correctIds.length, correctQuestionIds: correctIds, submitTimeSeconds };
}

// Legacy helpers kept for backward compat — prefer simulateBotMatch.
export function simulateBotScore(botElo: number): number {
  let base: number;
  if (botElo >= 1400) base = 7;
  else if (botElo >= 1200) base = 6;
  else if (botElo >= 1000) base = 5;
  else if (botElo >= 800) base = 3;
  else base = 2;
  const variation = Math.floor(Math.random() * 3) - 1;
  return clamp(base + variation, 0, 8);
}

export function simulateBotSubmitDelaySec(botElo: number): number {
  if (botElo >= 1300) return Math.floor(120 + Math.random() * 160);
  if (botElo >= 900) return Math.floor(280 + Math.random() * 120);
  return Math.floor(380 + Math.random() * 95);
}

export { getBotName } from "./bot";

// ---------- ELO ----------

export function kFactor(elo: number) {
  // 3x boost for more entertaining ELO swings
  if (elo < 1500) return 96;
  if (elo <= 1800) return 60;
  return 30;
}

export function calcNewElo(oldElo: number, oppElo: number, result: 0 | 0.5 | 1): number {
  const expected = 1 / (1 + Math.pow(10, (oppElo - oldElo) / 400));
  const k = kFactor(oldElo);
  const next = oldElo + k * (result - expected);
  return Math.max(600, Math.round(next));
}

// ---------- Process result ----------

export async function processMatchResultServer(matchId: string) {
  const { data: match, error } = await supabaseAdmin
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();
  if (error || !match) throw error ?? new Error("Match not found");
  if (match.status === "finished") return { alreadyFinished: true };

  // Idempotency: om elo_history redan har rader för matchen så har den
  // redan processats; markera bara som finished och returnera.
  const { data: existingHistory } = await supabaseAdmin
    .from("elo_history")
    .select("id")
    .eq("match_id", matchId)
    .limit(1);
  if (existingHistory && existingHistory.length > 0) {
    await supabaseAdmin
      .from("matches")
      .update({ status: "finished" })
      .eq("id", matchId);
    return { alreadyFinished: true };
  }

  const p1Score = match.player1_score ?? 0;
  const p2Score = match.player2_score ?? 0;
  const p1Sub = match.player1_submitted_at ? new Date(match.player1_submitted_at).getTime() : Infinity;
  const p2Sub = match.player2_submitted_at ? new Date(match.player2_submitted_at).getTime() : Infinity;

  if (p1Sub === Infinity || p2Sub === Infinity) {
    // Not both submitted yet
    return { waiting: true };
  }

  // Determine result (from p1 perspective)
  // Equal scores = real draw. Time is NOT used as a tiebreaker
  // (avoids the "showed as draw but I lost ELO" bug).
  void p1Sub; void p2Sub;
  let r1: 0 | 0.5 | 1;
  if (p1Score > p2Score) r1 = 1;
  else if (p1Score < p2Score) r1 = 0;
  else r1 = 0.5;

  const r2: 0 | 0.5 | 1 = r1 === 1 ? 0 : r1 === 0 ? 1 : 0.5;
  const matchType = match.match_type as MatchType;
  const eloField = matchType === "verbal" ? "elo_verbal" : "elo_math";
  const peakField = matchType === "verbal" ? "elo_verbal_peak" : "elo_math_peak";

  // Player 1
  const { data: p1User } = await supabaseAdmin.from("users").select("*").eq("id", match.player1_id).single();
  if (!p1User) throw new Error("p1 missing");

  const p1Any = p1User as unknown as Record<string, number>;
  const p1Elo = p1Any[eloField] ?? 1000;
  const p1Peak = p1Any[peakField] ?? 1000;

  let p2EloOld = 1000;
  let p2Any: Record<string, number> | null = null;
  if (match.is_bot_match) {
    p2EloOld = match.bot_elo ?? 1000;
  } else {
    if (!match.player2_id) throw new Error("p2 id missing");
    const { data } = await supabaseAdmin.from("users").select("*").eq("id", match.player2_id).single();
    if (!data) throw new Error("p2 missing");
    p2Any = data as unknown as Record<string, number>;
    p2EloOld = p2Any[eloField] ?? 1000;
  }

  const p1NewElo = calcNewElo(p1Elo, p2EloOld, r1);
  const p1Change = p1NewElo - p1Elo;

  const p1Update: Record<string, number> = {
    [eloField]: p1NewElo,
    [peakField]: Math.max(p1Peak, p1NewElo),
    games_played: (p1Any.games_played ?? 0) + 1,
    wins: (p1Any.wins ?? 0) + (r1 === 1 ? 1 : 0),
    losses: (p1Any.losses ?? 0) + (r1 === 0 ? 1 : 0),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabaseAdmin.from("users").update(p1Update as any).eq("id", match.player1_id);

  await supabaseAdmin.from("elo_history").insert({
    user_id: match.player1_id,
    match_id: matchId,
    match_type: matchType,
    elo_before: p1Elo,
    elo_after: p1NewElo,
    elo_change: p1Change,
  });

  if (!match.is_bot_match && p2Any && match.player2_id) {
    const p2Old = p2Any[eloField] ?? 1000;
    const p2Peak = p2Any[peakField] ?? 1000;
    const p2NewElo = calcNewElo(p2Old, p1Elo, r2);
    const p2Change = p2NewElo - p2Old;

    const p2Update: Record<string, number> = {
      [eloField]: p2NewElo,
      [peakField]: Math.max(p2Peak, p2NewElo),
      games_played: (p2Any.games_played ?? 0) + 1,
      wins: (p2Any.wins ?? 0) + (r2 === 1 ? 1 : 0),
      losses: (p2Any.losses ?? 0) + (r2 === 0 ? 1 : 0),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabaseAdmin.from("users").update(p2Update as any).eq("id", match.player2_id);

    await supabaseAdmin.from("elo_history").insert({
      user_id: match.player2_id,
      match_id: matchId,
      match_type: matchType,
      elo_before: p2Old,
      elo_after: p2NewElo,
      elo_change: p2Change,
    });
  }

  const winnerId =
    r1 === 1 ? match.player1_id : r1 === 0 ? match.player2_id : null;

  await supabaseAdmin
    .from("matches")
    .update({ winner_id: winnerId, status: "finished" })
    .eq("id", matchId);

  return { ok: true };
}
