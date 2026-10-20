import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { questionIsServable } from "./question-validity";
import { voteWeight, weightedShuffle } from "./question-votes";
import { loadVoteStats } from "./question-votes.server";
import { optionalSupabaseAuth } from "./auth-optional.server";
import { GENERATED_TAG, MEK_ORIGINS, type MekOrigin } from "./question-origin";

const MATH_CATEGORIES = new Set(["XYZ", "KVA", "NOG", "DTK"]);

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
  "id, category, question_text, options, passage_id, passage_text, image_url, image_caption, correct_answer, explanation, difficulty, cleaned_question_text, cleaned_options, clean_status, tags, source";

/** Hur många id som läses per delprov innan urvalet görs. PostgREST:s radtak. */
const ID_WINDOW = 1000;

export const fetchTrainingBatch = createServerFn({ method: "GET" })
  .middleware([optionalSupabaseAuth])
  .inputValidator(
    (data: {
      categories: string[];
      difficulty?: number | null;
      count?: number;
      mekOrigin?: MekOrigin;
      excludeCorrect?: boolean;
    }) =>
      z
        .object({
          categories: z.array(z.enum(CATEGORIES)).min(1).max(8),
          difficulty: z.number().int().min(1).max(3).nullable().optional().default(null),
          count: z.number().int().min(1).max(60).optional().default(20),
          mekOrigin: z.enum(MEK_ORIGINS).optional().default("all"),
          excludeCorrect: z.boolean().optional().default(false),
        })
        .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    // Tung query och publik — hamringsskydd per IP, samma tak som ordbatchen.
    assertRateLimit(ipKey("trainbatch"), limits.wordBatch);

    // Urvalet görs i två steg: först id:n per delprov, sedan hela raderna för
    // just de id som lottats fram. Tidigare hämtades hela rader med
    // `.limit(300)` och utan ordning, vilket i praktiken gav de 300 äldsta
    // raderna varje gång. För MEK (698 rader) betydde det att de nyare
    // uppgifterna, alltså alla Tvåkommanollans egna, nästan aldrig kom med.
    // Ett id-fönster på upp till 1 000 rader per delprov täcker hela MEK och
    // läggs på en slumpad plats i de större delproven (ORD).
    const idsByCategory = await Promise.all(
      data.categories.map(async (category) => {
        const filtered = () => {
          let q = supabaseAdmin
            .from("questions")
            .select("id", { count: "exact" })
            .eq("category", category);
          if (data.difficulty !== null) q = q.eq("difficulty", data.difficulty);
          // De skrapade matteraderna ligger kvar som "retired" för
          // matchhistorikens skull och ska inte delas ut igen.
          //
          // Filtret är `neq retired`, INTE `eq ok`: verbala rader står allihop
          // kvar som "pending" (8 761 ORD, 398 MEK, 336 LÄS, 79 ELF), så ett
          // `eq("clean_status","ok")` hade tömt varje verbalt pass. Kolumnen är
          // NOT NULL DEFAULT 'pending', alltså finns ingen NULL-lucka.
          q = q.neq("clean_status", "retired");
          if (category === "MEK" && data.mekOrigin === "tkn") {
            q = q.contains("tags", [GENERATED_TAG]);
          } else if (category === "MEK" && data.mekOrigin === "archive") {
            q = q.not("tags", "cs", `{${GENERATED_TAG}}`);
          }
          return q;
        };
        const head = await filtered().range(0, 0);
        if (head.error) throw head.error;
        const total = head.count ?? 0;
        const offset = total > ID_WINDOW ? Math.floor(Math.random() * (total - ID_WINDOW + 1)) : 0;
        const { data: ids, error } = await filtered()
          .order("id")
          .range(offset, offset + ID_WINDOW - 1);
        if (error) throw error;
        return (ids ?? []).map((r) => r.id as string);
      }),
    ).catch((e: unknown) => {
      console.error("[train] id fetch failed:", e instanceof Error ? e.message : e);
      throw new Error("Något gick fel. Försök igen om en stund.");
    });

    // "Dölj frågor jag redan klarat": allt användaren svarat rätt på, i
    // träning eller match. Identiteten läses ur tokenen, aldrig ur ett fält
    // klienten fyller i. Utloggad eller vid fel: inget filter.
    const solved = new Set<string>();
    if (data.excludeCorrect && context.userId) {
      for (let from = 0; from < 20_000; from += 1000) {
        const { data: rows, error } = await supabaseAdmin
          .from("match_answers")
          .select("question_id")
          .eq("user_id", context.userId)
          .eq("is_correct", true)
          .range(from, from + 999);
        if (error) {
          console.error("[train] klarade frågor:", error.message);
          break;
        }
        for (const r of rows ?? []) if (r.question_id) solved.add(r.question_id);
        if ((rows ?? []).length < 1000) break;
      }
    }

    // Blandningen sker här och inte i klienten: urvalet är hela skyddet, och
    // ett urval som klienten gör själv är inget urval.
    // Rösterna väger in (`question-votes.ts`): begravda frågor faller bort,
    // lyfta dras oftare. Utan läsbara röster är det en vanlig blandning.
    const votes = await loadVoteStats();
    const candidates = idsByCategory.flat().filter((id) => !solved.has(id));
    // Marginal för frågor som faller på spelbarhetskontrollen nedan.
    const chosen = weightedShuffle(candidates, (id) => voteWeight(votes.get(id))).slice(
      0,
      data.count * 3,
    );
    if (chosen.length === 0) return { questions: [], exhausted: solved.size > 0 };

    const { data: fetched, error } = await supabaseAdmin
      .from("questions")
      .select(COLS)
      .in("id", chosen);
    if (error) {
      console.error("[train] batch fetch failed:", error.message);
      throw new Error("Något gick fel. Försök igen om en stund.");
    }
    const order = new Map(chosen.map((id, i) => [id, i]));
    const rows = (fetched ?? []).sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    );

    // `clean_status != "retired"` betyder att textutvinningen inte är utgången,
    // inte att uppgiften faktiskt går att visa — en matteuppgifts beskärning
    // kan sakna sin bildproportion eller vara halvfärdig (se
    // `question-validity.ts`) och renderar då fel skuren eller helt tom.
    // `useCleaned` här matchar exakt logiken i `train.tsx`, så det som
    // kontrolleras är det som faktiskt renderas.
    const playable = (rows ?? []).filter((row) => {
      const r = row as {
        id: string;
        category: string;
        question_text: string | null;
        options: unknown;
        cleaned_options: unknown;
        correct_answer: string | null;
        image_url: string | null;
        image_caption: unknown;
        clean_status: string;
        cleaned_question_text: string | null;
      };
      if (!MATH_CATEGORIES.has(r.category)) return true;
      const useCleaned = r.clean_status === "ok" && !!r.cleaned_question_text;
      return questionIsServable({
        id: r.id,
        category: r.category,
        question_text: useCleaned ? r.cleaned_question_text : r.question_text,
        options: useCleaned ? r.cleaned_options : r.options,
        correct_answer: r.correct_answer,
        image_url: useCleaned ? null : r.image_url,
        image_caption: useCleaned ? null : r.image_caption,
      });
    });

    // Redan blandat och viktat i id-steget; här behålls bara ordningen.
    const pool = playable.slice(0, data.count);

    // Passet hålls ihop. Ett flerkategoripass levererades tidigare helt
    // slumpat, så en ORD-fråga följdes av en LÄS-text följd av en MEK-mening —
    // man hann aldrig komma in i en uppgiftstyp innan den byttes ut. Nu
    // kommer kategorierna i den ordning anroparen bad om dem, med
    // blandningen kvar INOM varje kategori.
    //
    // Frågor som delar lästext hamnar dessutom bredvid varandra. Utan det kan
    // samma text dyka upp två gånger i passet med tre frågor emellan, och
    // överstrykningarna (som hör till texten) ser ut att komma och gå.
    const rank = new Map(data.categories.map((c, i) => [c as string, i]));
    const passageOrder = new Map<string, number>();
    for (const row of pool) {
      const r = row as { passage_id?: string | null };
      if (r.passage_id && !passageOrder.has(r.passage_id)) {
        passageOrder.set(r.passage_id, passageOrder.size);
      }
    }
    const sorted = pool
      .map((row, i) => ({ row, i }))
      .sort((a, b) => {
        const ra = a.row as { category: string; passage_id?: string | null };
        const rb = b.row as { category: string; passage_id?: string | null };
        const ca = rank.get(ra.category) ?? 99;
        const cb = rank.get(rb.category) ?? 99;
        if (ca !== cb) return ca - cb;
        const pa = ra.passage_id ? (passageOrder.get(ra.passage_id) ?? 0) : -1;
        const pb = rb.passage_id ? (passageOrder.get(rb.passage_id) ?? 0) : -1;
        if (pa !== pb) return pa - pb;
        return a.i - b.i; // behåll den slumpade ordningen inom gruppen
      })
      .map((x) => x.row);

    return { questions: sorted, exhausted: false };
  });

/**
 * Hur många MEK-uppgifter som går att träna på, för startsidans MEK-kort.
 * Siffran räknas, den skrivs aldrig för hand: banken växer batch för batch
 * mot 2 000, och ett hårdkodat tal hade blivit fel vid nästa import.
 * Cachad en timme per isolat.
 */
let mekStatsCache: { at: number; total: number; own: number } | null = null;

export const fetchMekStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ total: number; own: number } | null> => {
    assertRateLimit(ipKey("mek-stats"), limits.publicRead);
    if (mekStatsCache && Date.now() - mekStatsCache.at < 60 * 60 * 1000) {
      return { total: mekStatsCache.total, own: mekStatsCache.own };
    }
    const base = () =>
      supabaseAdmin
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("category", "MEK")
        .neq("clean_status", "retired");
    const [all, own] = await Promise.all([base(), base().contains("tags", [GENERATED_TAG])]);
    if (all.error || own.error) {
      console.error("[train] mek-räkning:", all.error?.message ?? own.error?.message);
      return null;
    }
    mekStatsCache = { at: Date.now(), total: all.count ?? 0, own: own.count ?? 0 };
    return { total: mekStatsCache.total, own: mekStatsCache.own };
  },
);
