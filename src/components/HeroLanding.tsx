import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { m, useInView } from "framer-motion";
import { ArrowRight, Trophy, Medal, Award, type LucideIcon } from "lucide-react";
import { RankIcon } from "@/components/ui/RankIcon";
import { getNextHpDate } from "@/lib/hp-dates";
import { getBotName } from "@/lib/bot";
import { getLandingStats, type LandingStats, type TopPlayer } from "@/lib/landing.functions";
import { useShaderCanvas } from "@/components/landing/shaderCanvas";
import { RANK_TIERS } from "@/types";
import { formatInt } from "@/lib/sv-format";

const TESTIMONIALS = [
  {
    quote:
      "Det är ett gott tecken när det känns roligt och engagerande att plugga inför högskoleprovet.",
    name: "Aron",
    score: "2.0",
  },
  {
    quote: "HP Kampen har allt som behövs för att lyckas på högskoleprovet.",
    name: "Gustav",
    score: "1.9",
  },
  {
    quote:
      "HP Kampen innehåller verktyg jag hade haft stor nytta av när jag pluggade till högskoleprovet, helt gratis.",
    name: "Niklas",
    score: "1.95",
    founder: true,
  },
];

const AMBER = "#f2a65a";

// Återanvändbar glassmorphism: gradient-fyllning + inset-highlight + soft
// shadow. Synligt även när det inte finns något dynamiskt att blur:a
// bakom, eftersom gradienten + inset-kanten gör jobbet visuellt.
const GLASS_STYLE: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)",
};
const GLASS_CLASS = "rounded-2xl border border-white/15 backdrop-blur-xl";

// Ord som cyklar i mittersta raden av hero-rubriken. Behåller "Klättra"
// som första ord så hemsidan ser bekant ut första sekunden, sedan rotation
// genom relaterade verbs som passar 3-stegs-rubriken "Spela. X. Vinn."
const HERO_CYCLE_WORDS = ["Klättra.", "Tävla.", "Träna.", "Utmana.", "Bevisa.", "Mästra.", "Slå."];

export function HeroLanding() {
  const fetchStats = useServerFn(getLandingStats);
  const [stats, setStats] = useState<LandingStats | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [fetchStats]);

  return (
    <div className="min-h-screen text-white" style={{ background: "#170d05" }}>
      <LiveTicker stats={stats} />
      <Hero stats={stats} />
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
function getMatchOutcome(m: {
  winner_id: string | null;
  player1_id: string;
  player1_score: number | null;
  player2_score: number | null;
}) {
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

/**
 * Cyklar mellan ord med långsam spring-animation (4s mellan byten).
 * Använder en osynlig spacer för längsta ordet så layouten inte hoppar.
 */
function CyclingWord({ words, color }: { words: string[]; color: string }) {
  const [idx, setIdx] = useState(0);
  const spacer = useMemo(() => words.reduce((a, b) => (a.length >= b.length ? a : b), ""), [words]);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % words.length);
    }, 4000);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <span className="relative inline-block overflow-hidden align-baseline" style={{ color }}>
      <span className="invisible" aria-hidden>
        {spacer}
      </span>
      {words.map((w, i) => (
        <m.span
          key={w}
          className="absolute inset-x-0 top-0 whitespace-nowrap text-center"
          initial={false}
          animate={
            idx === i ? { y: "0%", opacity: 1 } : { y: idx > i ? "-110%" : "110%", opacity: 0 }
          }
          transition={{ type: "spring", stiffness: 38, damping: 14, mass: 1 }}
        >
          {w}
        </m.span>
      ))}
    </span>
  );
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
        text: `${formatInt(stats.totalMatches)} matcher spelade totalt`,
      });
    }
    if (stats && stats.totalPlayers > 0) {
      out.push({
        type: "stat",
        text: `${formatInt(stats.totalPlayers)} registrerade spelare`,
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
    <div
      className="relative z-30 overflow-hidden py-2 backdrop-blur-sm"
      style={{ background: "rgba(15, 8, 3, 0.45)" }}
    >
      <div
        className="flex whitespace-nowrap will-change-transform"
        style={{ animation: "ticker-loop 28s linear infinite" }}
      >
        {looped.map((item, i) => {
          const dotColor =
            item.type === "live"
              ? "var(--success)"
              : item.type === "match"
                ? AMBER
                : item.type === "stat"
                  ? "#ffffff"
                  : "rgba(255,255,255,0.4)";
          return (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2 px-6 font-mono text-[11px] uppercase tracking-wider"
            >
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

function Hero({ stats }: { stats: LandingStats | null }) {
  const canvasRef = useShaderCanvas("amber");
  const recentSix = stats?.recent?.slice(0, 6) ?? [];

  // Hero pulls upp under navbar (60px) + ticker (~36px) = ~96px så
  // shadern fyller hela viewporten från topp. Navbar (z-50) och ticker
  // (z-30) flyter över shadern (z-10) som glas.
  return (
    <section
      className="relative -mt-[96px] overflow-hidden"
      style={{ minHeight: "calc(92svh + 96px)" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ background: "#170d05" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(23,13,5,0) 0%, rgba(23,13,5,0.12) 45%, rgba(23,13,5,0.7) 88%, rgba(23,13,5,1) 100%)",
        }}
      />

      <div
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center justify-center px-6 pb-24 pt-[160px] text-center"
        style={{ minHeight: "calc(92svh + 96px)" }}
      >
        <m.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-[44px] font-black leading-[0.98] sm:text-[68px] md:text-[92px] lg:text-[108px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
        >
          Spela. <CyclingWord words={HERO_CYCLE_WORDS} color={AMBER} />
          <br />
          Vinn.
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-7 max-w-xl text-[15px] leading-[1.6] text-white/65 sm:text-[18px]"
        >
          Realtidsmatcher mot riktiga spelare. ELO som rör sig efter varje match. Inga övningsprov.
          Bara duell.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mx-auto mt-10 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center"
        >
          <a
            href="/matchmaking"
            className="group relative inline-flex h-[52px] items-center justify-center gap-2 rounded-md px-8 text-[15px] font-semibold text-[#1a0d04] transition hover:brightness-110"
            style={{ background: AMBER }}
          >
            Hitta match
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <Link
            to="/signup"
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-md border border-white/12 px-6 text-[14px] font-medium text-white/75 transition hover:border-white/25 hover:text-white"
          >
            Spara min ELO
          </Link>
        </m.div>

        {/* Glas-kort: senaste 6 matcher — flyter mjukt över shadern */}
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          className={`mx-auto mt-14 w-full max-w-md p-5 text-left ${GLASS_CLASS}`}
          style={GLASS_STYLE}
        >
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-white/45">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Senaste 6
            </span>
            <span>Resultat</span>
          </div>
          {recentSix.length === 0 ? (
            <div className="py-5 text-center font-mono text-[11px] uppercase tracking-wider text-white/35">
              <p>Inga matcher ännu</p>
              <Link
                to="/signup"
                className="mt-2 inline-block underline-offset-4 hover:text-white hover:underline"
                style={{ color: AMBER }}
              >
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
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 font-mono text-[11px]"
                  >
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
                      {ws}
                      <span className="text-white/30">–</span>
                      {ls}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </m.div>
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
    <section className="relative px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-end justify-between">
          <h2
            className="text-[28px] font-bold leading-[1.05] sm:text-[40px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
          >
            Toppspelarna just nu
          </h2>
          <Link
            to="/leaderboard"
            className="hidden text-[13px] text-white/55 underline-offset-4 hover:text-white hover:underline sm:block"
          >
            Hela topplistan →
          </Link>
        </div>

        {topVerbal.length > 0 && <VerbalPodium players={topVerbal} />}

        <div className={`overflow-hidden ${GLASS_CLASS}`} style={GLASS_STYLE}>
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
            Exempel — fylls med riktiga spelare när matcherna drar igång.
          </p>
        )}

        {/* Mobil-fallback för länken till hela topplistan */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            to="/leaderboard"
            className="text-[13px] text-white/55 underline-offset-4 hover:text-white hover:underline"
          >
            Hela topplistan →
          </Link>
        </div>
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
  { icon: LucideIcon; height: string; label: string; accent: string }
> = {
  1: { icon: Trophy, height: "sm:pt-0", label: "Guld", accent: "#f2a65a" },
  2: { icon: Medal, height: "sm:pt-6", label: "Silver", accent: "#c3ccd6" },
  3: { icon: Award, height: "sm:pt-8", label: "Brons", accent: "#c98a5e" },
};

function PodiumCard({ player, rank }: { player: TopPlayer | null; rank: 1 | 2 | 3 }) {
  // Hette tidigare `m` och skuggade framer-motions `m` i just den här scopen.
  const medal = MEDAL_STYLES[rank];
  const MedalIcon = medal.icon;
  const isGold = rank === 1;

  return (
    <div className={`${medal.height} flex flex-col items-stretch`}>
      <div
        className={`relative flex flex-1 flex-col items-center p-5 ${GLASS_CLASS}`}
        style={{
          ...GLASS_STYLE,
          boxShadow: isGold
            ? `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10), 0 0 60px -15px ${AMBER}55`
            : (GLASS_STYLE.boxShadow as string),
        }}
      >
        <MedalIcon
          className="h-10 w-10 sm:h-12 sm:w-12"
          style={{ color: medal.accent }}
          aria-hidden
          strokeWidth={1.5}
        />
        <div
          className="mt-3 font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color: medal.accent }}
        >
          {medal.label}
        </div>
        {player ? (
          <>
            <div className="mt-3 max-w-full truncate text-center text-[14px] font-bold text-white sm:text-[15px]">
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
    rank === 1
      ? "bg-amber-500/20 text-amber-300"
      : rank === 2
        ? "bg-slate-400/20 text-slate-300"
        : rank === 3
          ? "bg-orange-700/20 text-orange-300"
          : "bg-white/10 text-white/70";
  return (
    <tr
      className={`border-b border-white/5 transition hover:bg-white/[0.03] ${isTopThree ? "bg-white/[0.02]" : ""}`}
      style={isTopThree ? { background: `${AMBER}0a` } : undefined}
    >
      <td className="px-4 py-3 font-mono text-[13px] text-white/55">{rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${medalBg}`}
          >
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
    <section className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h2
            className="text-[32px] font-bold leading-[1.05] sm:text-[44px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
          >
            Så ser en match ut
          </h2>
        </div>

        <div className={`overflow-hidden ${GLASS_CLASS}`} style={GLASS_STYLE}>
          <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.02] px-5 py-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
              <span
                className="rounded px-2 py-0.5 font-bold text-[#1a0d04]"
                style={{ background: AMBER }}
              >
                ORD
              </span>
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
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Synonymer
            </div>
            <p
              className="mt-4 text-[24px] font-bold leading-snug text-white sm:text-[30px]"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
            >
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
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${opt.state === "correct" ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60"}`}
                  >
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

function PlayerStrip({
  name,
  elo,
  score,
  you,
}: {
  name: string;
  elo: number;
  score: number;
  you?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold ${you ? "text-[#1a0d04]" : "bg-white/10 text-white/80"}`}
          style={you ? { background: AMBER } : undefined}
        >
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
    <section className="relative px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h2
            className="text-[28px] font-bold leading-[1.05] sm:text-[40px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
          >
            Senaste matcherna
          </h2>
        </div>

        <div
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl"
          style={{ boxShadow: "0 20px 60px -25px rgba(0,0,0,0.5)" }}
        >
          <ul className="divide-y divide-white/8">
            {matches.map((m, i) => (
              <MatchRow key={m.id} match={m} delay={i * 0.06} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function MatchRow({
  match,
  delay,
}: {
  match: NonNullable<LandingStats["recent"]>[number];
  delay: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const p1 = match.p1_name || "Gäst";
  const p2 = match.is_bot_match
    ? getBotName(match.bot_elo ?? 1000, match.id)
    : match.p2_name || "Gäst";
  const s1 = match.player1_score ?? 0;
  const s2 = match.player2_score ?? 0;
  const { isDraw, p1Won } = getMatchOutcome(match);
  const winner = isDraw ? null : p1Won ? p1 : p2;
  const loser = isDraw ? null : p1Won ? p2 : p1;
  const ws = isDraw ? s1 : p1Won ? s1 : s2;
  const ls = isDraw ? s2 : p1Won ? s2 : s1;
  const isVerbal = match.match_type === "verbal";

  return (
    <m.li
      ref={ref}
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.4, delay }}
      className="flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-white/[0.02]"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`flex h-7 items-center rounded px-2 font-mono text-[10px] font-bold uppercase tracking-wider ${isVerbal ? "text-[#1a0d04]" : "bg-white/15 text-white"}`}
          style={isVerbal ? { background: AMBER } : undefined}
        >
          {isVerbal ? "Verbal" : "Matte"}
        </span>
        <p className="truncate text-[14px] text-white/85">
          {isDraw ? (
            <>
              <span className="font-semibold">{p1}</span> <span className="text-white/50">och</span>{" "}
              <span className="font-semibold">{p2}</span>{" "}
              <span className="text-white/50">– oavgjort</span>
            </>
          ) : (
            <>
              <span className="font-semibold">{winner}</span>{" "}
              <span className="text-white/50">slog</span>{" "}
              <span className="font-semibold">{loser}</span>
            </>
          )}
        </p>
      </div>
      <div className="shrink-0 font-mono text-[14px] font-bold tabular-nums">
        <span className="text-white">{ws}</span>
        <span className="mx-1 text-white/30">–</span>
        <span className="text-white/55">{ls}</span>
      </div>
    </m.li>
  );
}

/* ============================================================ */
/* ===  TIER BAR                                            === */
/* ============================================================ */

function TierBar() {
  return (
    <section className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h2
            className="text-[28px] font-bold leading-[1.05] sm:text-[40px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
          >
            Brons till Diamant
          </h2>
        </div>
        {/* Mobile: 2-col-rad + diamant full-bredd så det inte ser stympat ut. md+: 5 i rad. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
          {RANK_TIERS.map((t) => (
            <div
              key={t.tier}
              className="rounded-2xl border p-5 text-center backdrop-blur-md"
              style={
                t.tier === "diamant"
                  ? {
                      borderColor: `${AMBER}66`,
                      background: `linear-gradient(180deg, ${AMBER}22 0%, rgba(255,255,255,0.03) 100%)`,
                      boxShadow: `0 0 40px -10px ${AMBER}55`,
                    }
                  : {
                      borderColor: "rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)",
                    }
              }
            >
              <div
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border"
                style={{ background: t.soft, color: t.accent, borderColor: t.line }}
              >
                <RankIcon rank={t} className="h-5 w-5" />
              </div>
              <div className="mt-3 text-[13px] font-bold uppercase tracking-wider text-white">
                {t.tier}
              </div>
              <div className="mt-1 font-mono text-[10px] tabular-nums text-white/45">
                {t.minElo}
                {t.tier === "diamant" ? "+" : `–${t.maxElo}`}
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

type StackPosition = "front" | "middle" | "back";

function Quotes() {
  const [positions, setPositions] = useState<StackPosition[]>(["front", "middle", "back"]);

  const handleShuffle = useCallback(() => {
    setPositions((prev) => {
      const next = [...prev];
      next.unshift(next.pop()!);
      return next;
    });
  }, []);

  // Auto-advance var 7:e sekund. Timer:n återställs varje gång positions
  // ändras (även vid manuell shuffle) — då hinner användaren läsa det nya
  // kortet innan nästa byte.
  useEffect(() => {
    const id = setTimeout(handleShuffle, 7000);
    return () => clearTimeout(id);
  }, [positions, handleShuffle]);

  return (
    <section className="relative px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2
          className="mb-14 text-center text-[28px] font-bold leading-[1.05] sm:text-[40px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
        >
          Vad spelarna säger
        </h2>

        {/* Stacken — overflow är synlig så fanade kort hänger ut till höger */}
        <div className="relative mx-auto h-[360px] w-[300px] sm:h-[380px] sm:w-[360px]">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialStackCard
              key={t.name}
              t={t}
              position={positions[i]}
              handleShuffle={handleShuffle}
            />
          ))}
        </div>

        <p className="mt-10 text-center text-[11px] uppercase tracking-[0.18em] text-white/40">
          Dra åt vänster för nästa
        </p>
      </div>
    </section>
  );
}

function TestimonialStackCard({
  t,
  position,
  handleShuffle,
}: {
  t: (typeof TESTIMONIALS)[number];
  position: StackPosition;
  handleShuffle: () => void;
}) {
  const dragStartX = useRef(0);
  const isFront = position === "front";

  return (
    <m.div
      style={{
        zIndex: position === "front" ? 3 : position === "middle" ? 2 : 1,
      }}
      animate={{
        rotate: position === "front" ? "-3deg" : position === "middle" ? "1deg" : "5deg",
        x: position === "front" ? "0%" : position === "middle" ? "10%" : "20%",
        y: position === "front" ? "0%" : position === "middle" ? "2%" : "5%",
        scale: position === "front" ? 1 : 0.96,
      }}
      drag={isFront ? "x" : false}
      dragElastic={0.4}
      dragListener={isFront}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onDragStart={(_, info) => {
        dragStartX.current = info.point.x;
      }}
      onDragEnd={(_, info) => {
        if (dragStartX.current - info.point.x > 100) handleShuffle();
        dragStartX.current = 0;
      }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute inset-0 flex flex-col justify-between rounded-2xl border border-white/12 bg-[#1a0d04]/85 p-7 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md ${
        isFront ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <p className="text-[15px] leading-[1.55] text-white/85 sm:text-[16px]">
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-white/8 pt-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
          {t.name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-white">{t.name}</p>
          {t.founder && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">Grundare</p>
          )}
        </div>
        <span
          className="ml-auto shrink-0 rounded px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-[#1a0d04]"
          style={{ background: AMBER }}
        >
          HP {t.score}
        </span>
      </div>
    </m.div>
  );
}

/* ============================================================ */
/* ===  CLOSER                                              === */
/* ============================================================ */

function Closer() {
  return (
    <section className="px-6 py-24 text-center sm:py-32">
      <div className="mx-auto max-w-2xl">
        <h2
          className="text-[36px] font-black leading-[1.02] text-white sm:text-[56px] md:text-[64px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
        >
          Hitta en match.
          <br />
          <span style={{ color: AMBER }}>Nu.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] text-white/55 sm:text-[16px]">
          Inget kreditkort. Inga annonser. Bara duell.
        </p>
        <div className="mx-auto mt-10 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row">
          <a
            href="/matchmaking"
            className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-md px-10 text-[15px] font-semibold text-[#1a0d04] transition hover:brightness-110"
            style={{ background: AMBER }}
          >
            Hitta match
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <Link
            to="/login"
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-md border border-white/12 px-10 text-[15px] font-medium text-white/75 transition hover:border-white/25 hover:text-white"
          >
            Logga in
          </Link>
        </div>
      </div>
    </section>
  );
}
