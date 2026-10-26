import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Swords } from "lucide-react";
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

  const typ = saved.matchType === "math" ? "Kvantitativ" : saved.matchType === "verbal" ? "Verbal" : null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-terracotta px-6 py-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Swords className="h-6 w-6 shrink-0 text-[var(--cream-3)]" aria-hidden />
          <div>
            <p className="text-base font-semibold text-[var(--cream)]">Du har en match igång</p>
            <p className="text-sm text-[var(--cream-3)]">
              {typ ? `${typ}. ` : ""}Klockan går medan du är borta.
            </p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            className="min-h-[44px] bg-primary px-5 text-on-brand hover:bg-primary-deep"
          >
            <Link to="/match/$matchId" params={{ matchId: saved.matchId }}>
              Fortsätt
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={cancel}
            className="min-h-[44px] text-[var(--cream-3)] hover:bg-black/5"
          >
            Avbryt
          </Button>
        </div>
      </div>
    </div>
  );
}
