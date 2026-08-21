/**
 * Användningsstatistik + händelseloggning.
 *
 * - logUsageEvent: klientflöden (t.ex. gamla-prov-inlämning) loggar en rad i
 *   audit_log med namespacad action ("usage:...") — tabellen finns redan och
 *   används inte av appkoden, så ingen migration behövs.
 * - fetchUsageStats: admin-vy som sammanställer aktivitet utanför matcher:
 *   träningssvar, ordträning, gamla prov och aktiv svarstid.
 *
 * OBS om "aktiv tid": historiskt finns bara time_spent_seconds på match-svar.
 * Tränings-svar får tid från och med nu (train.tsx), och gamla-prov loggar
 * sessionslängd vid inlämning — så metriken växer framåt.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { optionalSupabaseAuth } from "./auth-optional.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { GAMLA_PROV_START_ACTION, GAMLA_PROV_SUBMIT_ACTION } from "./usage-actions";

const GAMLA_PROV_ACTION = GAMLA_PROV_SUBMIT_ACTION;

export const logUsageEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        event: z.literal("gamla_prov_submit"),
        meta: z
          .object({
            term: z.string().max(20),
            provpass: z.number().int().min(1).max(10),
            // Provläge eller övningsläge. Fältet har alltid skickats av
            // ProvRunner men saknades i schemat, och `.strict()` gör en okänd
            // nyckel till ett kastat fel — som anropssidan sväljer med
            // .catch(). Följden var att INGEN gamla-prov-inlämning hamnade i
            // audit_log, och att admin-vyns siffra stod på noll utan att något
            // syntes i loggarna.
            mode: z.enum(["prov", "ova"]).optional(),
            score: z.number().int().min(0).max(200).nullable(),
            total: z.number().int().min(1).max(200),
            duration_s: z
              .number()
              .int()
              .min(0)
              .max(6 * 60 * 60),
          })
          .strict(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    assertRateLimit(`usage:${userId}`, limits.publicRead);
    const { error } = await supabaseAdmin.from("audit_log").insert({
      action: GAMLA_PROV_ACTION,
      table_name: "usage_events",
      user_id: userId,
      meta: data.meta,
    });
    // Best-effort — statistik får aldrig störa användarflödet.
    if (error) console.error("[usage] event insert failed:", error.message);
    return { ok: true };
  });

/**
 * Ett påbörjat provpass.
 *
 * Skild från `logUsageEvent` på en punkt som är hela poängen: den här kräver
 * **inget konto**. Gamla prov skrivs till största delen av utloggade besökare,
 * och det som bara loggades av inloggade var per definition inte användningen
 * utan en delmängd av den — `audit_log` stod på noll rader medan provsidorna
 * var sajtens mest besökta.
 *
 * Identiteten läses ur tokenen när den finns och är enbart upplysning; raden
 * skrivs lika gärna med `user_id: null` (kolumnen är nullable). Ingen
 * migration behövs — `audit_log` finns sedan tidigare, precis som för
 * inlämningarna.
 *
 * Best-effort rakt igenom: ett fel här får aldrig hindra någon från att skriva
 * ett prov, så anropssidan ska inte invänta svaret.
 */
export const logProvStart = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        term: z.string().max(20),
        provpass: z.number().int().min(1).max(10),
        mode: z.enum(["prov", "ova"]),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Per IP, inte per användare: endpointen är öppen för utloggade. Rundligt
    // tilltaget — ett skolnät ligger bakom en adress — men detta är per isolat
    // och alltså en broms mot hamring, inte en exakt kvot.
    assertRateLimit(ipKey("prov-start"), limits.provStart);
    const { error } = await supabaseAdmin.from("audit_log").insert({
      action: GAMLA_PROV_START_ACTION,
      table_name: "usage_events",
      user_id: context.userId,
      meta: { term: data.term, provpass: data.provpass, mode: data.mode },
    });
    if (error) console.error("[usage] prov-start insert failed:", error.message);
    return { ok: true };
  });

/** Paginera fram en kolumn (PostgREST returnerar max ~1000 rader/anrop). */
async function pageColumn<T>(
  table: string,
  column: string,
  filter: (q: ReturnType<typeof supabaseAdmin.from>) => unknown,
  maxPages = 100,
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabaseAdmin.from(table as any).select(column);
    q = filter(q) ?? q;
    const { data, error } = await q.range(page * 1000, page * 1000 + 999);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

export interface UsageStats {
  training: { total: number; last7d: number; last30d: number; users: number };
  matchAnswers: { total: number; last30d: number };
  matchesFinished: number;
  ord: { totalAnswers: number; users: number };
  gamlaProv: {
    submits: number;
    last7d: number;
    totalDurationS: number;
    trackedSince: string | null;
  };
  /** Summerad time_spent_seconds över alla svar — proxy för aktiv tid. */
  activeAnswerTimeS: number;
  activeUsers7d: number;
}

export const fetchUsageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsageStats> => {
    const { userId } = context;
    const { data: me } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (!me?.is_admin) throw new Response("Forbidden: kräver admin", { status: 403 });

    const d7 = new Date(Date.now() - 7 * 86400_000).toISOString();
    const d30 = new Date(Date.now() - 30 * 86400_000).toISOString();

    const count = async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      build: (q: any) => any,
    ): Promise<number> => {
      const { count: c, error } = await build(
        supabaseAdmin.from("match_answers").select("id", { count: "exact", head: true }),
      );
      if (error) throw new Error(error.message);
      return c ?? 0;
    };

    // Träning (utanför match)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trainingTotal = await count((q: any) => q.eq("is_training", true));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const training7d = await count((q: any) => q.eq("is_training", true).gte("answered_at", d7));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const training30d = await count((q: any) => q.eq("is_training", true).gte("answered_at", d30));
    const trainingUserRows = await pageColumn<{ user_id: string }>(
      "match_answers",
      "user_id",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q: any) => q.eq("is_training", true),
    );
    const trainingUsers = new Set(trainingUserRows.map((r) => r.user_id)).size;

    // Matchsvar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchTotal = await count((q: any) => q.eq("is_training", false));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match30d = await count((q: any) => q.eq("is_training", false).gte("answered_at", d30));

    const { count: matchesFinished } = await supabaseAdmin
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("status", "finished");

    // Ordträning (aggregerad per användare i ord_practice_stats)
    const ordRows = await pageColumn<{ total_count: number }>(
      "ord_practice_stats",
      "total_count",
      (q) => q,
    );
    const ordTotal = ordRows.reduce((s, r) => s + (r.total_count ?? 0), 0);

    // Gamla prov (spåras via audit_log från och med nu)
    const gpRows = await pageColumn<{ created_at: string; meta: { duration_s?: number } | null }>(
      "audit_log",
      "created_at, meta",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q: any) => q.eq("action", GAMLA_PROV_ACTION),
    );
    const gp7d = gpRows.filter((r) => r.created_at >= d7).length;
    const gpDuration = gpRows.reduce((s, r) => s + (r.meta?.duration_s ?? 0), 0);
    const gpSince = gpRows.length
      ? gpRows.reduce((min, r) => (r.created_at < min ? r.created_at : min), gpRows[0].created_at)
      : null;

    // Aktiv svarstid — summa time_spent_seconds där den finns
    const timeRows = await pageColumn<{ time_spent_seconds: number | null }>(
      "match_answers",
      "time_spent_seconds",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q: any) => q.not("time_spent_seconds", "is", null),
    );
    const activeAnswerTimeS = timeRows.reduce((s, r) => s + (r.time_spent_seconds ?? 0), 0);

    // Aktiva användare senaste 7 dygnen (någon svarsaktivitet alls)
    const active7Rows = await pageColumn<{ user_id: string }>(
      "match_answers",
      "user_id",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (q: any) => q.gte("answered_at", d7),
    );
    const activeUsers7d = new Set(active7Rows.map((r) => r.user_id)).size;

    return {
      training: {
        total: trainingTotal,
        last7d: training7d,
        last30d: training30d,
        users: trainingUsers,
      },
      matchAnswers: { total: matchTotal, last30d: match30d },
      matchesFinished: matchesFinished ?? 0,
      ord: { totalAnswers: ordTotal, users: ordRows.length },
      gamlaProv: {
        submits: gpRows.length,
        last7d: gp7d,
        totalDurationS: gpDuration,
        trackedSince: gpSince,
      },
      activeAnswerTimeS,
      activeUsers7d,
    };
  });

export interface PageViewStats {
  /** Sidor sorterade på visningar, senaste 30 dygnen. */
  topPages: Array<{ path: string; views: number }>;
  /** Visningar per dygn, äldst först — underlag för trendkurva. */
  daily: Array<{ day: string; views: number }>;
  total30d: number;
  total7d: number;
  /** Första dygnet med data; null innan räkningen hunnit igång. */
  since: string | null;
}

/**
 * Sidvisningar från public.page_views. Rent aggregerat underlag — tabellen
 * innehåller varken IP, användare eller session, bara dygn + sökväg + antal.
 */
export const fetchPageViewStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PageViewStats> => {
    const { userId } = context;
    const { data: me } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (!me?.is_admin) throw new Response("Forbidden: kräver admin", { status: 403 });

    const dayKey = (offset: number) =>
      new Date(Date.now() - offset * 86400_000).toISOString().slice(0, 10);
    const from30 = dayKey(30);
    const from7 = dayKey(7);

    const { data, error } = await supabaseAdmin
      .from("page_views")
      .select("day, path, views")
      .gte("day", from30)
      .order("day", { ascending: true });
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Array<{ day: string; path: string; views: number }>;

    const perPath = new Map<string, number>();
    const perDay = new Map<string, number>();
    let total30d = 0;
    let total7d = 0;
    for (const r of rows) {
      perPath.set(r.path, (perPath.get(r.path) ?? 0) + r.views);
      perDay.set(r.day, (perDay.get(r.day) ?? 0) + r.views);
      total30d += r.views;
      if (r.day >= from7) total7d += r.views;
    }

    return {
      topPages: [...perPath.entries()]
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 25),
      daily: [...perDay.entries()]
        .map(([day, views]) => ({ day, views }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      total30d,
      total7d,
      since: rows.length ? rows[0].day : null,
    };
  });
