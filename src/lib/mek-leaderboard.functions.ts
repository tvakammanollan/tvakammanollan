import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { isRankable } from "./username";
import { LEADERBOARD_SIZE } from "./leaderboard.functions";
import { optionalSupabaseAuth } from "./auth-optional.server";
import { sumPracticeAnswers, type PracticeAnswer, type PracticeTotals } from "./mek-leaderboard";
import type { OrdLeaderboardRow } from "./word-practice.functions";

/** Samma radform som ordlistan, så att fliken kan rendera båda likadant. */
export type MekLeaderboardRow = OrdLeaderboardRow;

const PAGE = 1000;
const MAX_PAGES = 100;
const CACHE_MS = 60 * 1000;

let cache: { at: number; totals: PracticeTotals[] } | null = null;
let building: Promise<PracticeTotals[]> | null = null;

/**
 * Alla besvarade MEK-uppgifter i träningsläget, summerade per användare.
 * Samma urval som gratisgränsen (`countMekTrainingAnswers`): träning, inte
 * dueller, och en överhoppad uppgift räknas inte.
 *
 * Svaren läses sidvis och summeras här i stället för i en vy, så att listan
 * inte kräver en migration. Det håller så länge träningssvaren räknas i
 * tiotusental; blir de fler är det dags för en aggregerad tabell som
 * `ord_practice_stats`. Cachad en minut per isolat.
 */
async function loadTotals(): Promise<PracticeTotals[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.totals;
  if (building) return building;
  building = (async () => {
    const rows: PracticeAnswer[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE;
      const { data, error } = await supabaseAdmin
        .from("match_answers")
        .select("user_id, is_correct, questions!inner(category)")
        .eq("is_training", true)
        .not("selected_answer", "is", null)
        .eq("questions.category", "MEK")
        .order("id", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) {
        console.error("[mek-leaderboard] kunde inte läsa svar:", error.message);
        throw new Error("Kunde inte ladda topplistan.");
      }
      const batch = (data ?? []) as Array<{ user_id: string; is_correct: boolean }>;
      for (const r of batch) rows.push({ user_id: r.user_id, is_correct: r.is_correct });
      if (batch.length < PAGE) break;
    }
    const totals = sumPracticeAnswers(rows);
    cache = { at: Date.now(), totals };
    return totals;
  })();
  try {
    return await building;
  } finally {
    building = null;
  }
}

function toRow(t: PracticeTotals, username: string, rank: number): MekLeaderboardRow {
  return {
    rank,
    user_id: t.user_id,
    username,
    correct_count: t.correct_count,
    total_count: t.total_count,
    accuracy: t.total_count > 0 ? Math.round((t.correct_count * 100) / t.total_count) : 0,
  };
}

/**
 * MEK-topplistan: flest rätta besvarade MEK-uppgifter i övningen. Publik, som
 * de andra listorna. Den egna raden läses ur tokenen, aldrig ur ett
 * klientskickat id, så endpointen inte blir ett uppslagsverk över andras konton.
 */
export const fetchMekLeaderboard = createServerFn({ method: "GET" })
  .middleware([optionalSupabaseAuth])
  .handler(async ({ context }) => {
    assertRateLimit(ipKey("lb-mek"), limits.publicRead);
    const userId = context.userId;
    const totals = await loadTotals();

    const nameMap = new Map<string, string>();
    const ids = totals.map((t) => t.user_id);
    for (let i = 0; i < ids.length; i += 200) {
      const { data: us } = await supabaseAdmin
        .from("users")
        .select("id, username")
        .in("id", ids.slice(i, i + 200));
      for (const u of us ?? []) nameMap.set(u.id as string, (u.username as string) ?? "");
    }

    // Sålla före numreringen, annars äter gästkonton platser i listan.
    const ranked = totals
      .map((t) => ({ t, username: nameMap.get(t.user_id) ?? "" }))
      .filter((r) => isRankable(r.username))
      .map((r, i) => toRow(r.t, r.username, i + 1));

    const top = ranked.slice(0, LEADERBOARD_SIZE);

    let me: MekLeaderboardRow | null = userId
      ? (ranked.find((r) => r.user_id === userId) ?? null)
      : null;
    if (!me && userId) {
      const own = totals.find((t) => t.user_id === userId);
      if (own) me = toRow(own, "", 0);
    }
    return { top, me };
  });
