import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SavedMatch {
  matchId: string;
  savedAt: string;
  matchType?: string;
  createdAt?: string;
}

const MATCH_DURATION = 8 * 60; // 480s

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
        const refTime = data.createdAt ?? data.savedAt;
        const elapsed = (Date.now() - new Date(refTime).getTime()) / 1000;
        if (elapsed >= MATCH_DURATION) {
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
        try { sessionStorage.removeItem("active_match"); } catch { /* ignore */ }
      }
    })();
    return () => { cancelled = true; };
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
    <div className="mb-4 flex flex-col items-start gap-2 rounded-xl border border-[#F2A65A]/40 bg-[#fefce8] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-foreground">
        ⏳ Du har en pågående{" "}
        {saved.matchType === "math" ? "matte-" : saved.matchType === "verbal" ? "verbal-" : ""}
        match – vill du fortsätta?
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          asChild
          size="sm"
          className="bg-[#f2a65a] text-[#1a0d04] hover:bg-[#c97b41]"
        >
          <Link to="/match/$matchId" params={{ matchId: saved.matchId }}>
            Fortsätt matchen
          </Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={cancel}
          className="text-muted-foreground"
        >
          Avbryt matchen
        </Button>
      </div>
    </div>
  );
}
