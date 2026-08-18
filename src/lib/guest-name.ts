// Gästnamn.
//
// Utan detta heter varje gäst `user_c8a56e2c`: DB-triggern
// `handle_new_user` faller tillbaka på `'user_' || left(id, 8)` när
// metadatan saknar ett användarnamn. Det syns i navbaren, i matchen och
// på resultatskärmen, och ser ut som ett internt id snarare än en
// person.
//
// Namnet sätts i metadatan REDAN vid inloggningen, så triggern plockar
// upp det. Det kräver alltså ingen migration och ingen extra skrivning
// mot users-tabellen.
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
 * Kollisioner är acceptabla: gästkonton hamnar inte på topplistan och
 * namnet är en artighet, inte en identitet.
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

/** `user_1a2b3c4d` från triggern — namnet användaren aldrig valde. */
export function isAutoGuestName(name: string | null | undefined): boolean {
  return !!name && /^user_[0-9a-f]{8}$/i.test(name);
}

/**
 * Är namnet genererat åt kontot i stället för valt av användaren — oavsett
 * vilket av de två schemana det kom ur?
 *
 * Två format finns i `users.username`: `user_1a2b3c4d` från triggerns
 * fallback, och `Gäst ekorre` som sätts i metadatan sedan 2026-08-18. Båda
 * betyder samma sak: kontot har aldrig valt ett namn. De måste kännas igen
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
 * Namnet som ska visas. Gaster som skapades innan namnsattningen fanns
 * ligger kvar som user_xxxx i databasen; de far ett vanligt namn har i
 * visningslagret i stallet for en migration over befintliga rader.
 */
export function displayName(username: string | null | undefined, id?: string): string {
  if (!username) return "Gäst";
  return isAutoGuestName(username) ? guestName(id ?? username) : username;
}
