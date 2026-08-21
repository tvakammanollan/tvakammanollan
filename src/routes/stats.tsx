import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { pageMeta, pageLinks } from "@/lib/page-meta";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
import {
  ArrowLeft,
  ArrowRight,
  Trophy,
  Target,
  BookA,
  Sigma,
  Star,
  Flame,
  TrendingUp,
  Swords,
} from "lucide-react";
import { HpScoreWidget } from "@/components/ui/HpScoreWidget";
import { displayCategory, formatDate, formatTime } from "@/lib/sv-format";
import { EmptyState } from "@/components/EmptyState";
import { getBotName } from "@/lib/bot";
import { displayName } from "@/lib/guest-name";
import { outcomeFor } from "@/lib/match-outcome";
import { buildEloSeries, eloSeriesSpan, eloTickUnit, type EloSeries } from "@/lib/elo-series";
import { Reveal, StaggerList } from "@/components/landing/MotionFX";
import { PageHero } from "@/components/layout/PageHero";
import { AchievementsCard } from "@/components/AchievementsCard";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
  head: () => ({
    meta: pageMeta({
      path: "/stats",
      title: "Din statistik · Tvåkommanollan",
      description:
        "Följ din HP-progression: ELO-utveckling, win rate, prestanda per delprov och uppskattad normerad HP-poäng.",
      noindex: true,
    }),
    links: pageLinks("/stats"),
  }),
});

const VERBAL_COLOR = "#ae2f26";
const MATH_COLOR = "#7a5236";

interface UserRow {
  username: string;
  elo_verbal: number;
  elo_math: number;
  elo_verbal_peak: number;
  elo_math_peak: number;
  games_played: number;
  wins: number;
  losses: number;
  current_streak?: number;
  longest_streak?: number;
}

/**
 * Hur många matcher per del kurvan sträcker sig över. Räknas per del och inte
 * totalt — se hämtningen nedan.
 */
const ELO_POINTS_PER_TRACK = 50;

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
  // Behövs för tiebreaken: vid lika poäng vinner den som lämnade in först.
  // Se `decideWinnerSide` i `match-outcome.ts`.
  player1_submitted_at: string | null;
  player2_submitted_at: string | null;
}

interface AnswerStat {
  category: string;
  correct: number;
  total: number;
  avgTime: number | null;
}

const VERBAL_CATS = ["ORD", "MEK", "LAS", "ELF"];
const MATH_CATS = ["XYZ", "KVA", "NOG", "DTK"];

function StatsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [eloSeries, setEloSeries] = useState<EloSeries | null>(null);
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
        .select(
          "username, elo_verbal, elo_math, elo_verbal_peak, elo_math_peak, games_played, wins, losses",
        )
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setProfile(prof as UserRow);

      // ELO-historik. Hämtas EN GÅNG PER DEL med flit: ett gemensamt
      // `limit(30)` över hela historiken betyder att den som spelat trettio
      // mattematcher inte har en enda verbal punkt kvar i urvalet, och den
      // verbala linjen försvinner utan förklaring.
      const [verbalRes, mathRes] = await Promise.all([
        supabase
          .from("elo_history")
          .select("match_type, elo_after, elo_change, created_at")
          .eq("user_id", user.id)
          .eq("match_type", "verbal")
          .order("created_at", { ascending: false })
          .limit(ELO_POINTS_PER_TRACK),
        supabase
          .from("elo_history")
          .select("match_type, elo_after, elo_change, created_at")
          .eq("user_id", user.id)
          .eq("match_type", "math")
          .order("created_at", { ascending: false })
          .limit(ELO_POINTS_PER_TRACK),
      ]);
      if (cancelled) return;
      setEloSeries(
        buildEloSeries([
          ...((verbalRes.data ?? []) as EloRow[]),
          ...((mathRes.data ?? []) as EloRow[]),
        ]),
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
          .in(
            "match_id",
            history.map((h) => h.id),
          );
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
          // Samma översättning som i matchen och på resultatsidan: ett
          // gästkonto heter `user_1a2b3c4d` i databasen, inte i historiken.
          for (const u of us ?? [])
            nm.set(u.id as string, displayName(u.username as string, u.id as string));
          setOpponentNames(nm);
        }
      }

      // Average score per match_type (player's score from finished matches)
      let sumV = 0,
        cntV = 0,
        sumM = 0,
        cntM = 0;
      for (const h of history) {
        const myScore = h.player1_id === user.id ? h.player1_score : h.player2_score;
        if (myScore == null) continue;
        if (h.match_type === "verbal") {
          sumV += myScore;
          cntV++;
        } else {
          sumM += myScore;
          cntM++;
        }
      }
      setVerbalAvg(cntV ? sumV / cntV : null);
      setMathAvg(cntM ? sumM / cntM : null);

      // Delprov breakdown + average time per category
      // `selected_answer` måste med: `submitMatch` skriver en rad för VARJE
      // fråga i matchen, även de som aldrig besvarades (`selected_answer` null,
      // `is_correct` false). Räknades de med hamnade obesvarade frågor i
      // nämnaren som felsvar, så den som lämnade in med fyra av åtta hunna fick
      // 50 % i stället för sin faktiska träffsäkerhet. Andel rätt ska mäta det
      // man svarat på; hur mycket man hann är tidspress, en annan sak.
      const { data: ans } = await supabase
        .from("match_answers")
        .select("is_correct, selected_answer, time_spent_seconds, questions(category)")
        .eq("user_id", user.id)
        .not("selected_answer", "is", null)
        .limit(2000);
      const tally = new Map<
        string,
        { correct: number; total: number; timeSum: number; timeCount: number }
      >();
      for (const row of ans ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cat = (row as any).questions?.category as string | undefined;
        if (!cat) continue;
        const t = tally.get(cat) ?? { correct: 0, total: 0, timeSum: 0, timeCount: 0 };
        t.total += 1;
        if (row.is_correct) t.correct += 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ts = (row as any).time_spent_seconds as number | null;
        if (typeof ts === "number" && ts > 0) {
          t.timeSum += ts;
          t.timeCount += 1;
        }
        tally.set(cat, t);
      }
      const stats: AnswerStat[] = [];
      for (const c of [...VERBAL_CATS, ...MATH_CATS]) {
        const t = tally.get(c);
        stats.push({
          category: c,
          correct: t?.correct ?? 0,
          total: t?.total ?? 0,
          avgTime: t && t.timeCount > 0 ? t.timeSum / t.timeCount : null,
        });
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
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6" aria-busy="true">
        <div className="skeleton-shimmer h-28 rounded-2xl" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-24 rounded-xl" />
          ))}
        </div>
        <div className="skeleton-shimmer mt-8 h-72 rounded-2xl" />
        <div className="skeleton-shimmer mt-6 h-72 rounded-2xl" />
      </main>
    );
  }

  const totalPages = Math.max(1, Math.ceil(matchHistory.length / 10));
  const pageRows = matchHistory.slice(page * 10, page * 10 + 10);

  const breakdownData = breakdown.map((b) => ({
    category: displayCategory(b.category),
    pct: b.total >= 5 ? Math.round((b.correct / b.total) * 100) : null,
    enough: b.total >= 5,
    color: VERBAL_CATS.includes(b.category) ? VERBAL_COLOR : MATH_COLOR,
    total: b.total,
    correct: b.correct,
  }));

  return (
    <>
      <PageHero
        eyebrowTone="leaf"
        eyebrow="Din resa"
        title="Din utveckling"
        subtitle="Progression och prestation över tid."
        variant="compact"
      />
      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        {/* HP score estimate – first section */}
        <Reveal delay={0.45} className="mb-6">
          <HpScoreWidget eloVerbal={profile.elo_verbal} eloMath={profile.elo_math} size="full" />
        </Reveal>

        {/* Stat cards */}
        <StaggerList
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          delayStep={0.05}
          y={16}
        >
          <StatCard
            icon={<Target className="h-4 w-4" />}
            label="Matcher"
            value={profile.games_played}
          />
          <StatCard
            icon={<Trophy className="h-4 w-4" />}
            label="Vinster"
            value={profile.wins}
            sub={winRate !== null ? `${winRate.toFixed(0)}% win rate` : undefined}
          />
          <StatCard
            icon={<BookA className="h-4 w-4" />}
            label="Snitt verbal"
            value={verbalAvg !== null ? `${verbalAvg.toFixed(1)}/8` : "–"}
          />
          <StatCard
            icon={<Sigma className="h-4 w-4" />}
            label="Snitt matte"
            value={mathAvg !== null ? `${mathAvg.toFixed(1)}/8` : "–"}
          />
          <StatCard
            icon={<Star className="h-4 w-4" />}
            label="Bästa ELO"
            value={Math.max(profile.elo_verbal_peak, profile.elo_math_peak)}
            sub={`V ${profile.elo_verbal_peak} · M ${profile.elo_math_peak}`}
          />
          {/* Ett kort, inte två. "Nuvarande" och "Längsta" är samma begrepp,
              och rekordet betyder bara något i relation till var man står nu. */}
          <StatCard
            icon={<Flame className="h-4 w-4" />}
            label="Streak"
            value={`${profile.current_streak ?? 0} dagar`}
            sub={`Rekord: ${profile.longest_streak ?? 0} dagar`}
          />
        </StaggerList>
        {/* Achievements */}
        <Reveal className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
          <AchievementsCard variant="full" />
        </Reveal>

        {/* ELO chart */}
        <Reveal className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-baseline justify-between">
            <h2
              className="relative text-xl font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-10 after:bg-[#ae2f26]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ELO över tid
            </h2>
            <span className="text-xs text-muted-foreground">
              Senaste {ELO_POINTS_PER_TRACK} matcherna per del
            </span>
          </div>

          {/* Sammanfattning per del. Kurvan visar utvecklingen, den här raden
              säger vad den betyder — och den skiljer "har inte spelat matte"
              från "matte står stilla", vilket en linje inte kan. */}
          {eloSeries && (
            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
              {(
                [
                  ["verbal", "Verbal", VERBAL_COLOR],
                  ["math", "Matte", MATH_COLOR],
                ] as const
              ).map(([track, label, color]) => {
                const span = eloSeries.span[track];
                const antal = eloSeries.counts[track];
                return (
                  <span key={track} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="font-medium text-foreground">{label}:</span>
                    {span && antal > 0 ? (
                      <span className="tabular-nums text-muted-foreground">
                        {span.last}
                        <span
                          className={
                            span.last - span.first > 0
                              ? "ml-1 text-[var(--success)]"
                              : span.last - span.first < 0
                                ? "ml-1 text-[var(--danger)]"
                                : "ml-1"
                          }
                        >
                          ({span.last - span.first >= 0 ? "+" : ""}
                          {span.last - span.first})
                        </span>
                        <span className="ml-1">
                          på {antal} {antal === 1 ? "match" : "matcher"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">inga matcher än</span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
          {!eloSeries || eloSeries.points.length < 2 ? (
            <EmptyState
              icon={TrendingUp}
              title="Inte tillräckligt med data ännu"
              subtitle="Spela minst 2 matcher för att se din ELO-kurva börja forma sig."
              ctaLabel="Spela en match"
              ctaHref="/"
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={eloSeries.points}
                  margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  {/* Riktig tidsaxel. Var tidigare matchens ordningsnummer,
                      så två matcher samma kväll låg lika långt isär som två
                      med en månad emellan. */}
                  {/* Etiketternas upplösning följer seriens spann. De var
                      alltid ett datum, så tre matcher samma kväll gav fyra
                      identiska etiketter ("21 aug. 21 aug. 21 aug. 21 aug.")
                      och axeln sa ingenting. Se `eloTickUnit`. */}
                  <XAxis
                    dataKey="ts"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v: number) => {
                      const enhet = eloTickUnit(eloSeriesSpan(eloSeries.points));
                      if (enhet === "time") return formatTime(new Date(v));
                      if (enhet === "month")
                        return formatDate(new Date(v), { month: "short", year: "numeric" });
                      return formatDate(new Date(v), { month: "short", day: "numeric" });
                    }}
                    stroke="rgba(255,255,255,0.42)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.42)"
                    fontSize={11}
                    tickLine={false}
                    domain={[
                      (min: number) => Math.max(600, Math.floor(min - 30)),
                      (max: number) => Math.ceil(max + 30),
                    ]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(251, 246, 236, 0.96)",
                      color: "#2e1e14",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#2e1e14" }}
                    itemStyle={{ color: "#2e1e14" }}
                    // Datum OCH klockslag: två matcher samma dag fick annars
                    // samma rubrik i rutan och gick inte att skilja åt.
                    labelFormatter={(v) =>
                      `${formatDate(new Date(Number(v)))} ${formatTime(new Date(Number(v)))}`
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any, props: any) => {
                      // Ändringen hör till den del som faktiskt spelades. Utan
                      // kontrollen fick BÅDA linjerna samma delta i rutan, så
                      // en verbal vinst såg ut att ha höjt matte-ELO också.
                      const p = props?.payload;
                      const track = name === "Verbal" ? "verbal" : "math";
                      if (p?.changed !== track || p?.delta == null) return [`${value}`, name];
                      const sign = p.delta >= 0 ? "+" : "";
                      return [`${value} (${sign}${p.delta})`, name];
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
        </Reveal>

        {/* Delprov breakdown */}
        <Reveal className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-baseline justify-between">
            <h2
              className="relative text-xl font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-10 after:bg-[#ae2f26]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Delprov-prestation
            </h2>
            <span className="text-xs text-muted-foreground">Min. 5 svar per delprov</span>
          </div>
          {breakdownData.every((b) => !b.enough) ? (
            <EmptyState
              icon={Target}
              title="Spela fler matcher"
              subtitle="Vi behöver mer data för att visa din träffsäkerhet per delprov."
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="category"
                    stroke="rgba(255,255,255,0.42)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.42)"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(251, 246, 236, 0.96)",
                      color: "#2e1e14",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#2e1e14" }}
                    itemStyle={{ color: "#2e1e14" }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, _name: any, props: any) => {
                      const p = props?.payload;
                      if (!p?.enough) {
                        // Skilj "inga svar alls" från "för få för att säga något".
                        return [
                          p?.total ? `Bara ${p.total} svar än` : "Inga svar än",
                          "Andel rätt",
                        ];
                      }
                      // Andelen utan antal säger inget om hur säker den är:
                      // 80 % av 5 frågor och 80 % av 200 är olika påståenden.
                      return [`${value}% av ${p.total} svar`, "Andel rätt"];
                    }}
                  />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                    {breakdownData.map((entry, i) => (
                      <Cell key={i} fill={entry.enough ? entry.color : "rgba(255,255,255,0.12)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Reveal>

        {/* Match history */}
        <Reveal className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-baseline justify-between">
            <h2
              className="relative text-xl font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-10 after:bg-[#ae2f26]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Matchhistorik
            </h2>
            <span className="text-xs text-muted-foreground">{matchHistory.length} matcher</span>
          </div>
          {matchHistory.length === 0 ? (
            <EmptyState
              icon={Swords}
              title="Inga matcher ännu"
              subtitle="Du har inte spelat någon match ännu. Spela din första så dyker den upp här."
              ctaLabel="Spela en match"
              ctaHref="/"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground">
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
                      const myScore = isP1 ? (m.player1_score ?? 0) : (m.player2_score ?? 0);
                      const oppScore = isP1 ? (m.player2_score ?? 0) : (m.player1_score ?? 0);
                      // winner_id ensamt duger inte: en FÖRLORAD botmatch har
                      // winner_id = player2_id, som är NULL för bottar. Samma
                      // funktion som servern räknade med. Se `match-outcome.ts`.
                      const outcome = outcomeFor(user!.id, m);
                      const won = outcome === "win";
                      const oppId = isP1 ? m.player2_id : m.player1_id;
                      const oppLabel = m.is_bot_match
                        ? getBotName(m.bot_elo ?? 1000, m.id)
                        : // Ett raderat konto har ingen rad kvar i users —
                          // matchen finns ändå, eftersom kontoradering bevarar
                          // motpartens historik.
                          (oppId && opponentNames.get(oppId)) || "Okänd spelare";
                      const delta = eloByMatch.get(m.id);
                      const rowBg =
                        outcome === null
                          ? "bg-background"
                          : won
                            ? "bg-emerald-500/10"
                            : "bg-rose-500/10";
                      return (
                        <tr key={m.id} className={`border-b border-border/60 ${rowBg}`}>
                          <td className="px-2 py-2 text-muted-foreground">
                            {formatDate(m.created_at, {
                              year: "2-digit",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-2 py-2 capitalize">{m.match_type}</td>
                          <td className="px-2 py-2">{oppLabel}</td>
                          <td className="px-2 py-2 font-medium">
                            {outcome === null ? "Pågår" : won ? "Vinst" : "Förlust"}
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums">
                            {myScore}–{oppScore}
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums">
                            {delta == null ? (
                              "–"
                            ) : (
                              <span
                                className={
                                  delta > 0
                                    ? "text-emerald-400"
                                    : delta < 0
                                      ? "text-rose-400"
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
        </Reveal>

        {/* GDPR: självservice-radering */}
        <DeleteAccountSection />
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
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className="text-2xl font-bold tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
