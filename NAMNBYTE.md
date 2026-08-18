# Namnbytet till Tvåkommanollan — vad som är gjort och vad du måste göra själv

Datum: 2026-08-18. Allt under "Gjort" ligger i arbetsträdet, ocommittat.

Konventionen: **`Tvåkommanollan` med å i all text en människa läser**,
`tvakommanollan` med a i domän, paketnamn, user-agents, lagringsnycklar och
allt annat som inte tål å.

---

## Gjort i koden (168 textträffar + identifierare)

| Vad | Från | Till |
| --- | --- | --- |
| Visningsnamn, 58 filer | `HP Kampen` / `HP Kampens` | `Tvåkommanollan` / `Tvåkommanollans` |
| JSON-LD `alternateName` | `HP-Kampen` | `Tvakommanollan` |
| Bot-UA (3 scrapers + `src/server.ts`) | `HPKampen-Bot/1.0` | `Tvakommanollan-Bot/1.0` |
| Analys-UA | `HPKampen-Analysis/1.0` | `Tvakommanollan-Analysis/1.0` |
| Import-UA (6 py-filer) | `hpkampen-import/1.0` | `tvakommanollan-import/1.0` |
| Orddefinitions-UA + URL | `hpkampen-orddefs` + `https://hpkampen.se` | `tvakommanollan-orddefs` + `https://tvakommanollan.se` |
| MCP-servernamn (2 filer) | `hpkampen-mcp` | `tvakommanollan-mcp` |
| Ångerrättsmejl i `/villkor` | `info@hpkampen.se` | `info@tvakommanollan.se` |
| Edge-funktionens datakälla | `https://hpkampen.se/gamla-prov-data.json` | `https://tvakommanollan.se/…` |
| Paketnamn (`package.json`, `package-lock.json`) | `tvakammanollan` | `tvakommanollan` |
| Workspace-fil | `hpkampen.code-workspace` | `tvakommanollan.code-workspace` |
| Palettrubrik i `styles.css` | `HPKAMPEN PALETTE` | `TVÅKOMMANOLLAN PALETTE` |
| Konkurrensanalysens fält | `hpkampenStrengths` | `tvakommanollanStrengths` |
| `README.md` "Live app" | `hpkampen.lovable.app` | `tvakommanollan.se` |
| `FORUM_PLAN.md` | `hpkampen.se` | `tvakommanollan.se` |
| Stripe-testfixtur | `whsec_hpkampen` | `whsec_tvakommanollan` |

### Lagringsnycklarna — bytta **med överflyttning**

`hpk-analytics-consent` → `tkn-analytics-consent`  (flyttas över)
`hpk-coaching-prompt` → `tkn-coaching-prompt`  (flyttas över)
`hpk:consent-changed` → `tkn:consent-changed`  (event, ingen lagring)
`hpk:ach:v1:<uid>` → `tkn:ach:v1:<uid>`  (baslinje för utmärkelser)
`hpk:wotd:<datum>` → `tkn:wotd:<datum>`  (dagens ord, cache)
`hpk:achievements:check` → `tkn:achievements:check`  (event, ingen lagring)

De två sista lagringsnycklarna behöver **ingen** överflyttning:
utmärkelsevakten seedar baslinjen tyst när nyckeln saknas (`readSeen`
returnerar `null` → `writeSeen` utan att fira), så ingen får en skur av gamla
pop-uper. Dagens ord är en cache som ändå faller ut vid midnatt.

Ett rent byte hade tolkats som "inget val gjort": varje besökare som redan
svarat om samtycke hade fått bannern igen, och varje köpare av studieupplägget
hade fått nudgen igen (`stopped` ligger i den nyckeln). Båda modulerna läser
därför den gamla nyckeln en gång, skriver om den till den nya och tar bort den
gamla. Pinnat med 9 nya tester i `consent.test.ts` och `coaching-prompt.test.ts`.

Ta bort överflyttningen tidigast när `hpk-`-nycklarna rimligen hunnit försvinna
ur besökarnas webbläsare — tidigast om ett år.

### Medvetet **inte** ändrat

- **`wrangler.jsonc`-routerna för `hpkampen.se`** och `LEGACY_HOSTS` i
  `src/lib/canonical-host.ts` + dess test. Det är 301:ans källa, inte namnet.
  Städas de bort dör omdirigeringen som Google ska följa i minst ett år till.
- **CLAUDE.md:s historik** om domänflytten. Den beskriver den gamla domänen och
  måste förbli sann. Ett nytt avsnitt **"Namnet (2026-08-18)"** är tillagt med
  reglerna ovan.
- **`public/hpkampen-1778669612-72e6848caa7e6744.txt`** — verifieringsfil åt en
  tredje part (innehållet = filnamnet). Se punkt 5 nedan.

---

## Måste göras för hand — du kommer inte åt det härifrån

### 1. Worker-namnet `tvakammanollan` (stavfel: "kamma", inte "komma")

`wrangler.jsonc` rad 3. **Rör den inte i en vanlig deploy.** Namnet är Workerns
identitet: byts det skapar nästa deploy en *ny* Worker medan den gamla behåller
routerna — sajten släcks tyst medan bygget ser grönt ut.

Ordningen om det ska rättas, som två deployer:
1. Skapa Workern `tvakommanollan` med `wrangler deploy` från en gren där bara
   namnet är ändrat, **utan** `routes` i konfigen.
2. Flytta de fyra routerna (`{,www.}tvakommanollan.se/*`,
   `{,www.}hpkampen.se/*`) till den nya Workern.
3. Verifiera `https://tvakommanollan.se/api/health` → 200 och att
   `hpkampen.se` fortfarande 301:ar.
4. Ta bort den gamla Workern.
5. Kontrollera att **secrets följt med**: `SUPABASE_SERVICE_ROLE_KEY`,
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CALENDLY_API_TOKEN`. De är
   bundna per Worker och följer *inte* med automatiskt. `wrangler versions
   secret put <NAMN>` + `wrangler versions deploy "<id>@100%"`.

Alternativet — och det billigare — är att låta Workern heta fel. Ingen användare
ser namnet.

### 2. GitHub-repot och den lokala katalogen

Repot och `~/tvakammanollan` bär samma stavfel. Byter du reponamn i GitHub:
Cloudflare Workers Builds är kopplat till repot och kopplingen måste läggas om,
annars slutar `push till main = deploy` att fungera utan att något felar.

### 3. Utgående mejl

`info@hpkampen.se` och `info@tvakommanollan.se` är båda levande hos Strato.
Koden pekar nu enbart på den nya. Innan du stänger den gamla brevlådan:
kontrollera Stripe-kvittonas avsändare och Calendly-inbjudningarnas
"från"-adress.

**Kvarstår oberoende av namnbytet:** ingen av domänerna har SPF-post trots
`_dmarc p=reject`. Utgående mejl riskerar att avvisas. En TXT på apex i
respektive zon.

### 4. Externa konton och profiler — inget av detta finns i repot

- **Stripe**: produktnamnet på studieupplägget syns på kvittot och i kassan.
- **Calendly**: event-typens namn och beskrivning syns i tidsväljaren.
- **PostHog**: projektnamnet.
- **Supabase**: projektnamnet, och `site_url` / `uri_allow_list` i auth-konfigen
  (`GET/PATCH https://api.supabase.com/v1/projects/<ref>/config/auth`) —
  kontrollera att de pekar på `https://tvakommanollan.se`.
- **Google Search Console**: lägg till `tvakommanollan.se` som egendom och kör
  adressändringen från `hpkampen.se` om det inte redan är gjort.
- **Sociala konton**, om några finns.

### 5. `public/hpkampen-1778669612-72e6848caa7e6744.txt`

En verifieringsfil (innehållet är samma sträng som filnamnet). Den hör till
någon tredje part — ta reda på vem (Lovable? en annonsleverantör?) innan du gör
något. Fungerar verifieringen fortfarande: låt den ligga, den är inte ett
varumärke. Behövs den inte: radera filen.

### 6. Delningsbilden

`public/og-image-3.png` har `tvakommanollan.se` tryckt i nederkanten och är
alltså redan rätt. Men **bilden visar inget namn** — vill du ha "Tvåkommanollan"
i motivet måste den ritas om för hand (det finns inget generatorscript), och då
gäller regeln: **ny bild = nytt filnamn** (`og-image-4.png`), annars serverar
Facebook, LinkedIn, Slack och Snapchat den gamla i månader. Fyra ställen följer
med: `__root.tsx` (`og:image` + `twitter:image`), `guider-meta.tsx`,
`manifest.json` och kommentaren i `page-meta.ts`.

### 7. SEO — värt att veta, inget att fixa

Titlarna blev 5 tecken längre ("HP Kampen" → "Tvåkommanollan"). De flesta låg
redan över Googles klippgräns, och det är varumärkessuffixet som klipps — det
är normalt. Men **"HP" försvann ur varumärkesdelen av varje titel**. De flesta
titlar har kvar "HP" eller "Högskoleprovet" i själva rubriken; kontrollera i
Search Console om klickfrekvensen faller på de sidor som inte har det.

---

## Verifiering

Kört efter ändringarna, i CLAUDE.md:s ordning:

- `npx tsc --noEmit` — rent
- `npx eslint` på alla ändrade filer — 0 errors (29 prettier-ombrytningar som
  det längre namnet orsakade är `--fix`:ade, bara i filer som ändå ändrats)
- `npm run test` — 229 tester, gröna
- `npm run build` — exit 0
- SSR-röktest mot dev-servern: `/`, `/om`, `/faq`, `/guider`, `/villkor`,
  `/kontakt`, `/leaderboard`, `/integritetspolicy`, `/hogskoleprovet-datum`
  → 200; ogiltig slug → 404; `/om` levererar 25 × `Tvåkommanollan`,
  `<title>Om Tvåkommanollan · varför sajten finns</title>`,
  `og:site_name="Tvåkommanollan"`.
- `bun install --frozen-lockfile` — går igenom trots det nya paketnamnet, så
  CI-bygget påverkas inte.

Kvar: `grep -ri "hp kampen"` ger noll träffar i hela repot.
