/*
 * Var PostHog nås — en definition, läst av både klienten och Workern.
 *
 * Klienten skickar händelserna dit (`api_host` i analytics.ts) och Workern
 * måste släppa igenom exakt samma värdnamn i CSP:n (`src/server.ts`). Stod
 * adressen på två ställen räckte det att ändra på det ena för att analysen
 * skulle dö tyst: webbläsaren blockerar anropet, ingenting kastas, ingenting
 * loggas, och siffrorna planar bara ut.
 *
 * Värdet kommer ur `VITE_PUBLIC_POSTHOG_HOST` i `.env`, som Vite bakar in i
 * BÅDA bundlarna vid bygget — även Workerns. Det är med flit: CSP:n får då per
 * konstruktion samma sträng som klienten ringer, och de kan inte glida isär.
 * `process.env` är bara en reserv för det fall variabeln saknas vid bygget
 * (då står den ändå i `wrangler.jsonc`); i ett normalt bygge optimeras den
 * grenen bort helt.
 */

/** PostHogs egen EU-ingång. Används när ingen egen proxy är konfigurerad. */
export const POSTHOG_DEFAULT_HOST = "https://eu.i.posthog.com";

/**
 * Skripten (session replay, web vitals, dead clicks) ligger på en egen värd.
 * Med en managed reverse proxy serveras de från proxyns värdnamn i stället,
 * men posten kostar ingenting och gör en halvvägs utrullning ofarlig.
 */
export const POSTHOG_ASSETS_HOST = "https://eu-assets.i.posthog.com";

function envHost(): string | undefined {
  const bakadIBundlen = import.meta.env?.VITE_PUBLIC_POSTHOG_HOST as string | undefined;
  if (bakadIBundlen) return bakadIBundlen;
  // `process` finns inte i webbläsaren; i Workern är det enda vägen till
  // wrangler.jsonc:s vars (nitro skickar inte vidare `env`-argumentet).
  if (typeof process !== "undefined") {
    return process.env?.VITE_PUBLIC_POSTHOG_HOST;
  }
  return undefined;
}

/**
 * Värdnamnet händelserna skickas till, utan avslutande snedstreck.
 *
 * Läses vid anrop och inte som en modulkonstant: i Workern hinner
 * `process.env` inte alltid vara ifylld när modulen laddas.
 */
export function posthogHost(): string {
  const raw = envHost()?.trim();
  return raw ? raw.replace(/\/+$/, "") : POSTHOG_DEFAULT_HOST;
}

/**
 * Värdnamnen CSP:n måste tillåta, uppdelade per direktiv.
 *
 * `script-src` behöver den värd som serverar tilläggsskripten (session replay,
 * web vitals, dead clicks); `connect-src` behöver den värd händelserna skickas
 * till. Med en managed reverse proxy är båda proxyns värdnamn — posthog-js
 * byter inte till `eu-assets` när `api_host` ligger utanför posthog.com.
 *
 * PostHogs egna värdar står kvar även när en proxy är konfigurerad. Det kostar
 * inget mot en ad-blockerare (den läser adressen i anropet, inte CSP-huvudet)
 * och gör att ordningen mellan "byt env-variabel" och "proxyn är
 * provisionerad" inte kan släcka analysen tyst.
 */
export function posthogCspOrigins(host: string = posthogHost()): {
  script: string[];
  connect: string[];
} {
  const egen = host !== POSTHOG_DEFAULT_HOST && host !== POSTHOG_ASSETS_HOST ? [host] : [];
  return {
    script: [...egen, POSTHOG_ASSETS_HOST],
    connect: [...egen, POSTHOG_DEFAULT_HOST, POSTHOG_ASSETS_HOST],
  };
}
