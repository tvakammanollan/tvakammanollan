import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { ArrowLeft, ArrowRight, Trophy, Target, BookA, Sigma, Star } from "lucide-react";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

const VERBAL_COLOR = "#1a5c3a";
const MATH_COLOR = "#d4a017";

interface UserRow {
  username: string;
  elo_verbal: number;
  elo_math: number;
  elo_verbal_peak: number;
  elo_math_peak: number;
  games_played: number;
  wins: number;
  losses: number;
}

interface EloPoint {
  ts: number;
  date: string;
  verbal?: number;
  math?: number;
  delta?: number;
  match_type: "verbal" | "math";
}

interface EloRow {
  match_type: "verbal" | "math";
  elo_after: number;
  elo_change: number;
  created_at: string;
}

interface MatchHistRow {
  id: string;
  match_type: "verbal" | "math";
  player1_id: string;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  winner_id: string | null;
  is_bot_match: boolean;
  bot_elo: number | null;
  created_at: string;
  status: string;
}

interface AnswerStat {
  category: string;
  correct: number;
  total: number;
}

const VERBAL_CATS = ["ORD", "MEK", "LAS", "ELF"];
const MATH_CATS = ["XYZ", "KVA", "NOG", "DTK"];

function StatsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [eloPoints, setEloPoints] = useState<EloPoint[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistRow[]>([]);
  const [eloByMatch, setEloByMatch] = useState<Map<string, number>>(new Map());
  const [opponentNames, setOpponentNames] = useState<Map<string, string>>(new Map());
  const [page, setPage] = useState(0);
  const [verbalAvg, setVerbalAvg] = useState<number | null>(null);
  const [mathAvg, setMathAvg] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<AnswerStat[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: prof } = await supabase
        .from("users")
        .select("username, elo_verbal, elo_math, elo_verbal_peak, elo_math_peak, games_played, wins, losses")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setProfile(prof as UserRow);

      // ELO history – last 30
      const { data: eh } = await supabase
        .from("elo_history")
        .select("match_type, elo_after, elo_change, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      const ordered = ((eh ?? []) as EloRow[]).slice().reverse();
      setEloPoints(
        ordered.map((r) => ({
          ts: new Date(r.created_at).getTime(),
          date: new Date(r.created_at).toLocaleDateString("sv-SE", { month: "short", day: "numeric" }),
          verbal: r.match_type === "verbal" ? r.elo_after : undefined,
          math: r.match_type === "math" ? r.elo_after : undefined,
          delta: r.elo_change,
          match_type: r.match_type,
        })),
      );

      // Match history – all matches the user has played, finished
      const { data: mh } = await supabase
        .from("matches")
        .select("*")
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .eq("status", "finished")
        .order("created_at", { ascending: false })
        .limit(200);
      const history = (mh ?? []) as MatchHistRow[];
      setMatchHistory(history);

      // ELO change per match for table
      if (history.length > 0) {
        const { data: hh } = await supabase
          .from("elo_history")
          .select("match_id, elo_change")
          .eq("user_id", user.id)
          .in("match_id", history.map((h) => h.id));
        const m = new Map<string, number>();
        for (const row of hh ?? []) m.set(row.match_id, row.elo_change as number);
        setEloByMatch(m);

        // Opponent usernames (non-bot)
        const oppIds = Array.from(
          new Set(
            history
              .filter((h) => !h.is_bot_match)
              .map((h) => (h.player1_id === user.id ? h.player2_id : h.player1_id))
              .filter((x): x is string => !!x),
          ),
        );
        if (oppIds.length > 0) {
          const { data: us } = await supabase.from("users").select("id, username").in("id", oppIds);
          const nm = new Map<string, string>();
          for (const u of us ?? []) nm.set(u.id as string, u.username as string);
          setOpponentNames(nm);
        }
      }

      // Average score per match_type (player's score from finished matches)
      let sumV = 0, cntV = 0, sumM = 0, cntM = 0;
      for (const h of history) {
        const myScore = h.player1_id === user.id ? h.player1_score : h.player2_score;
        if (myScore == null) continue;
        if (h.match_type === "verbal") { sumV += myScore; cntV++; }
        else { sumM += myScore; cntM++; }
      }
      setVerbalAvg(cntV ? sumV / cntV : null);
      setMathAvg(cntM ? sumM / cntM : null);

      // Delprov breakdown
      const { data: ans } = await supabase
        .from("match_answers")
        .select("is_correct, questions(category)")
        .eq("user_id", user.id)
        .limit(2000);
      const tally = new Map<string, { correct: number; total: number }>();
      for (const row of ans ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cat = (row as any).questions?.category as string | undefined;
        if (!cat) continue;
        const t = tally.get(cat) ?? { correct: 0, total: 0 };
        t.total += 1;
        if (row.is_correct) t.correct += 1;
        tally.set(cat, t);
      }
      const stats: AnswerStat[] = [];
      for (const c of [...VERBAL_CATS, ...MATH_CATS]) {
        const t = tally.get(c);
        stats.push({ category: c, correct: t?.correct ?? 0, total: t?.total ?? 0 });
      }
      setBreakdown(stats);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate]);

  const winRate = useMemo(() => {
    if (!profile || profile.games_played === 0) return null;
    return (profile.wins / profile.games_played) * 100;
  }, [profile]);

  if (loading || !profile) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Laddar statistik…
        </div>
      </>
    );
  }

  const totalPages = Math.max(1, Math.ceil(matchHistory.length / 10));
  const pageRows = matchHistory.slice(page * 10, page * 10 + 10);

  const breakdownData = breakdown.map((b) => ({
    category: b.category === "LAS" ? "LÄS" : b.category,
    pct: b.total >= 5 ? Math.round((b.correct / b.total) * 100) : null,
    enough: b.total >= 5,
    color: VERBAL_CATS.includes(b.category) ? VERBAL_COLOR : MATH_COLOR,
    total: b.total,
  }));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Statistik
            </h1>
            <p className="text-sm text-muted-foreground">
              Din progression och prestation över tid.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Tillbaka hem</Link>
          </Button>
        </div>

        {/* Stat cards */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={<Target className="h-4 w-4" />} label="Matcher" value={profile.games_played} />
          <StatCard
            icon={<Trophy className="h-4 w-4" />}
            label="Vinster"
            value={profile.wins}
            sub={winRate !== null ? `${winRate.toFixed(0)}% win rate` : undefined}
          />
          <StatCard
            icon={<BookA className="h-4 w-4" />}
            label="Snitt verbal"
            value={verbalAvg !== null ? `${verbalAvg.toFixed(1)}/8` : "—"}
          />
          <StatCard
            icon={<Sigma className="h-4 w-4" />}
            label="Snitt matte"
            value={mathAvg !== null ? `${mathAvg.toFixed(1)}/8` : "—"}
          />
          <StatCard
            icon={<Star className="h-4 w-4" />}
            label="Bästa ELO"
            value={Math.max(profile.elo_verbal_peak, profile.elo_math_peak)}
            sub={`V ${profile.elo_verbal_peak} · M ${profile.elo_math_peak}`}
          />
        </section>

        {/* ELO chart */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="relative text-xl font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-10 after:bg-[#1a5c3a]" style={{ fontFamily: "var(--font-display)" }}>ELO över tid</h2>
            <span className="text-xs text-muted-foreground">Senaste 30 matcherna</span>
          </div>
          {eloPoints.length < 2 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
              Spela fler matcher för att se din progression
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eloPoints} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.92 0.01 85)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="oklch(0.55 0 0)"
                    fontSize={11}
                    tickLine={false}
                    domain={[(min: number) => Math.max(600, Math.floor(min - 30)), (max: number) => Math.ceil(max + 30)]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid oklch(0.90 0.01 85)",
                      fontSize: 12,
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any, props: any) => {
                      const delta = props?.payload?.delta;
                      const sign = delta >= 0 ? "+" : "";
                      return [`${value} (${sign}${delta})`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="verbal"
                    name="Verbal"
                    stroke={VERBAL_COLOR}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="math"
                    name="Matte"
                    stroke={MATH_COLOR}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Delprov breakdown */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="relative text-xl font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-10 after:bg-[#1a5c3a]" style={{ fontFamily: "var(--font-display)" }}>Delprov-prestation</h2>
            <span className="text-xs text-muted-foreground">Min. 5 svar per delprov</span>
          </div>
          {breakdownData.every((b) => !b.enough) ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
              Ej tillräckligt med data – spela fler matcher
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.92 0.01 85)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="oklch(0.55 0 0)"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid oklch(0.90 0.01 85)",
                      fontSize: 12,
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, _name: any, props: any) => {
                      if (!props?.payload?.enough) return ["Ej nog data", "Andel rätt"];
                      return [`${value}%`, "Andel rätt"];
                    }}
                  />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                    {breakdownData.map((entry, i) => (
                      <Cell key={i} fill={entry.enough ? entry.color : "oklch(0.85 0.01 85)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Match history */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="relative text-xl font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-10 after:bg-[#1a5c3a]" style={{ fontFamily: "var(--font-display)" }}>Matchhistorik</h2>
            <span className="text-xs text-muted-foreground">{matchHistory.length} matcher</span>
          </div>
          {matchHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-[#f0ede8]/40 px-4 py-10 text-center">
              <Trophy className="h-10 w-10 text-[#c49a0e]/60" />
              <div>
                <p className="text-sm font-medium">Inga matcher ännu</p>
                <p className="mt-1 text-xs text-muted-foreground">Starta din första battle för att se historik här.</p>
              </div>
              <Button asChild size="sm" className="bg-[#1a5c3a] text-white hover:bg-[#154d31]">
                <Link to="/">Till hemskärmen</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-2 py-2">Datum</th>
                      <th className="px-2 py-2">Typ</th>
                      <th className="px-2 py-2">Motståndare</th>
                      <th className="px-2 py-2">Resultat</th>
                      <th className="px-2 py-2 text-right">Poäng</th>
                      <th className="px-2 py-2 text-right">ELO ±</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((m) => {
                      const isP1 = m.player1_id === user!.id;
                      const myScore = isP1 ? m.player1_score ?? 0 : m.player2_score ?? 0;
                      const oppScore = isP1 ? m.player2_score ?? 0 : m.player1_score ?? 0;
                      const won = m.winner_id === user!.id;
                      const draw = m.winner_id === null;
                      const oppId = isP1 ? m.player2_id : m.player1_id;
                      const oppLabel = m.is_bot_match
                        ? `Bot (ELO ${m.bot_elo ?? "?"})`
                        : (oppId && opponentNames.get(oppId)) || "Motståndare";
                      const delta = eloByMatch.get(m.id);
                      const rowBg = draw
                        ? "bg-background"
                        : won
                        ? "bg-emerald-50/60"
                        : "bg-rose-50/60";
                      return (
                        <tr key={m.id} className={`border-b border-border/60 ${rowBg}`}>
                          <td className="px-2 py-2 text-muted-foreground">
                            {new Date(m.created_at).toLocaleDateString("sv-SE", {
                              year: "2-digit",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-2 py-2 capitalize">{m.match_type}</td>
                          <td className="px-2 py-2">{oppLabel}</td>
                          <td className="px-2 py-2 font-medium">
                            {draw ? "Oavgjort" : won ? "Vinst" : "Förlust"}
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums">
                            {myScore}–{oppScore}
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums">
                            {delta == null ? (
                              "—"
                            ) : (
                              <span
                                className={
                                  delta > 0
                                    ? "text-emerald-700"
                                    : delta < 0
                                    ? "text-rose-700"
                                    : "text-muted-foreground"
                                }
                              >
                                {delta >= 0 ? "+" : ""}
                                {delta}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Föregående
                  </Button>
                  <span className="text-muted-foreground">
                    Sida {page + 1} av {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Nästa <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
