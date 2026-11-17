/**
 * Vilka gamla prov som går att skriva utan köp.
 *
 * De tio senaste provtillfällena är gratis, övriga ingår i Premium (samma köp
 * som ordlistan och MEK, `ord-paywall.ts`). Regeln räknas ur provlistan, som
 * är sorterad nyast först: läggs ett nytt prov till blir det gratis och det
 * äldsta av de tidigare gratisproven låses, utan att något ändras här.
 *
 * Låset sitter i provvyn (`ProvRunner`), inte i datan. Provpassen är statiska
 * filer som följer med bygget, och sidorna serverrenderas utan att servern vet
 * vem som frågar, så det här är en spärr i gränssnittet. Facittabellen på
 * provtillfällets sida (bara bokstäver) är öppen för alla prov.
 *
 * Antalet skrivs aldrig ut i text besökare läser (Niklas beslut 2026-11-17):
 * copyn säger bara att de senaste proven är gratis.
 */
import type { ExamSummary } from "@/types/gamla-prov";

/** Så många av de senaste proven är gratis. */
export const FREE_EXAM_COUNT = 10;

/** `exams` är provlistan, nyast först (som `allExams()` ger den). */
export function freeExams<T extends Pick<ExamSummary, "term">>(exams: readonly T[]): T[] {
  return exams.slice(0, FREE_EXAM_COUNT);
}

export function isFreeExam(term: string, exams: readonly Pick<ExamSummary, "term">[]): boolean {
  return freeExams(exams).some((e) => e.term === term);
}
