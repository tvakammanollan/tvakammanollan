/**
 * Hämtar källtexterna som MEK-uppgifterna skrivs ur.
 *
 *   bun run scripts/mek-gen/fetch-sources.ts scripts/mek-gen/pilot/kallor-01.txt
 *
 * Filen har en artikel per rad (titel på svenska Wikipedia). Texten sparas i
 * `scripts/mek-gen/out/sources/<titel>.txt` (gitignorerad, går att hämta om)
 * och används på två ställen: när uppgiften skrivs, och av `build.ts`, som
 * kontrollerar att uppgiftstexten inte delar för långa ordföljder med källan.
 *
 * Uppgifterna är egen prosa ur källans fakta (REGELVERK.md, C7 nivå D-läge):
 * fakta är fria, formuleringar är det inte.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const UA = "tvakommanollan-mek/1.0 (https://tvakommanollan.se; niklas.pellkvist@gmail.com)";
const OUT = join(new URL(".", import.meta.url).pathname, "out", "sources");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

export function sourceFile(title: string): string {
  return join(OUT, `${title.replace(/[/\\:*?"<>|]/g, "_")}.txt`);
}

async function fetchExtract(title: string): Promise<{ title: string; text: string } | null> {
  const url =
    "https://sv.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1" +
    `&format=json&titles=${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { title?: string; extract?: string; missing?: string }> };
  };
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined || !page.extract) return null;
  // Brödtexten fram till litteraturlistorna räcker; resten är referenser.
  const text = page.extract.split(
    /\n==\s*(Referenser|Källor|Externa länkar|Se även|Noter)\s*==/,
  )[0];
  return { title: page.title ?? title, text: text.slice(0, 12000) };
}

if (import.meta.main) {
  const list = process.argv[2];
  if (!list) {
    console.error("Ange en fil med en artikeltitel per rad.");
    process.exit(2);
  }
  const titles = readFileSync(list, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  let saknas = 0;
  for (const t of titles) {
    const file = sourceFile(t);
    if (existsSync(file)) continue;
    const got = await fetchExtract(t);
    if (!got) {
      console.log(`SAKNAS  ${t}`);
      saknas++;
      continue;
    }
    writeFileSync(
      file,
      `${got.title}\nhttps://sv.wikipedia.org/wiki/${encodeURIComponent(got.title.replace(/ /g, "_"))}\n\n${got.text}`,
    );
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log(`${titles.length} titlar, ${saknas} saknas`);
}
