# On-page SEO-checklista

Från Fas 3 i den ursprungliga SEO-prompten. Applicera på varje ny
innehållssida. Rör aldrig sajtens röst för att pricka av en punkt — se
`references/voice.md`. En SEO-perfekt men tråkig sida får folk att studsa,
och studs är också en signal.

## Checklistan

- [ ] Exakt en H1, innehåller det primära sökordet naturligt
- [ ] Primärt sökord inom de första 100 orden i brödtexten
- [ ] 3–5 relevanta H2 som speglar hur folk faktiskt söker
- [ ] Meta title och description enligt mönstret (`pageMeta`/`fitTitle`), unika på varje sida
- [ ] 3–5 interna länkar till relevanta sidor, med beskrivande ankartext (aldrig "läs mer"/"klicka här")
- [ ] 1–3 externa länkar till auktoritativa källor: uhr.se, studera.nu, antagning.se — bara där en genuint relevant sida faktiskt finns, aldrig en gissad URL
- [ ] Ett FAQ-block med 4–8 riktiga frågor, om sidans innehåll faktiskt lämpar sig för det
- [ ] Alla bilder har beskrivande alt-text
- [ ] Tydlig CTA till en duell eller relevant övningssida, placerad både högt och lågt på sidan
- [ ] Uppdaterat-datum synligt när innehållet är tidskänsligt (provdatum, poänggränser, anmälningstider)
- [ ] Läsbarhet: korta stycken, ingen mening längre än ~25 ord i snitt

## Statusaudit — de 8 delprovsguiderna (`/guider/*`)

Gjord 2026-08-22 mot befintliga sidor, innan den här rundans fixar.

| Guide | H1 unik + kodord | H2-antal | Meta unik | Interna länkar | Externa auktoritativa länkar | FAQ | CTA högt+lågt | Uppdaterat-datum |
|---|---|---|---|---|---|---|---|---|
| ord | ✅ | 5 | ✅ | 3 (+4 RelatedGuides) | ❌→✅ | ❌ | ❌→✅ | n/a |
| mek | ✅ | 4 | ✅ | 1 (+4) | ❌→✅ | ❌ | ❌→✅ | n/a |
| las | ✅ | 8 | ✅ | 2 (+4) | ❌→✅ | HowTo (ej FAQ) | ❌→✅ | n/a |
| elf | ✅ | 4 | ✅ | 1 (+4) | ❌→✅ | ❌ | ❌→✅ | n/a |
| xyz | ✅ | 4 | ✅ | 1 (+4) | ❌→✅ | ❌ | ❌→✅ | n/a |
| kva | ✅ | 4 | ✅ | 1 (+4) | ❌→✅ | ❌ | ❌→✅ | n/a |
| nog | ✅ | 4 | ✅ | 1 (+4) | ❌→✅ | ❌ | ❌→✅ | n/a |
| dtk | ✅ | 4 | ✅ | 1 (+4) | ❌→✅ | ❌ | ❌→✅ | n/a |

**"❌→✅" = fixat i commit `4dc7874`** (`GuideTopCta` + en studera.nu-länk per
guide). Se den commiten för exakt diff.

**Kvarstående gap, inte fixat än:**
- **Inget FAQ-block på 7 av 8 guider.** `las.tsx` har ett `HowTo`-schema i
  stället, vilket är rimligt för en steg-för-steg-guide, men de andra sju har
  varken FAQ eller HowTo. Att skriva 4–8 riktiga, icke-uppdiktade frågor per
  guide är ett innehållsjobb, inte en kodfix — bra kandidat för
  Prompt 2-processen (SERP-analys av vad folk faktiskt frågar) snarare än
  att gissas fram här.
- **Inga bilder på någon av de 8 guiderna**, så "alt-text"-punkten är N/A —
  inte en brist, bara inte tillämplig. Skulle en guide få ett diagram (t.ex.
  DTK-guiden med ett exempel-diagram) måste alt-texten läggas till då.
- **Läsbarhet och "sökord inom 100 ord" är inte systematiskt mätta** — de 8
  guidernas första stycken innehåller redan delprovskoden (ORD, MEK, etc.)
  och delprovets svenska namn inom de första meningarna, vilket uppfyller
  kravet i praktiken, men ingen ordräkning har körts per sida.

## Övriga sidtyper — inte auditerade i den här rundan

`/guider/tidspress`, `/guider/bra-resultat`, `/guider/index`, de nya
`/hogskoleprovet-poang/<program>`-sidorna, `/ova/$delprov`,
`/gamla-prov/$term` och ordlistans sidor byggdes eller redigerades redan med
motsvarande mönster (se respektive commit), men har inte körts igenom den
här specifika tabellen. Kör samma Explore-baserade audit mot dem innan du
litar på att de är kompletta.
