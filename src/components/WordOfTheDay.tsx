import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { fetchWordOfTheDay, type WordOfTheDay as Wotd } from "@/lib/word-practice.functions";
import { ordText } from "@/lib/sv-format";
import { ordDefinitionParts } from "@/lib/ord-definition";
import { EyebrowLabel } from "@/components/layout/EyebrowLabel";
import { ArrowRight, BookOpen } from "lucide-react";

/* =====================================================================
   DAGENS ORD — ett riktigt HP-ord med förklaring, samma för alla.

   Valet görs på servern (`fetchWordOfTheDay`) av dagens datum i svensk tid.
   Kortet hämtade tidigare fyrtio slumpade ord i webbläsaren och tog det
   första med en förklaring, vilket gav ett eget "dagens ord" per besökare.

   LADDNINGSORDNING. Kortet är det första blocket i vänsterspalten och ska
   inte poppa in efter resten:

     - Ordet skickas in som `initial` när sidan redan har det (dashboardens
       loader hämtar det parallellt med resten), och renderas då direkt i
       första målningen — ingen hämtning i webbläsaren alls.
     - Utan `initial` hämtas det i en effekt, men skelettet har samma höjd
       som det färdiga kortet, så layouten hoppar inte när det landar.
     - Dygnets val cachas i localStorage under `tkn:wotd:<datum>` så en
       återkommande besökare slipper anropet helt.
   ===================================================================== */

type Visning = { word: string; definition: string };

const cacheKey = (date: string) => `tkn:wotd:${date}`;

/** Datumsträngen används både som cachenyckel och som "är detta dagens?". */
function svensktDatum(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function tillVisning(w: Wotd): Visning | null {
  // Bara betydelserna: kortet klipper på tre rader, och exempelmening plus
  // liknande ord hör hemma i ord-övningen där det finns plats.
  const parts = ordDefinitionParts(w.definition);
  if (parts.senses.length === 0) return null;
  return { word: ordText(w.word), definition: parts.senses.join(" ") };
}

export function WordOfTheDay({ initial }: { initial?: Wotd | null }) {
  const fetchWotd = useServerFn(fetchWordOfTheDay);
  const [wotd, setWotd] = useState<Visning | null>(() => (initial ? tillVisning(initial) : null));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (wotd) return;
    let cancelled = false;
    const datum = svensktDatum();

    try {
      const raw = localStorage.getItem(cacheKey(datum));
      if (raw) {
        const parsed = JSON.parse(raw) as Visning;
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
        const res = (await fetchWotd()) as Wotd | null;
        if (cancelled) return;
        const val = res ? tillVisning(res) : null;
        if (!val) {
          setFailed(true);
          return;
        }
        try {
          localStorage.setItem(cacheKey(res!.date), JSON.stringify(val));
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
  }, [fetchWotd, wotd]);

  // Kortet returnerade tidigare null så fort hämtningen inte gick igenom.
  // Det lämnar ett hål i layouten, och eftersom felet är tyst syns det som
  // att komponenten är borta snarare än att ett anrop failat. Nu fyller den
  // alltid sin plats: skelett medan den laddar, och ett ingångskort till
  // ordträningen om anropet inte gick fram.
  if (!wotd) {
    if (!failed) {
      return (
        <div
          className="rounded-2xl border border-[#7a5236]/20 bg-[#7a5236]/[0.05] p-5"
          aria-busy="true"
        >
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
