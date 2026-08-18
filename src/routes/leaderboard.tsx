import { createFileRoute, Link } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Users, Medal, CalendarDays, BookA } from "lucide-react";
import { formatTime } from "@/lib/sv-format";
import { PodiumRank } from "@/components/ui/PodiumRank";
import { fetchOrdLeaderboard, type OrdLeaderboardRow } from "@/lib/word-practice.functions";
import {
  fetchLeaderboard,
  fetchWeeklyLeaderboard,
  type WeeklyLeaderboardRow,
} from "@/lib/leaderboard.functions";
import { isRankable } from "@/lib/username";
import { EmptyState } from "@/components/EmptyState";
import { Reveal } from "@/components/landing/MotionFX";
import { PageHero } from "@/components/layout/PageHero";

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

function displayName(username: string): string {
  return isRankable(username) ? username : "Anonym";
}

/**
 * Serverfunktionerna filtrerar redan bort anonyma konton — det här är samma
 * regel en gång till för "Vänner"-vyn, som sållar i en redan hämtad lista, och
 * som skydd om en cachad payload från före filtret ligger kvar i react-query.
 */
function filterLeaderboard<T extends { username: string; rank: number }>(
  rows: T[] | undefined | null,
): T[] {
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => isRankable(r.username))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4" aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton-shimmer h-9 w-9 shrink-0 rounded-full" />
          <div className="skeleton-shimmer h-4 flex-1 rounded" />
          <div className="skeleton-shimmer h-4 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: pageMeta({
      path: "/leaderboard",
      title: "Topplista · HP Kampen ELO-ranking",
      description:
        "Se de bästa HP-spelarna i Sverige. ELO-ranking för verbal, matte och ord. Uppdateras live efter varje match. Helt gratis.",
      ogTitle: "Topplista · HP Kampen",
      ogDescription: "ELO-rankning av Sveriges vassaste HP-spelare. Uppdateras live.",
    }),
    links: pageLinks("/leaderboard"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Topplista", path: "/leaderboard" },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Topplista — HP Kampen",
        description:
          "ELO-rankning av Sveriges vassaste HP-spelare i verbal, matte och ord. Uppdateras live efter varje match.",
        url: "https://tvakommanollan.se/leaderboard",
        inLanguage: "sv-SE",
        isPartOf: { "@id": "https://tvakommanollan.se/#website" },
        about: { "@type": "Thing", name: "Högskoleprovet ELO-ranking" },
      }),
    ],
  }),
});

function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"verbal" | "math" | "ord">("verbal");

  return (
    <div className="min-h-screen">
      <PageHero
        eyebrowTone="leaf"
        eyebrow="Hall of fame"
        title="Se vem som är"
        cycleWords={["bäst.", "snabbast.", "vassast.", "smartast."]}
        subtitle="De vassaste HP-spelarna just nu, uppdateras live efter varje match."
        align="center"
        variant="compact"
      />

      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        {user?.is_anonymous && (
          <p className="mb-4 rounded-xl border border-[#ae2f26]/20 bg-[#ae2f26]/[0.06] px-4 py-2.5 text-sm text-white/70">
            Du spelar som gäst — din ELO sparas inte.{" "}
            <Link to="/signup" className="font-semibold text-[#ae2f26] hover:underline">
              Skapa konto
            </Link>{" "}
            för att ta en plats på listan.
          </p>
        )}
        <Reveal delay={0.2}>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="verbal">Verbal</TabsTrigger>
              <TabsTrigger value="math">Matte</TabsTrigger>
              <TabsTrigger value="ord">Ord</TabsTrigger>
            </TabsList>

            <TabsContent value="verbal">
              <Board matchType="verbal" currentUserId={user?.id} isGuest={!!user?.is_anonymous} />
            </TabsContent>
            <TabsContent value="math">
              <Board matchType="math" currentUserId={user?.id} isGuest={!!user?.is_anonymous} />
            </TabsContent>
            <TabsContent value="ord">
              <OrdBoard />
            </TabsContent>
          </Tabs>
        </Reveal>
      </div>
    </div>
  );
}

type Scope = "all" | "week" | "friends";

function ScopeToggle({ scope, onChange }: { scope: Scope; onChange: (s: Scope) => void }) {
  const opts: { value: Scope; label: string }[] = [
    { value: "all", label: "Alltid" },
    { value: "week", label: "Denna vecka" },
    { value: "friends", label: "Vänner" },
  ];
  return (
    <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            scope === o.value ? "bg-[#ae2f26] text-[#2e1e14]" : "text-white/55 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Board({
  matchType,
  currentUserId,
  isGuest,
}: {
  matchType: MatchType;
  currentUserId: string | undefined;
  isGuest: boolean;
}) {
  const fetchLb = useServerFn(fetchLeaderboard);
  const fetchWeekly = useServerFn(fetchWeeklyLeaderboard);
  const [weekly, setWeekly] = useState<WeeklyLeaderboardRow[] | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string> | null>(null);
  const [scope, setScope] = useState<Scope>("all");
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  // react-query-pilot: cache/dedup/refetch utan manuell orkestrering.
  // Server-fn (service-role) returnerar ALLA users med games_played >= 1.
  const {
    data: rows = [],
    isLoading: loading,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["leaderboard", matchType],
    queryFn: async () => {
      const rowsData = await fetchLb({ data: { match_type: matchType, limit: 200 } });
      return filterLeaderboard(rowsData as LbRow[]);
    },
    staleTime: 60_000,
  });
  const error =
    queryError instanceof Error ? queryError.message : queryError ? "Kunde inte ladda" : null;
  const updatedAt = dataUpdatedAt || null;

  // Hämta vän-id:n en gång (för "Vänner"-filtret).
  useEffect(() => {
    if (!currentUserId) {
      setFriendIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);
      if (cancelled) return;
      const ids = new Set<string>([currentUserId]);
      for (const f of data ?? []) {
        ids.add(f.requester_id as string);
        ids.add(f.addressee_id as string);
      }
      setFriendIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  // Ladda veckodata first gången "Denna vecka" väljs.
  useEffect(() => {
    if (scope !== "week" || weekly !== null) return;
    let cancelled = false;
    setWeeklyLoading(true);
    (async () => {
      try {
        const w = await fetchWeekly({ data: { match_type: matchType, limit: 100 } });
        if (!cancelled) setWeekly(filterLeaderboard(w as WeeklyLeaderboardRow[]));
      } catch {
        if (!cancelled) setWeekly([]);
      } finally {
        if (!cancelled) setWeeklyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, weekly, matchType, fetchWeekly]);

  // Weekly nollställs om match_type byts (separat Board-instans per flik,
  // men säkrare att rensa om komponenten återanvänds).
  useEffect(() => {
    setWeekly(null);
  }, [matchType]);

  const headerRefresh = () => {
    if (scope === "week") {
      setWeekly(null);
    } else {
      void refetch();
    }
  };

  return (
    <div>
      <ScopeToggle scope={scope} onChange={setScope} />
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.02] px-5 py-3 text-xs text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {scope === "week"
              ? "Senaste 7 dygnen · störst ELO-klättring"
              : scope === "friends"
                ? "Du och dina vänner"
                : updatedAt
                  ? `Live · uppdaterad ${formatTime(updatedAt)}`
                  : "Live"}
          </span>
          <button
            onClick={headerRefresh}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white/55 transition hover:bg-white/[0.05] hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
            Uppdatera
          </button>
        </div>

        {scope === "week" ? (
          <WeeklyTable rows={weekly} loading={weeklyLoading} currentUserId={currentUserId} />
        ) : (
          <AllTimeTable
            rows={rows}
            loading={loading}
            error={error}
            currentUserId={currentUserId}
            isGuest={isGuest}
            friendsOnly={scope === "friends"}
            friendIds={friendIds}
          />
        )}
      </div>
    </div>
  );
}

function AllTimeTable({
  rows,
  loading,
  error,
  currentUserId,
  isGuest,
  friendsOnly,
  friendIds,
}: {
  rows: LbRow[];
  loading: boolean;
  error: string | null;
  currentUserId: string | undefined;
  isGuest: boolean;
  friendsOnly: boolean;
  friendIds: Set<string> | null;
}) {
  const scoped = friendsOnly
    ? filterLeaderboard(rows.filter((r) => friendIds?.has(r.user_id)))
    : rows;
  const top = scoped.slice(0, 100);
  const me = currentUserId ? scoped.find((r) => r.user_id === currentUserId) : undefined;
  const meInTop = me && top.some((r) => r.user_id === me.user_id);
  // Gästkonton står aldrig i listan, så "spela en match" vore fel besked — de
  // har redan spelat. Banderollen högst upp på sidan säger vad som krävs.
  const notRanked = !friendsOnly && !!currentUserId && !isGuest && (!me || me.games_played < 1);

  if ((loading && rows.length === 0) || (friendsOnly && friendIds === null))
    return <TableSkeleton />;
  if (error) return <div className="p-8 text-center text-sm text-[#8c1d18]">{error}</div>;
  if (friendsOnly && top.length === 0)
    return (
      <div className="border-t border-border">
        <EmptyState
          icon={Users}
          title="Inga rankade vänner ännu"
          subtitle="Lägg till vänner och spela en match så dyker de upp här."
          ctaLabel="Hitta vänner"
          ctaHref="/friends"
        />
      </div>
    );

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-xs text-white/55">
            <tr>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">
                Spelare
              </th>
              <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">ELO</th>
              <th className="hidden px-4 py-3 text-right font-semibold uppercase tracking-wider sm:table-cell">
                Matcher
              </th>
              <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">Win %</th>
            </tr>
          </thead>
          <tbody>
            {top.map((r) => (
              <Row key={r.user_id} r={r} isMe={!!currentUserId && r.user_id === currentUserId} />
            ))}
            {!meInTop && me && (
              <>
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-center text-xs text-white/45">
                    Din placering: #{me.rank}
                  </td>
                </tr>
                <Row r={me} isMe />
              </>
            )}
          </tbody>
        </table>
      </div>
      {notRanked && (
        <div className="border-t border-border">
          <EmptyState
            icon={Medal}
            title="Du är inte rankad ännu"
            subtitle="Spela en match så hamnar du på listan."
            ctaLabel="Spela nu"
            ctaHref="/"
          />
        </div>
      )}
    </>
  );
}

function WeeklyTable({
  rows,
  loading,
  currentUserId,
}: {
  rows: WeeklyLeaderboardRow[] | null;
  loading: boolean;
  currentUserId: string | undefined;
}) {
  if (loading || rows === null) return <TableSkeleton />;
  if (rows.length === 0)
    return (
      <EmptyState
        icon={CalendarDays}
        title="Ingen har spelat än den här veckan"
        subtitle="Veckolistan nollställs varje måndag. Spela en match så tar du förstaplatsen."
        ctaLabel="Spela nu"
        ctaHref="/"
      />
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.03] text-xs text-white/55">
          <tr>
            <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">#</th>
            <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider">Spelare</th>
            <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">
              ELO denna vecka
            </th>
            <th className="hidden px-4 py-3 text-right font-semibold uppercase tracking-wider sm:table-cell">
              Matcher
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isMe = !!currentUserId && r.user_id === currentUserId;

            return (
              <tr
                key={r.user_id}
                className={`border-t border-white/8 transition-colors ${
                  isMe
                    ? "bg-[#ae2f26]/10 font-semibold ring-1 ring-[#ae2f26]/40"
                    : "hover:bg-white/[0.03]"
                }`}
              >
                <td className="px-4 py-3.5 tabular-nums">
                  <PodiumRank rank={r.rank} />
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-2 text-white">
                    {displayName(r.username)}
                    {isMe && (
                      <span className="rounded-full bg-[#ae2f26] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2e1e14]">
                        Du
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span
                    className={`text-[16px] font-bold tabular-nums ${
                      r.elo_gain > 0
                        ? "text-emerald-400"
                        : r.elo_gain < 0
                          ? "text-rose-400"
                          : "text-white/55"
                    }`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {r.elo_gain >= 0 ? "+" : ""}
                    {r.elo_gain}
                  </span>
                </td>
                <td className="hidden px-4 py-3.5 text-right tabular-nums text-white/55 sm:table-cell">
                  {r.games}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Row({ r, isMe }: { r: LbRow; isMe: boolean }) {
  const wr = r.games_played > 0 ? Math.round((r.wins / r.games_played) * 100) : 0;
  const isPodium = r.rank <= 3;
  const rowBg = isMe
    ? "bg-[#ae2f26]/10 ring-1 ring-[#ae2f26]/40"
    : r.rank === 1
      ? "bg-[#ae2f26]/[0.04]"
      : "";
  return (
    <m.tr
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: Math.min(r.rank * 0.02, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className={`group border-t border-white/8 transition-colors ${rowBg} ${
        isMe ? "font-semibold" : "hover:bg-white/[0.03]"
      }`}
    >
      <td className="px-4 py-4 tabular-nums">
        <PodiumRank rank={r.rank} size="md" />
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-2">
          <span className="text-[15px] font-medium text-white">{displayName(r.username)}</span>
          {isMe && (
            <span className="rounded-full bg-[#ae2f26] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2e1e14]">
              Du
            </span>
          )}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <span
          className={`text-[18px] font-bold tabular-nums ${
            isPodium ? "text-[#ae2f26]" : "text-white"
          }`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {r.elo}
        </span>
      </td>
      <td className="hidden px-4 py-4 text-right tabular-nums text-sm text-white/55 sm:table-cell">
        {r.games_played}
      </td>
      <td className="px-4 py-4 text-right">
        <span className="inline-flex items-center justify-end gap-1.5">
          <span className="text-sm font-semibold tabular-nums text-white">{wr}%</span>
          {wr >= 50 && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              aria-label="Vinnande win rate"
            />
          )}
        </span>
      </td>
    </m.tr>
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
      const res = await fetchLb({ data: user ? { user_id: user.id } : {} });
      setTop(filterLeaderboard(res.top));
      setMe(res.me);
      setUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte ladda topplistan");
    } finally {
      setLoading(false);
    }
  }, [fetchLb, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const meInTop = me && top.some((r) => r.user_id === me.user_id);
  // Gästkonton rankas inte alls, så en egen rad vore en placering de inte
  // har. Banderollen högst upp på sidan säger vad som krävs i stället.
  const showMe = !!me && !meInTop && !user?.is_anonymous;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.02] px-4 py-2 text-xs text-white/55">
        <span>{updatedAt ? `Uppdaterad ${formatTime(updatedAt)}` : "—"}</span>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-white/55 hover:bg-white/[0.05] hover:text-white"
        >
          <RefreshCw className="h-3 w-3" />
          Uppdatera
        </button>
      </div>

      {loading && top.length === 0 ? (
        <TableSkeleton />
      ) : error ? (
        <div className="p-8 text-center text-sm text-[#8c1d18]">{error}</div>
      ) : top.length === 0 ? (
        <EmptyState
          icon={BookA}
          title="Inga ord övade ännu"
          subtitle="Ord-listan rankar efter antal rätta ord. Öva en runda så hamnar du på den."
          ctaLabel="Öva ord"
          ctaHref="/ord"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/55">
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
              {showMe && me && (
                <>
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-center text-xs text-white/45">
                      {me.rank > 0 ? `Din placering: #${me.rank}` : "Din statistik"}
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
  const tintBg = isMe
    ? "bg-[#ae2f26]/10 ring-1 ring-[#ae2f26]/40"
    : r.rank === 1
      ? "bg-[#ae2f26]/[0.04]"
      : "";
  return (
    <tr
      className={`border-t border-white/8 transition-colors ${tintBg} ${
        isMe ? "font-semibold" : "hover:bg-white/[0.03]"
      }`}
    >
      <td className="px-3 py-2.5 tabular-nums">
        <PodiumRank rank={r.rank} />
      </td>
      <td className="px-3 py-2.5 text-white">
        <span className="inline-flex items-center gap-2">
          {displayName(r.username)}
          {isMe && (
            <span className="rounded-full bg-[#ae2f26] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#2e1e14]">
              Du
            </span>
          )}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-[#ae2f26]">
        {r.correct_count}
      </td>
      <td className="hidden px-3 py-2.5 text-right tabular-nums text-white/70 sm:table-cell">
        {r.total_count}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-white/85">{r.accuracy}%</td>
    </tr>
  );
}
