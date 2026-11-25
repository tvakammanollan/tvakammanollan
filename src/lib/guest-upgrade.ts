/**
 * Gästkonto → riktigt konto, webbläsardelen. Serverdelen (profilens adress
 * och flytten av ett gästköp) ligger i `guest-upgrade.functions.ts`.
 *
 * Används av /signup och av steget efter ett köp som gäst
 * (`SaveGuestPurchase`). Två vägar finns, och de är inte utbytbara:
 *
 * 1. `upgradeGuest`: gästen blir ett riktigt konto med SAMMA id. ELO,
 *    matcher, ordframsteg, utmärkelser och ett Premium-köp ligger på id:t och
 *    följer därför med utan att något flyttas. Den vägen ska alltid prövas först.
 * 2. Allt som byter ut gästsessionen mot ett ANNAT konto (inloggning på ett
 *    konto som finns, Google, en ny registrering när bytet inte gick) ska
 *    först anropa `rememberGuestForClaim`, så att ett gästköp kan flyttas när
 *    det nya kontot är inloggat (`GuestPurchaseClaimer` i roten).
 */
import { supabase } from "@/integrations/supabase/client";
import { storeGuestClaim } from "./guest-claim";

/**
 * Gör det inloggade gästkontot till ett riktigt konto, med samma id.
 *
 * Två steg med flit: Supabase släpper inte igenom ett lösenord på en anonym
 * användare som saknar adress, så adressen sätts först. "Confirm email" är
 * avslaget, så bytet gäller direkt och `is_anonymous` blir falskt i samma
 * anrop. Sessionen förnyas efteråt: servern läser `is_anonymous` ur tokenen
 * (kassan och flytten av gästköp läser den), och den gamla tokenen säger
 * fortfarande gäst.
 *
 * - "ok": kontot är riktigt och inloggat.
 * - "exists": adressen hör redan till ett annat konto.
 * - "fallback": bytet gick inte (inställning i Supabase, eller bekräftelse
 *   krävs). Anroparen skapar då ett nytt konto, så att registreringen aldrig
 *   står still; framstegen följer inte med, men ett köp gör det via
 *   `rememberGuestForClaim`.
 */
export async function upgradeGuest(
  email: string,
  password: string,
): Promise<"ok" | "exists" | "fallback"> {
  const first = await supabase.auth.updateUser({ email });
  if (first.error) {
    return /already|registered|exists/i.test(first.error.message) ||
      first.error.code === "email_exists"
      ? "exists"
      : "fallback";
  }
  const updated = first.data.user;
  if (!updated || updated.is_anonymous || updated.email?.toLowerCase() !== email.toLowerCase()) {
    return "fallback";
  }
  const second = await supabase.auth.updateUser({ password });
  if (second.error) throw second.error;
  const refreshed = await supabase.auth.refreshSession();
  if (refreshed.error) throw refreshed.error;
  return "ok";
}

/**
 * Åtkomsttoken för den inloggade gästen, null för alla andra. `getSession`
 * förnyar en token som gått ut, så den som lämnas ut gäller i närmare en
 * timme.
 */
export async function currentGuestToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session || session.user.is_anonymous !== true) return null;
    return session.access_token;
  } catch {
    return null;
  }
}

/**
 * Sparar gästens token inför ett byte till ett annat konto. Gör ingenting för
 * den som inte är gäst. Anropas för ALLA gäster, inte bara de som köpt: att
 * först fråga servern om gästen har ett köp hade lagt en väntan i varje
 * inloggning, och flytten svarar ändå "inget att flytta" på en gång.
 */
export async function rememberGuestForClaim(): Promise<void> {
  const token = await currentGuestToken();
  if (token) storeGuestClaim(token);
}
