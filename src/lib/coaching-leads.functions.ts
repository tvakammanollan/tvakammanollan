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
import { QUIZ_STEPS, QUIZ_VALUES } from "./coaching-quiz";

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
  // Frivilliga. Numret är fortfarande det enda som krävs — produkten är ett
  // telefonsamtal — men går personen inte att nå på telefon fanns tidigare
  // ingen andra väg alls, och den som har något specifikt att berätta hade
  // ingenstans att skriva det.
  email: z
    .string()
    .trim()
    .email("Adressen ser inte ut att stämma.")
    .max(200)
    .optional()
    .or(z.literal("")),
  message: z.string().trim().max(1000).optional(),
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

    const email = data.email?.trim() || null;
    const message = data.message?.trim() || null;

    const { error } = await supabaseAdmin.from("coaching_leads").insert({
      user_id: context.userId,
      phone: phone.e164,
      name: name && name.length > 0 ? name : null,
      email,
      message,
      answers: data.answers,
      source: data.source,
      // Samtycket ÄR inskicket: formuläret säger före knappen vad numret
      // används till, och att trycka på den är den entydiga viljeyttringen.
      // Tidpunkten sätts på servern, inte av klienten — den är beviset och
      // ska inte gå att skicka in.
      consent_at: new Date().toISOString(),
    });
    if (error) throwDbError(error, "insert");

    // Notis till oss. Ett lead som ingen ser är ett samtal som inte blir av,
    // och listan ligger bakom admin-inloggning som ingen öppnar utan anledning.
    // Utskicket får aldrig fälla inskicket: raden är sparad ovanför.
    try {
      const { emailAdmin, sendEmail } = await import("./email.server");
      const { leadNotificationTemplate } = await import("./email-templates");
      const svar = QUIZ_STEPS.map((steg) => {
        const value = (data.answers as Record<string, string>)[steg.id];
        const label = steg.options.find((o) => o.value === value)?.label ?? value;
        return `${steg.question} ${label}`;
      });
      const mail = leadNotificationTemplate({
        phone: phone.e164,
        name: name && name.length > 0 ? name : null,
        answers: svar,
        source: data.source,
        message,
      });
      await sendEmail({
        to: emailAdmin(),
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        // Svara-knappen ska gå till personen när vi har en adress.
        replyTo: email ?? undefined,
        tag: "ringlista-lead",
      });
    } catch (e) {
      console.error("[coaching-leads] notismejlet kunde inte skickas:", e);
    }

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
  email: string | null;
  message: string | null;
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
      limit: z.number().int().min(1).max(500).default(100),
      /** Fritextsökning på namn, nummer eller adress. */
      search: z.string().trim().max(80).optional(),
      /**
       * Sorteringen. "Äldsta först" är standard för obehandlade — den som
       * väntat längst ska ringas först — och nyast först för övriga vyer.
       */
      sort: z.enum(["oldest", "newest", "name"]).optional(),
    }),
  )
  .handler(async ({ data, context }): Promise<CoachingLead[]> => {
    const userId = context.userId as string;
    await requireAdmin(userId);

    const sort = data.sort ?? (data.status === "new" ? "oldest" : "newest");
    let q = supabaseAdmin
      .from("coaching_leads")
      .select(
        "id,created_at,phone,name,email,message,answers,source,status,contacted_at,note,user_id",
      )
      .limit(data.limit);
    if (sort === "name") q = q.order("name", { ascending: true, nullsFirst: false });
    else q = q.order("created_at", { ascending: sort === "oldest" });
    if (data.status !== "all") q = q.eq("status", data.status);

    // Sökningen görs i databasen och inte i klienten: listan kan innehålla
    // hundratals rader, och att skicka alla till webbläsaren för att filtrera
    // där är att skicka andras telefonnummer i onödan. `%`, `,` och `*` måste
    // escapas — de är metatecken i PostgREST:s or-syntax och i ILIKE.
    if (data.search) {
      const term = data.search.replace(/[%_,()*]/g, " ").trim();
      if (term) {
        q = q.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
      }
    }

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
      email: r.email,
      message: r.message,
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
