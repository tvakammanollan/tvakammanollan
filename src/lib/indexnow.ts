/**
 * IndexNow: säger till Bing (och Yandex, Seznam, Naver) att en adress är ny
 * eller ändrad, i stället för att vänta på att de hittar den själva. Bings
 * index är det ChatGPT:s och Copilots webbsök läser.
 *
 * Nyckeln är inte hemlig: den ligger publikt i `public/<nyckel>.txt`, och det
 * är den filen IndexNow hämtar för att bekräfta att vi äger domänen. Samma
 * nyckel står i `scripts/indexnow.mjs`; testet pinnar att filen finns.
 */
import { CANONICAL_HOST } from "./canonical-host";

export const INDEXNOW_KEY = "cf39542cb6ea930dc589d12fac3ab9d9";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** IndexNow tar högst 10 000 adresser per anrop, och bara från en värd. */
export function indexNowBody(urls: string[]) {
  const origin = `https://${CANONICAL_HOST}/`;
  return {
    host: CANONICAL_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${origin}${INDEXNOW_KEY}.txt`,
    urlList: [...new Set(urls)].filter((u) => u.startsWith(origin)).slice(0, 10000),
  };
}
