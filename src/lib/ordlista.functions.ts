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
import { fetchOrdEntry, fetchOrdLetter, fetchOrdlistaOverview } from "./ordlista.server";

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
