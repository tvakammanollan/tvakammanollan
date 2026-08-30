import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { pageTitle } from "@/lib/page-meta";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { m } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, AlertTriangle } from "lucide-react";
import { joinRankedQueue, pollRankedMatch, cancelRankedQueue } from "@/lib/ranked.functions";
import { createMatch } from "@/lib/match.functions";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/events";
import { toast } from "sonner";

const search = z.object({ type: z.enum(["verbal", "math"]).default("verbal") });

export const Route = createFileRoute("/matchmaking")({
  validateSearch: (s) => search.parse(s),
  component: MatchmakingPage,
  head: () => ({
    meta: [
      { title: pageTitle("Hitta match") },
      {
        name: "description",
        content:
          "Matchas mot en HP-spelare på din ELO-nivå inom sekunder. Välj verbal eller matte.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
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
  const [failed, setFailed] = useState(false);
  const cancelledRef = useRef(false);
  const navigatedRef = useRef(false);
  const botFiredRef = useRef(false);
  const botAttemptsRef = useRef(0);
  const guestSignInRef = useRef(false);

  // No session yet? Sign in as an anonymous guest instead of bouncing to /login.
  // The hero "Hitta match" button already does guest play; the header/closer CTAs
  // link straight to /matchmaking, so without this a logged-out visitor dead-ended
  // at the login page. Guests can play immediately and save their ELO later.
  useEffect(() => {
    if (loading || user || guestSignInRef.current) return;
    guestSignInRef.current = true;
    void (async () => {
      // Skicka INTE med något username. `users.username` är UNIQUE och
      // gästnamnen räcker till 20 konton — därefter felar triggern och
      // auth svarar 500, alltså "Kunde inte starta gästläge" för alla.
      // Triggern sätter `user_ || left(id, 8)` och `displayName()` gör om
      // det till lundnamnet där det visas. Se `useGuestPlay`.
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        guestSignInRef.current = false;
        console.error("guest sign-in failed", error);
        toast.error("Kunde inte starta gästläge");
        navigate({ to: "/login" });
      }
    })();
  }, [loading, user, navigate]);

  // Join queue on mount
  useEffect(() => {
    if (!user) return;
    cancelledRef.current = false;
    navigatedRef.current = false;
    let cancelled = false;
    (async () => {
      try {
        const res = await joinFn({ data: { match_type: type } });
        trackEvent("matchmaking_started", { match_type: type });
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
    if (failed) return;
    if (elapsed >= 6 && !navigatedRef.current && !botFiredRef.current && !navigating) {
      botFiredRef.current = true;
      void (async () => {
        try {
          cancelledRef.current = true;
          await cancelFn().catch(() => {});
          const res = await createFn({ data: { match_type: type, mode: "bot" } });
          // Hur ofta kön faktiskt hittar en människa är den enda siffra som
          // säger om spelarbasen räcker till riktig matchmaking.
          trackEvent("matchmaking_bot_fallback", { match_type: type, waited_s: elapsed });
          if (!navigatedRef.current) {
            navigatedRef.current = true;
            setNavigating(true);
            navigate({ to: "/match/$matchId", params: { matchId: res.match_id } });
          }
        } catch (e) {
          console.error("bot fallback failed", e);
          botAttemptsRef.current += 1;
          if (botAttemptsRef.current >= 3) {
            // Sluta hamra servern — visa explicit felläge i stället för evig spinner.
            setFailed(true);
          } else {
            botFiredRef.current = false; // tillåt nytt försök vid nästa tick
          }
        }
      })();
    }
    if (elapsed === 30 && range === 200) setRange(400);
  }, [elapsed, range, navigating, failed, cancelFn, createFn, type, navigate]);

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
      .channel(`mm-${user.id}-${Math.random().toString(36).slice(2)}`)
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
    trackEvent("matchmaking_abandoned", { match_type: type, waited_s: elapsed });
    try {
      await cancelFn();
    } catch {
      /* ignore */
    }
    navigate({ to: "/" });
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  // Explicit felläge efter 3 misslyckade match-försök — ingen evig spinner.
  if (failed) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-soft)]">
          <AlertTriangle className="h-6 w-6 text-[var(--danger)]" aria-hidden />
        </span>
        <div>
          <h1
            className="text-xl font-bold text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Kunde inte starta en match
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Något strular just nu. Försök igen om en stund.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              botAttemptsRef.current = 0;
              botFiredRef.current = false;
              cancelledRef.current = false;
              setFailed(false);
              setElapsed(0);
            }}
          >
            Försök igen
          </Button>
          <Button variant="ghost" onClick={() => navigate({ to: "/" })}>
            Till start
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      {/* Animated radar / pulse rings */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <m.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-primary/40"
          animate={{ scale: [1, 1.8, 1.8], opacity: [0.7, 0, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
        <m.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.8, 1.8], opacity: [0.7, 0, 0] }}
          transition={{ duration: 2.2, delay: 0.7, repeat: Infinity, ease: "easeOut" }}
        />
        <m.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          animate={{ scale: [1, 1.8, 1.8], opacity: [0.7, 0, 0] }}
          transition={{ duration: 2.2, delay: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <m.span
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-deep text-[var(--cream)] shadow-[var(--shadow-glow-gold)]"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Trophy className="h-9 w-9" />
        </m.span>
      </div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="eyebrow text-primary">Realtid</p>
        <h1
          className="display mt-2 text-[36px] font-bold leading-tight text-white sm:text-[48px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {navigating ? (
            "Motståndare hittad!"
          ) : (
            <>
              Söker <span className="display-italic font-medium text-primary">motståndare…</span>
            </>
          )}
        </h1>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="surface-paper w-full rounded-2xl p-5 text-sm"
      >
        <div className="text-white/65">
          {minElo !== null && maxElo !== null ? (
            <>
              Söker spelare med ELO{" "}
              <span className="font-semibold text-white tabular-nums">
                {minElo}–{maxElo}
              </span>
            </>
          ) : (
            "Joinar kön…"
          )}
        </div>
        {myElo !== null && (
          <div className="mt-1 text-white/65">
            Din ELO: <span className="font-semibold text-white tabular-nums">{myElo}</span>
          </div>
        )}
        <div
          className="mt-4 text-[28px] font-bold leading-none tabular-nums text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {mm}:{ss}
        </div>
      </m.div>

      <Button variant="outline" onClick={cancel} disabled={navigating}>
        {navigating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {navigating ? "Startar match…" : "Avbryt sökning"}
      </Button>
    </div>
  );
}
