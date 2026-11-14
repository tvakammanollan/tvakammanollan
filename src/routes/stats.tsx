import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { pageMeta, pageLinks } from "@/lib/page-meta";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { HpScoreWidget } from "@/components/ui/HpScoreWidget";
import { formatDate, enhet } from "@/lib/sv-format";
import { EmptyState } from "@/components/EmptyState";
import { getBotName } from "@/lib/bot";
import { displayName } from "@/lib/guest-name";
import { outcomeFor } from "@/lib/match-outcome";
import { PageHero } from "@/components/layout/PageHero";
import { AchievementsCard } from "@/components/AchievementsCard";
import { OrdPurchaseCard } from "@/components/OrdPurchaseCard";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
  head: () => ({
    meta: pageMeta({
      path: "/stats",
      title: "Din statistik",
      description:
        "Din statistik: matcher, andel vinster, matchhistorik och uppskattad HP-poäng.",
      noindex: true,
    }),
    links: pageLinks("/stats"),
  }),
});

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

function StatsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistRow[]>([]);
  const [eloByMatch, setEloByMatch] = useState<Map<string, number>>(new Map());
  const [opponentNames, setOpponentNames] = useState<Map<string, string>>(new Map());
  const [page, setPage] = useState(0);
  const [verbalAvg, setVerbalAvg] = useState<number | null>(null);
  const [mathAvg, setMathAvg] = useState<number | null>(null);

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
      </main>
    );
  }

  const totalPages = Math.max(1, Math.ceil(matchHistory.length / 10));
  const pageRows = matchHistory.slice(page * 10, page * 10 + 10);

  return (
    <>
      {/* Sidan är duellens statistik (ELO, matcher, HP-poäng ur ELO) och
          räknas till duellzonen i `zonForPath`, så dekorformerna och
          zonremsan blir terracotta som på /leaderboard. */}
      <PageHero title="Din utveckling" variant="compact" />
      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        {/* HP score estimate – first section */}
        <div className="mb-6">
          <HpScoreWidget eloVerbal={profile.elo_verbal} eloMath={profile.elo_math} size="full" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Matcher" value={profile.games_played} />
          <StatCard
            label="Vinster"
            value={profile.wins}
            sub={winRate !== null ? `${winRate.toFixed(0)}% win rate` : undefined}
          />
          <StatCard
            label="Snitt verbal"
            value={verbalAvg !== null ? `${verbalAvg.toFixed(1)}/8` : "–"}
          />
          <StatCard
            label="Snitt kvantitativ"
            value={mathAvg !== null ? `${mathAvg.toFixed(1)}/8` : "–"}
          />
          <StatCard
            label="Bästa ELO"
            value={Math.max(profile.elo_verbal_peak, profile.elo_math_peak)}
            sub={`Verbal ${profile.elo_verbal_peak}, kvantitativ ${profile.elo_math_peak}`}
          />
          {/* Ett kort, inte två. "Nuvarande" och "Längsta" är samma begrepp,
              och rekordet betyder bara något i relation till var man står nu. */}
          <StatCard
            label="Streak"
            value={`${enhet(profile.current_streak ?? 0, "dag")}`}
            sub={`Rekord: ${enhet(profile.longest_streak ?? 0, "dag")}`}
          />
        </div>
        {/* Achievements */}
        {/* Cream wash är den dekorfärg som inte tillhör någon zon; här
            skiljer den utmärkelserna från de vita statkorten ovanför och
            historiken nedanför utan att låna en produktytas färg. */}
        <div className="mt-8 rounded-3xl bg-cream-wash p-5 sm:p-6">
          <AchievementsCard variant="full" />
        </div>

        {/* Match history */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2
              className="relative text-xl font-semibold pb-2 after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-10 after:bg-primary"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Matchhistorik
            </h2>
            <span className="text-xs text-muted-foreground">
              {enhet(matchHistory.length, "match")}
            </span>
          </div>
          {matchHistory.length === 0 ? (
            <EmptyState
              icon={Swords}
              title="Inga matcher ännu"
              subtitle="Dina matcher visas här när du har spelat en."
              ctaLabel="Spela en match"
              ctaHref="/"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
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
                          <td className="px-2 py-2">
                            {m.match_type === "math" ? "Kvantitativ" : "Verbal"}
                          </td>
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
                    Föregående
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
                    Nästa
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Köpet och uppsägningen av månadsprenumerationen. Renderar
            ingenting för den som inte köpt. */}
        <OrdPurchaseCard className="mt-10" manageLink />

        {/* GDPR: självservice-radering */}
        <DeleteAccountSection />
      </main>
    </>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
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
