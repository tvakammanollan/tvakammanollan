import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, RefreshCw } from "lucide-react";
import { fetchOrdLeaderboard, type OrdLeaderboardRow } from "@/lib/word-practice.functions";
import { fetchLeaderboard } from "@/lib/leaderboard.functions";
import { EmptyState } from "@/components/EmptyState";
import { SplitText, Reveal } from "@/components/landing/MotionFX";

type MatchType = "verbal" | "math";

interface LbRow {
  rank: number;
  user_id: string;
  username: string;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
}

/**
 * No client-side filter — all players (including guests) should show.
 * Just drop rows with empty username (data corruption only).
 */
function filterLeaderboard<T extends { username: string; rank: number }>(rows: T[]): T[] {
  return rows
    .filter((r) => (r.username ?? "").trim().length > 0)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// Cache disabled — was serving stale data from earlier broken RPC.
const CACHE_MS = 0;
const cache: Record<MatchType, { rows: LbRow[]; ts: number } | undefined> = {
  verbal: undefined,
  math: undefined,
};

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: [
      { title: "Topplista — HP Kampen ELO-ranking" },
      {
        name: "description",
        content:
          "Se de bästa HP-spelarna i Sverige. ELO-ranking för verbal, matte och ord. Uppdateras live efter varje match. Helt gratis.",
      },
      { property: "og:title", content: "Topplista — HP Kampen" },
      {
        property: "og:description",
        content: "ELO-rankning av Sveriges vassaste HP-spelare. Uppdateras live.",
      },
    ],
    links: [{ rel: "canonical", href: "https://hpkampen.se/leaderboard" }],
  }),
});

function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"verbal" | "math" | "ord">("verbal");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-10 text-center sm:text-left">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow text-[#6366f1]"
        >
          Hall of fame
        </motion.p>
        <div className="mt-3 flex items-center justify-center gap-3 sm:justify-start">
          <motion.span
            initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-white shadow-[var(--shadow-glow-gold)]"
          >
            <Trophy className="h-7 w-7" />
          </motion.span>
          <h1
            className="display text-[40px] font-bold leading-tight text-[#050507] sm:text-[56px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <SplitText as="span">Topplista.</SplitText>
          </h1>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-[15px] text-neutral-500"
        >
          De vassaste HP-spelarna just nu — uppdateras live.
        </motion.p>
      </div>

      <Reveal delay={0.4}>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="verbal">Verbal</TabsTrigger>
            <TabsTrigger value="math">Matte</TabsTrigger>
            <TabsTrigger value="ord">Ord</TabsTrigger>
          </TabsList>

          <TabsContent value="verbal">
            <Board matchType="verbal" currentUserId={user?.id} />
          </TabsContent>
          <TabsContent value="math">
            <Board matchType="math" currentUserId={user?.id} />
          </TabsContent>
          <TabsContent value="ord">
            <OrdBoard />
          </TabsContent>
        </Tabs>
      </Reveal>
    </div>
  );
}

function Board({
  matchType,
  currentUserId,
}: {
  matchType: MatchType;
  currentUserId: string | undefined;
}) {
  const fetchLb = useServerFn(fetchLeaderboard);
  const [rows, setRows] = useState<LbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      const c = cache[matchType];
      if (!force && c && Date.now() - c.ts < CACHE_MS) {
        setRows(c.rows);
        setUpdatedAt(c.ts);
        setLoading(false);
        return;
      }
      setLoading(true);
      // Server function (admin/service-role) bypasser RLS och returnerar
      // ALLA users med games_played >= 1. Inga filter på namn alls.
      try {
        const rowsData = await fetchLb({
          data: { match_type: matchType, limit: 200 },
        });
        const filtered = filterLeaderboard(rowsData as LbRow[]);
        cache[matchType] = { rows: filtered, ts: Date.now() };
        setRows(filtered);
        setUpdatedAt(Date.now());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kunde inte ladda");
      } finally {
        setLoading(false);
      }
    },
    [matchType, fetchLb],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const top = rows.slice(0, 100);
  const me = currentUserId ? rows.find((r) => r.user_id === currentUserId) : undefined;
  const meInTop = me && top.some((r) => r.user_id === me.user_id);
  const notRanked = !!currentUserId && (!me || me.games_played < 1);

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-black/8 bg-white shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-black/5 bg-neutral-50/50 px-5 py-3 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          {updatedAt
            ? `Live · uppdaterad ${new Date(updatedAt).toLocaleTimeString("sv-SE", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Live"}
        </span>
        <button
          onClick={() => void load(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-neutral-500 transition hover:bg-white hover:text-[#050507]"
        >
          <RefreshCw className="h-3 w-3" />
          Uppdatera
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-neutral-500">Laddar…</div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-destructive">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50/30 text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">
                  Spelare
                </th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">ELO</th>
                <th className="hidden px-4 py-3 text-right font-semibold uppercase tracking-wider sm:table-cell">
                  Matcher
                </th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">
                  Win %
                </th>
              </tr>
            </thead>
            <tbody>
              {top.map((r) => (
                <Row key={r.user_id} r={r} isMe={!!currentUserId && r.user_id === currentUserId} />
              ))}
              {!meInTop && me && (
                <>
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-center text-xs text-muted-foreground">
                      Din placering: #{me.rank}
                    </td>
                  </tr>
                  <Row r={me} isMe />
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
      {notRanked && (
        <div className="border-t border-border">
          <EmptyState
            icon="🏅"
            title="Du är inte rankad ännu"
            subtitle="Spela en match så hamnar du på listan."
            ctaLabel="Spela nu"
            ctaHref="/"
          />
        </div>
      )}
    </div>
  );
}

function Row({ r, isMe }: { r: LbRow; isMe: boolean }) {
  const wr = r.games_played > 0 ? Math.round((r.wins / r.games_played) * 100) : 0;
  const isPodium = r.rank <= 3;
  const podiumGradient =
    r.rank === 1
      ? "from-amber-400 via-yellow-500 to-amber-600"
      : r.rank === 2
        ? "from-slate-300 via-slate-400 to-slate-500"
        : "from-orange-400 via-orange-500 to-orange-700";
  const podiumIcon = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉";
  const rowBg = isMe
    ? "bg-gradient-to-r from-indigo-50 to-violet-50 ring-2 ring-indigo-300"
    : r.rank === 1
      ? "bg-gradient-to-r from-amber-50/80 to-yellow-50/40"
      : "";
  return (
    <motion.tr
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: Math.min(r.rank * 0.02, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className={`group border-t border-black/5 transition-all ${rowBg} ${
        isMe ? "font-semibold" : "hover:bg-neutral-50"
      }`}
    >
      <td className="px-4 py-4 tabular-nums">
        {isPodium ? (
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${podiumGradient} text-lg shadow-md`}
          >
            {podiumIcon}
          </span>
        ) : (
          <span
            className="text-sm font-bold text-neutral-400 tabular-nums"
            style={{ fontFamily: "var(--font-display)" }}
          >
            #{r.rank}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-2">
          <span className="text-[15px] font-medium text-[#050507]">{r.username}</span>
          {isMe && (
            <span className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              Du
            </span>
          )}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <span
          className={`text-[18px] font-bold tabular-nums ${
            isPodium ? "text-aurora-gradient" : "text-[#050507]"
          }`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {r.elo}
        </span>
      </td>
      <td className="hidden px-4 py-4 text-right tabular-nums text-sm text-neutral-500 sm:table-cell">
        {r.games_played}
      </td>
      <td className="px-4 py-4 text-right">
        <span className="inline-flex items-center justify-end gap-1.5">
          <span className="text-sm font-semibold tabular-nums text-[#050507]">{wr}%</span>
          {wr >= 50 && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              aria-label="Vinnande win rate"
            />
          )}
        </span>
      </td>
    </motion.tr>
  );
}

// ---------- Ord leaderboard ----------

function OrdBoard() {
  const fetchLb = useServerFn(fetchOrdLeaderboard);
  const { user } = useAuth();
  const [top, setTop] = useState<OrdLeaderboardRow[]>([]);
  const [me, setMe] = useState<OrdLeaderboardRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLb();
      setTop(filterLeaderboard(res.top));
      setMe(res.me);
      setUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte ladda topplistan");
    } finally {
      setLoading(false);
    }
  }, [fetchLb]);

  useEffect(() => {
    void load();
  }, [load]);

  const meInTop = me && top.some((r) => r.user_id === me.user_id);

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {updatedAt
            ? `Uppdaterad ${new Date(updatedAt).toLocaleTimeString("sv-SE", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "—"}
        </span>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted"
        >
          <RefreshCw className="h-3 w-3" />
          Uppdatera
        </button>
      </div>

      {loading && top.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Laddar…</div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-destructive">{error}</div>
      ) : top.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Inga ord övade ännu — bli först!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Spelare</th>
                <th className="px-3 py-2 text-right">Rätt</th>
                <th className="hidden px-3 py-2 text-right sm:table-cell">Totalt</th>
                <th className="px-3 py-2 text-right">Träffsäkerhet</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r) => (
                <OrdRow key={r.user_id} r={r} isMe={!!user && r.user_id === user.id} />
              ))}
              {!meInTop && me && (
                <>
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-center text-xs text-muted-foreground">
                      Din placering: #{me.rank}
                    </td>
                  </tr>
                  <OrdRow r={me} isMe />
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrdRow({ r, isMe }: { r: OrdLeaderboardRow; isMe: boolean }) {
  const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : null;
  const tintBg = isMe
    ? "bg-[#e0e7ff]"
    : r.rank === 1
      ? "bg-[#fef3c7]"
      : r.rank === 2
        ? "bg-[#f0f2f5]"
        : r.rank === 3
          ? "bg-[#faf0e8]"
          : "";
  return (
    <tr
      className={`border-t border-border transition-colors ${tintBg} ${
        isMe ? "font-semibold" : "hover:bg-[#f0ede8]"
      }`}
    >
      <td className="px-3 py-2.5 tabular-nums">
        {medal ?? <span className="text-muted-foreground">#{r.rank}</span>}
      </td>
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-2">
          {r.username}
          {isMe && (
            <span className="rounded-full bg-[#6366f1] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              Du
            </span>
          )}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-[#6366f1]">
        {r.correct_count}
      </td>
      <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">{r.total_count}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">{r.accuracy}%</td>
    </tr>
  );
}
