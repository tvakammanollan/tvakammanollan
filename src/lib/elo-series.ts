/**
 * ELO-kurvan: två serier, en tidsaxel.
 *
 * `elo_history` har en rad per match och användare, med `elo_after`,
 * `elo_change`, `match_type` och `created_at`. Att rita den listan rakt av
 * ger en kurva som ser trasig ut, av två skäl:
 *
 *  - **Raderna är interfolierade.** En verbal match ger en punkt där bara
 *    `verbal` är satt, nästa match är matte och sätter bara `math`. Recharts
 *    ritar då hål i båda linjerna, och `connectNulls` drar en rak linje över
 *    hålet — vilket får ELO att se ut att ha ändrats vid en tidpunkt då
 *    ingenting hände i den delen.
 *  - **En hämtning täcker båda.** Ett `limit(30)` över hela historiken betyder
 *    att den som spelat trettio mattematcher inte har EN verbal punkt kvar i
 *    urvalet, och den verbala linjen försvinner utan förklaring.
 *
 * Lösningen här: hämta varje del för sig (anroparens ansvar), och slå ihop dem
 * till en gemensam tidsaxel där varje punkt bär **senast kända värde** för
 * båda delarna. Då är linjerna kontinuerliga och en punkt som inte rörde en
 * viss del ligger kvar på sitt värde i stället för att sakna det.
 */

export type EloTrack = "verbal" | "math";

export interface EloHistoryRow {
  match_type: string;
  elo_after: number;
  elo_change: number;
  created_at: string;
}

export interface EloSeriesPoint {
  ts: number;
  /** Senast kända ELO i respektive del vid den här tidpunkten. */
  verbal: number | null;
  math: number | null;
  /** Vilken del som faktiskt ändrades här, och med hur mycket. */
  changed: EloTrack | null;
  delta: number | null;
}

export interface EloSeries {
  points: EloSeriesPoint[];
  /** Antal riktiga datapunkter per del — driver "för lite data"-texten. */
  counts: Record<EloTrack, number>;
  /** Första och sista värdet per del, för sammanfattningen ovanför grafen. */
  span: Record<EloTrack, { first: number; last: number } | null>;
}

function isTrack(v: string): v is EloTrack {
  return v === "verbal" || v === "math";
}

/**
 * Bygger serien ur historikrader (valfri ordning, båda delarna blandade).
 *
 * Startvärdet före första matchen ritas inte: en spelare med en enda match har
 * en punkt, inte två, och en påhittad 1000-punkt före den hade sett ut som ett
 * mätvärde.
 */
export function buildEloSeries(rows: EloHistoryRow[]): EloSeries {
  const sorted = rows
    .filter((r) => isTrack(r.match_type) && Number.isFinite(r.elo_after))
    .map((r) => ({ ...r, ts: new Date(r.created_at).getTime() }))
    .filter((r) => Number.isFinite(r.ts))
    .sort((a, b) => a.ts - b.ts);

  const points: EloSeriesPoint[] = [];
  const counts: Record<EloTrack, number> = { verbal: 0, math: 0 };
  const span: Record<EloTrack, { first: number; last: number } | null> = {
    verbal: null,
    math: null,
  };

  let verbal: number | null = null;
  let math: number | null = null;

  for (const r of sorted) {
    const track = r.match_type as EloTrack;
    if (track === "verbal") verbal = r.elo_after;
    else math = r.elo_after;

    counts[track] += 1;
    const current = span[track];
    // `elo_before` är värdet FÖRE den första matchen i urvalet — det är det
    // som gör "+42 sedan start" till ett sant påstående och inte till noll.
    if (!current) span[track] = { first: r.elo_after - r.elo_change, last: r.elo_after };
    else current.last = r.elo_after;

    // Två matcher i samma sekund (går att åstadkomma) ska inte ge två punkter
    // på exakt samma x — den senare vinner.
    const last = points[points.length - 1];
    if (last && last.ts === r.ts) {
      last.verbal = verbal;
      last.math = math;
      last.changed = track;
      last.delta = r.elo_change;
      continue;
    }

    points.push({ ts: r.ts, verbal, math, changed: track, delta: r.elo_change });
  }

  return { points, counts, span };
}

/**
 * Vilken upplösning ska tidsaxeln ha?
 *
 * Etiketterna var alltid `{month:"short", day:"numeric"}`, alltså ett datum.
 * Spelar man tre matcher samma kväll — vilket är det normala — får axeln fyra
 * identiska etiketter ("21 aug. 21 aug. 21 aug. 21 aug.") och säger ingenting
 * om när något hände. Kurvan såg trasig ut fast datan var riktig.
 *
 * Upplösningen följer därför seriens spann:
 *  - inom ett och ett halvt dygn → klockslag ("14:32")
 *  - inom knappt ett år          → datum ("21 aug.")
 *  - längre                      → månad och år ("aug. 2026")
 */
export type EloTickUnit = "time" | "date" | "month";

/** Millisekunder i ett dygn. */
const DYGN = 24 * 60 * 60 * 1000;

export function eloTickUnit(spanMs: number): EloTickUnit {
  if (!Number.isFinite(spanMs) || spanMs < 0) return "date";
  if (spanMs <= 1.5 * DYGN) return "time";
  if (spanMs <= 330 * DYGN) return "date";
  return "month";
}

/** Seriens spann i millisekunder. 0 för tom serie eller en enda punkt. */
export function eloSeriesSpan(points: Pick<EloSeriesPoint, "ts">[]): number {
  if (points.length < 2) return 0;
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    if (p.ts < min) min = p.ts;
    if (p.ts > max) max = p.ts;
  }
  return Number.isFinite(min) && Number.isFinite(max) ? max - min : 0;
}
