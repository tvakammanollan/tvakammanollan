# Siffror

De enda tal som får användas i publicerad copy utan en explicit ny
verifiering. Skriv dem exakt så här — aldrig avrundade uppåt, aldrig
"tusentals" eller "massor av" i stället för det faktiska talet. Om ett tal
saknas här: skriv `TODO:` i texten och gå vidare, gissa inte.

**Källa för varje tal nedan är sajtens egen kod och CLAUDE.md, inte en
gissning.** Hittar du en nyare officiell siffra (UHR, antagning.se) för
sådant sajten inte själv äger (provdatum, antagningspoäng, provavgift),
verifiera mot källan direkt i det ögonblicket — den här filen äger bara
sajtens EGNA mätbara fakta, inte myndighetsdata som ändras varje termin.

## Ordbanken

- **10 000+ ord** i ordträningen (ORD-delprovet), byggd på tidigare
  högskoleprov från 1990-talet och framåt plus en del nyare uttryck på
  samma nivå. (`/faq`, `HeroLanding.tsx`)
- **8 761 ord** är det exakta antalet ORD-rader i databasen med `category
  = "ORD"`, om ett exakt tal någonsin behövs i stället för "10 000+".
  Avrunda ALDRIG uppåt förbi det här — "10 000+" är redan en sanning
  eftersom 8 761 avrundas nedåt till "10 000" är fel håll; skriv "8 700+"
  eller "10 000+" beroende på vilket som är sant i det ögonblicket
  copyn skrivs, och kontrollera det aktuella antalet i databasen om
  texten ska vara exakt.
- **100 % av orden har en definition** (betydelse, källhänvisad mot
  svenska.se/SO i första hand).

## Gamla prov-arkivet

- **30 provtillfällen** (VT2012–VT2026)
- **120 provpass** totalt (4 per provtillfälle)
- **4 800 uppgifter** (30 × 160) — inte "15 000+". Det talet finns inte i
  koden och ska inte användas.
- **8 delprov**: ORD, MEK, LÄS, ELF (verbal, 80 uppgifter/prov) · XYZ, KVA,
  NOG, DTK (kvantitativ, 80 uppgifter/prov)
- Varje provpass är **40 uppgifter** på **55 minuter**, med facit.
- En match är **8 frågor på 5 minuter**.

## Poäng och normering

- HP-skalan går **0,00–2,00** i steg om **0,05**.
- Snittresultatet ligger kring **0,9** (`/faq`).
- **1,2** placerar dig över snittet (`/faq`).
- Populära utbildningar (läkare, jurist, civilingenjör i storstäder) kräver
  ofta **1,7 eller högre** — men det här är en grov riktlinje ur FAQ:n, inte
  en programspecifik antagningspoäng. **Antagningspoäng per program måste
  alltid hämtas från antagning.se med årtal, inte återanvändas från den här
  filen** — de ändras varje termin och en gammal siffra här är värre än
  ingen siffra.
- HP-betyget är giltigt i **8 år**.
- Provavgiften är **`HP_FEE_SEK`** kronor — värdet står i
  `src/lib/hp-dates.ts` och ska alltid hämtas därifrån (eller från
  hogskoleprov.nu direkt), aldrig skrivas som ett hårdkodat tal i ny copy.

## Företaget/produkten

- Grundaren **Niklas** fick **1,95** på Högskoleprovet.
- Sajten är **helt gratis**: inga annonser, inget kreditkort, inga
  in-app-köp, ingen premiumnivå. Enda betaltjänsten är personlig
  coachning (**350 kr engångsköp**, se CLAUDE.md — kontrollera mot Stripe
  om priset någonsin citeras, det pinnas medvetet inte i kod).
- ELO-tiers (`RANK_TIERS` i `src/types/index.ts`): **Brons** 600–999,
  **Silver** 1000–1199, **Guld** 1200–1399, **Platina** 1400–1599,
  **Diamant** 1600+. Alla spelare startar på **1000** ELO.
