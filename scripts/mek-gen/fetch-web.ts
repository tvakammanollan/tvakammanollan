/**
 * Hämtar källtexter från andra webbplatser än Wikipedia: myndigheter,
 * museer och institutioner (1177, Riksdagen, Riksbanken, Naturvårdsverket
 * med flera). Uppgifterna skrivs som egen prosa ur källans fakta, precis som
 * med Wikipedia (REGELVERK.md, C7 nivå D): texten kopieras aldrig, men
 * källan anges på varje uppgift.
 *
 *   bun run scripts/mek-gen/fetch-web.ts links <url>   # listar artikellänkar på en sida
 *   bun run scripts/mek-gen/fetch-web.ts fetch <fil>   # hämtar "url | titel | utgivare" per rad
 *
 * Texten sparas som `out/sources/<titel>.txt`, samma plats som
 * Wikipedia-källorna, så att `build.ts` kan jämföra uppgiften mot källan.
 * Utgivare och adress sparas i `out/sources/_web.json`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sourceFile } from "./fetch-sources";

const UA = "Mozilla/5.0 (compatible; tvakommanollan-mek/1.0; +https://tvakommanollan.se)";
const META = join(new URL(".", import.meta.url).pathname, "out", "sources", "_web.json");

export interface WebSource {
  url: string;
  publisher: string;
}

export function readWebMeta(): Record<string, WebSource> {
  return existsSync(META) ? JSON.parse(readFileSync(META, "utf8")) : {};
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  shy: "",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  aring: "å",
  auml: "ä",
  ouml: "ö",
  Aring: "Å",
  Auml: "Ä",
  Ouml: "Ö",
  eacute: "é",
};

function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);
}

/** Brödtexten ur en HTML-sida: helst `<main>`/`<article>`, utan meny, sidfot och skript. */
export function htmlToText(html: string): string {
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(nav|header|footer|aside|form|button)[\s\S]*?<\/\1>/gi, " ");
  const main = h.match(/<main[\s\S]*?<\/main>/i) ?? h.match(/<article[\s\S]*?<\/article>/i);
  if (main) h = main[0];
  h = h.replace(/<\/(p|h[1-6]|li|div|section|tr)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n");
  const text = decode(h.replace(/<[^>]+>/g, " "));
  return text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 40)
    .join("\n");
}

async function get(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

if (import.meta.main) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "links" && arg) {
    const html = await get(arg);
    if (!html) {
      console.error("kunde inte hämta", arg);
      process.exit(1);
    }
    const base = new URL(arg);
    const seen = new Set<string>();
    for (const m of html.matchAll(/<a\s[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      let u: URL;
      try {
        u = new URL(decode(m[1]), base);
      } catch {
        continue;
      }
      if (u.host !== base.host) continue;
      const label = decode(m[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
      const key = u.origin + u.pathname;
      if (!label || label.length < 3 || seen.has(key)) continue;
      seen.add(key);
      console.log(`${key} | ${label}`);
    }
  } else if (cmd === "fetch" && arg) {
    const meta = readWebMeta();
    const lines = readFileSync(arg, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    let fel = 0;
    for (const line of lines) {
      const [url, title, publisher] = line.split("|").map((s) => s.trim());
      if (!url || !title || !publisher) continue;
      const html = await get(url);
      const text = html ? htmlToText(html) : "";
      if (text.length < 600) {
        console.log(`FÖR KORT  ${title} (${text.length} tecken) ${url}`);
        fel++;
        continue;
      }
      writeFileSync(sourceFile(title), `${title} ${url}\n\n${text.slice(0, 12000)}`);
      meta[title] = { url, publisher };
      await new Promise((r) => setTimeout(r, 400));
    }
    writeFileSync(META, JSON.stringify(meta, null, 1));
    console.log(`${lines.length} rader, ${fel} misslyckade`);
    if (fel) process.exitCode = 1;
  } else {
    console.error("användning: links <url> | fetch <fil>");
    process.exit(2);
  }
}
