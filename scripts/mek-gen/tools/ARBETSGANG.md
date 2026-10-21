# Arbetsgången för en MEK-batch

Läs `../REGELVERK.md` först. Den här filen beskriver det praktiska: hur en
batch om 50 uppgifter tas fram, kontrolleras och blindprövas. Batch 1–24 är
gjorda så här; `batcher/g22.py`–`g24.py` är förlagor att efterlikna.

Kör allt från repots rot. `bun` och `python3` behövs.

## 1. Källor

Två listor per batch i `pilot/`:

- `kallor-NN.txt`: rubriken `# Batch NN: Wikipedia` och sedan en svensk
  Wikipedia-titel per rad (cirka 44).
- `kallor-NN-web.txt`: rubriken och sedan `url | 1177 Titel | 1177`
  (cirka 6 sidor från 1177.se, för medicin).

Kör `scripts/mek-gen/tools/prep.sh NN`. Skriptet

- flaggar `USED-WIKI` / `USED-WEB` för det som redan finns i en tidigare
  batch, och sådant ska bytas ut;
- hämtar källorna till `out/sources/` (gitignorerad);
- skriver ett sammandrag till `out/batchNN-sources.txt`;
- flaggar `SAKNAS`, `KORT-WIKI` (under 700 tecken), `FLERTYDIG` och
  `FÖR KORT` (en webbsida som inte gick att läsa). Byt ut dem och kör igen.

En källa per uppgift. Två uppgifter ur samma källa avslöjar varandra.

Ämnesfördelning per batch, ungefär: med 7, kul 5, his 5, sam 5, bio 4,
lit 4, utb 4, eko 4, jur 3, fil 2, mil 2, psy 2, spr 2, tek 1.

## 2. Uppgifterna

Skriv `tools/batcher/gNN.py` (kopiera huvudet från `g24.py`): 20 enluckor
(`one`), 20 tvåluckor (`two`) och 10 treluckor (`three`), och sist
`write(NN)`. `python3 tools/batcher/gNN.py` skriver `pilot/src-NN.json`.

- **Egen prosa.** Aldrig sex ord i följd ur källan. Skriv om meningarna helt.
- **Nyckeln får inte stå i texten**, inte ens som ordstam (`samman` i texten
  läcker nyckeln `sammanslutning`).
- **Inga tidsord** (i dag, nyligen, just nu, i år) och inga ` – ` i
  förklaringarna.
- **Varje lucka har fyra olika värden.** Egennamn och siffror blir aldrig luckor.
- **Enluckor:** distraktorerna ska höra till samma fält och låta rimliga. Ta
  aldrig med nyckelns motsatsord, och inte heller tre synonymer till varandra.
  Båda gör facit gissbart utan text.
- **Flerluckor:** varje distraktor är en sammanhängande uppsättning och faller
  på minst en lucka med ett skäl man kan formulera. Mönstret står i `T2/F2` och
  `T3/F3`: den första distraktorn passar i alla luckor utom den sista, den andra
  passar i alla utom den första, och den tredje faller överallt. Kontrollera
  att en "delpassning" som ska falla verkligen faller.
- **Förklaringen** säger varför facit passar (textens ledtråd), vilka
  distraktorord som också fungerar, och varför resten faller.

## 3. Kontrollerna

Alla kontroller ska vara gröna innan blindprovet.

```bash
python3 scripts/mek-gen/tools/batcher/gNN.py
bun run scripts/mek-gen/build.ts scripts/mek-gen/pilot/src-NN.json | grep -E "UNDERK|varning|underkända"
bun run scripts/mek-gen/tools/overlap.ts scripts/mek-gen/pilot/batch-NN.json   # 6+ ord ur källan
bun run scripts/mek-gen/tools/quota.ts        # ska ge nyckel:[] distraktor:[]
python3 scripts/mek-gen/tools/longest.py scripts/mek-gen/pilot/batch-NN.json   # högst 3
bun run scripts/mek-gen/saol-check.ts scripts/mek-gen/pilot/batch-NN.json    # 0 saknas, tar några minuter
```

- `kopierar_källan` och utskrifter från `overlap.ts` åtgärdas genom att
  skriva om meningen. Kör om tills inget återstår.
- `quota.ts` listar ord som använts för ofta i hela banken. Byt ut dem i den
  nya batchen.
- `nyckel_i_texten` och `luckor_tätt` är varningar men ska ändå rättas.

## 4. Blindprovet

```bash
python3 scripts/mek-gen/blind.py prep <katalog> blindNN scripts/mek-gen/pilot/batch-NN.json
```

Det skriver `blindNN-text.txt` (med text) och `blindNN-utan.txt` (bara
alternativen). Två oberoende lösare utan tillgång till facit:

- **Med text:** svar till `blindNN-svar.json`, ett objekt per uppgift:
  `{"id","val","sakerhet","andra_forsvarbara":[{"alt","skal"}],"problem"}`.
- **Utan text:** gissningar till `blindNN-gissning.json`:
  `{"id","gissning","signal","varfor"}`.

`python3 scripts/mek-gen/blind.py score <katalog> blindNN scripts/mek-gen/pilot/batch-NN.json`

- Med text ska bli 50/50. Ett fel betyder att uppgiften har två svar eller
  inget, och den ska skrivas om.
- Utan text ska ligga på högst 72 % (arkivet ligger på 62 %). Ligger det
  högre ska distraktorerna i enluckorna skrivas om.
- Gå igenom `SE ÖVER` och `problem`. Om en distraktor är försvarbar byts den ut.

## 5. Commit och import

Committa de fyra filerna `pilot/kallor-NN.txt`, `pilot/kallor-NN-web.txt`,
`pilot/src-NN.json`, `pilot/batch-NN.json` och `tools/batcher/gNN.py`, med
meddelandet `feat(mek): batch NN (X totalt)`.

Importen till produktion (`bun run scripts/import-mek-generated.ts --apply`)
kräver `SUPABASE_SERVICE_ROLE_KEY` i `.env.local` och görs bara av den som
har nyckeln. Importskriptet läser endast batchfiler som är incheckade och
oförändrade.
