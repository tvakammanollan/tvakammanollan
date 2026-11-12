# Ordsannolikheten: regelverk

Varje uppslag i ordbanken får en uppskattad sannolikhet att vara ett av de 20
ORD-orden på nästa högskoleprov. Talet är sajtens uppskattning och ska alltid
presenteras så.

## Pipelinen

```bash
bun run scripts/ord-sannolikhet/historik.ts        # prov per ord + bank.json (läser databasen)
bun run scripts/ord-sannolikhet/typiskhet.ts prep  # blandade omgångar att bedöma
bun run scripts/ord-sannolikhet/typiskhet.ts samla # omgångarna -> hp-typiskhet.json
bun run scripts/ord-sannolikhet/modell.ts          # backtest, rapport.md, src/data/ord-sannolikhet.json
```

Kör om allt efter varje nytt prov i arkivet. Nya ord i banken behöver en
bedömning i `hp-typiskhet.json` innan `modell.ts` går igenom.

## Vad datan säger (mätt 2026-11-12)

- 56 prov 1997–2026, 1 619 ORD-uppgifter, 28 ord testade två gånger, inget tre.
- Kortaste avståndet mellan två förekomster är 6 år, medianen 17,5 år.
- Återanvändningen började på allvar 2021: 23 av 280 ord 2020–2026 mot 5 av
  1 339 dessförinnan. Modellen kalibreras därför mot proven från 2020.
- Ordbankens lektionsord är inte oberoende av proven: listan innehåller
  provorden 1997–2005 och de fyra vårproven 2021–2022. Träffar på lektionsord
  får bara räknas på prov vars ord kom in i banken som egna provrader.

## HP-typiskhet 1–5

Bedöms ord för ord utan att bedömaren ser källa eller provhistorik. Frågan är:
hur väl liknar ordet det UHR brukar välja som uppslag i ORD?

| Betyg | Innebörd | Exempel på typ |
| --- | --- | --- |
| 5 | Kärnan. Bildat allmänspråk som en beläst vuxen kan men många 19-åringar inte: abstrakta lånord från latin, franska och grekiska, och äldre svenska ord som lever i skriven text. | obstinat, fadäs, raljera, varsko, kontentan |
| 4 | Troligt. Mindre vanligt allmänord eller fast uttryck i provets stil. | propsa på, tjänlig, osökt |
| 3 | Möjligt. Antingen lite för vanligt eller lite för smalt. | |
| 2 | Osannolikt. Fackterm (medicin, juridik, teknik, biologi), mycket ovanligt eller ålderdomligt ord, dialekt, slang. | |
| 1 | Nästan uteslutet. Affix, förkortningar, egennamn, utländska citatfraser, ord alla kan. | -ism, a cappella |

Betyget är ett särdrag i modellen, inte sannolikheten. Vikten bestäms av
backtestet, och bär betyget ingenting där tas det ur modellen.

## Klasserna

1. **Testat förut.** Sannolikheten styrs av hur länge sedan. Under 6 år: i
   praktiken noll. Därefter stiger den.
2. **Aldrig testat.** Låg grundnivå, fördelad efter hur provlikt ordet är.

## Det som inte får hända

- Inga procenttal publiceras om banden inte håller i backtestet. Då visas bara
  band.
- Skriv aldrig att ett ord "kommer" på provet. Den högsta sannolikheten i
  banken är under en procent.
