import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  MATCH_TOTAL_SECONDS,
  matchIsLive,
  matchStartKey,
  resolveMatchAnchor,
} from "@/lib/match-clock";

interface SavedMatch {
  matchId: string;
  savedAt: string;
  matchType?: string;
  createdAt?: string;
}

/**
 * Läser den sparade matchen SYNKRONT ur sessionStorage.
 *
 * Banderollen satt tidigare i ett `useState(null)` som fylldes först efter en
 * databasrundtur, alltså ett block som sköt ner hela startsidan en halv sekund
 * efter att den ritats. sessionStorage svarar direkt — finns ingen sparad match
 * (det vanliga) syns ingenting och ingenting hoppar; finns det en visas den i
 * första målningen. Databaskollen nedan blir då ett skyddsnät som i undantagsfall
 * TAR BORT banderollen, i stället för det som normalt lägger till den.
 */
function sparadMatch(): SavedMatch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("active_match");
    return raw ? (JSON.parse(raw) as SavedMatch) : null;
  } catch {
    return null;
  }
}

export function ResumeMatchBanner() {
  const [saved, setSaved] = useState<SavedMatch | null>(sparadMatch);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = sparadMatch();
        if (!data) return;

        // Statusen och starttiden läses ur databasen, inte ur den sparade
        // posten. Banderollen körde tidigare på 8 minuter mot matchens 5 och
        // mätte från `created_at` — som för ett privat rum eller en inbjudan
        // ligger *före* spelstart, ofta med minuter. Följden var att
        // "Fortsätt matchen" stod kvar efter att tiden gått ut, och den som
        // klickade landade på en match med noll sekunder kvar.
        const { data: m } = await supabase
          .from("matches")
          .select("status, started_at")
          .eq("id", data.matchId)
          .maybeSingle();
        if (cancelled) return;
        // Bara en spelbar match går att återuppta. `finished` är klar,
        // `waiting` har inte börjat — ingendera är "pågående".
        if (!m || !matchIsLive(m.status)) {
          sessionStorage.removeItem("active_match");
          setSaved(null);
          return;
        }

        let stored: string | null = null;
        try {
          stored = sessionStorage.getItem(matchStartKey(data.matchId));
        } catch {
          /* private mode */
        }
        const { anchor } = resolveMatchAnchor({
          startedAt: (m as { started_at?: string | null }).started_at ?? null,
          stored,
          now: Date.now(),
        });
        if ((Date.now() - anchor) / 1000 >= MATCH_TOTAL_SECONDS) {
          sessionStorage.removeItem("active_match");
          setSaved(null);
          return;
        }
        setSaved(data);
      } catch {
        setSaved(null);
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
