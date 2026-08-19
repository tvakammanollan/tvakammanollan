/**
 * Utgående e-post — via Resend, med `fetch`.
 *
 * Ingen SDK, av samma skäl som Stripe-klienten inte har någon: paketet måste
 * konfigureras om för Workers, drar in ett beroende, och båda låsfilerna
 * (`package-lock.json` och `bun.lock`) måste då hållas i synk. Resends API är
 * ett POST med JSON.
 *
 * Tre regler:
 *
 *  1. **Ingenting kastar.** Ett mejl som inte går fram får aldrig ta ner köpet,
 *    registreringen eller buggrapporten som utlöste det. Anroparen får
 *    `{ ok: false }` och kan logga; användaren märker inget.
 *  2. **`reply_to` är alltid satt** och pekar på en brevlåda som läses
 *    (`EMAIL_REPLY_TO`). Avsändaradressen är en no-reply på den verifierade
 *    domänen, eftersom Resend kräver att `from` ligger på en domän vi äger —
 *    men den som svarar ska hamna hos en människa, inte i tomma intet.
 *  3. **Ej konfigurerat är ett giltigt läge.** Utan `RESEND_API_KEY` loggas
 *    mejlet och släpps. Så fungerar lokal utveckling utan att skicka riktig
 *    post till riktiga adresser.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Avsändare. Måste ligga på den domän som är verifierad i Resend. */
export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Tvåkommanollan <no-reply@tvakommanollan.se>";
}

/**
 * Adressen svar landar på. Måste vara en brevlåda som faktiskt läses —
 * `info@tvakommanollan.se` ligger hos Strato och är levande.
 */
export function emailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO ?? "info@tvakommanollan.se";
}

/** Adressen som får driftnotiser (nya leads, buggrapporter). */
export function emailAdmin(): string {
  return process.env.EMAIL_ADMIN ?? emailReplyTo();
}

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Överskriver `EMAIL_REPLY_TO` för det enskilda utskicket. */
  replyTo?: string;
  /** Etikett i loggen, så ett tyst bortfall går att spåra till rätt flöde. */
  tag: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  /** "unconfigured" = ingen nyckel; utskicket hoppades över med flit. */
  reason?: "unconfigured" | "error";
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY saknas — hoppar över "${input.tag}"`);
    return { ok: false, reason: "unconfigured" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo ?? emailReplyTo(),
      }),
    });

    if (!res.ok) {
      // Resends felsvar innehåller inte mottagaradressen, så det är säkert
      // att logga rakt av.
      const body = await res.text().catch(() => "");
      console.error(`[email] "${input.tag}" avvisades av Resend (${res.status}): ${body}`);
      return { ok: false, reason: "error" };
    }

    const json = (await res.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, id: json?.id };
  } catch (e) {
    console.error(`[email] "${input.tag}" kunde inte skickas:`, e instanceof Error ? e.message : e);
    return { ok: false, reason: "error" };
  }
}
