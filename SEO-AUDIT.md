# SEO-audit — tvakommanollan.se

Senast uppdaterad 2026-08-22. Skriven efter två granskningsrundor: en extern
SEO/AIO-rapport (Semrush Site Audit) och en teknisk genomgång riktad mot det
en sådan rapport missar (renderingsmetod, CWV, strukturerad data-eligibilitet).

## Sammanfattning

Sajten är byggd rätt från grunden för SEO: TanStack Start SSR:ar alla
innehållssidor (ingen ren CSR-sida hittades förutom `/leaderboard`, som
fixades i den här rundan), bilderna är redan WebP, `font-display: swap` var
redan på plats, och sitemap/robots.txt/JSON-LD-infrastrukturen fanns redan.
De hittade problemen var få men träffade många sidor samtidigt (en trasig
länk i en delad komponent syns på alla sidor som länkar dit) — se
"Redan åtgärdat" nedan för vad som redan är fixat och pushat.

## Prioriterad lista — kvarstående/nya fynd

| Problem | Sidor som berörs | Effekt | Insats | Föreslagen åtgärd |
|---|---|---|---|---|
| Google har avvecklat "Practice problems"-strukturerad data (jan 2026) | — | — | — | **Gör ingenting.** Video-prompten som låg till grund för den här rundan föreslog att lägga till `Quiz`/`PracticeProblem`-schema på `/ova/*`. Verifierat mot developers.google.com: funktionen är helt borttagen ur Sök, Rich Results Test och dokumentationen. Implementera inte. |
| Ordlista i tema/svårighetsgrad, inte bara bokstav | `/ordlista/*` | Medel | M | Föreslaget, ej byggt. Kräver en svårighetsgrads-taggning av orden (finns inte i datan idag) — antingen en enkel heuristik (ordlängd + frekvens i arkivet) eller manuell kuratering av en första lista ("Svåra ord högskoleprovet"). |
| Sökordskluster per guide | De 8 delprovsguiderna | Medel | M | Föreslaget, ej byggt. Kräver riktig sökordsdata (Search Console, se "Efter deploy" nedan) snarare än gissade svenska fraser — annars optimerar vi mot fel frågor. |
| Publiceringskadens (3–5 sidor/vecka, 6–8 v. före toppar) | Alla nya sidor | Låg (process, ej kod) | S | Antaget som arbetssätt framåt, inget att bygga. |

## Redan åtgärdat den här rundan (för sammanhanget, inte att göra om)

- **`/leaderboard` var helt klientrenderad.** Topplistans data hämtades bara
  i en `useQuery` i webbläsaren — en crawler utan JS (precis som Semrush
  körde) såg en tom tabell. Ordantalet på sidan var därför bara 142 trots
  att den har rejält med innehåll. Fixat: en route-`loader` hämtar nu
  standardfliken (verbal, "alltid") server-side och sås in som
  `initialData` i samma `useQuery` — flik-byten, "Denna vecka" och
  "Vänner" fungerar precis som innan, verifierat i webbläsare.
- **CLS-risk på `/ova/xyz` och `/ova/kva`:** exempel-bilderna hade ingen
  reserverad höjd (`imageAspect` extraherades aldrig till `exempel.json`).
  Fixat i både datapipelinen (`build.py`) och typen/renderingen
  (`ProvExample.imageAspect`, `style={{aspectRatio}}` på `<img>`).
- **`exempel.json` var en inaktuell ögonblicksbild.** En pågående, separat
  insats konverterar successivt XYZ/KVA/NOG-uppgifter från bildutsnitt till
  ren text (`scripts/hp-import/apply_quant_text.py`, commit-serien
  "provpass X till text"). `exempel.json` byggdes bara om vid `build.py`-
  körning och hade inte fångat upp de konverteringarna. Ett nytt,
  fristående skript (`refresh_examples.py`) bygger om **bara** den filen ur
  redan committad data, utan att röra bildpipelinen eller konfliktera med
  den pågående konverteringen. Resultat: `/ova/xyz` gick från 6/6
  bildbaserade exempel till 6/6 textbaserade (med riktig KaTeX-rendering),
  `/ova/kva` från 6/6 till 5/6. Ordantal: XYZ 317→559, KVA 334→546.
- **Fontpreload saknades.** `InstrumentSans-Regular.woff2` (all brödtext)
  och `YoungSerif-Regular.woff2` (alla rubriker) upptäcktes förut först när
  CSS:en hunnit parsas till `@font-face`. Nu preloadade i `__root.tsx`.
- Bildformat (WebP), kodsplittning per route (Vite/TanStack Router) och
  `font-display: swap` var redan på plats — inget att göra.
- Se tidigare commits samma dag för: trasig `/ova/läs`-länk, 82 sidors
  redirect-kedja via `/matchmaking`, WebApplication-schemat flyttat till
  startsidan med riktiga recensioner, dubblerat varumärke i 15 sidors
  `<title>`, trasig extern länk på `/villkor`, saknad HSTS på
  www-redirecten, samt tunt innehåll på ordlistans bokstavssidor och
  gamla prov-terminssidorna.
- **Cloudflares AI-bot-block i `robots.txt` avstängt** (din åtgärd i
  Cloudflare-dashboarden) — troligen den enskilt viktigaste orsaken till
  att inget AI-svarsverktyg citerat sajten.
- **Poänggränser per program byggda** (`/hogskoleprovet-poang/<program>`,
  `src/routes/hogskoleprovet-poang_.$program.tsx`), sju sidor: läkare,
  civilekonom (Handelshögskolan), teknisk fysik, psykolog, jurist,
  tandläkare, sjuksköterska. Se avsnittet nedan för källor och datum —
  detta ersätter den tidigare "kartlagt, ej byggt"-raden.

## Poänggränser per program — källor och underhåll

Byggda 2026-08-22, all data hämtad **live** ur UHR:s antagningsstatistik-
verktyg (uhr.se/studier-och-antagning/antagningsstatistik, urval 2, HT 2026)
via en riktig webbläsarsession — inte skrapad från tredje part, inte
gissad. Civilekonomprogrammet är undantaget: Handelshögskolan i Stockholm
har egen antagningsstatistik-sida med historik sedan 2020, citerad direkt
dit i stället för UHR.

**Så uppdaterar du siffrorna nästa antagningsomgång:**

1. Gå till `https://www.uhr.se/studier-och-antagning/antagningsstatistik/`,
   välj rätt termin (`HT`/`VT` + år) i dropdownen och sök på programmets
   namn — sökrutan fyller URL:en `?astasearchperiod=HTxx&astasearchfor=...`
   som går att länka direkt till.
2. Läs raden för urvalsgrupp **Högskoleprov (HP)** ("Poängen som visas är
   den lägsta som en antagen person hade i urvalsgruppen").
3. Uppdatera motsvarande `schools`-rad och `verifiedAt` i
   `hogskoleprovet-poang_.$program.tsx`. Lägg aldrig in ett tal du inte
   själv läst av på det sättet.

**Kända luckor, inte fel:** Umeå universitet saknas på jurist- och
läkarsidorna (dess program dök inte upp under samma sökterm som gav träff
för övriga lärosäten — värt att undersöka med en egen sökning om sidan ska
kompletteras). Sjuksköterskeprogrammet visar fem exempel av ~25 möjliga
studieorter, valda för att visa spridningen (0,45–1,10) snarare än att vara
en fullständig lista.

## Föreslagen innehållsarkitektur (kartläggning, ej byggt)

Enligt Fas 4 i den ursprungliga prompten — det här är förslag som väntar på
ditt godkännande, inte kod som redan finns.

### Ordlista i teman

Ett nytt lager ovanpå bokstavsregistret: `/ordlista/tema/svara-ord`,
`/ordlista/tema/vanligast` osv. Kräver antingen en enkel, transparent
heuristik (t.ex. ordlängd + hur sällan ordet dyker upp i vardagssvenska)
eller manuell kuratering av en första lista. Bokstavsregistret och de
enskilda uppslagen rörs inte — det här är ett tredje sätt att bläddra, inte
en ersättning.

### Sökordskluster per guide

Kräver riktig sökordsdata för att inte gissa fel på hur svenskar faktiskt
formulerar sig. Se "Efter deploy" nedan — Search Console-datan (frågor med
position 8–20) är rätt källa, inte en modellgissning.

## Efter deploy — manuella steg (inte kod, men värda att göra)

1. **Google Search Console**: verifiera domänen om det inte redan är gjort,
   skicka in sitemapen, och filtrera Prestanda-rapporten på frågor med
   position 8–20 och många visningar — det är sidorna närmast att lyfta,
   och den datan är den bästa källan till sökordskluster ovan (bättre än
   ett externt verktygs gissning).
2. **Bing Webmaster Tools**: importera direkt från GSC, tar ~5 minuter.
3. **Produktanalys utöver besök**: andel som startar en duell, andel som
   slutför den, och andel som är tillbaka dag 2 — redan mätbart via
   `trackEvent()` (se CLAUDE.md, "Product events"), men värt att bygga en
   egen vy för i admin-dashboarden om det inte redan finns en.
4. **Omnämnanden, inte köpta länkar**: studentkårer, gymnasiers
   studievägledare, HP-communities, relevanta trådar på Flashback/Reddit.
   Köp aldrig länkpaket.

## Referensmaterial för framtida innehåll

`references/voice.md`, `humor.md`, `opinions.md`, `stats.md` och
`stories.md` är byggda den här rundan — extraherade ur befintlig copy
(`/om`, `/faq`, `HeroLanding.tsx`), inte uppfunna. Läs dem innan du skriver
en ny guide eller sida. `stories.md` har medvetet bara `TODO:`-platshållare
— fyll i med riktiga anekdoter, hitta aldrig på en.
