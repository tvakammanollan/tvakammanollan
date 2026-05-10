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

  if (!user || !profile) return null;

  const winRate =
    profile.games_played > 0
      ? Math.round((profile.wins / profile.games_played) * 100)
      : 0;

  const openMatch = (t: MatchType) => {
    setMatchType(t);
    setMatchOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Stat panel */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={profile.username} size={64} />
            <div>
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {profile.username}
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
          subtitle="ORD · MEK · LÄS · ELF"
          elo={profile.elo_verbal}
          icon={<GraduationCap className="h-6 w-6" />}
          onStart={() => openMatch("verbal")}
          variant="primary"
        />
        <BattleCard
          title="Matte Battles"
          subtitle="XYZ · KVA · NOG · DTK"
          elo={profile.elo_math}
          icon={<Sigma className="h-6 w-6" />}
          onStart={() => openMatch("math")}
          variant="dark"
        />
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
      ? "text-gold-foreground"
      : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 text-xl font-semibold tabular-nums ${valueColor}`}>
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
      className={`relative overflow-hidden rounded-2xl border p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated ${
        isDark
          ? "border-secondary/30 bg-secondary text-secondary-foreground"
          : "border-primary/30 bg-card"
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isDark ? "bg-gold/20 text-gold" : "bg-primary text-primary-foreground"
          }`}
        >
          {icon}
        </div>
        <Trophy
          className={`h-5 w-5 ${isDark ? "text-gold/60" : "text-muted-foreground/40"}`}
        />
      </div>

      <h3
        className="mt-4 text-2xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p
        className={`mt-1 text-xs uppercase tracking-[0.18em] ${
          isDark ? "text-secondary-foreground/60" : "text-muted-foreground"
        }`}
      >
        {subtitle}
      </p>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <div
            className={`text-[11px] uppercase tracking-wider ${
              isDark ? "text-secondary-foreground/60" : "text-muted-foreground"
            }`}
          >
            Din ELO
          </div>
          <div className="text-3xl font-semibold tabular-nums">{elo}</div>
        </div>
        <Button
          onClick={onStart}
          className={
            isDark
              ? "bg-gold text-gold-foreground hover:bg-gold/90"
              : ""
          }
        >
          Starta Battle
        </Button>
      </div>
    </div>
  );
}
