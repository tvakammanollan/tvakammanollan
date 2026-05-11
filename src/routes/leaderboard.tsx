import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, RefreshCw } from "lucide-react";
import {
  fetchOrdLeaderboard,
  type OrdLeaderboardRow,
} from "@/lib/word-practice.functions";

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="h-7 w-7 text-gold" />
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Topplista
        </h1>
      </div>

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
      const { data, error } = await supabase.rpc("get_leaderboard", {
        _match_type: matchType,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const all = (data ?? []) as LbRow[];
      cache[matchType] = { rows: all, ts: Date.now() };
      setRows(all);
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
          onClick={() => void load(true)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted"
        >
          <RefreshCw className="h-3 w-3" />
          Uppdatera
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Laddar…</div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-destructive">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Spelare</th>
                <th className="px-3 py-2 text-right">ELO</th>
                <th className="hidden px-3 py-2 text-right sm:table-cell">Matcher</th>
                <th className="px-3 py-2 text-right">Win %</th>
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
    </div>
  );
}

function Row({ r, isMe }: { r: LbRow; isMe: boolean }) {
  const wr = r.games_played > 0 ? Math.round((r.wins / r.games_played) * 100) : 0;
  const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : null;
  const tintBg = isMe
    ? "bg-[#e8f2ec]"
    : r.rank === 1
    ? "bg-[#fdf3d0]"
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
            <span className="rounded-full bg-[#1a5c3a] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              Du
            </span>
          )}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{r.elo}</td>
      <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">{r.games_played}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">{wr}%</td>
    </tr>
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
      setTop(res.top);
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
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
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
    ? "bg-[#e8f2ec]"
    : r.rank === 1
    ? "bg-[#fdf3d0]"
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
            <span className="rounded-full bg-[#1a5c3a] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              Du
            </span>
          )}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-[#1a5c3a]">
        {r.correct_count}
      </td>
      <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">
        {r.total_count}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">{r.accuracy}%</td>
    </tr>
  );
}
