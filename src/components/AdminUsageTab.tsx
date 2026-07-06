import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchUsageStats, type UsageStats } from "@/lib/usage.functions";
import { formatInt } from "@/lib/sv-format";

/** Admin → Användning: aktivitet utanför matcher + aktiv tid. */
export function AdminUsageTab() {
  const fetchFn = useServerFn(fetchUsageStats);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = (await fetchFn({})) as UsageStats;
        if (!cancelled) setStats(s);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Kunde inte hämta statistik");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchFn]);

  if (error) return <p className="p-6 text-sm text-[#e25a6a]">{error}</p>;
  if (!stats) return <div className="skeleton-shimmer h-64 rounded-2xl" aria-busy="true" />;

  const hours = Math.floor(stats.activeAnswerTimeS / 3600);
  const mins = Math.round((stats.activeAnswerTimeS % 3600) / 60);
  const gpHours = (stats.gamlaProv.totalDurationS / 3600).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card label="Träningssvar (totalt)" value={formatInt(stats.training.total)} />
        <Card label="Träningssvar 7 dagar" value={formatInt(stats.training.last7d)} />
        <Card label="Träningssvar 30 dagar" value={formatInt(stats.training.last30d)} />
        <Card label="Unika tränare" value={formatInt(stats.training.users)} />
        <Card label="Ordsvar (totalt)" value={formatInt(stats.ord.totalAnswers)} />
        <Card label="Unika ordtränare" value={formatInt(stats.ord.users)} />
        <Card label="Matchsvar (totalt)" value={formatInt(stats.matchAnswers.total)} />
        <Card label="Avslutade matcher" value={formatInt(stats.matchesFinished)} />
        <Card label="Aktiva användare 7 dagar" value={formatInt(stats.activeUsers7d)} />
        <Card
          label="Aktiv svarstid (alla svar)"
          value={`${formatInt(hours)} h ${mins} min`}
          hint="Summerad tid per besvarad fråga — match + träning. Ordsvar och läsning räknas inte."
        />
        <Card
          label="Gamla prov: inlämningar"
          value={formatInt(stats.gamlaProv.submits)}
          hint={
            stats.gamlaProv.trackedSince
              ? `Spåras sedan ${stats.gamlaProv.trackedSince.slice(0, 10)}`
              : "Spårning aktiverad nu — historik före denna deploy finns inte."
          }
        />
        <Card
          label="Gamla prov: total tid"
          value={`${gpHours} h`}
          hint={`${formatInt(stats.gamlaProv.last7d)} inlämningar senaste 7 dagarna`}
        />
      </div>

      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        <strong>Om "aktiv tid":</strong> sidan har ingen heartbeat-mätning, så siffran är summan av
        tid spenderad per besvarad fråga (match-svar historiskt; tränings-svar och gamla
        prov-sessioner spåras från och med nu). Det är medvetet ett mått på{" "}
        <em>aktivt pluggande</em>, inte "flik öppen i bakgrunden".
      </p>
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className="mt-1 text-2xl font-bold tabular-nums text-[#e8e4da]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</div>}
    </div>
  );
}
