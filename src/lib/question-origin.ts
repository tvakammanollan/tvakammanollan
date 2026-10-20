/**
 * Var en uppgift kommer ifrån, i den form UI:t skriver ut den.
 *
 * Tvåkommanollans egna MEK-uppgifter (`scripts/mek-gen/`, importerade av
 * `scripts/import-mek-generated.ts`) bär taggen `tkn-genererad` och en
 * källrad i `source` (se `SOURCE_PATTERN`). Etiketten
 * ska synas där uppgiften visas, så att ingen tar vår uppgift för en ur ett
 * riktigt högskoleprov, och källraden krävs av Wikipedias licens.
 *
 * Alla andra rader ger `null`: arkivuppgifterna har sin egen märkning, och de
 * skrapade radernas `source` är en intern URL som inte ska ut i UI:t.
 */

export const GENERATED_TAG = "tkn-genererad";

/**
 * Urvalet i `/train`: arkivets MEK-uppgifter, Tvåkommanollans egna, eller
 * båda. Gäller bara MEK; andra delprov har bara en källa.
 */
export const MEK_ORIGINS = ["all", "archive", "tkn"] as const;
export type MekOrigin = (typeof MEK_ORIGINS)[number];

export interface QuestionOrigin {
  label: string;
  publisher: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  license: string | null;
}

/**
 * `Utgivare: Titel (licens) url`, där licensen bara står för Wikipedia
 * (`Wikipedia: Gikt (CC BY-SA 4.0) https://sv.wikipedia.org/wiki/Gikt`,
 * `1177: Influensa https://www.1177.se/...`). Utgivaren får inte innehålla
 * kolon; titeln får innehålla parenteser.
 */
const SOURCE_PATTERN = /^([^:]+): (.+?)(?: \(([^()]*(?:CC|licens)[^()]*)\))? (https?:\/\/\S+)$/;

export function questionOrigin(
  tags: readonly string[] | null | undefined,
  source: string | null | undefined,
): QuestionOrigin | null {
  if (!tags?.includes(GENERATED_TAG)) return null;
  const m = source ? SOURCE_PATTERN.exec(source.trim()) : null;
  return {
    label: "Tvåkommanollans egen uppgift",
    publisher: m ? m[1].trim() : null,
    sourceTitle: m ? m[2] : null,
    sourceUrl: m ? m[4] : null,
    license: m ? (m[3] ?? null) : null,
  };
}
