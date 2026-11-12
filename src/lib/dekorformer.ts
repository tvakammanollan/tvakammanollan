import { type Produktzon, zonDekor, zonForPath } from "./produktzon";

/**
 * Vilka dekorformer en sida får, ur adressen. Ren och testad; renderingen
 * bor i `components/layout/Dekorformer.tsx`, där också bakgrunden står.
 */
export interface Dekorform {
  /** CSS-färg, normalt en zon-token. */
  farg: string;
  /** Position och storlek, Tailwind-klasser. */
  className: string;
  /** Organisk form, `border-radius` med åtta värden. */
  radius: string;
}

const RUND = [
  "58% 42% 37% 63% / 45% 55% 45% 55%",
  "42% 58% 61% 39% / 52% 38% 62% 48%",
  "63% 37% 47% 53% / 41% 59% 41% 59%",
  "51% 49% 38% 62% / 60% 44% 56% 40%",
] as const;

/** Två former i zonens färg och en liten i cream wash. */
function zonFormer(farg: string): Dekorform[] {
  return [
    { farg, className: "-top-10 right-[7%] h-[180px] w-[200px] opacity-70", radius: RUND[0] },
    { farg, className: "top-[230px] left-[5%] h-[112px] w-[124px] opacity-60", radius: RUND[1] },
    {
      farg: "var(--cream-wash)",
      className: "top-[70px] left-[58%] h-[64px] w-[76px] opacity-80",
      radius: RUND[2],
    },
  ];
}

/** Utanför zonerna: cream wash, som inte tillhör någon produktyta. */
export const CREAM_FORMER: Dekorform[] = [
  {
    farg: "var(--cream-wash)",
    className: "-top-10 right-[7%] h-[180px] w-[200px] opacity-90",
    radius: RUND[0],
  },
  {
    farg: "var(--cream-wash)",
    className: "top-[230px] left-[5%] h-[112px] w-[124px] opacity-80",
    radius: RUND[1],
  },
  {
    farg: "var(--cream-wash)",
    className: "top-[90px] left-[62%] h-[56px] w-[68px] opacity-90",
    radius: RUND[2],
  },
];

/**
 * Startsidan visar alla fyra produktytorna och är den enda sidan där alla
 * fyra färgerna får mötas. Plum är inte med, se ovan.
 */
export const HEM_FORMER: Dekorform[] = [
  {
    farg: "var(--terracotta)",
    className: "-top-12 right-[3%] h-[190px] w-[220px] opacity-70",
    radius: RUND[0],
  },
  {
    farg: "var(--sky)",
    className: "top-[200px] -left-6 h-[130px] w-[150px] opacity-70",
    radius: RUND[1],
  },
  {
    farg: "var(--lavender)",
    className: "top-[120px] right-[22%] h-[90px] w-[104px] opacity-70",
    radius: RUND[2],
  },
  {
    farg: "var(--cream-wash)",
    className: "top-[10px] left-[40%] h-[72px] w-[84px] opacity-90",
    radius: RUND[3],
  },
];

/**
 * Sidor som INTE får former: startsidan (ritar sina egna), pågående match
 * och provpass (täta skärmar med halvgenomskinliga kort som formerna hade
 * lyst igenom) och admin.
 */
const UTAN_FORMER = [/^\/$/, /^\/match\//, /^\/gamla-prov\/[^/]+\/[^/]+/, /^\/admin/];

/**
 * Prissidan och kassan säljer ordlistan och MEK och får ordlistans färg,
 * utan att räknas till zonen: `ZonBand` ska fortsätta betyda "du står på
 * produktytan", och det gör man inte i kassan.
 */
const PRODUKTSIDOR: Record<string, Produktzon> = { "/pris": "ord", "/kassa": "ord" };

export function formerForPath(path: string): Dekorform[] | null {
  if (UTAN_FORMER.some((re) => re.test(path))) return null;
  const zon = zonForPath(path) ?? PRODUKTSIDOR[path] ?? null;
  return zon ? zonFormer(zonDekor[zon]) : CREAM_FORMER;
}
