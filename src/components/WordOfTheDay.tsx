import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { fetchWordBatch } from "@/lib/word-practice.functions";
import { EyebrowLabel } from "@/components/layout/EyebrowLabel";
import { ArrowRight, BookOpen } from "lucide-react";

/* =====================================================================
   DAGENS ORD — en daglig lärnudge på dashboarden. Hämtar ett riktigt
   HP-ord med förklaring (återanvänder fetchWordBatch, ingen DB-ändring),
   och cachar dagens val i localStorage så det är stabilt per dygn.
   Helt fail-safe: renderar inget om data saknas/fel.
   ===================================================================== */

type Wotd = { word: string; definition: string };

const cacheKey = () => `hpk:wotd:${new Date().toISOString().slice(0, 10)}`;

export function WordOfTheDay() {
  const fetchBatch = useServerFn(fetchWordBatch);
  const [wotd, setWotd] = useState<Wotd | null>(null);

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
        const val: Wotd = { word: pick.question_text, definition: pick.definition as string };
        try {
          localStorage.setItem(cacheKey(), JSON.stringify(val));
        } catch {
          /* localStorage kan vara blockerad */
        }
        setWotd(val);
      } catch {
        /* tyst — kortet visas bara inte */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchBatch]);

  if (!wotd) return null;

  return (
    <Link
      to="/ord"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params={{} as any}
      className="group block rounded-2xl border border-[#6fb3b8]/20 bg-[#6fb3b8]/[0.05] p-5 transition-colors hover:border-[#6fb3b8]/40 hover:bg-[#6fb3b8]/[0.08]"
    >
      <div className="flex items-center justify-between gap-3">
        <EyebrowLabel tone="teal">Dagens ord</EyebrowLabel>
        <span className="inline-flex items-center gap-1 text-xs text-white/45 transition-colors group-hover:text-[#6fb3b8]">
          <BookOpen className="h-3.5 w-3.5" />
          Öva fler
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <div
        className="mt-2 text-[26px] font-bold lowercase leading-tight text-[#e8e4da] sm:text-[30px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {wotd.word}
      </div>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-white/65">{wotd.definition}</p>
    </Link>
  );
}
