/**
 * Uppgiftstexten som den ska visas — och det som står framför den.
 *
 * 279 uppgifter (KVA, XYZ, NOG) bär prefixet `[utgången] ` i
 * `questions.question_text`. Det kommer ur importen av gamla prov: `utgår` i
 * UHR:s facit betyder att uppgiften strukits i efterhand, alltså att rätt svar
 * står kvar men att poängen inte räknades. Markören är alltså riktig
 * information — men den renderades rakt av, så uppgiften inleddes med en
 * hakparentes mitt i frågan.
 *
 * Den skiljs därför ut här, i visningslagret, av samma skäl som
 * ordförklaringarnas förkortningar skrivs ut vid rendering: att rätta 279
 * rader kräver en migration mot produktion för ren presentationsdata, och
 * texten ska fortsätta gå att läsa rakt av för den som slår upp raden i
 * databasen eller via MCP-verktyget.
 *
 * Markören kastas inte bort utan visas som en bricka. En struken uppgift är
 * ofta struken för att den var tvetydig, och det är precis den förklaring den
 * som fastnar på den behöver.
 */

const WITHDRAWN = /^\s*\[utgången\]\s*/i;

export interface QuestionText {
  /** Texten utan markörer, redo att renderas. */
  text: string;
  /** Uppgiften ströks ur provet i efterhand — rätt svar gäller ändå. */
  withdrawn: boolean;
}

export function parseQuestionText(raw: string | null | undefined): QuestionText {
  const text = raw ?? "";
  if (!WITHDRAWN.test(text)) return { text, withdrawn: false };
  return { text: text.replace(WITHDRAWN, ""), withdrawn: true };
}

/** Bara texten, för de ställen som inte har plats för en bricka. */
export function questionText(raw: string | null | undefined): string {
  return parseQuestionText(raw).text;
}
