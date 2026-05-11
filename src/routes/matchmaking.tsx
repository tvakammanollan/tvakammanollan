import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  joinRankedQueue,
  pollRankedMatch,
  cancelRankedQueue,
} from "@/lib/ranked.functions";
import { createMatch } from "@/lib/match.functions";
import { supabase } from "@/integrations/supabase/client";

const search = z.object({ type: z.enum(["verbal", "math"]).default("verbal") });

export const Route = createFileRoute("/matchmaking")({
  validateSearch: (s) => search.parse(s),
  component: MatchmakingPage,
});

function MatchmakingPage() {
  const { user, loading } = useAuth();
  const { type } = Route.useSearch();
  const navigate = useNavigate();

  const joinFn = useServerFn(joinRankedQueue);
  const pollFn = useServerFn(pollRankedMatch);
  const cancelFn = useServerFn(cancelRankedQueue);
  const createFn = useServerFn(createMatch);

  const [elapsed, setElapsed] = useState(0);
  const [range, setRange] = useState(200);
  const [minElo, setMinElo] = useState<number | null>(null);
  const [maxElo, setMaxElo] = useState<number | null>(null);
  const [myElo, setMyElo] = useState<number | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const cancelledRef = useRef(false);
  const navigatedRef = useRef(false);

  // Join queue on mount
  useEffect(() => {
    if (!user) return;
    cancelledRef.current = false;
    navigatedRef.current = false;
    let cancelled = false;
    (async () => {
      try {
        const res = await joinFn({ data: { match_type: type } });
        if (!cancelled) setMyElo(res.elo);
      } catch (e) {
        console.error(e);
        toast.error("Kunde inte gå med i kön");
        navigate({ to: "/" });
      }
    })();
    return () => {
      cancelled = true;
      if (!navigatedRef.current && !cancelledRef.current) {
        cancelledRef.current = true;
        cancelFn().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, type]);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Show bot fallback after 10s
  useEffect(() => {
    if (elapsed >= 10) setShowFallback(true);
    if (elapsed === 30 && range === 200) setRange(400);
  }, [elapsed, range]);

  // Polling for match
  useEffect(() => {
    if (!user) return;
    let active = true;
    const tick = async () => {
      try {
        const res = await pollFn({
          data: { match_type: type, elo_range: range },
        });
        if (!active) return;
        if (res.status === "matched" && res.match_id) {
          navigatedRef.current = true;
          setNavigating(true);
          navigate({ to: "/match/$matchId", params: { matchId: res.match_id } });
          return;
        }
        if (res.status === "waiting") {
          setMinElo(res.min_elo);
          setMaxElo(res.max_elo);
        }
      } catch (e) {
        console.error("poll error", e);
      }
    };
    void tick();
    const id = setInterval(tick, 3000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [user, type, range, navigate, pollFn]);

  // Realtime: instant notify when our row gets paired
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`mm-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matchmaking_queue",
          filter: `player_id=eq.${user.id}`,
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          if (row?.status === "matched" && row?.match_id && !navigatedRef.current) {
            navigatedRef.current = true;
            setNavigating(true);
            navigate({ to: "/match/$matchId", params: { matchId: row.match_id } });
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const cancel = async () => {
    cancelledRef.current = true;
    try {
      await cancelFn();
    } catch {/* ignore */}
    navigate({ to: "/" });
  };

  const playBot = async () => {
    cancelledRef.current = true;
    try {
      await cancelFn();
      const res = await createFn({ data: { match_type: type, mode: "bot" } });
      navigatedRef.current = true;
      navigate({ to: "/match/$matchId", params: { matchId: res.match_id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte starta bot-match");
    }
  };

  if (!loading && !user) return <Navigate to="/login" />;

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {navigating ? "Motståndare hittad!" : "Söker motståndare…"}
      </h1>

      <div className="flex items-center gap-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-3 w-3 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
      </div>

      <div className="w-full rounded-xl border border-border bg-card p-5 text-sm">
        <div className="text-muted-foreground">
          {minElo !== null && maxElo !== null
            ? `Söker spelare med ELO ${minElo}–${maxElo}`
            : "Joinar kön…"}
        </div>
        {myElo !== null && (
          <div className="mt-1 text-muted-foreground">
            Din ELO: <span className="font-semibold text-foreground">{myElo}</span>
          </div>
        )}
        <div
          className="mt-3 text-xl tabular-nums"
          style={{ fontFamily: "var(--font-mono, ui-monospace)" }}
        >
          Sökt i: {mm}:{ss}
        </div>
      </div>

      {showFallback && !navigating && (
        <div className="w-full rounded-xl border border-border bg-background p-4 text-sm">
          <div className="font-medium">Ingen spelare hittades ännu ({elapsed} sek)</div>
          <div className="mt-1 text-muted-foreground">Vill du möta en bot istället?</div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={playBot} className="flex-1">
              ⚡ Ja, möt en bot
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFallback(false)}
              className="flex-1"
            >
              ⏳ Vänta mer
            </Button>
          </div>
        </div>
      )}

      <Button variant="outline" onClick={cancel} disabled={navigating}>
        {navigating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {navigating ? "Startar match…" : "Avbryt sökning"}
      </Button>
    </div>
  );
}
