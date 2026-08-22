# Humor

Ärligt läge: sajtens förklarande copy (FAQ, guider, `/om`, produktbeskrivningar)
är **inte** skämtsam. Den är rak och saklig — se `voice.md`. Det finns ingen
anledning att tvinga in en vits i en guide om normeringen bara för att den
här filen finns.

Personligheten bor i stället i **spelmomenten**, inte i förklaringarna. Två
konkreta ställen där den redan syns:

## Prestationsnamnen (`src/lib/achievements.ts`)

Korta, macho-lekfulla titlar snarare än beskrivande etiketter:
"Vinnarskalle" (vinn 10 matcher), "Eldsjäl" / "Tändad" / "Obändig" (streaks),
"Ordvirtuos" / "Ordlegend" (ordträning). Mönstret är sammansatta ord som låter
som ett smeknamn en lagkompis skulle ge dig, inte en trofébeskrivning. Själva
`description`-fältet bredvid är sedan helt sakligt ("Vinn 10 matcher.") — det
är namnet som bär personligheten, inte förklaringen.

## Gästnamnen (`src/lib/guest-name.ts`)

Deterministiska namn byggda på svenska skogsord: "Gäst ekorre", "Gäst
lönnlöv", "Gäst kantarell". Charmigt genom valet av ord (bär, fåglar, träd —
en sammanhållen, lite mysig kategori), inte genom ordvitsar.

## Om du lägger till en ny spelmoment-text

Följ samma mall: ett kort, associationsrikt namn ur en sammanhållen
kategori (naturord, stridstermer, musiktermer — vad som passar), och en
alldeles saklig förklaring bredvid. Låna aldrig vitsen in i förklaringen
själv.

## Var humor INTE hör hemma

FAQ, juridiska sidor, guider, felmeddelanden, coachningens säljtext. Där
gäller `voice.md` rakt av. En vits i ett felmeddelande om en misslyckad
betalning läser som att sajten inte tar problemet på allvar.
