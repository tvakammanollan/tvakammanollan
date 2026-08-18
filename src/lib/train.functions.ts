import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";

/**
 * Frågor till träningsläget.
 *
 * Den här funktionen finns av ett säkerhetsskäl, inte ett arkitektoniskt.
 * Tidigare hämtade `/train` sina frågor med webbläsarklienten och läste
 * `correct_answer` rakt ur tabellen. Rättigheten som krävdes för det gällde
 * varje inloggad klient — och anonym inloggning är påslagen — så vem som helst
 * kunde slå upp facit för godtyckliga fråge-id, inklusive de tio som just då
 * låg i någon annans pågående match.
 *
 * Poängen med att flytta hämtningen hit är därför INTE att svaret passerar en
 * server (det gör det ändå, och träningsläget måste kunna visa rätt svar när
 * spelaren svarat). Poängen är att **anroparen inte får peka ut vilka frågor
 * den vill ha**. Man ber om "tjugo ORD-frågor", inte om "de här id:na" — och
 * då går luckan inte längre att rikta mot en pågående match.
 *
 * En rättnings-endpoint hade inte räckt: en sådan svarar ju med facit, och
 * då kan vem som helst skicka ett godtyckligt svar för matchens fråge-id och
 * få rätt svar tillbaka. Det som skyddar är urvalet, inte rättningen.
 *
 * Kvar som teoretisk risk: att skörda hela beståndet genom att be om omgång
 * efter omgång. Det bromsas av kvoten nedan och är oanvändbart mitt i en
 * match, vilket är den attack som faktiskt kostade ELO.
 */

const CATEGORIES = ["ORD", "MEK", "LAS", "ELF", "XYZ", "KVA", "NOG", "DTK"] as const;

/** Kolumnerna träningsläget renderar. En enda literal — annars tappar supabase-js radtypen. */
const COLS =
  "id, category, question_text, options, passage_id, passage_text, image_url, correct_answer, explanation, difficulty, cleaned_question_text, cleaned_options, clean_status";

export const fetchTrainingBatch = createServerFn({ method: "GET" })
  .inputValidator((data: { categories: string[]; difficulty?: number | null; count?: number }) =>
    z
      .object({
        categories: z.array(z.enum(CATEGORIES)).min(1).max(8),
        difficulty: z.number().int().min(1).max(3).nullable().optional().default(null),
        count: z.number().int().min(1).max(60).optional().default(20),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    // Tung query och publik — hamringsskydd per IP, samma tak som ordbatchen.
    assertRateLimit(ipKey("trainbatch"), limits.wordBatch);

    let query = supabaseAdmin.from("questions").select(COLS).in("category", data.categories);
    if (data.difficulty !== null) query = query.eq("difficulty", data.difficulty);

    const { data: rows, error } = await query.limit(300);
    if (error) {
      console.error("[train] batch fetch failed:", error.message);
      throw new Error("Något gick fel. Försök igen om en stund.");
    }

    // Blandningen sker här och inte i klienten: urvalet är hela skyddet, och
    // ett urval som klienten gör själv är inget urval.
    const pool = [...(rows ?? [])].sort(() => Math.random() - 0.5).slice(0, data.count);
    return { questions: pool };
  });
