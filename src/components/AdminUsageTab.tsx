import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  fetchUsageStats,
  fetchPageViewStats,
  type UsageStats,
  type PageViewStats,
} from "@/lib/usage.functions";
import { formatInt } from "@/lib/sv-format";

/** Admin → Användning: aktivitet utanför matcher + aktiv tid. */
export function AdminUsageTab() {
  const fetchFn = useServerFn(fetchUsageStats);
  const fetchViews = useServerFn(fetchPageViewStats);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [views, setViews] = useState<PageViewStats | null>(null);
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

  // Egen effekt: sidvisningar är nytt och får inte kunna släcka resten av vyn
  // om något strular med dem.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = (await fetchViews({})) as PageViewStats;
        if (!cancelled) setViews(v);
      } catch {
        if (!cancelled) setViews(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchViews]);

  if (error) return <p className="p-6 text-sm text-[#8c1d18]">{error}</p>;
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

      <PageViewsSection views={views} />

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
        className="mt-1 text-2xl font-bold tabular-nums text-[#2e1e14]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</div>}
    </div>
  );
}

/**
 * Sidvisningar. Räknas i workern per dygn och sökväg — ingen IP, ingen
 * användare, ingen cookie — så inget samtycke krävs och integritetspolicyn
 * står kvar orörd.
 */
function PageViewsSection({ views }: { views: PageViewStats | null }) {
  if (!views) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
        <div className="text-sm font-semibold text-[#2e1e14]">Sidvisningar</div>
        <p className="mt-1 text-xs text-muted-foreground">Kunde inte hämta sidvisningar just nu.</p>
      </div>
    );
  }

  if (!views.since) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
        <div className="text-sm font-semibold text-[#2e1e14]">Sidvisningar</div>
        <p className="mt-1 text-xs text-muted-foreground">
          Räkningen är igång men har inte hunnit samla data än. Siffrorna börjar fyllas på från och
          med första besöket efter den här deployen.
        </p>
      </div>
    );
  }

  const peak = Math.max(...views.daily.map((d) => d.views), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card label="Sidvisningar 7 dagar" value={formatInt(views.total7d)} />
        <Card
          label="Sidvisningar 30 dagar"
          value={formatInt(views.total30d)}
          hint={`Räknas sedan ${views.since}`}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
        <div className="text-sm font-semibold text-[#2e1e14]">Per dygn</div>
        <div
          className="mt-3 flex h-28 items-end gap-1"
          role="img"
          aria-label="Sidvisningar per dygn"
        >
          {views.daily.map((d) => (
            <div
              key={d.day}
              className="flex-1 rounded-t bg-[#ae2f26]/70 transition-colors hover:bg-[#ae2f26]"
              style={{ height: `${Math.max((d.views / peak) * 100, 2)}%` }}
              title={`${d.day}: ${formatInt(d.views)} visningar`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>{views.daily[0]?.day}</span>
          <span>{views.daily[views.daily.length - 1]?.day}</span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
        <div className="text-sm font-semibold text-[#2e1e14]">Mest besökta sidor (30 dagar)</div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1 pr-3 font-medium">Sida</th>
                <th className="py-1 text-right font-medium">Visningar</th>
              </tr>
            </thead>
            <tbody>
              {views.topPages.map((p) => (
                <tr key={p.path} className="border-t border-white/5">
                  <td className="py-1.5 pr-3 font-mono text-[13px] text-[#2e1e14]">{p.path}</td>
                  <td className="py-1.5 text-right tabular-nums text-[#2e1e14]">
                    {formatInt(p.views)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
