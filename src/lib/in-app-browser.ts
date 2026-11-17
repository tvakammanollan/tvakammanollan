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
