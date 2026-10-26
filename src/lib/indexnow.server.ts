import { getRequest } from "@tanstack/react-start/server";
import { CANONICAL_HOST } from "./canonical-host";
import { INDEXNOW_ENDPOINT, indexNowBody } from "./indexnow";

/**
 * Anmäler adresser till IndexNow. Kastar aldrig och väntar högst tre
 * sekunder: en sökmotor som inte svarar får inte göra att ett inlägg ser ut
 * att ha misslyckats.
 *
 * Görs bara när anropet kom till den riktiga domänen. En lokal dev-server
 * pratar med produktionsdatabasen, och utan spärren hade varje testinlägg
 * anmälts som en ny sida på sajten.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  try {
    const host = getRequest()?.headers?.get("host")?.toLowerCase();
    if (host !== CANONICAL_HOST) return;
    const body = indexNowBody(urls);
    if (body.urlList.length === 0) return;
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
    // 200 = mottaget, 202 = mottaget men nyckeln är inte verifierad än.
    if (res.status >= 300)
      console.warn(`[indexnow] ${res.status} för ${body.urlList.length} adresser`);
  } catch (e) {
    console.warn("[indexnow]", e instanceof Error ? e.message : e);
  }
}
