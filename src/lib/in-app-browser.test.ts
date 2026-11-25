import { describe, expect, it } from "vitest";
import { isCrawler, isEmbeddedBrowser } from "./in-app-browser";

const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const CHROME_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const INSTAGRAM_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 357.0.0.25.101 (iPhone15,2; iOS 18_1; sv_SE; sv; scale=3.00; 1179x2556; 657432093)";
const TIKTOK_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_37.5.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/sv Region/SE";
const TIKTOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-S911B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 trill_370504 BytedanceWebview/d8a21c6";
const FACEBOOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/489.0.0.53.81;]";
const SNAPCHAT_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/13.20.0.39 (like Safari/8619.1.26.10.1, panda)";
const GENERIC_IOS_WEBVIEW =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const GENERIC_ANDROID_WEBVIEW =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36";

describe("isEmbeddedBrowser", () => {
  it("släpper igenom riktiga webbläsare", () => {
    for (const ua of [SAFARI_IOS, CHROME_IOS, CHROME_ANDROID, DESKTOP]) {
      expect(isEmbeddedBrowser(ua)).toBe(false);
    }
  });

  it("känner igen appars webbvyer", () => {
    for (const ua of [
      INSTAGRAM_IOS,
      TIKTOK_IOS,
      TIKTOK_ANDROID,
      FACEBOOK_ANDROID,
      SNAPCHAT_IOS,
      GENERIC_IOS_WEBVIEW,
      GENERIC_ANDROID_WEBVIEW,
    ]) {
      expect(isEmbeddedBrowser(ua)).toBe(true);
    }
  });

  it("räknar en saknad user agent som en vanlig webbläsare", () => {
    expect(isEmbeddedBrowser(null)).toBe(false);
    expect(isEmbeddedBrowser("")).toBe(false);
  });
});

describe("isCrawler", () => {
  it("känner igen sökrobotar och förhandsvisningar", () => {
    for (const ua of [
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.204 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)",
      "Mozilla/5.0 (compatible; AdsBot-Google; +http://www.google.com/adsbot.html)",
      "WhatsApp/2.23.20.0 A",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Chrome-Lighthouse",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
      "curl/8.7.1",
    ]) {
      expect(isCrawler(ua)).toBe(true);
    }
  });

  it("släpper igenom vanliga webbläsare och appars webbvyer", () => {
    for (const ua of [
      SAFARI_IOS,
      CHROME_IOS,
      CHROME_ANDROID,
      DESKTOP,
      INSTAGRAM_IOS,
      TIKTOK_ANDROID,
      // Märket heter Cubot: "bot" i en user agent betyder inte robot.
      "Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    ]) {
      expect(isCrawler(ua)).toBe(false);
    }
    expect(isCrawler(null)).toBe(false);
    expect(isCrawler("")).toBe(false);
  });
});
