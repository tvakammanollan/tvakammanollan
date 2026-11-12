/**
 * Uppskattad sannolikhet att ett ORD-uppslag står på nästa högskoleprov.
 *
 * Talen räknas av `scripts/ord-sannolikhet/modell.ts` (se REGELVERK.md där)
 * och ligger i `src/data/ord-sannolikhet.json`, nycklade på samma slug som
 * ordlistan. Den här filen läser dem och gör text av dem. Filen är 380 kB:
 * importera den bara på servern.
 *
 * Talet är sajtens uppskattning, inte UHR:s besked, och ska alltid
 * presenteras så. Den högsta sannolikheten i banken är under en procent.
 */
import data from "@/data/ord-sannolikhet.json";
import { formatDecimal, formatInt } from "@/lib/sv-format";

export type OrdSannolikhetPost = {
  /** Sannolikhet per provtillfälle, i procent. */
  p: number;
  /** 1–5, där 5 är högst. */
  band: number;
  /** Bedömd provlikhet 1–5. */
  typ: number;
  /** Senaste provtillfälle ordet stod på, om något. */
  senast?: string;
};

export type OrdSannolikhet = OrdSannolikhetPost & {
  /** "0,18 %" eller "under 0,01 %". */
  text: string;
  /** "1 på 550". */
  ettPa: string;
  skal: string;
};

/** Ord har hittills inte kommit tillbaka inom så här många år. */
export const KARENS_AR = 10;

const ORD = data.ord as Record<string, OrdSannolikhetPost>;

/** "0,18 %" för vanliga tal, tre decimaler under en tiondels procent. */
export function formatSannolikhet(procent: number): string {
  if (!Number.isFinite(procent) || procent < 0) return "–";
  if (procent < 0.01) return "under 0,01 %";
  return `${formatDecimal(procent, procent < 0.1 ? 3 : 2)} %`;
}

/** "1 på 550", avrundat till två värdesiffror. */
export function formatEttPa(procent: number): string {
  if (!Number.isFinite(procent) || procent <= 0) return "–";
  const n = 100 / procent;
  const steg = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1);
  return `1 på ${formatInt(Math.round(n / steg) * steg)}`;
}

/** "våren 2004", "hösten 2021". Okänd form ges tillbaka orörd. */
export function termText(term: string): string {
  const m = /^(\d{4})(vt|ht)[ab]?$/.exec(term);
  return m ? `${m[2] === "ht" ? "hösten" : "våren"} ${m[1]}` : term;
}

function termTid(term: string): number {
  return Number(term.slice(0, 4)) + (term.includes("ht") ? 0.8 : 0.27);
}

export function sannolikhetSkal(post: OrdSannolikhetPost, nasta: number): string {
  if (post.senast) {
    const stod = `Stod på provet ${termText(post.senast)}.`;
    return nasta - termTid(post.senast) < KARENS_AR
      ? `${stod} Hittills har inget ord kommit tillbaka inom ${KARENS_AR} år.`
      : `${stod} Äldre provord har börjat återanvändas.`;
  }
  if (post.typ >= 4) return "Har inte stått på provet, men liknar de ord som brukar väljas.";
  if (post.typ <= 2) return "Har inte stått på provet och liknar inte de ord som brukar väljas.";
  return "Har inte stått på provet.";
}

export function beskrivSannolikhet(post: OrdSannolikhetPost, nasta: number): OrdSannolikhet {
  return {
    ...post,
    text: formatSannolikhet(post.p),
    ettPa: formatEttPa(post.p),
    skal: sannolikhetSkal(post, nasta),
  };
}

/** Sannolikheten för ett uppslag, eller null om ordet saknas i beräkningen. */
export function ordSannolikhet(slug: string): OrdSannolikhet | null {
  const post = ORD[slug];
  return post ? beskrivSannolikhet(post, data.nasta) : null;
}
