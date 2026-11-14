import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertRateLimit } from "./rate-limit.server";
import { readOrdPurchase } from "./ord-paywall.server";
import { cancelSubscriptionNow, retrieveSubscription } from "./stripe.server";

/**
 * GDPR art. 17 — radera konto (självservice).
 *
 * Strategi: matcher är DELAD data (motståndarens historik ska överleva),
 * så matches/elo-aggregat anonymiseras via users-raden i stället för att
 * raderas. Allt personligt raderas på riktigt:
 *   1. Personliga sidotabeller töms (ordträning, kö, inbjudningar, vänner,
 *      svar, ELO-historik, rapporter, provförsök, e-postverifieringar,
 *      forumprenumerationer/reaktioner/anmälningar, veckoutmaningar och
 *      ringlistan). `audit_log` anonymiseras i stället: raderna driver den
 *      publika räknaren på landningssidan, och kopplingen till personen är
 *      det som ska bort, inte siffran.
 *
 *      Kvar med flit: `coaching_requests` (köp — bokföringsgrund, och
 *      integritetspolicyn säger det uttryckligen) samt forumtrådar och
 *      forumsvar, som anonymiseras via users-raden precis som matcherna.
 *
 *      `ord_purchases` raderas: raden är en åtkomstpost, och betalningen
 *      finns kvar hos Stripe för bokföringen. En löpande månadsprenumeration
 *      avslutas i Stripe FÖRST (steg 0), annars hade den fortsatt dra pengar
 *      från ett konto som inte längre finns och inte går att säga upp.
 *   2. users-raden anonymiseras (username → "" döljer den från topplistor,
 *      e-post → null) men behålls så matchers FK inte bryts.
 *   3. Auth-användaren hårdraderas (login + e-post försvinner). Om det
 *      misslyckas (t.ex. FK-cascade-konflikt) skramlas e-posten och kontot
 *      bannlyses permanent som fallback — inloggning är död oavsett.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    // Skriven bekräftelse från UI:t — skyddar mot oavsiktliga anrop.
    z.object({ confirm: z.literal("RADERA") }).parse(input),
  )
  .handler(async ({ context }) => {
    const { userId } = context;
    assertRateLimit(`delacc:${userId}`, { max: 3, windowMs: 60 * 60 * 1000 });

    // 0) Avsluta en löpande prenumeration på ordlistan. Går det inte stoppas
    //    raderingen: utan raden finns ingen väg att säga upp, och Stripe
    //    fortsätter dra. Ett nytt försök kostar användaren en minut.
    const { row: purchase, failed: purchaseReadFailed } = await readOrdPurchase(userId);
    if (purchaseReadFailed) {
      throw new Error(
        "Vi kunde inte kontrollera ditt köp just nu. Försök igen om en stund, eller mejla info@tvakommanollan.se.",
      );
    }
    const subscriptionId = purchase?.stripe_subscription_id;
    const finished = new Set(["canceled", "incomplete_expired"]);
    if (subscriptionId && !finished.has(purchase?.subscription_status ?? "")) {
      try {
        await cancelSubscriptionNow(subscriptionId);
      } catch (e) {
        // Raden kan ligga efter Stripe: är prenumerationen redan avslutad
        // där svarar Stripe med fel, och då finns inget att stoppa.
        const already = await retrieveSubscription(subscriptionId)
          .then((sub) => finished.has(sub.status))
          .catch(() => false);
        if (!already) {
          console.error("[account] kunde inte avsluta prenumerationen:", e);
          throw new Error(
            "Vi kunde inte avsluta din prenumeration hos Stripe just nu. Försök igen om en stund, eller mejla info@tvakommanollan.se.",
          );
        }
      }
    }

    // 1) Personliga sidotabeller — ren radering.
    // Köpraden skulle försvinna med auth-användaren ändå (ON DELETE CASCADE),
    // men inte om steg 3 faller tillbaka på avstängning.
    await supabaseAdmin.from("ord_purchases").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_word_failed").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_word_correct").delete().eq("user_id", userId);
    await supabaseAdmin.from("ord_practice_stats").delete().eq("user_id", userId);
    await supabaseAdmin.from("matchmaking_queue").delete().eq("player_id", userId);
    await supabaseAdmin
      .from("match_invites")
      .delete()
      .or(`from_user.eq.${userId},to_user.eq.${userId}`);
    await supabaseAdmin
      .from("friendships")
      .delete()
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    await supabaseAdmin.from("match_answers").delete().eq("user_id", userId);
    await supabaseAdmin.from("elo_history").delete().eq("user_id", userId);
    await supabaseAdmin.from("bug_reports").delete().eq("user_id", userId);
    await supabaseAdmin.from("question_reports").delete().eq("reporter_id", userId);
    await supabaseAdmin.from("question_votes").delete().eq("user_id", userId);
    // Tillagda efter en inventering av var användardata faktiskt ligger
    // (2026-08-21). Alla sju bar personuppgifter och överlevde raderingen.
    await supabaseAdmin.from("prov_attempts").delete().eq("user_id", userId);
    await supabaseAdmin.from("email_verifications").delete().eq("user_id", userId);
    await supabaseAdmin.from("forum_subscriptions").delete().eq("user_id", userId);
    await supabaseAdmin.from("forum_reactions").delete().eq("user_id", userId);
    await supabaseAdmin.from("forum_reports").delete().eq("reporter_id", userId);
    await supabaseAdmin.from("weekly_challenge_entries").delete().eq("player_id", userId);
    // Ringlistan. Bär namn, e-post, telefon och meddelande — och till skillnad
    // från `coaching_requests` är ett lead inte ett köp, alltså finns ingen
    // bokföringsgrund att luta sig mot när någon begär radering.
    await supabaseAdmin.from("coaching_leads").delete().eq("user_id", userId);

    // Användningsloggen ANONYMISERAS i stället för att raderas: raderna driver
    // den publika räknaren på landningssidan ("N matcher spelade"), och att
    // radera dem hade skrivit om en siffra som redan visats. Kopplingen till
    // personen försvinner, vilket är det radering handlar om.
    await supabaseAdmin.from("audit_log").update({ user_id: null }).eq("user_id", userId);

    // 2) Anonymisera users-raden (behålls för matchernas FK; tomt username
    //    filtreras bort från alla topplistor).
    const { error: anonErr } = await supabaseAdmin
      .from("users")
      .update({
        username: "",
        email: null,
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null,
      })
      .eq("id", userId);
    if (anonErr) {
      console.error("[account] anonymisering misslyckades:", anonErr.message);
      throw new Error("Kunde inte radera kontot. Försök igen eller mejla info@tvakommanollan.se.");
    }

    // 3) Radera auth-användaren (tar bort inloggning + e-post ur auth-systemet).
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error("[account] auth-radering misslyckades, kör fallback:", authErr.message);
      // Fallback: skrota e-posten och bannlys — kontot är dött även om
      // auth-raden lever kvar tekniskt.
      const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: `deleted-${userId}@deleted.invalid`,
        password: crypto.randomUUID() + crypto.randomUUID(),
        ban_duration: "876000h", // ~100 år
      });
      if (banErr) {
        console.error("[account] fallback misslyckades:", banErr.message);
        throw new Error(
          "Dina uppgifter är raderade men kontot kunde inte stängas helt. Mejla info@tvakommanollan.se så fixar vi det.",
        );
      }
    }

    return { ok: true };
  });
