/**
 * Buggrapporter — en väg in som faktiskt leder någonstans.
 *
 * Knappen skrev tidigare en rad i `bug_reports` med webbläsarklienten och
 * visade en toast. Två problem med det:
 *
 *  - **Den krävde inloggning** (`user_id` var NOT NULL), så den som stötte på
 *    ett fel i något av de utloggade flödena — startsidan, registreringen,
 *    gamla prov — möttes av "Du måste vara inloggad för att rapportera
 *    buggar". Alltså ingen väg alls, just där felen är mest värda att veta om.
 *  - **Ingen läste tabellen.** Inget mejl, ingen notis, ingen admin-vy. Tio
 *    rapporter låg olästa.
 *
 * Nu: raden skrivs med service role (så inloggning inte behövs), och samma
 * anrop mejlar rapporten till `EMAIL_ADMIN`. Mejlet får `reply_to` satt till
 * rapportörens adress när vi har en, så ett svar går rakt tillbaka till den
 * som skrev.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { writeTolerant } from "./schema-tolerant.server";
import type { Database } from "@/integrations/supabase/types";
import { optionalSupabaseAuth } from "./auth-optional.server";
import { limits } from "./rate-limit";
import { assertRateLimit, ipKey } from "./rate-limit.server";
import { emailAdmin, sendEmail } from "./email.server";
import { bugReportTemplate } from "./email-templates";

export const submitBugReport = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        message: z.string().trim().min(5, "Skriv lite mer så vi förstår problemet.").max(2000),
        /** Sidan felet uppstod på. Skickas av klienten, används bara som text. */
        page: z.string().max(200).optional(),
        userAgent: z.string().max(400).optional(),
        /** Frivillig svarsadress för den som inte är inloggad. */
        replyEmail: z.string().email().max(200).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; emailed: boolean }> => {
    const { userId } = context;
    // Per IP och inte per användare: formuläret är öppet för utloggade.
    assertRateLimit(ipKey("bug-report"), limits.bugReport);

    let username: string | null = null;
    let kontoEpost: string | null = null;
    if (userId) {
      const { data: u } = await supabaseAdmin
        .from("users")
        .select("username, email")
        .eq("id", userId)
        .maybeSingle();
      username = (u as { username: string | null } | null)?.username ?? null;
      kontoEpost = (u as { email: string | null } | null)?.email ?? null;
    }

    const replyEmail = data.replyEmail?.trim() || kontoEpost || null;

    // `reply_email` är valfri mot databasen tills migrationen körts — se
    // schema-tolerant.server. Rapporten är viktigare än svarsadressen.
    const { error } = await writeTolerant(
      {
        user_id: userId ?? null,
        message: data.message.trim(),
        page: data.page ?? null,
        user_agent: data.userAgent ?? null,
        reply_email: replyEmail,
      },
      ["reply_email"],
      (payload) =>
        supabaseAdmin
          .from("bug_reports")
          .insert(payload as Database["public"]["Tables"]["bug_reports"]["Insert"])
          .select("id"),
    );
    if (error) {
      console.error("[bug] kunde inte spara rapporten:", error.message);
      throw new Error("Kunde inte skicka rapporten just nu. Försök igen om en stund.");
    }

    const mail = bugReportTemplate({
      message: data.message.trim(),
      page: data.page ?? null,
      username,
      email: replyEmail,
    });
    // Rapporten är sparad oavsett vad som händer med mejlet. Ett misslyckat
    // utskick får inte se ut som en misslyckad rapport för den som skrev den.
    const res = await sendEmail({
      to: emailAdmin(),
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      // Svaret ska gå till den som rapporterade, inte till oss själva.
      replyTo: replyEmail ?? undefined,
      tag: "buggrapport",
    });

    return { ok: true, emailed: res.ok };
  });
