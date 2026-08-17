// Vad som räknas som ett anonymt konto. Ren modul utan beroenden — samma
// definition används av topplistans serverfunktioner och av UI:t som renderar
// namnen, och de två får aldrig glida isär.

/**
 * Auto-genererat användarnamn: `user_` + de åtta första tecknen av UUID:t.
 * Sätts av `handle_new_user()` när kontot skapas utan eget namn — alltså allt
 * gästspel (`signInAnonymously`) och registreringar där namnet inte hann med.
 *
 * Regexen är avsiktligt vidare än triggern (sex tecken eller fler, versaler
 * tillåtna): topplistan både filtrerar och renderar på den här funktionen, så
 * allt som *visas* som "Anonym" måste också *räknas* som anonymt. Vore den
 * strikt (`{8}$`) kunde en rad passera filtret och sedan hamna i listan utan
 * namn. Priset är att ett självvalt `user_deadbeef` också döljs — det namnet
 * visas ändå som "Anonym" i dag.
 */
export function isAutoUsername(username: string | null | undefined): boolean {
  return !!username && /^user_[0-9a-f]{6,}/i.test(username.trim());
}

/**
 * Får kontot ta plats på topplistan?
 *
 * Anonyma konton hålls utanför sedan 2026-08-17. Bakgrunden står i
 * `match-abuse.ts`: fyra gästkonton odlade ELO mot bottar och tog hela toppen
 * av den verbala listan. Kvoterna där stoppar odlingen, det här stoppar
 * skyltningen — ett gästkonto som spelat en botmatch ska inte rankas mot
 * spelare som byggt sin ELO över tid.
 */
export function isRankable(username: string | null | undefined): boolean {
  const name = (username ?? "").trim();
  return name.length > 0 && !isAutoUsername(name);
}
