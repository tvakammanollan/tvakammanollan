import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MATCH_TOTAL_SECONDS, matchStartKey } from "@/lib/match-clock";

interface SavedMatch {
  matchId: string;
  savedAt: string;
  matchType?: string;
  createdAt?: string;
}

export function ResumeMatchBanner() {
  const [saved, setSaved] = useState<SavedMatch | null>(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = sessionStorage.getItem("active_match");
        if (!raw) return;
        const data = JSON.parse(raw) as SavedMatch;
        // Samma klocka som matchsidan räknar på: ankaret sätts när spelaren
        // ser första frågan. Banderollen körde tidigare på 8 minuter mot
        // matchens 5 och mätte dessutom från `created_at`, som för privata rum
        // ligger före spelstart. Följden var att "Fortsätt matchen" stod kvar
        // efter att tiden gått ut — och den som klickade landade på en match
        // med noll sekunder kvar, som lämnades in automatiskt direkt.
        const anchor = Number(sessionStorage.getItem(matchStartKey(data.matchId))) || 0;
        const refTime = anchor || new Date(data.createdAt ?? data.savedAt).getTime();
        const elapsed = (Date.now() - refTime) / 1000;
        if (elapsed >= MATCH_TOTAL_SECONDS) {
          sessionStorage.removeItem("active_match");
          return;
        }
        // Verify match still active in DB
        const { data: m } = await supabase
          .from("matches")
          .select("status")
          .eq("id", data.matchId)
          .maybeSingle();
        if (cancelled) return;
        if (!m || m.status === "finished") {
          sessionStorage.removeItem("active_match");
          return;
        }
        setSaved(data);
      } catch {
        try {
          sessionStorage.removeItem("active_match");
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide while user is on the match itself
  if (!saved) return null;
  if (location.pathname.startsWith(`/match/${saved.matchId}`)) return null;

  const cancel = () => {
    try {
      sessionStorage.removeItem("active_match");
    } catch {
      /* ignore */
    }
    setSaved(null);
  };

  return (
    <div className="mb-4 flex flex-col items-start gap-2 rounded-xl border border-[#ae2f26]/30 bg-[#ae2f26]/[0.08] px-4 py-3 text-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[var(--cream)]">
        ⏳ Du har en pågående{" "}
        {saved.matchType === "math" ? "matte-" : saved.matchType === "verbal" ? "verbal-" : ""}
        match – vill du fortsätta?
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild size="sm" className="bg-[#ae2f26] text-[#fff8f5] hover:bg-[#8f2620]">
          <Link to="/match/$matchId" params={{ matchId: saved.matchId }}>
            Fortsätt matchen
          </Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel} className="text-muted-foreground">
          Avbryt matchen
        </Button>
      </div>
    </div>
  );
}
