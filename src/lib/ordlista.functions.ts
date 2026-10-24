/**
 * Ordlistans serverfunktioner.
 *
 * Route-loaders körs både under SSR och vid klientnavigering, så uppslagningen
 * måste gå genom `createServerFn` — annars hade `supabaseAdmin` (service role)
 * hamnat i klientbundlen.
 *
 * Allt här är publik läsning utan inloggning: sidorna ska kunna indexeras, och
 * en utloggad besökare ska se exakt samma sida som Googlebot gör. Därför
 * IP-baserad hamringsbroms i stället för auth.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { isOrdLetter } from "./ord-slug";
import {
  fetchOrdEntry,
  fetchOrdLetter,
  fetchOrdlistaOverview,
  getOrdIndex,
} from "./ordlista.server";

export const getOrdlistaEntry = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data }) => {
    assertRateLimit(ipKey("ordlista"), limits.publicRead);
    return fetchOrdEntry(data.slug);
  });

export const getOrdlistaLetter = createServerFn({ method: "GET" })
  .inputValidator((data: { letter: string }) =>
    z.object({ letter: z.string().min(1).max(16) }).parse(data),
  )
  .handler(async ({ data }) => {
    assertRateLimit(ipKey("ordlista"), limits.publicRead);
    // Grinden här och inte i `fetchOrdLetter`: registret är en Map med fasta
    // nycklar, så en okänd bokstav ger ändå null — men att avvisa tidigt
    // slipper bygga registret för en adress som ändå ska 404:a.
    if (!isOrdLetter(data.letter)) return null;
    return fetchOrdLetter(data.letter);
  });

export const getOrdlistaOverview = createServerFn({ method: "GET" }).handler(async () => {
  assertRateLimit(ipKey("ordlista"), limits.publicRead);
  return fetchOrdlistaOverview();
});

/**
 * Vilka av de givna sluggarna som har en egen sida i ordlistan. Används av
 * sidorna som listar ett provs ORD-ord: arkivets ord och ordlistans bestånd är
 * inte samma mängd, och en länk till en slug som saknas är en 404 i
 * sökmotorns ögon. Ett fel ger tom lista, alltså inga länkar, aldrig en
 * trasig sida.
 */
export const getOrdlistaKnownSlugs = createServerFn({ method: "GET" })
  .inputValidator((data: { slugs: string[] }) =>
    z.object({ slugs: z.array(z.string().min(1).max(120)).max(200) }).parse(data),
  )
  .handler(async ({ data }) => {
    assertRateLimit(ipKey("ordlista"), limits.publicRead);
    try {
      const index = await getOrdIndex();
      return data.slugs.filter((s) => index.bySlug.has(s));
    } catch {
      return [];
    }
  });
