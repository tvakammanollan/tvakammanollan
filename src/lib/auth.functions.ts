import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { isAutoUsername } from "./username";

/**
 * Inloggning med användarnamn.
 *
 * Supabase känner bara till e-post och telefon, så namnet måste översättas
 * till en adress först. Uppslaget ligger här och inte i klienten med flit: en
 * endpoint som svarar på "vilken e-post hör till lina_p" är en läcka hur den
 * än formuleras — vem som helst kan gå igenom topplistan och skörda adresser.
 * Servern slår upp, loggar in och lämnar tillbaka en färdig session; adressen
 * korsar aldrig nätverket.
 *
 * Själva inloggningen görs med den PUBLIKA nyckeln, inte service role. Då
 * gäller Supabase egna spärrar precis som på e-postvägen (bannade konton,
 * obekräftad adress, lösenordspolicy) i stället för att kringgås.
 */

/** Samma svar oavsett om namnet saknas eller lösenordet är fel. */
const GENERIC_ERROR = "Fel användarnamn eller lösenord";

/**
 * Klient med publik nyckel. Skapas per anrop — den håller ingen session och
 * ska inte delas mellan förfrågningar i samma isolat.
 */
function anonAuthClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Inloggningen är felkonfigurerad. Försök igen senare.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

async function emailForUsername(username: string): Promise<string | null> {
  // Gästkonton (auto-namn, inget lösenord) ska inte ens gå att sondera.
  // Raderade konton har tomt namn och stoppas redan av min(3) i valideringen.
  if (isAutoUsername(username)) return null;

  // `.eq` och inte `.ilike` som vänsöket i friends.functions.ts: i LIKE är
  // `_` ett jokertecken, och understreck är tillåtet i användarnamn. `lina_p`
  // skulle alltså också matcha `linaxp`, och två träffar får maybeSingle() att
  // fela — inloggningen skulle dö för alla vars namn råkar matcha någon annans.
  // Onboarding sparar namnen gemena, så exakt matchning räcker.
  const { data: row } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!row) return null;

  // auth.users är sanningen om adressen. public.users.email sätts en gång av
  // handle_new_user() och följer inte med om adressen byts senare.
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(row.id);
  return authUser?.user?.email ?? null;
}

export const signInWithUsername = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        // Samma regler som onboarding sätter namnet med.
        username: z
          .string()
          .trim()
          .toLowerCase()
          .min(3)
          .max(20)
          .regex(/^[a-z0-9_-]+$/),
        password: z.string().min(1).max(128),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    // Två spärrar med olika syfte: en mot bredspektrad gissning från samma
    // IP, en mot hamring av ETT konto från många håll. Båda lever per
    // Cloudflare-isolat — de stoppar hamring, inte en tålmodig angripare.
    assertRateLimit(ipKey("login-username"), { max: 10, windowMs: 10 * 60 * 1000 });
    assertRateLimit(`login-username:${data.username}`, { max: 10, windowMs: 10 * 60 * 1000 });

    const email = await emailForUsername(data.username);
    if (!email) throw new Error(GENERIC_ERROR);

    const { data: result, error } = await anonAuthClient().auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (error || !result.session) throw new Error(GENERIC_ERROR);

    // Bara det klienten behöver för setSession(). Inget om användaren själv —
    // den hämtar useAuth() ändå så fort sessionen är satt.
    return {
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    };
  });
