import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { SplitText } from "@/components/landing/MotionFX";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy } from "lucide-react";
import { joinRankedQueue, pollRankedMatch, cancelRankedQueue } from "@/lib/ranked.functions";
import { createMatch } from "@/lib/match.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [navigating, setNavigating] = useState(false);
  const cancelledRef = useRef(false);
  const navigatedRef = useRef(false);
  const botFiredRef = useRef(false);

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

  // Auto-match with bot after 6s if no human found — seamless, no indication it's a bot
  useEffect(() => {
    if (elapsed >= 6 && !navigatedRef.current && !botFiredRef.current && !navigating) {
      botFiredRef.current = true;
      void (async () => {
        try {
          cancelledRef.current = true;
          await cancelFn().catch(() => {});
          const res = await createFn({ data: { match_type: type, mode: "bot" } });
          if (!navigatedRef.current) {
            navigatedRef.current = true;
            setNavigating(true);
            navigate({ to: "/match/$matchId", params: { matchId: res.match_id } });
          }
        } catch (e) {
          botFiredRef.current = false;
          console.error("bot fallback failed", e);
        }
      })();
    }
    if (elapsed === 30 && range === 200) setRange(400);
  }, [elapsed, range, navigating, cancelFn, createFn, type, navigate]);

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
    } catch {
      /* ignore */
    }
    navigate({ to: "/" });
  };

  if (!loading && !user) return <Navigate to="/login" />;

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      {/* Animated radar / pulse rings */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-[#6366f1]/40"
          animate={{ scale: [1, 1.8, 1.8], opacity: [0.7, 0, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-[#6366f1]/30"
          animate={{ scale: [1, 1.8, 1.8], opacity: [0.7, 0, 0] }}
          transition={{ duration: 2.2, delay: 0.7, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-[#6366f1]/20"
          animate={{ scale: [1, 1.8, 1.8], opacity: [0.7, 0, 0] }}
          transition={{ duration: 2.2, delay: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#4338ca] text-white shadow-[var(--shadow-glow-green)]"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="h-9 w-9" />
        </motion.span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="eyebrow text-[#6366f1]">Realtid</p>
        <h1
          className="display mt-2 text-[36px] font-bold leading-tight text-[#050507] sm:text-[48px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {navigating ? (
            <SplitText as="span">Motståndare hittad!</SplitText>
          ) : (
            <>
              <SplitText as="span">Söker</SplitText>{" "}
              <span className="display-italic font-medium text-[#6366f1]">
                <SplitText as="span" delay={0.2} italic>
                  motståndare…
                </SplitText>
              </span>
            </>
          )}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="surface-paper w-full rounded-2xl p-5 text-sm"
      >
        <div className="text-[#737373]">
          {minElo !== null && maxElo !== null ? (
            <>
              Söker spelare med ELO{" "}
              <span className="font-semibold text-[#050507] tabular-nums">
                {minElo}–{maxElo}
              </span>
            </>
          ) : (
            "Joinar kön…"
          )}
        </div>
        {myElo !== null && (
          <div className="mt-1 text-[#737373]">
            Din ELO: <span className="font-semibold text-[#050507] tabular-nums">{myElo}</span>
          </div>
        )}
        <div
          className="mt-4 text-[28px] font-bold leading-none tabular-nums text-[#6366f1]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {mm}:{ss}
        </div>
      </motion.div>

      <Button variant="outline" onClick={cancel} disabled={navigating}>
        {navigating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {navigating ? "Startar match…" : "Avbryt sökning"}
      </Button>
    </div>
  );
}
