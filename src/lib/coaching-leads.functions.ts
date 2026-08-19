/**
 * Kvalificeringsformuläret — "Är studieupplägget något för dig?"
 *
 * Två frågor på dashboarden, sedan ett telefonnummer, sedan hör vi av oss.
 * Det är hela flödet: ingen kassa, ingen kalender, inget konto. Skälet till att
 * det ligger bredvid Stripe-köpet och inte i stället för det är att de säljer
 * till olika personer — den som redan bestämt sig köper direkt, den som är
 * osäker vill prata först.
 *
 * Telefonnumret är sajtens första personuppgift som samlas in för att någon
 * ska bli uppringd, och det styr tre saker här:
 *   - `consent_at` är NOT NULL i tabellen, och sätts av servern. Inskicket ÄR
 *     samtycket (texten står över knappen), och tidpunkten är beviset.
 *   - Numret normaliseras till E.164 innan det sparas (`normalizePhone`), så
 *     samma person inte hamnar i ringlistan två gånger.
 *   - Läsvägen är admin-only. Tabellen har RLS på och noll policies, så bara
 *     service role kommer åt den, och `fetchCoachingLeads` kontrollerar
 *     is_admin innan den svarar.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { optionalSupabaseAuth } from "./auth-optional.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { normalizePhone } from "./phone";
import { QUIZ_VALUES } from "./coaching-quiz";

function throwDbError(error: { message: string }, ctx: string): never {
  // Numret får aldrig med i loggen — det är hela poängen med att logga
  // felmeddelandet och inte raden.
  console.error(`[coaching-leads] ${ctx}:`, error.message);
  throw new Error("Något gick fel. Försök igen om en stund.");
}

/**
 * Svarsalternativen valideras mot samma lista som UI:t renderar
 * (`QUIZ_VALUES`), inte mot en handskriven kopia. Skrivs en fråga om glider de
 * annars isär, och servern börjar avvisa svar som knappen faktiskt visar.
 */
const answersSchema = z.object({
  forsok: z.enum(QUIZ_VALUES.forsok as [string, ...string[]]),
  hinder: z.enum(QUIZ_VALUES.hinder as [string, ...string[]]),
});

const submitSchema = z.object({
  phone: z.string().min(1).max(40),
  name: z.string().trim().max(80).optional(),
  answers: answersSchema,
  source: z.enum(["dashboard", "landing", "popup"]).default("dashboard"),
});

export interface SubmitLeadResult {
  ok: true;
  /** Normaliserat nummer, tillbaka till UI:t för kvittot. */
  phone: string;
}

export const submitCoachingLead = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseAuth])
  .inputValidator(submitSchema)
  .handler(async ({ data, context }): Promise<SubmitLeadResult> => {
    // Per IP: formuläret är öppet för utloggade, så användar-id finns inte
    // alltid. Tre i timmen räcker för den som skriver fel nummer en gång.
    assertRateLimit(ipKey("coaching-lead"), limits.coachingLead);

    const phone = normalizePhone(data.phone);
    if (!phone.ok || !phone.e164) {
      // Felet från normalizePhone är redan skrivet för att visas.
      throw new Error(phone.error ?? "Numret ser inte ut att stämma.");
    }

    const name = data.name?.trim();

    const { error } = await supabaseAdmin.from("coaching_leads").insert({
      user_id: context.userId,
      phone: phone.e164,
      name: name && name.length > 0 ? name : null,
      answers: data.answers,
      source: data.source,
      // Samtycket ÄR inskicket: formuläret säger före knappen vad numret
      // används till, och att trycka på den är den entydiga viljeyttringen.
      // Tidpunkten sätts på servern, inte av klienten — den är beviset och
      // ska inte gå att skicka in.
      consent_at: new Date().toISOString(),
    });
    if (error) throwDbError(error, "insert");

    return { ok: true, phone: phone.e164 };
  });

/* ------------------------------------------------------------------ */
/* Admin — ringlistan                                                  */
/* ------------------------------------------------------------------ */

export interface CoachingLead {
  id: string;
  created_at: string;
  phone: string;
  name: string | null;
  answers: { forsok?: string; hinder?: string };
  source: string | null;
  status: string;
  contacted_at: string | null;
  note: string | null;
  /** Användarnamn om leadet kom från ett inloggat konto. */
  username: string | null;
}

/** supabaseAdmin går förbi RLS, så den här kontrollen är den enda kontrollen. */
async function requireAdmin(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error) throwDbError(error, "requireAdmin");
  if (!data?.is_admin) throw new Error("Behörighet saknas.");
}

export const fetchCoachingLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      status: z.enum(["new", "contacted", "won", "lost", "all"]).default("new"),
      limit: z.number().int().min(1).max(200).default(100),
    }),
  )
  .handler(async ({ data, context }): Promise<CoachingLead[]> => {
    const userId = context.userId as string;
    await requireAdmin(userId);

    let q = supabaseAdmin
      .from("coaching_leads")
      .select("id,created_at,phone,name,answers,source,status,contacted_at,note,user_id")
      // Äldsta först bland de obehandlade: den som väntat längst ska ringas
      // först. För övriga vyer är nyast först mer användbart.
      .order("created_at", { ascending: data.status === "new" })
      .limit(data.limit);
    if (data.status !== "all") q = q.eq("status", data.status);

    const { data: rows, error } = await q;
    if (error) throwDbError(error, "fetchCoachingLeads");

    const list = rows ?? [];
    // Användarnamn hämtas separat i stället för via en join: coaching_leads har
    // ingen FK-relation deklarerad i types.ts, och en embed hade krävt det.
    const ids = [...new Set(list.map((r) => r.user_id).filter((v): v is string => !!v))];
    const names = new Map<string, string>();
    if (ids.length > 0) {
      const { data: users } = await supabaseAdmin.from("users").select("id,username").in("id", ids);
      for (const u of users ?? []) names.set(u.id, u.username ?? "");
    }

    return list.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      phone: r.phone,
      name: r.name,
      answers: (r.answers ?? {}) as { forsok?: string; hinder?: string },
      source: r.source,
      status: r.status,
      contacted_at: r.contacted_at,
      note: r.note,
      username: r.user_id ? (names.get(r.user_id) ?? null) : null,
    }));
  });

export const updateCoachingLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "contacted", "won", "lost"]),
      note: z.string().trim().max(1000).optional(),
    }),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const userId = context.userId as string;
    await requireAdmin(userId);

    const { error } = await supabaseAdmin
      .from("coaching_leads")
      .update({
        status: data.status,
        note: data.note ?? null,
        // Sätts när raden lämnar 'new' — det är då någon faktiskt ringt.
        contacted_at: data.status === "new" ? null : new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throwDbError(error, "updateCoachingLead");

    return { ok: true };
  });
