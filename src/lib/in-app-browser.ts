/**
 * Känner igen webbläsaren inuti en app: Instagram, TikTok, Facebook,
 * Messenger, Snapchat, LinkedIn och andra som öppnar länkar i en egen
 * webbvy i stället för i Safari eller Chrome.
 *
 * Google blockerar inloggning i sådana webbvyer (`403 disallowed_useragent`),
 * så "Fortsätt med Google" leder där till en felsida från Google. Trafik från
 * sociala medier landar nästan alltid i en sådan vy. Ren funktion, testad i
 * `in-app-browser.test.ts`.
 */
const APP_MARKERS =
  /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Messenger|musical_ly|TikTok|Bytedance|Snapchat|LinkedInApp|Pinterest|Twitter|Line\/|KAKAOTALK/i;

export function isEmbeddedBrowser(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  if (APP_MARKERS.test(userAgent)) return true;
  // Android WebView märker sig med "; wv)".
  if (/Android/i.test(userAgent) && /;\s*wv\)/i.test(userAgent)) return true;
  // En webbvy på iOS saknar "Safari/", vilket alla riktiga iOS-webbläsare
  // (Safari, Chrome, Firefox, Edge) har med.
  if (/iPhone|iPad|iPod/i.test(userAgent) && /AppleWebKit/i.test(userAgent)) {
    return !/Safari\//i.test(userAgent);
  }
  return false;
}

/**
 * Sökrobotar, länkförhandsvisningar och mätverktyg som kör sidans skript.
 * Kassan skapar ett gästkonto åt en utloggad besökare så att den kan betala
 * direkt (sedan 2026-11-25); en robot som renderar /kassa ska inte få ett.
 * Robotarna står uppräknade i stället för att fångas på "bot" i namnet:
 * telefoner av märket Cubot säger "CUBOT" i sin user agent, och en riktig
 * köpare ska aldrig räknas som robot. Det är en broms mot skräpkonton, inget
 * skydd: en robot som ljuger om sin user agent får ett gästkonto, precis som
 * den hade fått via /matchmaking.
 */
const CRAWLER_MARKERS =
  /(?:google|bing|yandex|duckduck|apple|baidu|slack|twitter|telegram|discord|linkedin|claude|gpt|perplexity|ahrefs|semrush|mj12|dot|petal|amazon|cc|seznam|ads)bot|googleother|bytespider|crawl|spider|slurp|facebookexternalhit|whatsapp\/|embedly|lighthouse|pagespeed|inspectiontool|python-requests|curl\//i;

export function isCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return CRAWLER_MARKERS.test(userAgent);
}
