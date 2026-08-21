/**
 * `action`-strängarna för användningshändelser i `audit_log`.
 *
 * De ligger i en egen, ren modul därför att de läses från två håll som inte
 * får importera varandra: skrivningen (`usage.functions.ts`) och läsningen
 * (`landing.functions.ts`, admin-vyn). En felstavning på ena sidan ger inget
 * fel — bara en siffra som står still.
 */

/** Ett inlämnat provpass. Loggas bara för inloggade (kräver auth). */
export const GAMLA_PROV_SUBMIT_ACTION = "usage:gamla_prov_submit";

/**
 * Ett **påbörjat** provpass, med eller utan konto.
 *
 * Gamla prov är sajtens mest använda yta och den enda som fungerar helt utan
 * konto — allt annat spår låg i besökarens localStorage, så servern visste
 * ingenting om den användningen. Det här är det enda serverspåret av ett
 * provpass som faktiskt påbörjats.
 */
export const GAMLA_PROV_START_ACTION = "usage:gamla_prov_start";
