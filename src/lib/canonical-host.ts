/*
 * Domänflytten hpkampen.se → tvakommanollan.se (2026-08-18).
 *
 * Sajten svarar på fyra värdnamn men får bara indexeras på ett, annars
 * konkurrerar kopiorna med varandra i sökresultatet. Allt utom apex på den nya
 * domänen 301:as hit.
 *
 * Två saker är medvetna och lätta att råka bygga bort:
 *
 * 1. `/api/` undantas. Stripe följer inte 3xx — en webhook som pekar på ett
 *    gammalt värdnamn skulle läsa 301 som ett misslyckande och sluta bokföra
 *    köp, tyst, medan kassan fortsätter se ut att fungera. Undantaget gör att
 *    en endpoint som glömts kvar hos en tredje part fortsätter fungera i
 *    stället för att gå sönder vid utrullningen.
 * 2. Det är 301 och inte 308. Googles adressändringsverktyg vill ha just 301
 *    för att flytta rankningen mellan domänerna.
 *
 * Omdirigeringen ligger i koden och inte som en Redirect Rule i Cloudflare
 * därför att undantaget ovan behöver kunna testas — se canonical-host.test.ts.
 */

export const CANONICAL_HOST = "tvakommanollan.se";

/** Värdnamn som pekar på sajten men inte ska indexeras. */
const LEGACY_HOSTS = new Set(["hpkampen.se", "www.hpkampen.se", `www.${CANONICAL_HOST}`]);

/**
 * Målet för en 301, eller null när begäran redan ligger rätt.
 *
 * Tar en färdig URL så att både sökväg och frågesträng följer med — en flytt
 * som tappar `?sida=3` skickar varje forumsida till sida 1.
 */
export function canonicalRedirect(url: URL): string | null {
  if (!LEGACY_HOSTS.has(url.hostname)) return null;
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return null;
  return `https://${CANONICAL_HOST}${url.pathname}${url.search}`;
}

/**
 * Är flytten påslagen?
 *
 * 301:an ovan pekar på ett värdnamn som måste ha en Worker-route innan den
 * aktiveras. Saknas routen svarar Cloudflare 522 — och eftersom omdirigeringen
 * gäller allt utom `/api/` skulle hela sajten slockna i samma sekund koden
 * rullas ut, medan den gamla domänen fortfarande fungerade utmärkt sekunden
 * innan. Det var läget när det här skrevs: `tvakommanollan.se` var proxad i
 * Cloudflare men ingen route besvarade den.
 *
 * Grinden gör de två stegen oberoende av varandra: koden kan pushas när som
 * helst, och flytten slås på med `CANONICAL_REDIRECT=on` i `wrangler.jsonc`
 * först när målet bevisligen svarar 200. Ta inte bort den till förmån för ett
 * "det är ju redan fixat" — den kostar en env-variabel och skyddar mot ett
 * totalstopp.
 */
export function canonicalRedirectEnabled(): boolean {
  return process.env.CANONICAL_REDIRECT?.trim().toLowerCase() === "on";
}

/** Värdnamn där sajten serveras skarpt. Allt annat (localhost, förhandsvisningar) lämnas i fred. */
const OWN_HOSTS = new Set([CANONICAL_HOST, `www.${CANONICAL_HOST}`]);

/**
 * Den enda adress en sida får svara 200 på, eller null när begäran redan
 * ligger där (2026-11-14).
 *
 * Fram till dess svarade samma sida 200 på fyra adresser: med och utan www,
 * över http och https. Canonical-taggen pekade rätt, men Google måste då
 * hämta varje kopia för att läsa taggen, och varje kopia hamnar i Search
 * Console som "Alternativ sida med korrekt kanonisk tagg" eller "Dubblett".
 * Avslutande snedstreck gav dessutom 307 (tillfällig) från routern, vilket
 * Google läser som att adressen med snedstreck ska behållas.
 *
 * - www på den egna domänen flyttas ALLTID, utan grinden: målet är samma
 *   Worker på samma zon, så det finns inget läge där www svarar men apex
 *   inte gör det. Grinden gäller bara den gamla domänen.
 * - http flyttas bara när `x-forwarded-proto` uttryckligen säger http.
 *   nitro ligger mellan Cloudflare och den här koden; skulle URL:en någon
 *   gång byggas om med fel schema får det inte bli en evig omdirigering.
 * - `/api/` rörs aldrig, av samma skäl som i canonicalRedirect().
 */
export function canonicalLocation(
  url: URL,
  opts: { legacyEnabled: boolean; forwardedProto?: string | null },
): string | null {
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return null;

  const legacy = opts.legacyEnabled ? canonicalRedirect(url) : null;
  const own = OWN_HOSTS.has(url.hostname);
  if (!legacy && !own) return null;

  const path = url.pathname.replace(/\/+$/, "") || "/";
  const insecure = url.protocol === "http:" && opts.forwardedProto?.trim().toLowerCase() === "http";
  const wrongHost = legacy !== null || url.hostname !== CANONICAL_HOST;
  if (!wrongHost && !insecure && path === url.pathname) return null;

  return `https://${CANONICAL_HOST}${path}${url.search}`;
}
