import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { getNextHpDate } from "@/lib/hp-dates";
import { getBotName } from "@/lib/bot";
import { getLandingStats, type LandingStats, type TopPlayer } from "@/lib/landing.functions";
import { useGuestPlay } from "@/hooks/useGuestPlay";
import { useShaderCanvas } from "@/components/landing/shaderCanvas";
import { RANK_TIERS } from "@/types";

const TESTIMONIALS = [
  { quote: "Det är ett gott tecken när det känns roligt och engagerande att plugga inför högskoleprovet.", name: "Aron", score: "2.0" },
  { quote: "HP Kampen har allt som behövs för att lyckas på högskoleprovet.", name: "Gustav", score: "1.9" },
  { quote: "HP Kampen innehåller verktyg jag hade haft stor nytta av när jag pluggade till högskoleprovet, helt gratis.", name: "Niklas", score: "1.95", founder: true },
];

const AMBER = "#f2a65a";

export function HeroLanding() {
  const fetchStats = useServerFn(getLandingStats);
  const [stats, setStats] = useState<LandingStats | null>(null);
  const { play: playAsGuest, loading: guestLoading } = useGuestPlay();

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats(null));
  }, [fetchStats]);

  return (
    <div className="min-h-screen text-white" style={{ background: "#170d05" }}>
      <LiveTicker stats={stats} />
      <Hero stats={stats} guestLoading={guestLoading} onGuest={playAsGuest} />
      <Leaderboard stats={stats} />
      <LiveMatch />
      <RecentMatches stats={stats} />
      <TierBar />
      <Quotes />
      <Closer />
    </div>
  );
}

/* ============================================================ */
/* ===  LIVE TICKER — real recent matches                   === */
/* ============================================================ */

/**
 * Härleder vinnaren från scores när winner_id är null (vilket händer
 * när en bot vinner — boten har ingen user-id att lagra). Lika scores
 * = riktig oavgjort.
 */
function getMatchOutcome(m: { winner_id: string | null; player1_id: string; player1_score: number | null; player2_score: number | null }) {
  const s1 = m.player1_score ?? 0;
  const s2 = m.player2_score ?? 0;
  if (s1 === s2) return { isDraw: true as const, p1Won: false };
  const p1Won = m.winner_id ? m.winner_id === m.player1_id : s1 > s2;
  return { isDraw: false as const, p1Won };
}

function formatMatchString(m: NonNullable<LandingStats["recent"]>[number]): string {
  const p1 = m.p1_name || "Gäst";
  const p2 = m.is_bot_match ? getBotName(m.bot_elo ?? 1000, m.id) : m.p2_name || "Gäst";
  const s1 = m.player1_score ?? 0;
  const s2 = m.player2_score ?? 0;
  const { isDraw, p1Won } = getMatchOutcome(m);
  if (isDraw) return `${p1} och ${p2} oavgjort ${s1}–${s2}`;
  const winner = p1Won ? p1 : p2;
  const loser = p1Won ? p2 : p1;
  const ws = p1Won ? s1 : s2;
  const ls = p1Won ? s2 : s1;
  return `${winner} slog ${loser} ${ws}–${ls}`;
}

function LiveTicker({ stats }: { stats: LandingStats | null }) {
  const [now, setNow] = useState(() => new Date());
  const next = useMemo(() => getNextHpDate(now), [now]);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const diffDays = next
    ? Math.max(0, Math.ceil((next.date.getTime() - now.getTime()) / 86400000))
    : null;

  const items = useMemo(() => {
    const out: Array<{ type: "live" | "match" | "stat" | "tag"; text: string }> = [];

    // Live-stats (når data finns)
    if (stats && stats.activePlayers > 0) {
      out.push({ type: "live", text: `${stats.activePlayers} spelare online just nu` });
    }
    if (stats && stats.matchesPerMin > 0) {
      out.push({
        type: "live",
        text: `${stats.matchesPerMin} match${stats.matchesPerMin === 1 ? "" : "er"} senaste minuten`,
      });
    }

    // ELO-rekord
    if (stats && stats.topVerbalElo > 0) {
      out.push({ type: "stat", text: `Bästa verbal-ELO: ${stats.topVerbalElo}` });
    }
    if (stats && stats.topMathElo > 0) {
      out.push({ type: "stat", text: `Bästa matte-ELO: ${stats.topMathElo}` });
    }

    // HP-countdown
    if (next && diffDays !== null) {
      out.push({ type: "stat", text: `${diffDays} dagar till ${next.label}` });
    }

    // Totals
    if (stats && stats.totalMatches > 0) {
      out.push({
        type: "stat",
        text: `${stats.totalMatches.toLocaleString("sv-SE")} matcher spelade totalt`,
      });
    }
    if (stats && stats.totalPlayers > 0) {
      out.push({
        type: "stat",
        text: `${stats.totalPlayers.toLocaleString("sv-SE")} registrerade spelare`,
      });
    }

    // Match-feed (de senaste)
    const recent = stats?.recent ?? [];
    for (const m of recent.slice(0, 8)) {
      out.push({ type: "match", text: formatMatchString(m) });
    }

    // Statiska taglines / produktfakta (alltid med)
    out.push({ type: "tag", text: "8 000+ HP-ord i databasen" });
    out.push({ type: "tag", text: "ORD · MEK · LÄS · ELF · XYZ · KVA · NOG · DTK" });
    out.push({ type: "tag", text: "Helt gratis · inget kreditkort · inga annonser" });
    out.push({ type: "tag", text: "Brons → Silver → Guld → Platina → Diamant" });

    if (out.length === 0) {
      out.push({ type: "tag", text: "HP Kampen · realtidsmatcher för Högskoleprovet" });
    }
    return out;
  }, [stats, next, diffDays]);

  // 2x duplicering (CSS keyframe loopar -50%)
  const looped = [...items, ...items];

  return (
    <div className="sticky top-0 z-30 overflow-hidden border-b border-white/10 bg-black/55 py-2 backdrop-blur-sm">
      <div
        className="flex whitespace-nowrap will-change-transform"
        style={{ animation: "ticker-loop 28s linear infinite" }}
      >
        {looped.map((item, i) => {
          const dotColor =
            item.type === "live" ? "#34d399" :
            item.type === "match" ? AMBER :
            item.type === "stat" ? "#ffffff" :
            "rgba(255,255,255,0.4)";
          return (
            <div key={i} className="flex shrink-0 items-center gap-2 px-6 font-mono text-[11px] uppercase tracking-wider">
              <span
                className={`h-1.5 w-1.5 rounded-full ${item.type === "live" ? "animate-pulse" : ""}`}
                style={{ background: dotColor }}
              />
              <span className="text-white/75">{item.text}</span>
              <span className="ml-6 text-white/20">·</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ */
/* ===  HERO                                                === */
/* ============================================================ */

function Hero({
  stats,
  guestLoading,
  onGuest,
}: {
  stats: LandingStats | null;
  guestLoading: boolean;
  onGuest: () => void;
}) {
  const canvasRef = useShaderCanvas("amber");
  const recentSix = stats?.recent?.slice(0, 6) ?? [];

  return (
    <section className="relative h-[80vh] min-h-[620px] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" style={{ background: "#170d05" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{
        background: "linear-gradient(180deg, rgba(23,13,5,0) 0%, rgba(23,13,5,0.45) 60%, rgba(23,13,5,0.95) 100%)",
      }} />

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-16">
        <div className="grid items-end gap-8 md:grid-cols-[2fr_1fr]">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-[56px] font-black leading-[0.95] sm:text-[88px] md:text-[108px]"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
            >
              Spela. <span style={{ color: AMBER }}>Klättra.</span>
              <br />
              Vinn.
            </motion.h1>
            <p className="mt-6 max-w-xl text-[16px] leading-[1.6] text-white/65 sm:text-[18px]">
              Realtidsmatcher mot riktiga spelare. ELO som rör sig efter varje match.
              Inga övningsprov. Bara duell.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
            >
              <button
                type="button"
                onClick={onGuest}
                disabled={guestLoading}
                className="group relative inline-flex h-[52px] items-center gap-2 rounded-md px-7 text-[15px] font-semibold text-[#1a0d04] transition hover:brightness-110 disabled:opacity-60"
                style={{ background: AMBER }}
              >
                {guestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {guestLoading ? "Startar…" : "Hitta match"}
                {!guestLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
              <Link
                to="/signup"
                className="inline-flex h-[52px] items-center gap-2 rounded-md border border-white/12 px-6 text-[14px] font-medium text-white/75 transition hover:border-white/25 hover:text-white"
              >
                Spara min ELO
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur-sm"
          >
            <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-white/45">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                SENASTE 6
              </span>
              <span>RESULTAT</span>
            </div>
            {recentSix.length === 0 ? (
              <div className="py-5 text-center font-mono text-[11px] uppercase tracking-wider text-white/35">
                <p>Inga matcher ännu</p>
                <Link to="/signup" className="mt-2 inline-block underline-offset-4 hover:text-white hover:underline" style={{ color: AMBER }}>
                  Spela första matchen →
                </Link>
              </div>
            ) : (
              <ol className="space-y-1.5">
                {recentSix.map((m) => {
                  const p1 = m.p1_name || "Gäst";
                  const p2 = m.is_bot_match
                    ? getBotName(m.bot_elo ?? 1000, m.id)
                    : m.p2_name || "Gäst";
                  const s1 = m.player1_score ?? 0;
                  const s2 = m.player2_score ?? 0;
                  const { isDraw, p1Won } = getMatchOutcome(m);
                  const winner = isDraw ? p1 : p1Won ? p1 : p2;
                  const loser = isDraw ? p2 : p1Won ? p2 : p1;
                  const ws = isDraw ? s1 : p1Won ? s1 : s2;
                  const ls = isDraw ? s2 : p1Won ? s2 : s1;
                  const isVerbal = m.match_type === "verbal";
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-2 font-mono text-[11px]">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase ${isVerbal ? "text-[#1a0d04]" : "bg-white/15 text-white/85"}`}
                          style={isVerbal ? { background: AMBER } : undefined}
                        >
                          {isVerbal ? "V" : "M"}
                        </span>
                        <span className="truncate text-white">
                          <span className="font-semibold">{winner}</span>
                          <span className="text-white/40"> / {loser}</span>
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-white/75">
                        {ws}<span className="text-white/30">–</span>{ls}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  LEADERBOARD                                         === */
/* ============================================================ */

function Leaderboard({ stats }: { stats: LandingStats | null }) {
  const players = stats?.topPlayers ?? [];
  const displayPlayers = players.length > 0 ? players : ANONYMOUS_PLACEHOLDER;
  const isPlaceholder = players.length === 0;
  const topVerbal = displayPlayers.filter((p) => p.type === "verbal").slice(0, 3);

  return (
    <section className="border-y border-white/8 bg-black/30 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="text-[32px] font-bold leading-[1.05] sm:text-[44px]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
            Toppspelarna just nu
          </h2>
          <Link to="/leaderboard" className="hidden text-[13px] text-white/55 underline-offset-4 hover:text-white hover:underline sm:block">
            Hela topplistan →
          </Link>
        </div>

        {topVerbal.length > 0 && (
          <VerbalPodium players={topVerbal} />
        )}

        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-left text-[11px] uppercase tracking-wider text-white/45">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Spelare</th>
                <th className="px-4 py-3 font-medium">Prov</th>
                <th className="px-4 py-3 text-right font-medium">ELO</th>
              </tr>
            </thead>
            <tbody>
              {displayPlayers.map((p, i) => (
                <PlayerRow key={`${p.username}-${p.type}-${i}`} player={p} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>

        {isPlaceholder && (
          <p className="mt-3 text-center text-[12px] text-white/35">
            Placeholder — fylls med riktiga spelare när de börjar spela.
          </p>
        )}
      </div>
    </section>
  );
}

// Visas när topPlayers är tom — så layouten inte ser trasig ut.
const ANONYMOUS_PLACEHOLDER: TopPlayer[] = [
  { username: "Anonym spelare", elo: 1854, type: "verbal" },
  { username: "Anonym spelare", elo: 1822, type: "math" },
  { username: "Anonym spelare", elo: 1798, type: "verbal" },
  { username: "Anonym spelare", elo: 1781, type: "math" },
  { username: "Anonym spelare", elo: 1764, type: "verbal" },
  { username: "Anonym spelare", elo: 1743, type: "math" },
  { username: "Anonym spelare", elo: 1721, type: "verbal" },
  { username: "Anonym spelare", elo: 1698, type: "math" },
];

function VerbalPodium({ players }: { players: TopPlayer[] }) {
  // Beställning på podiet: silver(#2), guld(#1), brons(#3) — guld i mitten
  const ordered: Array<{ player: TopPlayer | null; rank: 1 | 2 | 3 }> = [
    { player: players[1] ?? null, rank: 2 },
    { player: players[0] ?? null, rank: 1 },
    { player: players[2] ?? null, rank: 3 },
  ];

  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: AMBER }} />
        Topp 3 · Verbal
      </div>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {ordered.map(({ player, rank }) => (
          <PodiumCard key={rank} player={player} rank={rank} />
        ))}
      </div>
    </div>
  );
}

const MEDAL_STYLES: Record<
  1 | 2 | 3,
  { icon: string; ring: string; bg: string; text: string; height: string; label: string }
> = {
  1: {
    icon: "🥇",
    ring: "ring-2",
    bg: "linear-gradient(180deg, rgba(242,166,90,0.16) 0%, rgba(242,166,90,0.04) 100%)",
    text: "#f2a65a",
    height: "sm:pt-2",
    label: "Guld",
  },
  2: {
    icon: "🥈",
    ring: "ring-1",
    bg: "linear-gradient(180deg, rgba(203,213,225,0.10) 0%, rgba(203,213,225,0.02) 100%)",
    text: "rgba(226,232,240,0.85)",
    height: "sm:pt-8",
    label: "Silver",
  },
  3: {
    icon: "🥉",
    ring: "ring-1",
    bg: "linear-gradient(180deg, rgba(180,90,40,0.10) 0%, rgba(180,90,40,0.02) 100%)",
    text: "rgba(217,119,87,0.9)",
    height: "sm:pt-10",
    label: "Brons",
  },
};

function PodiumCard({ player, rank }: { player: TopPlayer | null; rank: 1 | 2 | 3 }) {
  const m = MEDAL_STYLES[rank];
  const ringColor =
    rank === 1 ? `${AMBER}80` : rank === 2 ? "rgba(203,213,225,0.5)" : "rgba(180,90,40,0.5)";

  return (
    <div className={`${m.height} flex flex-col items-stretch`}>
      <div
        className={`relative flex flex-1 flex-col items-center rounded-lg border border-white/10 p-5 ${m.ring}`}
        style={{ background: m.bg, ["--tw-ring-color" as string]: ringColor } as React.CSSProperties}
      >
        <div className="text-[40px] leading-none sm:text-[48px]" aria-hidden>
          {m.icon}
        </div>
        <div
          className="mt-3 font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color: m.text }}
        >
          {m.label}
        </div>
        {player ? (
          <>
            <div className="mt-3 truncate text-center text-[15px] font-bold text-white">
              {player.username}
            </div>
            <div className="mt-1 font-mono text-[18px] font-black tabular-nums text-white sm:text-[22px]">
              {player.elo}
            </div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/40">
              ELO
            </div>
          </>
        ) : (
          <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-wider text-white/30">
            Ledig plats
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerRow({ player, rank }: { player: TopPlayer; rank: number }) {
  const isTopThree = rank <= 3;
  const medalBg =
    rank === 1 ? "bg-amber-500/20 text-amber-300" :
    rank === 2 ? "bg-slate-400/20 text-slate-300" :
    rank === 3 ? "bg-orange-700/20 text-orange-300" :
    "bg-white/10 text-white/70";
  return (
    <tr className={`border-b border-white/5 transition hover:bg-white/[0.03] ${isTopThree ? "bg-white/[0.02]" : ""}`} style={isTopThree ? { background: `${AMBER}0a` } : undefined}>
      <td className="px-4 py-3 font-mono text-[13px] text-white/55">{rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${medalBg}`}>
            {player.username[0]?.toUpperCase()}
          </span>
          <span className="text-[14px] font-medium text-white">{player.username}</span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-white/55">
        {player.type === "verbal" ? "Verbal" : "Matte"}
      </td>
      <td className="px-4 py-3 text-right font-mono text-[15px] font-bold tabular-nums text-white">
        {player.elo}
      </td>
    </tr>
  );
}

/* ============================================================ */
/* ===  LIVE MATCH (frozen timer for perf — design intact)  === */
/* ============================================================ */

function LiveMatch() {
  return (
    <section className="px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h2 className="text-[32px] font-bold leading-[1.05] sm:text-[44px]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
            Så ser en match ut
          </h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.02] px-5 py-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
              <span className="rounded px-2 py-0.5 font-bold text-[#1a0d04]" style={{ background: AMBER }}>ORD</span>
              <span className="text-white/55">Verbal · Fråga 4/8</span>
            </div>
            {/* Frozen timer + animated dot — design behålls, ingen 1s-rerender */}
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 font-mono text-[12px] font-bold tabular-nums text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              02:47
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-white/8 border-b border-white/8">
            <PlayerStrip name="Du" elo={1542} score={3} you />
            <PlayerStrip name="Aron" elo={1518} score={2} />
          </div>

          <div className="px-6 py-10 sm:px-12 sm:py-14">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Synonymer</div>
            <p className="mt-4 text-[24px] font-bold leading-snug text-white sm:text-[30px]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}>
              Vad betyder ordet <span style={{ color: AMBER }}>prekär</span>?
            </p>
            <div className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { label: "A", text: "Trivial", state: "idle" },
                { label: "B", text: "Bekymmersam", state: "correct" },
                { label: "C", text: "Förutsägbar", state: "idle" },
                { label: "D", text: "Lockande", state: "idle" },
              ].map((opt) => (
                <div
                  key={opt.label}
                  className={`flex items-center gap-3 rounded-md border px-4 py-3 text-[14px] ${
                    opt.state === "correct"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/[0.02] text-white/80"
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${opt.state === "correct" ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60"}`}>
                    {opt.label}
                  </span>
                  <span className="font-medium">{opt.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlayerStrip({ name, elo, score, you }: { name: string; elo: number; score: number; you?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold ${you ? "text-[#1a0d04]" : "bg-white/10 text-white/80"}`} style={you ? { background: AMBER } : undefined}>
          {name[0]}
        </div>
        <div>
          <div className="text-[14px] font-semibold text-white">{name}</div>
          <div className="font-mono text-[11px] tabular-nums text-white/45">{elo} ELO</div>
        </div>
      </div>
      <div className="font-mono text-[28px] font-black tabular-nums text-white">{score}</div>
    </div>
  );
}

/* ============================================================ */
/* ===  RECENT MATCHES                                      === */
/* ============================================================ */

function RecentMatches({ stats }: { stats: LandingStats | null }) {
  const matches = stats?.recent?.slice(0, 6) ?? [];
  if (matches.length === 0) return null;

  return (
    <section className="border-y border-white/8 bg-black/30 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h2 className="text-[32px] font-bold leading-[1.05] sm:text-[44px]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
            Senaste matcherna
          </h2>
        </div>

        <ul className="space-y-2">
          {matches.map((m, i) => (
            <MatchRow key={m.id} match={m} delay={i * 0.06} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function MatchRow({ match, delay }: { match: NonNullable<LandingStats["recent"]>[number]; delay: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const p1 = match.p1_name || "Gäst";
  const p2 = match.is_bot_match ? getBotName(match.bot_elo ?? 1000, match.id) : match.p2_name || "Gäst";
  const s1 = match.player1_score ?? 0;
  const s2 = match.player2_score ?? 0;
  const { isDraw, p1Won } = getMatchOutcome(match);
  const winner = isDraw ? null : p1Won ? p1 : p2;
  const loser = isDraw ? null : p1Won ? p2 : p1;
  const ws = isDraw ? s1 : p1Won ? s1 : s2;
  const ls = isDraw ? s2 : p1Won ? s2 : s1;
  const isVerbal = match.match_type === "verbal";

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.4, delay }}
      className="flex items-center justify-between gap-4 rounded-md border border-white/8 bg-white/[0.02] px-4 py-3"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className={`flex h-7 items-center rounded px-2 font-mono text-[10px] font-bold uppercase tracking-wider ${isVerbal ? "text-[#1a0d04]" : "bg-white/15 text-white"}`} style={isVerbal ? { background: AMBER } : undefined}>
          {isVerbal ? "Verbal" : "Matte"}
        </span>
        <p className="truncate text-[14px] text-white/85">
          {isDraw ? (
            <><span className="font-semibold">{p1}</span> <span className="text-white/50">och</span> <span className="font-semibold">{p2}</span> <span className="text-white/50">– oavgjort</span></>
          ) : (
            <><span className="font-semibold">{winner}</span> <span className="text-white/50">slog</span> <span className="font-semibold">{loser}</span></>
          )}
        </p>
      </div>
      <div className="shrink-0 font-mono text-[14px] font-bold tabular-nums">
        <span className="text-white">{ws}</span>
        <span className="mx-1 text-white/30">–</span>
        <span className="text-white/55">{ls}</span>
      </div>
    </motion.li>
  );
}

/* ============================================================ */
/* ===  TIER BAR                                            === */
/* ============================================================ */

function TierBar() {
  return (
    <section className="px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h2 className="text-[32px] font-bold leading-[1.05] sm:text-[44px]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
            Brons till Diamant
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {RANK_TIERS.map((t) => (
            <div
              key={t.tier}
              className="rounded-md border p-5 text-center"
              style={t.tier === "diamant" ? {
                borderColor: `${AMBER}66`,
                background: `linear-gradient(180deg, ${AMBER}1a 0%, transparent 100%)`,
                boxShadow: `0 0 40px -10px ${AMBER}66`,
              } : {
                borderColor: "rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full text-[18px]" style={{ background: t.bgColor, color: t.textColor, border: `2px solid ${t.borderColor}` }}>
                {t.icon}
              </div>
              <div className="mt-3 text-[13px] font-bold uppercase tracking-wider text-white">{t.tier}</div>
              <div className="mt-1 font-mono text-[10px] tabular-nums text-white/45">
                {t.minElo}{t.tier === "diamant" ? "+" : `–${t.maxElo}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  QUOTES                                              === */
/* ============================================================ */

function Quotes() {
  return (
    <section className="border-y border-white/8 bg-black/30 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-center text-[24px] font-bold text-white/85 sm:text-[32px]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}>
          Vad spelarna säger
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col justify-between rounded-md border border-white/10 bg-white/[0.02] p-6"
            >
              <p className="text-[15px] leading-relaxed text-white/85">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3 border-t border-white/5 pt-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[12px] font-bold text-white">
                  {t.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white">{t.name}</p>
                  {t.founder && <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">Grundare</p>}
                </div>
                <span className="ml-auto rounded px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-[#1a0d04]" style={{ background: AMBER }}>
                  HP {t.score}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* ===  CLOSER                                              === */
/* ============================================================ */

function Closer() {
  return (
    <section className="px-6 py-24 text-center sm:py-32">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-[44px] font-black leading-[1.02] text-white sm:text-[64px]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
          Hitta en match.<br />
          <span style={{ color: AMBER }}>Nu.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[16px] text-white/55">
          Inget kreditkort. Inga annonser. Bara duell.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/matchmaking"
            className="group inline-flex h-[52px] items-center gap-2 rounded-md px-10 text-[15px] font-semibold text-[#1a0d04] transition hover:brightness-110"
            style={{ background: AMBER }}
          >
            Hitta match
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <Link
            to="/login"
            className="inline-flex h-[52px] items-center gap-2 rounded-md border border-white/12 px-10 text-[15px] font-medium text-white/75 transition hover:border-white/25 hover:text-white"
          >
            Logga in
          </Link>
        </div>
      </div>
    </section>
  );
}
