/**
 * Urvalet av demofrågor till landningssidans hjälte.
 *
 * Ren logik, skild från serverfunktionen i `landing.functions.ts`, av två
 * skäl: den går att testa utan databas, och urvalskriterierna är
 * produktbeslut som förtjänar att kunna läsas och tvistas om för sig.
 */

export interface DemoQuestion {
  ord: string;
  alternativ: { id: string; text: string }[];
  ratt: string;
}

/** En rad som den kommer ur `questions`. */
export interface RaOrdrad {
  question_text: string;
  options: unknown;
  correct_answer: string;
}

/** Längsta ord som får plats i hjältens rubrikstorlek utan att brytas. */
export const MAX_ORDLANGD = 24;
/** Längsta alternativtext som ryms på en rad i kortet. */
export const MAX_ALTERNATIVLANGD = 34;
/** Antalet alternativ en ORD-uppgift alltid har. */
export const ANTAL_ALTERNATIV = 5;

/**
 * Vilka rader som duger att visa upp.
 *
 * Affixen är det viktigaste filtret. Beståndet innehåller uppslag som
 * "karne-", "herb-" och "mort-", som är korrekta ORD-uppgifter men säger
 * ingenting om produkten för någon som ser sajten för första gången.
 */
export function dugligaDemofragor(rader: RaOrdrad[]): DemoQuestion[] {
  return rader
    .filter((r) => {
      const alt = r.options as { id: string; text: string }[] | null;
      const ord = r.question_text;
      if (typeof ord !== "string" || ord.length === 0 || ord.length > MAX_ORDLANGD) return false;
      if (/^-|-$/.test(ord)) return false;
      if (!Array.isArray(alt) || alt.length !== ANTAL_ALTERNATIV) return false;
      return alt.every((a) => typeof a?.text === "string" && a.text.length <= MAX_ALTERNATIVLANGD);
    })
    .map((r) => ({
      ord: r.question_text,
      alternativ: r.options as { id: string; text: string }[],
      ratt: r.correct_answer,
    }));
}

/**
 * Plockar `antal` frågor ur de dugliga, deterministiskt för ett givet frö.
 *
 * Determinismen är ett krav och inte en detalj: servern renderar och
 * webbläsaren hydrerar, och får de olika frågor blir det en hydreringsmiss
 * i sidans mest synliga element.
 *
 * Urvalet roterar startpunkten med fröet och tar löpande därifrån. Första
 * versionen räknade i stället `(frö * 7 + i * 53) % n`, vilket ger FYRA
 * IDENTISKA frågor när n är 53 (då är `i * 53 % 53` noll för varje i).
 * Rotationen kan inte råka ut för det: index är löpande, alltså skilda så
 * länge det finns minst så många rader.
 */
export function valjDemofragor(dugliga: DemoQuestion[], fro: number, antal = 4): DemoQuestion[] {
  const n = dugliga.length;
  if (n === 0) return [];
  const start = ((fro % n) + n) % n;
  return Array.from({ length: Math.min(antal, n) }, (_, i) => dugliga[(start + i) % n]);
}
