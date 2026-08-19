import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { fetchWordBatch } from "@/lib/word-practice.functions";
import { ordText } from "@/lib/sv-format";
import { ordDefinitionParts } from "@/lib/ord-definition";
import { EyebrowLabel } from "@/components/layout/EyebrowLabel";
import { ArrowRight, BookOpen } from "lucide-react";

/* =====================================================================
   DAGENS ORD — en daglig lärnudge på dashboarden. Hämtar ett riktigt
   HP-ord med förklaring (återanvänder fetchWordBatch, ingen DB-ändring),
   och cachar dagens val i localStorage så det är stabilt per dygn.
   Helt fail-safe: renderar inget om data saknas/fel.
   ===================================================================== */

type Wotd = { word: string; definition: string };

const cacheKey = () => `tkn:wotd:${new Date().toISOString().slice(0, 10)}`;

export function WordOfTheDay() {
  const fetchBatch = useServerFn(fetchWordBatch);
  const [wotd, setWotd] = useState<Wotd | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Cachad för idag?
    try {
      const raw = localStorage.getItem(cacheKey());
      if (raw) {
        const parsed = JSON.parse(raw) as Wotd;
        if (parsed?.word && parsed?.definition) {
          setWotd(parsed);
          return;
        }
      }
    } catch {
      /* ignorera trasig cache */
    }
    (async () => {
      try {
        const res = (await fetchBatch({ data: { count: 40 } })) as {
          questions: { question_text: string; definition: string | null }[];
        };
        const pick = (res.questions ?? []).find(
          (q) => q.definition && q.definition.trim().length > 0 && q.question_text,
        );
        if (!pick || cancelled) return;
        // Bara betydelserna: kortet klipper på tre rader, och exempelmening
        // plus liknande ord hör hemma i ord-övningen där det finns plats.
        const parts = ordDefinitionParts(pick.definition);
        if (parts.senses.length === 0) return;
        const val: Wotd = {
          word: ordText(pick.question_text),
          definition: parts.senses.join(" "),
        };
        try {
          localStorage.setItem(cacheKey(), JSON.stringify(val));
        } catch {
          /* localStorage kan vara blockerad */
        }
        setWotd(val);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchBatch]);

  // Kortet returnerade tidigare null så fort hämtningen inte gick igenom.
  // Det lämnar ett hål i layouten, och eftersom felet är tyst syns det
  // som att komponenten är borta snarare än att ett anrop failat. Nu
  // fyller den alltid sin plats: skelett medan den laddar, och ett
  // ingångskort till ordträningen om anropet inte gick fram.
  if (!wotd) {
    if (!failed) {
      return (
        <div className="rounded-2xl border border-[#7a5236]/20 bg-[#7a5236]/[0.05] p-5" aria-busy="true">
          <EyebrowLabel tone="teal">Dagens ord</EyebrowLabel>
          <div className="skeleton-shimmer mt-3 h-8 w-2/3 rounded-lg" />
          <div className="skeleton-shimmer mt-2.5 h-4 w-full rounded" />
          <div className="skeleton-shimmer mt-1.5 h-4 w-4/5 rounded" />
        </div>
      );
    }
    return (
      <Link
        to="/ord"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params={{} as any}
        className="group block rounded-2xl border border-[#7a5236]/20 bg-[#7a5236]/[0.05] p-5 transition-colors hover:border-[#7a5236]/40"
      >
        <EyebrowLabel tone="teal">Dagens ord</EyebrowLabel>
        <div
          className="mt-2 text-[22px] font-bold leading-tight text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          10 000 ord väntar
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-white/65">
          Dagens ord kunde inte hämtas just nu. Gå till ordträningen så plockar den upp där du
          slutade.
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#7a5236]">
          <BookOpen className="h-3.5 w-3.5" />
          Öva ord
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  return (
    <Link
      to="/ord"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params={{} as any}
      className="group block rounded-2xl border border-[#7a5236]/20 bg-[#7a5236]/[0.05] p-5 transition-colors hover:border-[#7a5236]/40 hover:bg-[#7a5236]/[0.08]"
    >
      <div className="flex items-center justify-between gap-3">
        <EyebrowLabel tone="teal">Dagens ord</EyebrowLabel>
        <span className="inline-flex items-center gap-1 text-xs text-white/45 transition-colors group-hover:text-[#7a5236]">
          <BookOpen className="h-3.5 w-3.5" />
          Öva fler
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <div
        className="mt-2 text-[26px] font-bold lowercase leading-tight text-[var(--cream)] sm:text-[30px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {wotd.word}
      </div>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-white/65">{wotd.definition}</p>
    </Link>
  );
}
