/**
 * Jämförelse som tar lika lång tid oavsett var två strängar skiljer sig.
 *
 * `a === b` avbryter vid första olika tecknet, så svarstiden berättar hur långt
 * en gissning kom. Det spelar ingen roll för det mesta, men för en delad
 * hemlighet i en URL är det skillnaden mellan att behöva gissa hela strängen
 * och att kunna gissa den ett tecken i taget.
 *
 * Strängarna hashas först: då är de alltid lika långa, och jämförelsen kan inte
 * läcka längden heller. `crypto.subtle` finns både i Workers och i Node 18+.
 */

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

export async function timingSafeEqualString(a: string, b: string): Promise<boolean> {
  // Tom hemlighet får aldrig matcha — annars öppnar en osatt variabel dörren.
  if (!a || !b) return false;
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i += 1) diff |= ha[i] ^ hb[i];
  return diff === 0;
}
