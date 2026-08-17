import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useGuestPlay } from "@/hooks/useGuestPlay";
import { Zap, Loader2 } from "lucide-react";

// Hide the CTA on pages where it would be distracting or redundant —
// login/signup (user already converting) och legal/kontakt-sidor
// (information snarare än aktivering).
const HIDDEN_PREFIXES = [
  "/login",
  "/signup",
  "/onboarding",
  "/villkor",
  "/integritetspolicy",
  "/kontakt",
];

/**
 * Always-visible floating CTA: a glowing round "Testa gratis" button
 * pinned to the bottom of the viewport on both mobile and desktop.
 * Only renders for visitors who aren't logged in. Drops them straight
 * into a bot match via the same useGuestPlay hook.
 */
export function FloatingTestCta() {
  const { user, loading } = useAuth();
  const { play, loading: guestLoading } = useGuestPlay();
  const [mounted, setMounted] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    // Avoid SSR hydration mismatch by waiting one frame on the client
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Hide for logged-in users (incl. anon guests — once they're in, no need)
  if (loading || user) return null;
  if (!mounted) return null;
  if (HIDDEN_PREFIXES.some((p) => path.startsWith(p))) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4 sm:bottom-7 sm:right-7 sm:left-auto sm:justify-end sm:px-0 pointer-events-none"
      aria-hidden={false}
    >
      <button
        type="button"
        onClick={() => play("verbal")}
        disabled={guestLoading}
        aria-label="Testa gratis, hoppa direkt in i en match"
        data-cursor="link"
        className="group pointer-events-auto relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-7 py-4 text-[15px] font-bold text-[#fff8f5] shadow-[0_10px_40px_rgba(174, 47, 38,0.5),0_0_0_1px_rgba(255,255,255,0.15)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 sm:px-8 sm:py-5 sm:text-base"
      >
        {/* Pulsing halo */}
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-amber-400/60 blur-2xl animate-pulse"
        />
        {/* Soft inner ring */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30"
        />
        {guestLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Zap className="h-5 w-5 fill-current" />
        )}
        <span className="whitespace-nowrap">Testa gratis</span>
      </button>
    </div>
  );
}
