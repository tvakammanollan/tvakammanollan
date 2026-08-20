// Gästnamn.
//
// Utan detta heter varje gäst `user_c8a56e2c`: DB-triggern
// `handle_new_user` faller tillbaka på `'user_' || left(id, 8)` när
// metadatan saknar ett användarnamn. Det syns i navbaren, i matchen och
// på resultatskärmen, och ser ut som ett internt id snarare än en
// person.
//
// Namnet sätts BARA vid rendering, aldrig i databasen. Det låg en tid i
// metadatan vid `signInAnonymously()` så att triggern skrev in det — men
// `users.username` är UNIQUE och listan är 20 ord lång, så när det
// tjugoförsta kontot råkade lotta ett upptaget namn felade triggern och
// auth svarade 500 "Database error creating anonymous user". Gästläget
// dog då för en växande andel av besökarna (15 av 20 namn var tagna när
// det upptäcktes, alltså 75 % av försöken). Låt triggern sätta sitt
// `user_ || left(id, 8)` — unikt per konstruktion — och gör om det här.
//
// Orden är hämtade ur lunden: samma bildvärld som resten av sajten.

const ORD = [
  "ekollon",
  "lönnlöv",
  "kotte",
  "grankvist",
  "björklöv",
  "mossa",
  "ljung",
  "enbär",
  "hassel",
  "rönnbär",
  "smultron",
  "blåbär",
  "lingon",
  "kantarell",
  "ekorre",
  "nötskrika",
  "domherre",
  "talgoxe",
  "lärka",
  "trast",
];

/**
 * Deterministiskt gästnamn, t.ex. "Gäst ekorre". Samma frö ger alltid
 * samma namn, så en gäst som laddar om sidan heter likadant.
 *
 * Kollisioner är acceptabla HÄR och bara här: namnet renderas, det lagras
 * aldrig. Skriv det aldrig till `users.username` — kolumnen är UNIQUE och
 * tjugo ord tar slut.
 */
export function guestName(seed?: string): string {
  const s = seed ?? Math.random().toString(36).slice(2);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `Gäst ${ORD[Math.abs(h) % ORD.length]}`;
}

/**
 * `user_1a2b3c4d` från triggern — namnet användaren aldrig valde.
 *
 * Åtta hextecken *eller fler*: triggern skriver normalt åtta, men faller
 * tillbaka på hela UUID:t när det korta namnet redan är taget (se
 * `20260820150000_registrering_overlever_upptaget_namn.sql`). Låstes det vid
 * exakt åtta skulle just de kontona visa sitt id i UI:t och dessutom slinka
 * in på topplistan.
 */
export function isAutoGuestName(name: string | null | undefined): boolean {
  return !!name && /^user_[0-9a-f]{8,}$/i.test(name);
}

/**
 * Är namnet genererat åt kontot i stället för valt av användaren — oavsett
 * vilket av de två schemana det kom ur?
 *
 * Två format finns i `users.username`: `user_1a2b3c4d` från triggerns
 * fallback — det enda som skrivs i dag — och `Gäst ekorre` på de rader som
 * hann skapas 2026-08-18–20, då namnet gick med i metadatan. Båda betyder
 * samma sak: kontot har aldrig valt ett namn. De måste kännas igen
 * på ett enda ställe, annars glider topplistans filter isär från
 * namnsättningen — vilket hände: filtret kände bara igen det gamla formatet,
 * och nya gäster började rankas fyra minuter efter att det gick live.
 *
 * Matchningen kräver ett ord ur ORD och är skiftlägesokänslig, så någon som
 * väljer "Gäst i huset" berörs inte.
 */
export function isGeneratedGuestName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (isAutoGuestName(trimmed)) return true;
  const match = /^gäst\s+(\S+)$/i.exec(trimmed);
  return !!match && ORD.includes(match[1].toLowerCase());
}

/**
 * Namnet som ska visas. Gäster som skapades innan namnsättningen fanns
 * ligger kvar som `user_xxxx` i databasen; de får ett läsbart namn här i
 * visningslagret i stället för en migration över befintliga rader.
 *
 * **Inget användarnamn renderas rått i UI:t — allt går genom den här.**
 * Annars driver ytorna isär: navbaren visade "Gäst ekorre" på avataren och
 * `user_5e19eb20` i texten bredvid, på samma konto och samma rad.
 *
 * Fröet är alltid användarnamnet, aldrig id:t, trots att `id` finns kvar i
 * signaturen. Anledningen är att `id` inte är tillgängligt överallt — forumet
 * och vänlistan har bara namnet — och två olika frön ger samma konto två
 * olika gästnamn beroende på var man tittar. `user_1a2b3c4d` bär ändå med sig
 * kontots åtta första tecken, så det duger gott som frö. `id` används bara när
 * namnet saknas helt.
 */
export function displayName(username: string | null | undefined, id?: string): string {
  const name = (username ?? "").trim();
  if (!name) return id ? guestName(id) : "Gäst";
  return isAutoGuestName(name) ? guestName(name) : name;
}
