import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, RefreshCw } from "lucide-react";
import {
  fetchOrdLeaderboard,
  type OrdLeaderboardRow,
} from "@/lib/word-practice.functions";
import { EmptyState } from "@/components/EmptyState";

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

/** Hide test/guest accounts and re-number ranks. */
function filterLeaderboard<T extends { username: string; rank: number }>(rows: T[]): T[] {
  const BLOCKED = new Set(["niklastest", "niklastest2"]);
  return rows
    .filter((r) => {
      const name = (r.username ?? "").toLowerCase().trim();
      if (!name) return false;
      if (BLOCKED.has(name)) return false;
      // Auto-generated guest username patterns:
      if (/^spelare_[a-z0-9]{3,}$/i.test(name)) return false;
      if (/^(gast|gäst|guest)[_-]?/i.test(name)) return false;
      if (/^anon[_-]?/i.test(name)) return false;
      return true;
    })
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

const CACHE_MS = 5 * 60 * 1000;
const cache: Record<MatchType, { rows: LbRow[]; ts: number } | undefined> = {
  verbal: undefined,
  math: undefined,
};

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"verbal" | "math" | "ord">("verbal");

  return (
    <div className="bg-paper text-navy min-h-screen">
      <div className="mx-auto max-w-[920px] px-6 pb-32 pt-10 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
          className="mb-10"
        >
          <p className="eyebrow">Topplista · uppdateras live</p>
          <h1 className="display mt-4 text-[40px] leading-[1.05] text-navy sm:text-[64px]">
            De vassaste{" "}
            <em className="text-amber-italic">just nu.</em>
          </h1>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-[1.6] text-navy/70">
            Krävs minst tre matcher för att synas. Testkonton och gäster
            filtreras bort automatiskt.
          </p>
        </motion.div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full max-w-md grid-cols-3 rounded-full border border-[var(--line-cream)] bg-paper-2 p-1">
            <TabsTrigger value="verbal" className="rounded-full font-mono text-[11px] uppercase tracking-[0.14em]">
              Verbal
            </TabsTrigger>
            <TabsTrigger value="math" className="rounded-full font-mono text-[11px] uppercase tracking-[0.14em]">
              Matte
            </TabsTrigger>
            <TabsTrigger value="ord" className="rounded-full font-mono text-[11px] uppercase tracking-[0.14em]">
              Ord
            </TabsTrigger>
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
      </div>
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
      // Try new RPC signature (with _limit/_offset). Fall back to old
      // single-arg signature if the migration hasn't been applied yet.
      let data: LbRow[] | null = null;
      let error: { message: string } | null = null;
      const r1 = await supabase.rpc("get_leaderboard", {
        _match_type: matchType,
        _limit: 200,
        _offset: 0,
      });
      if (r1.error) {
        const r2 = await supabase.rpc("get_leaderboard", {
          _match_type: matchType,
        });
        data = (r2.data ?? null) as LbRow[] | null;
        error = r2.error ? { message: r2.error.message } : null;
      } else {
        data = (r1.data ?? null) as LbRow[] | null;
      }
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Apply client-side filter as a safety net in case server hasn't been
      // upgraded yet (older RPC returns all users).
      const filtered = filterLeaderboard((data ?? []) as LbRow[]);
      cache[matchType] = { rows: filtered, ts: Date.now() };
      setRows(filtered);
      setUpdatedAt(Date.now());
      setLoading(false);
    },
    [matchType],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const top = rows.slice(0, 100);
  const me = currentUserId ? rows.find((r) => r.user_id === currentUserId) : undefined;
  const meInTop = me && top.some((r) => r.user_id === me.user_id);
  const notRanked = !!currentUserId && (!me || me.games_played < 3);

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
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-neutral-500 transition hover:bg-white hover:text-[#0E1B2C]"
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
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Spelare</th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">ELO</th>
                <th className="hidden px-4 py-3 text-right font-semibold uppercase tracking-wider sm:table-cell">Matcher</th>
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Win %</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r) => (
                <Row
                  key={r.user_id}
                  r={r}
                  isMe={!!currentUserId && r.user_id === currentUserId}
                />
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
            subtitle="Spela 3 matcher för att komma med i rankingen."
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
    ? "bg-gradient-to-r from-amber-50 to-orange-50 ring-2 ring-indigo-300"
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
          <span className="text-sm font-bold text-neutral-400 tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
            #{r.rank}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-2">
          <span className="text-[15px] font-medium text-[#0E1B2C]">{r.username}</span>
          {isMe && (
            <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              Du
            </span>
          )}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <span
          className={`text-[18px] font-bold tabular-nums ${
            isPodium ? "text-aurora-gradient" : "text-[#0E1B2C]"
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
          <span className="text-sm font-semibold tabular-nums text-[#0E1B2C]">{wr}%</span>
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
                <OrdRow
                  key={r.user_id}
                  r={r}
                  isMe={!!user && r.user_id === user.id}
                />
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
    ? "bg-[#DAD4C5]"
    : r.rank === 1
    ? "bg-[#E8E4DA]"
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
            <span className="rounded-full bg-[#0E1B2C] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              Du
            </span>
          )}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-[#0E1B2C]">
        {r.correct_count}
      </td>
      <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">
        {r.total_count}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">{r.accuracy}%</td>
    </tr>
  );
}
