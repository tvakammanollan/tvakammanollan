/**
 * Provtopplistan: de skrivna provpassen i `prov_attempts`, summerade per
 * spelare och rankade enligt `prov-leaderboard.ts`.
 *
 * Passen läses sidvis och summeras i minnet i stället för i en vy, precis som
 * MEK-listan, så att listan inte kräver en migration. Det håller så länge
 * skrivna pass räknas i tusental (411 rader 2026-10-26); blir de fler är det
 * dags för en aggregerad tabell.
 *
 * **Bara den som är inloggad kan hamna på listan.** Gamla prov går att skriva
 * utan konto, och då finns passet bara i besökarens localStorage
 * (`tkn:prov-resultat:v1`). Det är ett medvetet val som står kvar: provflödet
 * ska fungera utan registrering. Följden är att listan mäter en delmängd, och
 * att den delmängden växer framåt, aldrig bakåt.
 */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { isRankable } from "./username";
import { LEADERBOARD_SIZE } from "./leaderboard.functions";
import { optionalSupabaseAuth } from "./auth-optional.server";
import {
  rankProvTotals,
  sumProvAttempts,
  type ProvAttemptRow,
  type ProvScoreRow,
  type ProvTotals,
} from "./prov-leaderboard";

export interface ProvLeaderboardRow extends ProvScoreRow {
  username: string;
}

const PAGE = 1000;
const MAX_PAGES = 50;
const CACHE_MS = 60 * 1000;

let cache: { at: number; totals: ProvTotals[] } | null = null;
let building: Promise<ProvTotals[]> | null = null;

async function loadTotals(): Promise<ProvTotals[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.totals;
  if (building) return building;
  building = (async () => {
    const rows: ProvAttemptRow[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE;
      // Sorterad på id, inte på submitted_at: tidpunkten är inte unik, och en
      // osorterad sida kan ge samma rad 2 gånger och tappa en annan.
      const { data, error } = await supabaseAdmin
        .from("prov_attempts")
        .select("user_id, term, score, total, mode")
        .order("id", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) {
        console.error("[prov-leaderboard] kunde inte läsa försöken:", error.message);
        throw new Error("Kunde inte ladda topplistan.");
      }
      const batch = (data ?? []) as Array<Record<string, unknown>>;
      for (const r of batch) {
        rows.push({
          user_id: r.user_id as string,
          term: r.term as string,
          score: r.score as number,
          total: r.total as number,
          mode: r.mode === "ova" ? "ova" : "prov",
        });
      }
      if (batch.length < PAGE) break;
    }
    const totals = sumProvAttempts(rows);
    cache = { at: Date.now(), totals };
    return totals;
  })();
  try {
    return await building;
  } finally {
    building = null;
  }
}

/**
 * Listan, och den egna raden för den som ligger utanför toppen.
 *
 * Publik endpoint utan auth, som de andra listorna. Identiteten läses ur
 * tokenen och aldrig ur ett klientskickat id — annars blir endpointen ett
 * uppslagsverk över vad andra har svarat på gamla prov.
 */
export const fetchProvLeaderboard = createServerFn({ method: "GET" })
  .middleware([optionalSupabaseAuth])
  .handler(
    async ({ context }): Promise<{ top: ProvLeaderboardRow[]; me: ProvLeaderboardRow | null }> => {
      assertRateLimit(ipKey("lb-prov"), limits.publicRead);
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

      // Sållas före numreringen, annars äter gästkonton platser i listan.
      const ranked: ProvLeaderboardRow[] = rankProvTotals(
        totals.filter((t) => isRankable(nameMap.get(t.user_id))),
      ).map((r) => ({ ...r, username: nameMap.get(r.user_id) ?? "" }));

      const top = ranked.slice(0, LEADERBOARD_SIZE);

      let me: ProvLeaderboardRow | null = userId
        ? (ranked.find((r) => r.user_id === userId) ?? null)
        : null;
      if (!me && userId) {
        // Rankas inte (gästkonto eller inget valt namn), men ska ändå få se sin
        // egen statistik. Rank 0 betyder "ingen placering".
        const own = totals.find((t) => t.user_id === userId);
        if (own) {
          const [row] = rankProvTotals([own]);
          me = { ...row, rank: 0, username: nameMap.get(userId) ?? "" };
        }
      }
      return { top, me };
    },
  );
