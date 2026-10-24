/**
 * Skickar sajtens adresser till IndexNow efter en deploy. IndexNow delas av
 * Bing, Yandex, Seznam och Naver, och Bings index är det som ChatGPT:s och
 * Copilots webbsök läser. En ny sida kommer därmed med i AI-svaren dagar
 * tidigare än om vi väntar på att Bing hittar den själv.
 *
 *   node scripts/indexnow.mjs                 # alla adresser i de tre sitemaparna
 *   node scripts/indexnow.mjs /forum /ordlista # bara de här
 *
 * Nyckeln ligger som public/<nyckel>.txt och måste vara utrullad innan
 * skriptet körs: IndexNow hämtar filen för att bekräfta att vi äger domänen.
 * Byt aldrig namn på filen utan att byta KEY nedan.
 */
const HOST = "tvakommanollan.se";
const KEY = "cf39542cb6ea930dc589d12fac3ab9d9";
const SITEMAPS = ["sitemap.xml", "forum-sitemap.xml", "ordlista-sitemap.xml"];

async function urlsFromSitemaps() {
  const out = new Set();
  for (const s of SITEMAPS) {
    const res = await fetch(`https://${HOST}/${s}`);
    if (!res.ok) {
      console.warn(`${s}: ${res.status}, hoppas över`);
      continue;
    }
    const xml = await res.text();
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) out.add(m[1].trim());
  }
  return [...out];
}

const args = process.argv.slice(2);
const urls = args.length ? args.map((p) => `https://${HOST}${p}`) : await urlsFromSitemaps();
console.log(`${urls.length} adresser`);

// IndexNow tar max 10 000 adresser per anrop.
for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: batch,
    }),
  });
  // 200 = mottaget, 202 = mottaget men nyckeln är inte verifierad än.
  console.log(`${batch.length} adresser: ${res.status} ${res.statusText}`);
}
