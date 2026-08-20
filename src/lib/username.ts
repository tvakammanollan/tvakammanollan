// Vad som räknas som ett konto utan valt namn. Definitionen ligger på ett
// ställe därför att både topplistans serverfunktioner, UI:t som renderar
// namnen och routingen till onboarding hänger på den — glider de isär börjar
// konton läcka in på listan, vilket de gjorde 2026-08-18.

import { isGeneratedGuestName } from "./guest-name";

/**
 * Har kontot ett namn det aldrig valt?
 *
 * Två sådana scheman finns. `handle_new_user()` faller tillbaka på `user_` +
 * åtta tecken av UUID:t, och sedan 2026-08-18 sätter `useGuestPlay` i stället
 * `Gäst ekorre` i metadatan redan vid `signInAnonymously` — se `guest-name.ts`,
 * som äger ordlistan och känner igen båda.
 *
 * Regexen här är avsiktligt vidare än triggern (sex tecken eller fler,
 * versaler tillåtna): topplistan både filtrerar och renderar på den här
 * funktionen, så allt som *visas* som "Anonym" måste också *räknas* som
 * anonymt. Priset är att ett självvalt `user_deadbeef` också döljs — det
 * visas ändå som "Anonym" i dag.
 *
 * Följd i routingen (`routes/index.tsx`): en gäst som skaffar riktigt konto
 * behåller sitt gästnamn i databasen och skickas nu till onboarding för att
 * välja ett eget — annars hade hen blivit osynlig på topplistan för alltid.
 */
export function isAutoUsername(username: string | null | undefined): boolean {
  if (!username) return false;
  const trimmed = username.trim();
  return /^user_[0-9a-f]{6,}/i.test(trimmed) || isGeneratedGuestName(trimmed);
}

/**
 * Får kontot ta plats på topplistan?
 *
 * Anonyma konton hålls utanför sedan 2026-08-17. Bakgrunden står i
 * `match-abuse.ts`: fyra gästkonton odlade ELO mot bottar och tog hela toppen
 * av den verbala listan. Kvoterna där stoppar odlingen, det här stoppar
 * skyltningen — ett gästkonto som spelat en botmatch ska inte rankas mot
 * spelare som byggt sin ELO över tid.
 */
export function isRankable(username: string | null | undefined): boolean {
  const name = (username ?? "").trim();
  return name.length > 0 && !isAutoUsername(name);
}

/**
 * Namnet i en rankad lista — topplistan och landningssidans utdrag.
 *
 * Medvetet en annan regel än `displayName` i guest-name.ts: där ska ett
 * namnlöst konto få ett läsbart namn, här ska det INTE se ut som en spelare.
 * Ett "Gäst ekorre" bland de rankade läses som någon som tagit sig dit;
 * "Anonym" gör det inte.
 *
 * Serverfunktionerna sållar redan bort de här raderna. Det här är samma regel
 * en gång till, för listor som filtrerar i redan hämtad data och som skydd om
 * en cachad payload från före filtret ligger kvar i react-query.
 */
export function rankedName(username: string | null | undefined): string {
  return isRankable(username) ? (username as string) : "Anonym";
}
