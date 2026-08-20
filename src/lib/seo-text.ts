/**
 * Titlar och beskrivningar som ryms i ett sökresultat.
 *
 * Google kapar titeln runt 60 tecken och beskrivningen runt 155 — inte exakt,
 * det mäts i pixlar, men tecken är den approximation som går att resonera om.
 * Det som kapas är slutet, och slutet är där vi lagt "med facit" och
 * varumärket. En titel som klipps mitt i ett ord ser trasig ut i träfflistan,
 * och det är det enda en sökande ser av sidan innan hen väljer.
 *
 * Modulen är ren och testad därför att den styr vad 189 sidor visar i Google,
 * och felet den rättar var precis en avhuggen sträng: `intro.slice(0, 150)`
 * gav "Öva på riktiga DTK-uppg Gratis och utan inloggning." på alla åtta
 * övningssidorna.
 */

/** Så långt en titel får bli innan Google kapar den. */
export const TITLE_MAX = 60;

/** Så lång en beskrivning får bli innan Google kapar den. */
export const DESCRIPTION_MAX = 155;

/**
 * Kapar vid närmaste ordgräns i stället för mitt i ett ord, med hällipsis.
 *
 * Ryms texten redan lämnas den orörd — utan ellips, för en text som inte är
 * avkortad ska inte se avkortad ut.
 */
export function trimToWord(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  // Ellipsen tar plats den också, annars är resultatet ett tecken för långt.
  const cut = t.slice(0, Math.max(0, max - 1));
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "") + "…";
}

/**
 * Så många hela meningar som ryms.
 *
 * Bättre än `trimToWord` för en beskrivning: en avslutad mening läser som
 * text någon skrivit, en avkortad som ett fel. Ryms inte ens den första
 * meningen faller den tillbaka på ordgränsen.
 */
export function sentencesWithin(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  // Delar efter .!? följt av mellanslag. Punkten följer med sin mening.
  const sentences = t.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = "";
  for (const s of sentences) {
    const next = (out + s).trimEnd();
    if (next.length > max) break;
    out = next + " ";
  }
  const trimmed = out.trim();
  return trimmed || trimToWord(t, max);
}

/**
 * Bygger en beskrivning av en brödtext plus en fast svans som alltid ska med.
 *
 * Svansen ("Gratis och utan inloggning.") är ett säljargument och får aldrig
 * offras — det är brödtexten som ska krympa runt den.
 */
export function describeWithin(body: string, tail: string, max = DESCRIPTION_MAX): string {
  const suffix = tail.trim();
  const room = max - suffix.length - 1;
  if (room <= 0) return trimToWord(suffix, max);
  return `${sentencesWithin(body, room)} ${suffix}`.trim();
}

/**
 * Titel av en obligatorisk del plus svansar som får falla bort i tur och
 * ordning när utrymmet tar slut.
 *
 * Skriv svansarna i stigande umbärlighet: `fitTitle(kärnan, "med facit",
 * "· Tvåkommanollan")` behåller "med facit" och offrar varumärket när båda
 * inte får plats. Varumärket är det som tål att förloras — Google skriver
 * ofta dit sajtnamnet ändå, härlett ur og:site_name och WebSite-datan.
 */
export function fitTitle(head: string, ...tails: string[]): string {
  let title = head.trim();
  for (const tail of tails) {
    const candidate = `${title} ${tail.trim()}`.trim();
    if (candidate.length <= TITLE_MAX) title = candidate;
  }
  return title;
}
