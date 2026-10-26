/**
 * Provtopplistan: vem som skrivit flest gamla prov.
 *
 * **Listan rankar på antal skrivna provpass**, precis som ord- och MEK-listorna
 * rankar på antal rätta. Niklas beslut 2026-10-26, efter att ha sett en första
 * version som rankade på träffsäkerhet vägd mot underlaget: listan ska vara
 * lätt att förstå på en halv sekund, och "flest skrivna pass" är ett tal man
 * kan peka på utan att någon behöver fråga hur det räknats fram.
 *
 * Träffsäkerheten står kvar som egen kolumn. Den rankar inte, men den finns
 * där, så att listan säger både hur mycket någon nött och hur det gick. Vill
 * man någon gång tillbaka till en rankning som väger in den: använd
 * `wilsonInterval` i `question-votes.ts`, som är samma mått sajten redan
 * använder för att avgöra om en uppgift är ogillad med säkerhet.
 *
 * **Övningspass räknas med.** Svaret låses när det läggs, så träffsäkerheten
 * är riktig; det som saknas är tidspressen. Samma beslut som på resultatsidan
 * för gamla prov, och av samma skäl: utan övningsläget hade listan tappat två
 * tredjedelar av allt som skrivits. Men de märks ut, så listan inte påstår att
 * allt skrivits med klockan igång.
 */

/** En rad ur `prov_attempts`, så mycket av den som listan behöver. */
export interface ProvAttemptRow {
  user_id: string;
  term: string;
  score: number;
  total: number;
  mode: "prov" | "ova";
}

/** Allt en spelare skrivit, summerat. */
export interface ProvTotals {
  user_id: string;
  /** Antal skrivna provpass. Det är det här listan rankar på. */
  passes: number;
  /** Antal provtillfällen minst ett pass skrivits ur. */
  exams: number;
  /** Hur många av passen som skrevs i provläge, alltså med klockan igång. */
  timed: number;
  correct: number;
  questions: number;
}

export interface ProvScoreRow extends ProvTotals {
  /** Platsen i listan, 1 och uppåt. */
  rank: number;
  /** Rå träffsäkerhet i hela procent. Visas, men rankar inte. */
  accuracy: number;
}

export function sumProvAttempts(rows: ProvAttemptRow[]): ProvTotals[] {
  const byUser = new Map<string, ProvTotals>();
  const terms = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!Number.isFinite(r.score) || !Number.isFinite(r.total) || r.total <= 0) continue;
    let t = byUser.get(r.user_id);
    if (!t) {
      t = { user_id: r.user_id, passes: 0, exams: 0, timed: 0, correct: 0, questions: 0 };
      byUser.set(r.user_id, t);
      terms.set(r.user_id, new Set<string>());
    }
    t.passes += 1;
    if (r.mode === "prov") t.timed += 1;
    // Rätt kan aldrig vara fler än uppgifterna. Servern räknar om poängen ur
    // svaren, men tabellen är äldre än den här listan och raden kan komma
    // från en tid då något annat skrev den.
    t.correct += Math.max(0, Math.min(r.score, r.total));
    t.questions += r.total;
    terms.get(r.user_id)?.add(r.term);
  }
  for (const t of byUser.values()) t.exams = terms.get(t.user_id)?.size ?? 0;
  return [...byUser.values()];
}

/**
 * Rangordnar och numrerar listan.
 *
 * Ordningen: antal pass, sedan antal rätta, sedan id. De två sista är inte
 * smak utan krav. Antal rätta skiljer två som skrivit lika många pass, och id
 * är sista utvägen: utan den byter två spelare med samma siffror plats mellan
 * två laddningar av samma sida.
 */
export function rankProvTotals(totals: ProvTotals[]): ProvScoreRow[] {
  return totals
    .map((t) => ({
      ...t,
      rank: 0,
      accuracy: t.questions > 0 ? Math.round((t.correct * 100) / t.questions) : 0,
    }))
    .sort(
      (a, b) =>
        b.passes - a.passes ||
        b.correct - a.correct ||
        (a.user_id < b.user_id ? -1 : a.user_id > b.user_id ? 1 : 0),
    )
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
