import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/UserAvatar";
import { EloBadge } from "@/components/EloBadge";
import { EloChart } from "@/components/EloChart";
import { Button } from "@/components/ui/button";
import { MatchmakerModal, type MatchType } from "@/components/MatchmakerModal";
import { GraduationCap, Sigma, Trophy } from "lucide-react";

export function HomeDashboard() {
  const { user, profile } = useAuth();
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>("verbal");

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12" aria-busy="true">
        <div className="skeleton-shimmer h-48 rounded-2xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="skeleton-shimmer h-72 rounded-2xl" />
          <div className="skeleton-shimmer h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const winRate =
    profile.games_played > 0
      ? Math.round((profile.wins / profile.games_played) * 100)
      : 0;

  const openMatch = (t: MatchType) => {
    setMatchType(t);
    setMatchOpen(true);
  };

  const isGuest = !!user.is_anonymous;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {isGuest && (
        <div className="mb-4 flex flex-col items-start gap-2 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-foreground">
            Du spelar som <strong>gäst</strong>. Skapa ett konto för att spara
            din ELO och dyka upp på topplistan.
          </span>
          <Button asChild size="sm" variant="default">
            <a href="/signup">Skapa konto</a>
          </Button>
        </div>
      )}

      {/* Stat panel */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={profile.username} size={64} />
            <div>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {isGuest ? "Gäst" : profile.username}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <EloBadge label="Verbal" elo={profile.elo_verbal} />
                <EloBadge label="Matte" elo={profile.elo_math} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatChip label="Matcher" value={profile.games_played} />
            <StatChip label="Vinster" value={profile.wins} accent="primary" />
            <StatChip label="Förluster" value={profile.losses} />
            <StatChip label="Win rate" value={`${winRate}%`} accent="gold" />
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground/80">
              ELO-progression · senaste 20 matcherna
            </h2>
          </div>
          <EloChart userId={user.id} />
        </div>
      </section>

      {/* Battle cards */}
      <section className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2">
        <BattleCard
          title="Verbala Battles"
          subtitle="ORD · MEK"
          elo={profile.elo_verbal}
          icon={<GraduationCap className="h-6 w-6" />}
          onStart={() => openMatch("verbal")}
          variant="primary"
        />
        <BattleCard
          title="Matte Battles"
          subtitle="XYZ · KVA · NOG"
          elo={profile.elo_math}
          icon={<Sigma className="h-6 w-6" />}
          onStart={() => openMatch("math")}
          variant="dark"
        />
      </section>

      {/* Solo word practice */}
      <section className="mt-4">
        <a
          href="/ord"
          className="group flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 shadow-card transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f2ec] text-[#1a5c3a]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold">Öva ord (solo)</div>
              <div className="text-xs text-muted-foreground">
                950+ riktiga ORD-frågor från tidigare HP · helt själv, ingen motståndare
              </div>
            </div>
          </div>
          <span className="text-sm text-primary group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </section>

      <MatchmakerModal
        open={matchOpen}
        onOpenChange={setMatchOpen}
        matchType={matchType}
      />
    </div>
  );
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "primary" | "gold";
}) {
  const valueColor =
    accent === "primary"
      ? "text-primary"
      : accent === "gold"
      ? "text-[#c49a0e]"
      : "text-foreground";
  return (
    <div
      className="rounded-xl border border-l-4 border-border border-l-[#1a5c3a] bg-white px-3 py-2.5"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 text-2xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}

function BattleCard({
  title,
  subtitle,
  elo,
  icon,
  onStart,
  variant,
}: {
  title: string;
  subtitle: string;
  elo: number;
  icon: React.ReactNode;
  onStart: () => void;
  variant: "primary" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <div
      onClick={onStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStart();
        }
      }}
      className={`relative flex min-h-[260px] cursor-pointer flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-200 ease-out hover:-translate-y-1 sm:min-h-[280px] ${
        isDark
          ? "border-[#1a5c3a]/40 bg-[#1a5c3a] text-white"
          : "border-border bg-white"
      }`}
      style={{
        boxShadow: "var(--shadow-md)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-lg)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
    >
      {/* Pattern overlay */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${isDark ? "bg-diag" : "bg-dots"}`}
      />

      <div className="relative flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isDark ? "bg-[#d4a017]/20 text-[#d4a017]" : "bg-[#e8f2ec] text-[#1a5c3a]"
          }`}
        >
          {icon}
        </div>
        <Trophy
          className={`h-5 w-5 ${isDark ? "text-[#d4a017]/70" : "text-muted-foreground/40"}`}
        />
      </div>

      <h3
        className="relative mt-4 text-2xl font-semibold"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
      >
        {title}
      </h3>
      <p
        className={`relative mt-1 text-xs uppercase tracking-[0.18em] ${
          isDark ? "text-white/60" : "text-muted-foreground"
        }`}
      >
        {subtitle}
      </p>

      <div className="relative mt-auto pt-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <div
              className={`text-[11px] uppercase tracking-wider ${
                isDark ? "text-white/60" : "text-muted-foreground"
              }`}
            >
              Din ELO
            </div>
            <div
              className={`text-2xl font-semibold tabular-nums ${
                isDark ? "text-[#d4a017]" : "text-[#c49a0e]"
              }`}
            >
              {elo}
            </div>
          </div>
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
          className={`w-full ${
            isDark
              ? "bg-[#d4a017] text-[#1a1a1a] hover:bg-[#c49a0e]"
              : "bg-[#1a5c3a] text-white hover:bg-[#154d31]"
          }`}
        >
          Starta Battle
        </Button>
      </div>
    </div>
  );
}
