/**
 * Verifiering av e-postadress — påminnelse, inte vägg.
 *
 * Registrering med e-post och lösenord loggar in direkt (se migrationen
 * `20260819170000_egen_epostverifiering.sql` för varför "Confirm email" är
 * avstängt i Supabase). Det här är den egna verifieringen som ligger vid
 * sidan av: ett mejl med en länk, en flagga i `public.users`, och ingenting
 * som blockerar någon från att spela under tiden.
 *
 * Säkerhetsanteckningar, i den ordning de spelar roll:
 *
 *  - **Token lagras hashad.** Bara SHA-256 hamnar i tabellen. En läckt databas
 *    ska inte kunna användas för att verifiera andras adresser.
 *  - **Adressen låses till token.** Byter någon adress i efterhand duger inte
 *    en gammal länk, eftersom `email` jämförs vid inlösen.
 *  - **`verifyEmail` är den enda vägen som skriver flaggan**, och den kör med
 *    service role. Klienten har varken UPDATE-rätt på kolumnen eller en policy
 *    som släpper igenom den — se migrationen.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { sendEmail } from "./email.server";
import { verifyEmailTemplate } from "./email-templates";

/** Så länge en länk gäller. Står också i mejltexten. */
export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function siteOrigin(): string {
  try {
    const url = getRequest()?.url;
    if (url) {
      const origin = new URL(url).origin;
      if (origin.startsWith("http")) return origin;
    }
  } catch {
    /* faller igenom */
  }
  return "https://tvakommanollan.se";
}

/** Slumpad token, 32 byte som hex. */
function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface VerificationStatus {
  /** null = utloggad eller gäst; UI:t visar då ingen påminnelse. */
  needsVerification: boolean;
  email: string | null;
}

/** Behöver den inloggade bekräfta sin adress? Driver den lilla påminnelsen. */
export const fetchVerificationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VerificationStatus> => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("users")
      .select("email, email_verified_at")
      .eq("id", userId)
      .maybeSingle();

    const row = data as { email: string | null; email_verified_at: string | null } | null;
    if (!row?.email) return { needsVerification: false, email: null };
    return { needsVerification: !row.email_verified_at, email: row.email };
  });

export const sendVerificationEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ sent: boolean }> => {
    const { userId } = context;
    // Ett mejl per adress kostar oss pengar och mottagaren tålamod. Kvoten
    // ligger per användare, inte per IP: två personer på samma nät ska inte
    // kunna låsa varandra ute.
    assertRateLimit(`verify-email:${userId}`, limits.verificationEmail);

    const { data } = await supabaseAdmin
      .from("users")
      .select("email, username, email_verified_at")
      .eq("id", userId)
      .maybeSingle();
    const row = data as {
      email: string | null;
      username: string | null;
      email_verified_at: string | null;
    } | null;

    // Redan klart, eller inget att skicka till. Svaret är detsamma utåt.
    if (!row?.email || row.email_verified_at) return { sent: false };

    const token = newToken();
    const { error } = await supabaseAdmin.from("email_verifications").insert({
      user_id: userId,
      token_hash: await hashToken(token),
      email: row.email,
      expires_at: new Date(Date.now() + VERIFICATION_TTL_MS).toISOString(),
    });
    if (error) {
      console.error("[verifiering] kunde inte spara token:", error.message);
      throw new Error("Kunde inte skicka mejlet just nu. Försök igen om en stund.");
    }

    const url = `${siteOrigin()}/verifiera-epost?token=${token}`;
    const mail = verifyEmailTemplate({ url, username: row.username });
    const res = await sendEmail({
      to: row.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tag: "verifiera-epost",
    });

    return { sent: res.ok };
  });

export interface VerifyResult {
  ok: boolean;
  /** Varför det inte gick — texten skrivs i UI:t, inte här. */
  reason?: "okand" | "utgangen" | "anvand";
}

/**
 * Löser in en länk. Kräver ingen inloggning: mejlet kan öppnas i en annan
 * webbläsare än den man registrerade sig i, och att kräva session där hade
 * gjort halva länkarna verkningslösa.
 */
export const verifyEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ token: z.string().regex(/^[0-9a-f]{64}$/) }).parse(input),
  )
  .handler(async ({ data }): Promise<VerifyResult> => {
    assertRateLimit(ipKey("verify-email"), limits.verificationRedeem);

    const tokenHash = await hashToken(data.token);
    const { data: row } = await supabaseAdmin
      .from("email_verifications")
      .select("id, user_id, email, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!row) return { ok: false, reason: "okand" };
    if (row.used_at) return { ok: false, reason: "anvand" };
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "utgangen" };

    // Adressen måste fortfarande vara densamma. Byter någon adress efter att
    // mejlet gått iväg ska den gamla länken inte verifiera den nya.
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", row.user_id)
      .maybeSingle();
    if (!user || (user as { email: string | null }).email !== row.email) {
      return { ok: false, reason: "okand" };
    }

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("users")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ email_verified_at: now } as any)
      .eq("id", row.user_id);
    await supabaseAdmin.from("email_verifications").update({ used_at: now }).eq("id", row.id);

    return { ok: true };
  });
