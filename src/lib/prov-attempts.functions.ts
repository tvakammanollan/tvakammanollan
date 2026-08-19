/**
 * Skrivna provpass, sparade i databasen.
 *
 * Ett inlämnat provpass har hittills bara lämnat två spår, båda i besökarens
 * localStorage: hela försöket under `tkn:prov-progress:*` (som städas efter en
 * vecka) och summan under `tkn:prov-resultat:v1`. Gick man tillbaka till ett
 * prov man skrivit för två veckor sedan fanns alltså bara siffran kvar — ingen
 * genomgång, inget facit, ingen möjlighet att se vad man svarade på uppgift 23.
 *
 * Det här lagret är tillägget för den som är inloggad. localStorage står kvar
 * som huvudväg: gamla prov ska gå att skriva utan konto, och det är därför
 * ingenting här är obligatoriskt för att flödet ska fungera.
 *
 * **Poängen räknas alltid om här.** Klienten skickar bara vilka bokstäver som
 * valdes; facit ligger i provdatan som bundlas med servern, och `isCorrect`
 * hanterar de uppgifter UHR i efterhand godkänt flera svar på. Att ta emot en
 * poäng från klienten hade betytt att vem som helst kan skriva 40/40.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { limits } from "./rate-limit";
import { assertRateLimit } from "./rate-limit.server";
import { isCorrect, loadPass } from "./prov-data";

const TERM = /^\d{4}(vt|ht)[ab]?$/;

/** `{"1":"C","12":"A"}` — uppgiftsnummer → vald bokstav. */
const answersSchema = z.record(z.string().regex(/^\d{1,3}$/), z.enum(["A", "B", "C", "D", "E"]));

export interface ProvAttempt {
  term: string;
  pass: number;
  mode: "prov" | "ova";
  answers: Record<string, string>;
  score: number;
  total: number;
  durationS: number | null;
  submittedAt: string;
}

function toAttempt(row: Record<string, unknown>): ProvAttempt {
  return {
    term: row.term as string,
    pass: row.pass as number,
    mode: row.mode === "ova" ? "ova" : "prov",
    answers: (row.answers ?? {}) as Record<string, string>,
    score: row.score as number,
    total: row.total as number,
    durationS: (row.duration_s as number | null) ?? null,
    submittedAt: row.submitted_at as string,
  };
}

export const saveProvAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        term: z.string().regex(TERM),
        pass: z.number().int().min(1).max(5),
        mode: z.enum(["prov", "ova"]).default("prov"),
        answers: answersSchema,
        durationS: z
          .number()
          .int()
          .min(0)
          .max(6 * 3600)
          .nullable()
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ score: number; total: number }> => {
    const { userId } = context;
    assertRateLimit(`prov-attempt:${userId}`, limits.provAttempt);

    // Provpasset laddas på servern — samma data och samma facit som klienten
    // ser, men här är det vi som avgör vad som är rätt.
    const passet = await loadPass(data.term, data.pass);
    if (!passet) throw new Error("Provpasset finns inte.");

    const score = passet.questions.filter((q) => isCorrect(q, data.answers[String(q.nr)])).length;
    const total = passet.questions.length;

    const { error } = await supabaseAdmin.from("prov_attempts").upsert(
      {
        user_id: userId,
        term: data.term,
        pass: data.pass,
        mode: data.mode,
        answers: data.answers,
        score,
        total,
        duration_s: data.durationS ?? null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,term,pass" },
    );
    if (error) {
      console.error("[prov] kunde inte spara försöket:", error.message);
      throw new Error("Kunde inte spara resultatet. Provet är rättat ändå.");
    }

    return { score, total };
  });

/** Alla mina skrivna pass. Driver provlistan och provtillfällets sida. */
export const fetchProvAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProvAttempt[]> => {
    const { userId } = context;
    assertRateLimit(`prov-attempts:${userId}`, limits.publicRead);
    const { data, error } = await supabaseAdmin
      .from("prov_attempts")
      .select("term, pass, mode, answers, score, total, duration_s, submitted_at")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("[prov] kunde inte läsa försöken:", error.message);
      return [];
    }
    return (data ?? []).map((r) => toAttempt(r as Record<string, unknown>));
  });

/** Ett enskilt försök, med svaren — det som gör en genomgång i efterhand möjlig. */
export const fetchProvAttempt = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ term: z.string().regex(TERM), pass: z.number().int().min(1).max(5) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<ProvAttempt | null> => {
    const { userId } = context;
    assertRateLimit(`prov-attempts:${userId}`, limits.publicRead);
    const { data: row, error } = await supabaseAdmin
      .from("prov_attempts")
      .select("term, pass, mode, answers, score, total, duration_s, submitted_at")
      .eq("user_id", userId)
      .eq("term", data.term)
      .eq("pass", data.pass)
      .maybeSingle();
    if (error || !row) return null;
    return toAttempt(row as Record<string, unknown>);
  });
