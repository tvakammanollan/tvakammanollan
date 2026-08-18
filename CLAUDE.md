# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## How to Operate

**1. Look for existing patterns first**
Before adding anything new, check `src/lib/` for existing server functions, helpers, and utilities. Only create new files when nothing fits the task.

**2. Learn and adapt when things fail**
When you hit an error: read the full trace, fix and retest, then update this file with any constraint or quirk discovered (rate limits, timing issues, unexpected behavior).

**3. Ask before making irreversible changes**
DB migrations, pushing to `main`, and any action that affects production require explicit confirmation. Code edits are reversible; deploys and migrations are not.

**4. Keep this file current**
When you discover a better pattern or a gotcha, update the relevant section here. Do not create or overwrite other documentation files without being asked.

**5. Verify before every commit — in this order**
`npx tsc --noEmit` → `npx eslint src` (0 errors) → `npm run test` → `npm run build` → SSR smoke test (curl key routes → 200, invalid slugs → 404). For anything that renders only for logged-in users: headless Chrome with an injected Supabase session (create anon/real session via `POST {SUPABASE_URL}/auth/v1/signup` with the public anon key, put it in localStorage under `sb-<ref>-auth-token`, load the page, assert no "Något gick snett"). One logical commit per change; push only when green.

---

## Commands

```bash
npm run dev        # Start dev server (Vite + TanStack Start SSR)
npm run build      # Production build (Cloudflare Workers via wrangler)
npm run lint       # ESLint
npm run test       # Vitest — unit tests for pure libs (normering, hpScore, achievements, elo)
npx tsc --noEmit   # Type-check without building
```

Tests live next to their modules (`src/lib/*.test.ts`) and use a standalone
`vitest.config.ts` (does NOT load the app vite config, so Lovable/Cloudflare
plugins stay out of test runs).

### Deploy (changed 2026-08-14 — no longer via Lovable)

Supabase, Cloudflare and DNS all live in Niklas' own accounts. Cloudflare Workers
Builds is connected straight to the GitHub repo, so **push to `main` = build +
deploy**, no button to click anywhere. Build command `npm run build`, deploy
command `npx wrangler deploy`.

**`tvakommanollan.se` är sajtens domän sedan 2026-08-18** (`hpkampen.se` var det
2026-08-15 → 2026-08-18). Samma Worker (`tvakammanollan`) serverar båda, genom
fyra routes: `{,www.}tvakommanollan.se/*` och `{,www.}hpkampen.se/*`. Strato är
registrar och mejlvärd för båda (MX `smtp.rzone.de`); DNS ligger i Cloudflare.
**Pushing to `main` changes the live site** — verify before pushing, not after.
`wrangler versions upload` gives a preview URL that serves the build without
touching production; use it for anything you cannot check locally.

- **301:an är avstängd tills `CANONICAL_REDIRECT=on` sätts.** Den pekar på ett
  värdnamn som måste ha en Worker-route först: 2026-08-18 var
  `tvakommanollan.se` proxad i Cloudflare men hade ingen route, alltså 522 —
  och eftersom omdirigeringen gäller allt utom `/api/` hade en utrullning
  släckt hela sajten medan `hpkampen.se` fungerade utmärkt sekunden innan.
  Grinden (`canonicalRedirectEnabled()`) skiljer "koden är ute" från "flytten
  är på". Slå på den när `https://tvakommanollan.se/api/health` svarar 200,
  inte förr.
- **Kanonisk värd hanteras i koden, inte i Cloudflare.** `canonicalRedirect()`
  (`src/lib/canonical-host.ts`, anropad först i `src/server.ts`) 301:ar de tre
  icke-kanoniska värdnamnen till `tvakommanollan.se`. En Redirect Rule i
  dashboarden hade gjort samma sak men inte gått att testa — och undantaget
  nedan är hela poängen med att den är testbar.
- **`/api/` undantas från flytt-301:an.** Stripe följer inte 3xx: en webhook som
  fortfarande pekar på `hpkampen.se` hade läst 301 som misslyckande och slutat
  bokföra köp, tyst, medan kassan såg ut att fungera. Undantaget gör en
  kvarglömd endpoint hos tredje part ofarlig. Ta inte bort det utan att först
  kontrollera var Stripe-webhooken faktiskt pekar.
- **`hpkampen.se` ska ligga kvar registrerad och i Cloudflare.** 301:an och
  HSTS-huvudet (`max-age=31536000`) kräver att zonen behåller giltigt
  certifikat. Google vill ha 301:an kvar i minst ett år efter adressändringen.
- Både `info@hpkampen.se` och `info@tvakommanollan.se` är levande brevlådor
  under övergången; koden hänvisar till den nya. **Varken domänen har SPF-post**
  trots `_dmarc p=reject` — utgående mejl riskerar därför att avvisas. Fixas med
  en TXT på apex i respektive zon.

- **CI installs with `bun`, not npm.** The build runs
  `bun install --frozen-lockfile`, so a dependency added with npm updates
  `package-lock.json`, leaves `bun.lock` behind, and the build dies with
  "lockfile had changes, but lockfile is frozen" — while building perfectly on
  your machine. The repo carries both lockfiles and CI reads only the bun one, so
  run `bun install` and commit `bun.lock` with every dependency change.
- **Builds also fire on feature branches and fail there.** The deploy step targets
  production, so a red build on a branch is expected noise; only judge `main`.
- **A SaaS provider holding the hostname silently beats your own Worker routes.**
  After the nameserver switch the zone was active, records proxied and routes in
  place, yet Lovable still served hpkampen.se: they had it registered as a
  Cloudflare for SaaS *custom hostname*, which the edge matches ahead of the zone
  owner's routes and which also blocks Universal SSL ("This hostname is not covered
  by a certificate"). The certificate is the tell — a SaaS custom hostname gets a
  single-name cert (`DNS:hpkampen.se`), real Universal SSL covers
  `hpkampen.se` *and* `*.hpkampen.se`. Only the other party can release it.
- Public resolvers cache the old A record for a while after a cutover. Query the
  zone's nameservers directly (`dig A hpkampen.se @harlan.ns.cloudflare.com`) —
  a stale public answer looks exactly like a misconfigured proxy.

- **Runtime env vars belong in `wrangler.jsonc`, not the dashboard.** `wrangler deploy`
  treats the config file as the source of truth: the build writes
  `.output/server/wrangler.json` (vars copied from `wrangler.jsonc`) and
  `.wrangler/deploy/config.json` points wrangler at it. Anything set as a plain
  variable in the Cloudflare dashboard is **wiped on every deploy**. Only encrypted
  Secrets survive — that is where `SUPABASE_SERVICE_ROLE_KEY` lives.
- **Secrets need a version deploy.** Bindings are frozen into an immutable Worker
  version, so adding a secret does not affect the running one. `wrangler secret put`
  refuses outright when the newest version is not deployed. Use
  `wrangler versions secret put <NAME>` then `wrangler versions deploy "<id>@100%"`.
- **`env` is always empty in `src/server.ts`.** nitro wraps the Worker and does not
  forward the `env` argument — read `process.env` instead. Bindings *do* reach
  `process.env`.
- `/api/health` reports `supabase` and `service_role`; if the service role key ever
  goes missing again the site still serves but every server function returns empty.

### Environment quirks (hard-won)

- **Node ligger inte på PATH i ett icke-inloggat skal.** Den är installerad som
  officiell tarball i `~/.local/node/bin` (och bun i `~/.local/bun/bin`); båda
  läggs på PATH av `.zshrc`. Ett skal utan profil ser bara anaconda och får
  `command not found: node`. Prefixa med
  `export PATH="$HOME/.local/node/bin:$PATH"`.
- **`SUPABASE_SERVICE_ROLE_KEY` ligger i `.env.local`** (gitignorerad via `*.local`) och pekar på **produktionsdatabasen** — det finns ingen separat utvecklingsinstans. Med den går det att köra REST- och admin-anrop mot skarpa data från terminalen, vilket är hur botkontona städades 2026-08-17. Två följder: `supabaseAdmin` går att anropa lokalt om nyckeln laddas explicit (den läses inte av `vite dev` själv, så i appen är den fortfarande en lazy proxy som kastar vid anrop), och varje sådant anrop träffar riktiga användare. Ta backup före allt som raderar. Nyckeln får aldrig hamna i `.env` — den filen är committad.
- **Lovable pushes its own commits** to `main` ("Changes", MCP updates). If push is rejected: `git pull --rebase origin main`, then re-verify tsc + build (new deps may need `npm install`) before pushing.
- External curls of `/_serverFn/` endpoints always 500 (seroval framing) — not a bug.
- `eslint src` reports ~900 pre-existing `prettier/prettier` errors across files nobody
  has touched. Lint the files you changed (`npx eslint <path>`) instead of the tree, and
  do not run `--fix` repo-wide unless that reformat is the actual task.
- **På Windows kräver `npm run dev` och `npm run build` en lokal lappning.**
  `@lovable.dev/mcp-js` jämför Vites `root` (normaliserad med `/`) mot
  `resolve(root, "src/routes")` (som ger `\`) och kastar
  `routesDir "src/routes" must resolve under …` redan i `configResolved`.
  Pluginet har en oanvänd `normalizePath`-hjälpare precis ovanför; kör den på
  båda sidor i `assertContains` i
  `node_modules/@lovable.dev/mcp-js/dist/stacks/tanstack/vite.js` och jämför mot
  `parent + "/"`, så fungerar både bygge och dev-server. `node_modules` är
  gitignorerad, så lappningen följer aldrig med i en commit — men den försvinner
  vid nästa `npm install` och måste läggas tillbaka. Rapportera den gärna
  uppströms; det är en ren bugg i pluginet.
  Utcheckningen har dessutom `core.autocrlf=true`, så *varje* fil ger
  `Delete ␍` i eslint — filtrera bort dem för att se de riktiga träffarna, och
  kontrollera misstänkta prettier-fel mot `origin/main` innan du rättar dem:
  flera är pre-existerande (`Navbar.tsx:122`, `result.$matchId.tsx:439`).
- Verifying rendered pages: `--dump-dom` snapshots fire before React finishes its
  async queries, so pages look empty at random. Drive Chrome over CDP with
  `--remote-debugging-port` and poll `document.body.innerText` until the expected text
  shows up (Node 24 has a global `WebSocket`, so no puppeteer needed).
- **A copy of the repo needs its own `node_modules` — never symlink it.** With a
  symlink, `vite dev` serves the page but `/@id/virtual:tanstack-start-client-entry`
  404s, so React never hydrates: the HTML is there, every button is dead, and
  nothing is logged. It reads exactly like broken code. Run `bun install` in the
  copy instead (~6 s). This applies to `git worktree` too — the worktree is not
  what breaks hydration, the shared `node_modules` is.
- Isolating a copy is worth it when another session is regenerating `src/data/prov`:
  every `/gamla-prov` route 500s while the files are gone, and `vite dev` caches
  that failed import, so the server must be restarted *after* the data is back.
  Take the data from git (`git archive <sha> src/data/prov | tar -x -C <copy>`)
  and the dataset stays still while you test.

---

## Architecture

**Stack:** TanStack Start (SSR) + React 19 + TypeScript + Tailwind + Supabase + Cloudflare Workers

### Routing & server functions

TanStack Router with file-based routes in `src/routes/`. The route tree (`src/routeTree.gen.ts`) is **auto-generated** — never edit it manually.

Server functions (`createServerFn`) live in `src/lib/*.functions.ts` — these run on the server (Cloudflare Worker) and are called from client components via `useServerFn()`.

File naming: `*.functions.ts` = server functions, `*.server.ts` = server-only helpers (not directly callable from client).

### Auth pattern

- Client: `useAuth()` hook (`src/hooks/useAuth.ts`) — exposes `user`, `profile`, `loading`
- Anonymous play: `supabase.signInAnonymously()` via `useGuestPlay` hook
- Server functions that need auth use `.middleware([requireSupabaseAuth])` — this reads the Bearer token from the Authorization header
- Auth token is automatically injected into server function requests by `installSupabaseFetchAuth()` (called once in `__root.tsx`), which patches `window.fetch` to add the token to all `/_serverFn/` requests

### Supabase clients

- **`supabase`** (`src/integrations/supabase/client.ts`) — browser client, respects RLS
- **`supabaseAdmin`** (`src/integrations/supabase/client.server.ts`) — service role, bypasses RLS, server-only. Used in all `*.functions.ts` handlers

### Supabase types

`src/integrations/supabase/types.ts` is the source of truth for DB types. When adding new tables/columns via SQL migration, **manually add the type definition** to this file — the CLI auto-gen is not used in this project.

### Match flow

Matches have two types: `"verbal"` (ORD, MEK, LAS, ELF) and `"math"` (XYZ, KVA, NOG, DTK). Each type has its own ELO field on the user: `elo_verbal` and `elo_math`.

1. `createMatch` or `inviteFriendToMatch` → creates match row (`status: "waiting"` for private/invite, `"active"` for bot)
2. For invite matches: invite sender waits on `/match/$matchId` (realtime listens for `waiting → active`)
3. `acceptMatchInvite` / `joinMatch` → inserts questions into `match_questions`, sets `status: "active"`
4. Both players answer; timer is 5 minutes from when questions first load (`matchStartedAt` state, not `created_at`)
5. `submitMatch` → scores answers server-side, sets `player{1,2}_submitted_at`; if both submitted, calls `processMatchResultServer` which calculates ELO and sets `status: "finished"`
6. If only one submitted: the other player gets a 30s force-submit countdown via `postgres_changes` realtime

Ranked matchmaking uses a `matchmaking_queue` table and is handled in `src/lib/ranked.functions.ts`. Bot time and score are simulated server-side in `simulateBotMatch` (`src/lib/match.server.ts`).

### ELO & ranks

K-factor tiers in `src/lib/match.server.ts`: `<1500 → 96`, `1500–1800 → 60`, `>1800 → 30`. Bot ELO is randomized ±150 from the player's ELO.

Rank tiers (Brons → Silver → Guld → Platina → Diamant) are defined in `src/types/index.ts` with helpers `getRankForElo()`, `getNextRank()`, `getEloProgressInTier()`. HP score estimation (ELO → 0.6–2.0 scale) is in `src/lib/hpScore.ts`.

### Word practice (ORD spaced repetition)

- `user_word_failed` table tracks failed words with SM-2 fields: `ease_factor`, `interval_days`, `review_streak`, `next_review_at`
- On correct answer: increment streak, increase interval by ease_factor; at streak=5 the row is deleted (word mastered)
- On wrong answer: reset streak to 0, interval to 1 day, decrease ease_factor
- `fetchFailedWordBatch` serves due words sorted by `next_review_at`

### Gamla prov — arkivet och importen

Alla provtillfällen som går att få tag på finns i appen: 30 stycken
(VT2012–VT2026), 120 provpass, 4 800 uppgifter, facit på varje.

**Arkivet är komplett sedan 2026-08-17.** Varje prov har sina fyra räknade
provpass à 40 uppgifter — 30 × 160 = 4 800 — och ELF finns i samtliga 60
verbala pass. Att ett provpass har 30 uppgifter, eller att ett prov saknar
ELF, är därför inte längre något normalt utan ett tecken på att importen
gått fel. Motsvarande gäller delproven: ORD, LÄS, MEK och ELF ska vara 600
var, XYZ och DTK 720, KVA 600, NOG 360.

Datan är **genererad** — redigera aldrig `src/data/prov/` för hand, kör om
importen.

```bash
python3 scripts/hp-import/fetch.py     # laddar ner PDF:er till .hp-cache/ (gitignorerad)
python3 scripts/hp-import/archive_index.py  # register över allt UHR någonsin lagt upp
python3 scripts/hp-import/fetch_elf.py      # originalhäftena med ELF, via gissade namn
python3 scripts/hp-import/harvest_elf.py    # samma sak, men ur arkivregistret
python3 scripts/hp-import/html_elf.py       # ELF ur 2011–2014 års HTML-provsidor
python3 scripts/hp-import/html_prov.py      # hela verbala pass ur samma sidor (2012vt)
python3 scripts/hp-import/adopt_elf.py ~/Downloads          # torrkörning
python3 scripts/hp-import/adopt_elf.py ~/Downloads --apply  # häften hämtade för hand
python3 scripts/hp-import/build.py     # parsar → src/data/prov/ + public/prov-bilder/
python3 scripts/hp-import/build.py --fresh   # rendera om alla bilder också (~12 min)
```

Pipelinen är i Python (PyMuPDF + Pillow) därför att textextraktionen behöver
koordinater per rad och sida; `pip install pymupdf pillow`. Utan `--fresh`
återanvänds bilder som redan finns, vilket tar bygget till några sekunder.

- **Läggs ett nytt prov upp hos UHR** räcker det att köra båda scripten: `fetch.py`
  läser provlistan på studera.nu, och `build.py` skriver om `index.json`,
  `exempel.json` och gamla-prov-delen av `public/sitemap.xml` (mellan
  markörkommentarerna — resten av sitemapen är handskriven).
- **XYZ och KVA lagras som bildutsnitt**, inte text. Bråk, exponenter och rötter
  kommer ur PDF:en som `3 27 x 2 =`; att låtsas att det är text ger fel uppgifter.
  NOG och DTK är löptext, med bildutsnitt som reserv när uppgiften har en figur.
  DTK:s diagramuppslag sparas separat och visas bredvid uppgifterna.
- **ELF finns bara i en del prov.** UHR byter en vecka efter provdagen ut häftet
  mot en version utan den engelska texten (upphovsrätt) — deras länkade filer
  heter `...-utan-elf.pdf`. Originalet raderas dock inte alltid: det ligger kvar
  avlänkat på samma server, och finns annars ofta i Internet Archive.
  `fetch_elf.py` letar rätt på det (se filen för hur namnen gissas) och `elf.py`
  parsar ELF:s tre uppslagstyper. Går originalet inte att hitta på nätet är
  sista utvägen att hämta häftet för hand och köra `adopt_elf.py` (nedan) —
  det är så beståndet från 2012 och framåt blev komplett.
- **`adopt_elf.py` tar emot häften som laddats ner manuellt.** Provtillfälle och
  provpass läses ur häftets egen framsida, så filnamnen spelar ingen roll. Ett
  häfte tas bara emot om `parse_elf` hittar minst åtta uppgifter, facit täcker
  31–40, **och** den svenska delen är ord för ord samma text som den avskalade
  version vi redan har. Det sista kravet är det viktiga: två provtillfällen
  samma termin har identisk framsidelayout men olika innehåll, och utan
  jämförelsen hamnar ett häfte tyst på fel prov.
- **Provdatumet på framsidan är inte alltid det i `sources.json`.** Vårprovet
  2016 står där som 2016-04-04, en måndag; provet skrevs den 9:e, vilket är vad
  UHR:s egen katalognamn (`hp-2016-04-09`) och häftet säger. `adopt_elf.py`
  matchar därför på båda.
- **Provpass som inte står i provlistan byggs ändå.** De år UHR bara publicerade
  proven som webbsidor finns ingen PDF hos dem alls, så `sources.json` känner
  t.ex. bara till 2012vt:s två verbala pass. `build.py` letar därför efter
  `pass{N}-{verbal,kvant}.pdf` i cachen för varje provpass facit täcker, och
  bygger det som hittas. Det är så vårprovet 2012 blev komplett.
- **`utgår` och `ändrat` i facit är inte samma sak.** `C – utgår` betyder att
  uppgiften strukits i efterhand: rätt svar står kvar men poängen räknades
  inte. `D – ändrat` betyder att UHR rättat *vilket* svar som är rätt —
  uppgiften räknas som vanligt. Behandlas de lika blir en giltig uppgift
  markerad som struken, eller så tappas svaret helt och hela provpasset
  underkänns (2012vt provpass 5, uppgift 18 — den enda i arkivet).
- **Vårprovet 2020 ställdes in och skrevs aldrig.** Häftena var redan tryckta,
  och samma prov användes i stället den 25 oktober 2020 — texten är identisk,
  bara framsidans datum skiljer. Ett häfte märkt 2020-04-04 hör alltså till
  höstprovet 2020; se `DATE_ALIASES`. Något eget facit för april finns inte, och
  ska inte letas efter.
- **Ett par provtillfällen står inte på UHR:s provlista** men ligger kvar på
  servern (2013vt, 2012ht). De är uppräknade i `UNLISTED` i `fetch.py`. Hittar
  du fler: jämför provlistan mot `archive_index.py`:s register.
- **2011–2014 publicerades proven som HTML-sidor**, en per delprov, och de
  sidorna rensades aldrig på ELF. `html_elf.py` läser dem ur Internet Archive,
  `html_prov.py` hela verbala provpass. Längre bak än så går inte: den
  kvantitativa delen sattes då som en GIF per uppgift och de bilderna
  arkiverades aldrig, och höstprovet 2011 saknar facit helt.
- **Lästexterna delas i stycken på indrag**, inte på blankrad — provhäftena
  markerar nytt stycke med indrag och ett textblock är ofta en hel spalt.
  Se `Block.paragraphs`. Utan det kommer var sjätte lästext ut som en vägg.
- **ELF-avsnittet har två rubriksättningar** och skiftläget bär informationen:
  `Engelsk läsförståelse – ELF` (2019–) och `DELPROV ELF – ENGELSK
  LÄSFÖRSTÅELSE` (t.o.m. 2018). Sök aldrig skiftlägesokänsligt efter dem —
  varje framsida listar delproven som `ELF (engelsk läsförståelse)` med
  gemener, och då pekas omslaget ut som avsnittets början.
- **Luckuppgifternas alternativ är satta på två sätt.** Från 2019 ligger
  numret i ett eget block och bokstäverna på egna rader; t.o.m. 2018 ligger
  numret först i alternativblocket och sista bokstaven delar rad med sin text
  (`'D prejudice'`). `_gap_alternatives` kräver att bokstäverna kommer i
  ordning A, B, C … så att ett alternativ som självt börjar med `A ` inte klyvs.
- **Engelskan avstavas inte som svenskan.** `join_lines` tar bort bindestrecket
  när nästa rad börjar med gemen, vilket är rätt för `in-vasiv` men fel för
  `present-day` och `working-class`. ELF-blocken sätter därför `english=True`,
  och `_english_compound` behåller strecket när båda leden är egna engelska ord
  medan hopskrivningen inte är det. Regeln kräver gement förled — annars klyvs
  `Cam-bridge` och `Hit-ler` — och ordlistan (`/usr/share/dict/words`) måste
  kompletteras med böjda former, eftersom `workers` och `novelties` saknas där.
  Saknas ordlistan faller importen tillbaka på svenska regler utan att fela.
- **Arkivfilens ELF (`elf-arkiv.json`) är extraherad av någon annan** och har
  spalter inflätade i varandra på sina håll. `build.py` känner igen mönstret
  och hoppar över passets ELF hellre än att visa en text som inte går att läsa.
- **Ett provpass som inte validerar skrivs inte ut.** `build.py` kräver facit på
  varje uppgift och minst fyra alternativ, och listar det som fallerar på slutet.
- Provdatan laddas via `import.meta.glob` i `src/lib/prov-data.ts` — en chunk per
  provpass. Hämta den aldrig över HTTP: den gamla sidan läste
  `https://hpkampen.se/gamla-prov-data.json` (916 kB) i webbläsaren, vilket gjorde
  att lokal utveckling läste produktionsdata.

### ORD-beståndet — var orden kommer ifrån

Ordlistan (`questions` med `category = "ORD"`) byggs av två scrapers, båda mot
hogskoleprovet.nu:

- `scraper/scrape-hp-questions.ts` — nya formatet (2013–). ORD ligger inbakat i
  `verb1.pdf`/`verb2.pdf`, 10 uppgifter per provpass.
- `scraper/scrape-ord-old.ts` — gamla formatet (1977–2011). Egen `ord.pdf` med
  40 uppgifter per prov, och mapparna heter `v2005`/`h2005` i stället för
  `var-2013`/`host-2013`. Kör `bun run scrape:ord-old` → `ord-old-questions.json`,
  sedan `bun run seed:ord-old` (torrkörning) och `--apply` för att skriva.
  Seedaren är idempotent: den läser befintliga ORD-uppslag först och infogar
  bara det som saknas. Kör `scrape:ord-defs` + `apply:ord-defs` efteråt så får
  de nya orden definitioner som resten av beståndet.

**Sätt inte `exam_term` på ORD-rader.** `import-gamla-prov` gör
`delete().not("exam_term", "is", null)` innan den importerar om gamla prov, så
allt med `exam_term` satt raderas nästa gång någon kör den. Terminen ligger i
`tags` i stället (`["2005vt"]`), vilket också är varför resten av ORD-beståndet
har `exam_term` tomt.

Fällor i de gamla PDF:erna — alla hanterade i scriptet, men värda att känna till
om något liknande dyker upp:

- **`/GNNN`-glyfnamn (2000ht–2005ht).** Delmängdsfonterna har `/Differences` med
  namn som `/G228`, där talet är teckenkoden (228 = ä). pdfjs känner bara igen
  `/uniXXXX` och `/uXXXX`, så PDF:erna såg helt tomma ut trots att kodtabellen
  låg i filen. `oversattGlyfnamn` skriver om namnen i byten före parsning.
  **v2006 och h2006 är krypterade** (`/Encrypt`, tomt lösenord) — omskrivningen
  gör xref ogiltig och då tappar pdfjs dekrypteringen ("No password given").
  Byte-längden går inte att bevara, så de två terminerna kräver att PDF:en
  avkrypteras först.
- **MacRoman-deklaration med Latin-1-bytes (v1999, v2001).** "språk" kom ut som
  "sprÂk", "förklaring" som "fˆrklaring". Sju tecken mappas tillbaka i
  `cleanText`.
- **Svarsalternativ som ser ut som sidhuvuden.** v2000 uppgift 31 (*rön*) har
  "anvisningar" som alternativ B, vilket matchade instruktionsordet
  "Anvisningar" och kapade uppgiften mitt itu. En rad får bara räknas som
  sidhuvud när den inte redan tolkats som innehåll — samma sak gäller
  InDesign-sidfötter (`Ord 09A.indd 2`) som annars klistrades sist i alternativ E.
- **Inskannade prov.** Allt t.o.m. 1996 plus h1997–h1998 saknar textlager helt
  och kräver OCR. `h1999` har läsbara frågor men inskannat facit — utan
  verifierade rättsvar importeras de inte. Fyra terminer (h1982, v1983, h1984,
  h1988) har döda länkar på källsidan. Scriptet redovisar varje utelämnad termin
  med orsak i slutet av körningen i stället för att gissa.
- **h2011, v2012 och h2012 finns inte alls** — gamla listan slutar vid v2011 och
  nya börjar vid v2013.
### Forum

Ett Flashback-liknande diskussionsforum: platta trådar, citat, öppet läsbart.
Byggt lika mycket som SEO-motor som community — det är därför **allt** renderas i
route-loaders och aldrig hämtas i klienten.

- **Migration:** `supabase/migrations/20260816120000_forum.sql`. Sju tabeller
  (`forum_categories/threads/posts/reactions/subscriptions/reports` och
  `forum_word_filter`), tre nya kolumner på `users`, och alla skrivningar bakom
  RPC:er.
- **Skrivgrinden är hela spamskyddet.** Sidan har anonym inloggning påslagen, så
  `auth.uid() is not null` betyder "vem som helst, obegränsat antal konton, ett
  HTTP-anrop bort". `public.forum_can_post()` kräver icke-anonymt konto,
  bekräftad mejl, tio minuters ålder, användarnamn och ingen avstängning.
  `forum_post_block_reason()` säger *vad* som saknas, så UI:t kan skriva rätt text.
- **Kvoterna räknas i databasen, inte i `assertRateLimit`.** Limitern i
  `rate-limit.ts` lever per Cloudflare-isolat; RPC:erna räknar rader i ett
  tidsfönster (5 trådar/h, 20 inlägg/h, 30 redigeringar/h, och 1 inlägg/2 min för
  konton med < 5 inlägg). `assertRateLimit` är det billiga första lagret.
- **Nya användare får inte länka.** Inlägg med URL från ett konto yngre än 24 h
  eller med < 5 inlägg får `status='pending'` i stället för att avvisas —
  avvisning lär spammaren vad som släpps igenom. Samma sak för träffar i
  `forum_word_filter`.
- **Ingenting raderas hårt.** `status='deleted'` + `deleted_by` + tidpunkt.
- **`status`-filtret i koden är det riktiga skyddet**, inte RLS-policyn:
  serverfunktionerna kör med `supabaseAdmin`. Enda stället som medvetet läser
  dolt innehåll är `forum-moderation.functions.ts`, där `requireAdmin()` ligger
  först i varje handler.
- **Inläggstext parsas, renderas aldrig som HTML.** `lib/forum-markdown.ts` ger
  ett nodträd som `components/forum/ForumBody.tsx` gör React av. Matte (`$…$`)
  går till befintliga `MathTextLazy`/KaTeX. `dangerouslySetInnerHTML` på
  användarinnehåll finns inte och ska inte tillkomma.
- **Tråd-URL:en har id före slug** (`/forum/kvantitativ/482-hur-loser-man-kva`).
  Uppslag sker på id, så en ändrad rubrik bryter aldrig en gammal länk — fel
  slug 301:as i loadern. Paginering med `?sida=N`, canonical mot sidan själv
  (aldrig mot sida 1, det gömmer inläggen från sida 2 och framåt).
- **Structured data:** `QAPage` med `acceptedAnswer` för `kind='qa'`-kategorier,
  `DiscussionForumPosting` för resten.
- Nya `users`-kolumner (`forum_banned_until`, `forum_ban_reason`,
  `forum_post_count`) är tillagda i `users_protect_sensitive_fields` — utan det
  kunde en användare häva sin egen avstängning via sin RLS-tillåtna UPDATE.
- **Fas 2 är byggd (2026-08-17):** trådsitemap, prenumerationer + notiser, sök,
  reaktioner, bästa svar åt trådstartaren, uppgiftscitat och korslänkblocken.
  - `/forum-sitemap.xml` byggs i `src/server.ts` (inte som route-fil — svaret
    behöver ingen React) ur `src/lib/forum-sitemap.server.ts`. Kvalitetsgrind:
    trådar utan svar och med under 200 tecken skickas inte in. `robots.txt` har
    en andra `Sitemap:`-rad.
  - **Notiser har ingen egen tabell.** De härleds ur
    `forum_subscriptions.last_read_at`, precis som vänförfrågningarna härleds ur
    `friendships`. Man prenumererar automatiskt på trådar man skriver i.
  - **Sök kräver en RPC.** `forum_search`
    (`20260817150000_forum_sok.sql`) — en träff kan komma ur rubriken *eller* ur
    ett inlägg och ska rangordnas på relevans, vilket inte går i PostgREST.
    Söksidan är `noindex`: sökresultat är tunt dubblettinnehåll.
  - **Uppgiftscitat lagras i brödtexten**, som `[[uppgift:2024ht/3/12]]` på egen
    rad, inte i en egen kolumn — då följer referensen med citat, redigering och
    radering utan en andra kodväg. `forum-markdown.ts` parsar den till en
    `exam`-nod och `ExamQuote` renderar kortet; uppgiftstexten laddas först i
    webbläsaren, så en tråd med fem citat drar inte in fem provpass i SSR:en.
  - Reaktionsläget (`fetchMyForumReactions`) hämtas i klienten. Trådsidans
    loader måste förbli användaroberoende — annars finns ingen gemensam HTML
    att indexera, vilket är hela poängen med forumet.
- **Kvar (fas 3):** publika profiler `/u/$username`, bilduppladdning,
  "obesvarade frågor"-vy, veckomejl, edge-cache för utloggade, meta-kategori.
  Och **seedning** — forumet har noll trådar, så sitemapen är tom.

### Topplistan

Tre listor, alla i serverfunktioner med service role: `fetchLeaderboard` +
`fetchWeeklyLeaderboard` (`leaderboard.functions.ts`) och `fetchOrdLeaderboard`
(`word-practice.functions.ts`).

- **Anonyma konton rankas inte** (2026-08-17). `isRankable()` i
  `src/lib/username.ts` är enda definitionen — den täcker både auto-namnen
  `user_<8 hex>` som `handle_new_user()` sätter och tomma namn. Samma funktion
  driver `displayName()` i UI:t, så allt som *visas* som "Anonym" är också
  filtrerat; särar man på dem hamnar namnlösa rader i listan igen.
- **Filtret måste ligga i serverfunktionen.** Listorna är publika endpoints utan
  auth — ett klientfilter är kosmetika. Bakgrunden står i `match-abuse.ts`: fyra
  gästkonton odlade ELO mot bottar och tog hela toppen av den verbala listan.
- **Sålla före `slice()`, aldrig efter**, annars äter de bortfiltrerade raderna
  platser i topp 100. `fetchLeaderboard` läser därför `users` sidvis
  (`SCAN_PAGE`) tills den fyllt `limit` — gästkonton är majoriteten av tabellen,
  så ett enkelt `.limit()` gav en halvfull lista.
- Tröskeln på antal matcher är fortfarande **1** och togs medvetet bort en gång;
  återinför den inte utan att fråga.

### Coachning & Stripe (2026-08-17)

Sajtens enda betalprodukt: **Studieupplägg**, köpt via Stripe Checkout från
coachningskortet på startsidan och coachningsblocket på landningssidan. Före
det här låg där ett bokningsformulär som skrev en rad i `coaching_requests`;
nu skapas raden av servern när kassan öppnas och fylls i av webhooken.

- **Ingen Stripe-SDK.** `src/lib/stripe.server.ts` pratar REST med `fetch` och
  räknar webhook-signaturen med WebCrypto. SDK:n måste konfigureras om för
  Workers och drar in en dependency, vilket i det här repot betyder att både
  `package-lock.json` och `bun.lock` måste hållas i synk. Tre anrop och en HMAC
  är inte värt det. **API-versionen pinnas medvetet inte** — en felstavad
  version ger fel på varje anrop, och fälten vi läser är stabila sedan år.
- **Arkivera aldrig det pinnade priset innan det nya id:t är utrullat.**
  `STRIPE_COACHING_PRICE_ID` läses ur den *deployade* `wrangler.jsonc`, så ett
  byte i arbetsträdet betyder ingenting förrän koden pushats. Arkiveras det
  gamla priset i förväg fortsätter `GET /prices/{id}` att svara — kortet visar
  alltså priset och köpknappen ser normal ut — men
  `POST /checkout/sessions` avvisas med "The price specified is inactive".
  Felet syns först i sista steget, för den som faktiskt tänkte betala. Ordning:
  skapa nytt pris → pusha → verifiera → arkivera gamla. (Hände 2026-08-18.)
- **Produkten har exakt ett aktivt pris: 350 kr engångsköp**
  (`price_1U5jVF…`, satt som produktens `default_price` sedan 2026-08-18).
  Det är medvetet att pinnat id och `default_price` pekar på samma pris —
  innan dess sålde det pinnade id:t 300 kr engångsköp medan reservvägen
  (namnuppslag → `default_price`) hade blivit 350 kr **per månad**. Reserven
  hade alltså börjat dra pengar varje månad den dag varen tappades. Lägger du
  till ett pris: håll ihop dem, eller ta bort reservvägen.
- **Priset står aldrig i koden.** `resolveCoachingPrice()` läser det ur Stripe
  (env `STRIPE_COACHING_PRICE_ID`, annars produkten som heter
  `STRIPE_COACHING_PRODUCT_NAME` och dess `default_price`), cachat 10 min per
  isolat. Ett hårdkodat belopp kan visa en annan siffra än den kassan drar.
  `useCoachingOffer()` delar ett anrop mellan kortet, landningssidan och modalen.
- **Kortet visar `available: false` i stället för att krascha.**
  `fetchCoachingOffer` kastar aldrig: utan `STRIPE_SECRET_KEY` (eller när Stripe
  är nere) visas kontaktvägen i stället för en köpknapp. Startsidan får inte gå
  sönder för att en betalleverantör inte svarar.
- **Redirect-kassan kräver ingen ändring i CSP:n.** Inga kortuppgifter, ingen
  `js.stripe.com`, inget iframe — bara en `window.location` till
  `checkout.stripe.com`. Den publika nyckeln (`pk_live_…`) behövs alltså inte
  alls i klienten; lägg inte in den "för säkerhets skull".
- **Webhooken bokför, tacksidan är reserv.** `/api/stripe/webhook` ligger i
  `src/server.ts` (som `/api/health`): signaturen måste räknas på den **råa**
  bodyn, och en route-fil hade parsat den först. `/coachning/tack` bekräftar
  mot Stripe en gång till så att kvittot syns direkt om webhooken är sen. Båda
  går genom `markCoachingPaid()`, som är idempotent och returnerar `newlyPaid`
  — det är den flaggan som gör att köpet räknas en gång i PostHog och inte en
  gång per omladdning av tacksidan.
- **Kassan öppnas utan konto.** `startCoachingCheckout` använder
  `optionalSupabaseAuth` (`src/lib/auth-optional.server.ts`): inloggad → raden
  får `user_id`, utloggad besökare på landningssidan → `user_id` är null och
  Stripe samlar in mejl och telefon. Att kräva registrering före ett köp är att
  slänga bort halva försäljningen.
- **Formuläret är borta, frågorna finns kvar.** "Vad vill du fokusera på?" och
  "När passar det att höras?" ställs som `custom_fields` i kassan, båda
  frivilliga, och skrivs till `goal` / `preferred_time` av webhooken.
- **Radering av konto rör inte `coaching_requests`.** Det gällde redan förut,
  men nu innehåller raden ett köp — integritetspolicyn säger därför uttryckligen
  att köpuppgifter inte försvinner med kontot. Ändras det ena måste det andra
  ändras.
- Hemligheterna: `STRIPE_SECRET_KEY` och `STRIPE_WEBHOOK_SECRET` som krypterade
  Cloudflare-Secrets (`wrangler versions secret put` + `versions deploy`), och i
  `.env.local` för lokal körning. Aldrig i `.env` eller `wrangler.jsonc` — båda
  är committade. `STRIPE_COACHING_PRODUCT_NAME` är inte hemlig och ligger i
  `wrangler.jsonc`.
- Migration: `supabase/migrations/20260817170000_coachning_stripe.sql`. Släpper
  NOT NULL på `user_id`/`name`/`email`/`preferred_time` (inget av det finns när
  kassan öppnas) och lägger till betalfälten + unikt index på
  `stripe_session_id`, vilket är det som gör dubbelbokföring omöjlig.

### Tidsbokning i coachningen (Calendly, 2026-08-18)

Köparen väljer en tid **innan** kassan öppnas. Modalen har två steg:
erbjudandet, och Calendlys tidsväljare i en iframe. `startCoachingBooking`
skapar raden och länken, `completeCoachingBooking` läser den bokade tiden ur
Calendlys API, skriver den på raden och skapar först då Stripe-sessionen.

- **Ordningen har en känd baksida och den är accepterad.** En Calendly-bokning
  är ett åtagande i samma sekund den görs, medan Checkout går att överge — så
  en tid kan bli stående obetald. Vyn `coaching_obetalda_bokningar` listar dem
  (`paid_at IS NULL AND scheduled_at IS NOT NULL`) och de avbokas för hand via
  `calendly_cancel_url`. Byt inte ordningen "för säkerhets skull": den som redan
  har en tid i kalendern slutför köpet oftare än den som ska höra av sig sen.
- **`utm_content` är hela kopplingen mellan bokning och köp.** Raden i
  `coaching_requests` skapas före tidsvalet just för att dess id ska kunna
  följa med in i Calendly-länken och komma tillbaka i invitee-resursens
  `tracking`. Tas den bort går bokningen inte att knyta till rätt betalning.
  Följden: rader med status `'booking'` blir kvar efter alla som öppnar
  tidsväljaren och ångrar sig. De är avsiktligt inte med i vyn.
- **Tiden hämtas server-side, aldrig från klienten.** `event_scheduled` via
  postMessage innehåller bara URI:er. `fetchCalendlyBooking` slår upp dem —
  och `INVITEE_URI_PATTERN` låser formen till exakt den resursen först, för
  URI:n kommer från webbläsaren och skickas i en fetch med vårt Bearer-token.
  Utan mönstret är det en SSRF som läcker tokenet, tyst.
- **Bara `frame-src https://calendly.com` öppnas i CSP:n.** Calendlys `widget.js`
  används inte: allt scriptet gör är att lyssna på postMessage, vilket modalen
  gör själv. Lägg inte till `script-src` för Calendly.
- **Kassan upprepar inte en fråga som redan ställts.** `buildCoachingCheckoutParams`
  utelämnar `tid`-fältet när `scheduledAt` är satt och `fokus`-fältet när
  Calendly redan fått ett svar (`focusAnswered`). Samma fråga två gånger läser
  som att första svaret inte togs emot.
- **Halvt konfigurerat är inte påslaget.** `calendlyConfigured()` kräver både
  `CALENDLY_EVENT_URL` (publik, i `wrangler.jsonc`) och `CALENDLY_API_TOKEN`
  (krypterad Secret, `wrangler versions secret put` + `versions deploy`).
  Saknas något hoppas steget över och `startCoachingCheckout` går rakt till
  kassan som förut — `fetchCoachingOffer` säger `schedulingEnabled: false` och
  modalen byter knapptext. Det är samma princip som att kortet visar
  kontaktvägen när Stripe saknas.
- **`vite dev` läser `.env.local` självt, men servern är kall.** Priset och
  bokningsläget kommer först efter första riktiga requesten; en headless-koll
  som klickar direkt ser "Läs mer om coachning" i stället för priset och ser ut
  som att Stripe inte är konfigurerat. Värm med en `curl /` först.
- **Event-typens slug är en tyst enpunktsfelkälla.** `CALENDLY_EVENT_URL` är en
  sträng som pekar på något vi inte äger. Byts sluggen i Calendly (det hände:
  `30min` → `60min`) laddar iframen en 404-sida, ingen kan boka, och ingenting
  loggas eller kastar. `/api/health` rapporterar därför `calendly: "ok" |
  "fail" | "av"` — `"av"` betyder att tidsbokningen inte är påslagen, vilket är
  ett giltigt läge.
- **Slå INTE på "Collect payment" på event-typen i Calendly.** Kontot är kopplat
  till Stripe, men `is_paid` måste förbli `false`: annars betalar köparen i
  Calendly *och* `completeCoachingBooking` öppnar en andra Checkout-session
  efteråt. Det är en dubbeldebitering, och inget i koden upptäcker den.
- Migration: `supabase/migrations/20260818090000_coachning_calendly.sql`.
  `scheduled_at`, `calendly_*`-kolumnerna, unikt index på
  `calendly_invitee_uri` (en bokning hör till exakt ett köp) och vyn ovan med
  `security_invoker = true`.

### Streak

Daily activity streak lives on `users.current_streak` / `longest_streak` / `last_active_date`. Update via `updateStreak()` in `src/lib/streak.ts` — increments at most once per calendar day.

### Telemetry

Use `track()` / `trackError()` from `src/lib/telemetry.ts` for errors and metrics. Payloads must be <2 kB and must not include PII. In the browser, events are batched and sent via `navigator.sendBeacon` to `/api/telemetry`.

### SEO & per-route metadata

Every route should define its own `head()` using helpers from `src/lib/page-meta.ts`:

```ts
head: () => ({
  meta: pageMeta({ path: "/train", title: "...", description: "..." }),
  links: pageLinks("/train"),
})
```

Use `breadcrumbScript()` and `jsonLdScript()` from the same file for structured data.

### Märket, delningsbilden och omdömena (2026-08-18)

- **Märket är talet 2,0**, inte "HP" i en ruta. Det sitter i navbaren, i
  `public/favicon.svg` och i delningsbilden, och faviconen är ritad för 16 px:
  bara talet i en ton, kommat som form. PNG-varianterna (`icon-32`, `icon-192`,
  `apple-touch-icon`) måste finnas kvar — Google och Androids "lägg till på
  hemskärmen" tar inte SVG och faller annars tillbaka på en skalad skärmdump.
- **Byt URL, inte bara innehåll, när delningsbilden ändras.** Snapchat, Facebook,
  LinkedIn och Slack cachar förhandsbilden på URL:en, ofta i månader, och
  Cloudflare svarade `CF-Cache-Status: HIT` på den gamla vägen. Bilden heter
  därför `og-image-2.png` — nästa gång blir det `-3`. Fyra ställen följer med:
  `__root` (`og:image` + `twitter:image`), `guider-meta.tsx`, `manifest.json`
  och kommentaren i `page-meta.ts`.
- **Bytet av bild och bytet av domän gjordes på var sin gren och möttes först i
  en rebase.** Den ena sidan hade `hpkampen.se/og-image-2.png`, den andra
  `tvakommanollan.se/og-image.png`, och båda hade rätt i var sin halva. Sitter
  du i samma konflikt igen: **ny domän, nytt filnamn.**
- **`public/fonts/` finns inte i repot.** Mappen togs bort i revert `98d852a` och
  kom aldrig tillbaka, medan `styles.css` fortfarande `@font-face`:ar fyra filer
  därifrån. **Sajten 404:ar alltså sina egna typsnitt och faller tillbaka på
  Georgia/system-ui.** Filerna finns kvar i historiken:
  `git show 189d203:public/fonts/YoungSerif-Regular.ttf > public/fonts/…`.
- **Snittbetyget på landningssidan räknas ur `OMDOMEN`** (`SNITTBETYG` i
  `HeroLanding.tsx`), det skrivs aldrig för hand. `Stjarnor` tar `betyg` och
  fyller sista stjärnan delvis — fem hela stjärnor bredvid "4,8" säger emot
  siffran. Omdömena är riktiga personer; lägg aldrig till ett citat som ingen
  har sagt, och justera aldrig snittet utan att listan ändras.

### Key conventions

- All user-facing text is in Swedish (sv-SE)
- `displayCategory()` in `src/lib/sv-format.ts` — always use this to render question category names (maps `"LAS"→"LÄS"`; other codes like ORD, MEK, ELF are already display-safe)
- Number/date formatting helpers (`formatInt`, `formatDecimal`, `formatRelativeTime`, etc.) are in `src/lib/sv-format.ts` — use these everywhere instead of raw `toLocaleString`
- `@/` path alias maps to `src/`
- Animations: use `m.div` etc. from framer-motion (`import { m } from "framer-motion"`), NOT `motion.div` — the app runs under `<LazyMotion strict>` (root) with features async-loaded via `src/lib/motion-features.ts`; `motion.` throws at runtime in this setup
- Do NOT add extra Vite plugins — `@lovable.dev/vite-tanstack-config` already includes tanstackStart, viteReact, tailwindcss, tsConfigPaths, and cloudflare
- **Design (anti vibe-coded):** the app is **always-light** since the Lunden rebrand (2026-08-17). It was always-dark navy before that; anything you read elsewhere claiming otherwise is stale. Palette: paper `--navy #fbf6ec`, card `--navy-2 #ffffff`, ink `--cream #2e1e14`, apple `--amber #ae2f26`, bark `--teal #7a5236`, leaf `--success #2f6b3c`, error `--danger #d32f2f`, destructive `#8c1d18`. Card surface is still written `border border-white/10 bg-white/[0.02] backdrop-blur-sm` — the remap layer turns those into dark-on-cream, so keep using them. Never hardcode a surface colour; go through tokens. Icons = Lucide SVG, never emoji-as-icon. New interactive elements need visible hover + the global focus ring (now apple red) works automatically.
- **The `--navy` / `--cream` names are inverted lies**, kept deliberately so 106 components and the whole remap layer did not have to change. Read `--navy` as "the ground surface" and `--cream` as "the text", never as colours.
- **Colour has three jobs.** Apple leads to action (CTA, streak, rank). Bark is structure (borders, secondary, "the opponent" in match bars). Leaf is progress (correct answers, stats, coaching). `--danger` is wrong answers and is **not** an alias for `--destructive` any more — a wrong answer must not look as alarming as deleting your account. `EyebrowLabel` and `PageHero` take a `leaf` tone for progress-oriented pages.
- **Alpha ramps are not contrast-neutral when the theme flips.** Moving the same alpha from light-on-dark to dark-on-light cost the `text-white/N` ramp up to 1.95 contrast points; `/45` (36 usages) silently fell from 5.13 to 3.62. The ramp is solved so each step reproduces its *old ratio*, not its old alpha. If you touch the base palette again, re-solve it — never carry alphas across.
- **Measure contrast against the composited background, not the token.** `--rank-silver` passed 5.37 against paper but sat on a tinted surface where it was 4.13. Walk the ancestor chain and composite every semi-transparent layer before you judge a pair.
- **Light-on-dark islands.** A few surfaces stay dark in the light theme: the `ProvFigure` lightbox (`bg-black/90`, so scanned line art pops) and anything whose background is set with an inline `style`. Inside those, `white/N` and bare `text-white` must NOT go through the remap — use explicit `#fff8f5`. `.text-white` **is** remapped to dark ink, which is why `UserAvatar` and the difficulty pills in `/ord` need explicit hex.
- **Modal scrims are bark, not black** (`rgba(46,30,20,0.5)`). Pure black is too hard against cream and reads as a leftover from the old theme.
- **New indexable pages:** SSR the content (route `loader`, not client fetch), use `pageMeta`/`pageLinks` + JSON-LD, add the URL to `public/sitemap.xml`, and cross-link from related pages (guider ↔ öva ↔ gamla-prov cluster).
- **Retiring or merging a page:** put a 301 in `PERMANENT_REDIRECTS` at the bottom of `src/server.ts` — it answers before SSR starts, so no React runs. Do NOT leave a route file behind that just redirects: it stays in `routeTree.gen.ts` and keeps showing up in `GUIDES`/`RelatedGuides` as if the page still existed. Then sweep all six places a URL lives: `src/lib/guider-meta.tsx`, the footer link list in `__root.tsx`, the cards **and** the ItemList JSON-LD in `guider/index.tsx`, every `relatedPaths` array, `public/sitemap.xml`, and `public/llms.txt`. A stale path in `relatedPaths` fails silently — `RelatedGuides` filters unknown paths out, so the section just renders 3 cards instead of 4 with no error.
- **Deleting a route invalidates `routeTree.gen.ts`.** It is checked in but generated, so it still imports the deleted file and `npx tsc --noEmit` fails until the generator runs. `npm run dev` and `npm run build` regenerate it themselves — run one before type-checking, otherwise the failure looks like a real breakage.

### Shared primitives — use these, don't re-roll them

Each of these exists because the same thing had been hand-written 3–6 times
with a different look in every copy.

- **Rätt/fel:** `--success` / `--success-soft` / `--success-line` / `--success-ink`
  and `--danger{,-soft,-line,-ink}` (`styles.css`). Never pick a green or red by
  hand. Green must **not** be `--teal` — teal already means "the opponent" in
  the match progress bars. Note the Tailwind remap layer at the bottom of
  `styles.css` also routes `emerald/green → success` and `rose/red → danger`,
  *including* the `/10`-style opacity variants, which are separate selectors and
  are easy to miss when adding a new shade.
- **Rank:** `RANK_TIERS` in `src/types` is the only rank scale (brons 600–999,
  silver 1000–1199, guld 1200–1399, platina 1400–1599, diamant 1600+). Render it
  with `RankBadge`, `EloBadge` or `RankIcon` — all three read that one table.
  A second scale used to live in `lib/elo.ts` (`eloTier`), which made 1000 ELO
  show as "Brons" in the navbar and "Silver" on the dashboard at the same time.
  `src/lib/elo.test.ts` pins the boundaries.
- **Icons:** `RankIcon`, `AchievementIcon` (keys = achievement `id`),
  `PodiumRank` (top-3 medal cell). Achievement/rank data files hold no icons —
  the mapping lives in the UI layer so `lib/` stays server-safe.
- **Loading:** `Spinner` for full-screen/blocking, `<Loader2 className="animate-spin" />`
  inside buttons. Skeletons use `skeleton-shimmer`.
- **Empty lists:** `EmptyState` (takes a `LucideIcon`), not ad-hoc centred text.
- **Numbers/dates:** always the `sv-format` helpers (`formatInt`, `formatDecimal`,
  `formatTime`, `formatDate`, `formatDateLong`), never a raw `toLocaleString`.
- **Fonts:** only `var(--font-display|sans|mono)`. No inline font stacks.
- **Overlays not built on Radix `Dialog`** must call `useDismissible(open, onClose)`
  — it gives Escape-stängning and scroll-lås. Radix does this for you; the four
  hand-rolled overlays did not, and none of them locked the background scroll.
- **In-view reveals (`Reveal`, `StaggerList`, `whileInView`) take `amount: "some"`,
  never a fraction.** IntersectionObserver measures the ratio against the
  *element*, so it can never exceed `(viewport + rootMargin) / elementHeight`.
  Wrap anything taller than that — the 100-row topplista, a stats panel on a
  phone — and a `0.2` threshold is unreachable: `inView` never flips, the
  content stays at `opacity: 0`, and nothing errors. It reads as "loads only
  sometimes", because a cold load animates in while the skeleton is still short
  whereas a warm react-query cache renders the full-height table on mount.
- **Copy:** the unit of play is a **match**, never a "battle". App-språket är
  svenska rakt igenom (`sv-SE`).

### The Tailwind remap layer — read this before adding a shade

The bottom of `styles.css` remaps Tailwind colour utilities to brand tokens.
It is powerful and easy to break, because **an unmapped class silently renders
as raw Tailwind**, sitting next to a mapped one that doesn't.

Two bugs of exactly this kind have already been fixed; both looked like
"someone eyeballed the numbers":

- `text-white/45,55,65,70,80` all mapped to `--text-secondary` while `/50,60,75`
  stayed raw white — so `text-white/45` rendered **brighter** than `/60`. The
  whole ramp is now defined explicitly and is strictly monotonic (`/70` is the
  unchanged anchor at `--text-secondary`).
- `border-white/10` and `/15` both mapped to `--line` while `/8` and `/12`
  stayed raw — so `/12` rendered **dimmer** than `/10`. Also monotonic now.

So: **if you use a new `white/N` step, add it to the ramp**, and keep the ramp
sorted and increasing. Same for `emerald/red` opacity variants — `bg-red-500/10`
is a different selector from `bg-red-500` and needs its own entry.
- **Scanned exam figures** need the `.exam-figure` class, not `bg-white`. The
  original reason (the remap turned `bg-white` into navy, hiding black line art)
  went away with the Lunden flip, since `--navy-2` is now white. Keep the class
  anyway: it pins a literal `#ffffff` backing that survives any future palette
  change, which is exactly what scanned line art needs.
- **`var()` does not work in SVG presentation attributes** (`stroke=`, `fill=`).
  Use a literal hex there, or move the colour into `style={{ }}`.

### Realtime (Supabase) — crash class to avoid

- `postgres_changes` channels mounted in always-present components (Navbar, `__root`) MUST have **unique names per mount** (`` `topic-${id}-${Math.random().toString(36).slice(2)}` ``) + try/catch around `.subscribe()`. Reused topic names during rapid remount (auth transitions) throw `cannot add postgres_changes callbacks after subscribe()` — this once crashed login for all real users.
- **Broadcast** channels (match progress) are the opposite: both players must share the exact topic name — never add random suffixes there.
- Wrap all root/Navbar-mounted widgets in `SafeBoundary` (`src/components/SafeBoundary.tsx`).

### Rate limiting — mandatory on new endpoints

`src/lib/rate-limit.ts` (pure limiter + `limits.*` configs) + `src/lib/rate-limit.server.ts` (`assertRateLimit`, `ipKey`). Rules:
- Authenticated mutations: `assertRateLimit(\`thing:${userId}\`, limits.xxx)` first in the handler.
- Public GET endpoints: `assertRateLimit(ipKey("thing"), limits.publicRead)` (keys on `cf-connecting-ip`).
- Per-isolate on Cloudflare — it's a hammering brake, not an exact global quota.
- **Volymkvoter måste räknas i databasen.** Av precis det skälet: forumet räknar
  rader i RPC:erna, och matcher räknas i `matches` via `checkMatchQuota`
  (`src/lib/match-abuse.ts`). `assertRateLimit` är alltid bara första lagret.

### Matchspam & ELO-odling (2026-08-16)

Fyra anonyma konton körde 20–300 botmatcher var på ett dygn och tog hela toppen
av den verbala topplistan (översta på 2226 ELO). Hålet: cooldownen i
`createMatch` **hoppade uttryckligen över botmatcher**, alltså det enda läge som
ger ELO utan motpart, och den enda andra bromsen var den per-isolat-limitern.
Kontona och deras 560 matcher är raderade; två lager tillkom:

- `checkMatchQuota` — 20 matcher/h och 80/dygn, räknat ur `matches`, **alla
  lägen inklusive bot**. En riktig spelare hinner max ~12/h (5 min/match).
- `isImplausiblyFast` — en match som lämnats in på under 2 sekunder per fråga
  avslutas utan ELO och utan statistik. Mäts från `created_at`, som för privata
  rum ligger före spelstart, så golvet kan bara slå på botmatcher.

Anonyma konton är sedan 2026-08-17 borta ur den publika topplistan
(`public.guest_user_ids` + filtrering i `leaderboard.functions.ts` och
`fetchOrdLeaderboard`). Gästen ser fortfarande sin egen rad, och **bara**
gästen: identiteten läses ur token via `optionalSupabaseAuth`
(`src/lib/auth-optional.server.ts`), inte ur ett klientskickat `user_id` — annars
blir den publika endpointen ett uppslagsverk över andras konton. Rangordningen
sker efter filtreringen, annars får listan hål i numreringen.

Kvarstående hål: gästkonton går fortfarande att skapa i obegränsat antal.
`limits.guestSignup` är 5/h **per IP**.

### GDPR / privacy — non-negotiable

- `/integritetspolicy` must stay **factually true**. Since 2026-08-15 it documents PostHog analytics behind explicit consent — update it whenever what we collect changes.
- **Consent gate (added 2026-08-15).** `src/lib/consent.ts` stores the choice (`hpk-analytics-consent` in localStorage, versioned); `src/lib/analytics.ts` loads posthog-js via **dynamic `import()` only after a yes** — never import it statically, that would run the script before the user answers and defeats the whole gate. `<ConsentBanner />` asks, `<ConsentSettings />` (on `/integritetspolicy`) lets the user revoke, `<Analytics />` does identify + SPA `$pageview`. Bump `CONSENT_VERSION` when collection expands — old consents stop counting and the banner returns.
- Empty `VITE_PUBLIC_POSTHOG_KEY` = analytics off and no banner. `VITE_` vars are inlined **at build time**, so they must be in `.env`; the `wrangler.jsonc` copy alone does nothing for the client bundle.
- Ads are still out: they need a certified IAB TCF CMP, which our own banner is not. AdSense was removed for exactly this reason (see comment in `__root.tsx`).
- **Product events go through `trackEvent()` in `src/lib/events.ts`** — a typed
  catalogue, not free-form strings. It wraps `track({type:"metric"})`, which
  auto-forwards to PostHog; only `metric` forwards, errors stay in
  `/api/telemetry`. Add the event to `ProductEvents` first and the property names
  are then enforced by the compiler. That is the whole point: `match_type` in one
  event and `matchType` in the next makes a funnel unbuildable, and nothing tells
  you until someone tries three weeks later. There are no direct
  `captureAnalytics()` calls left in feature code.
- **An event fired before PostHog finished loading used to vanish.**
  `captureAnalytics` was `client?.capture(...)`, and `client` doesn't exist until
  the dynamic `import()` resolves — so anything in a mount-time effect (the
  pageview, `forum_search`, `consent_decided`) hit `undefined` and was dropped
  silently. `analytics.ts` now queues up to 50 events and flushes them on start;
  the queue is only filled when consent is already granted, and `stopAnalytics`
  empties it. Pinned by `src/lib/analytics.test.ts`.
- **`logUsageEvent`'s `meta` schema is `.strict()`.** ProvRunner had always sent a
  `mode` field that the schema didn't declare, so every gamla-prov submission
  threw in validation and was swallowed by the caller's `.catch()` — `audit_log`
  got nothing and the admin usage view read zero, with no error anywhere. Fixed
  2026-08-17 by declaring `mode`. Any new field must be added on both sides.
- posthog-js renames config keys between versions. `enable_heatmaps` is gone (now `capture_heatmaps`), and the exported client type moved, so `analytics.ts` derives it via `(typeof import("posthog-js"))["default"]` instead of importing a name. Verify keys against `@posthog/types/dist/posthog-config.d.ts` before adding any — the keys are **not** in `posthog-js`'s own `.d.ts`.
- Also on: `capture_dead_clicks`, `capture_performance` (web vitals + network
  timing). `capture_exceptions` is explicitly `false` — errors have their own path
  and would drown the funnels. That a feature is live is verifiable in the
  browser: PostHog fetches `web-vitals.js` / `dead-clicks-autocapture.js` from
  `eu-assets.i.posthog.com` only when the matching config is on.
- Account deletion exists (`src/lib/account.functions.ts` + danger zone on `/stats`): deletes personal data, anonymizes the `users` row (empty username hides it from leaderboards, match FKs survive), hard-deletes the auth user with scramble+ban fallback.
- Usage analytics go through `logUsageEvent` → `audit_log` with `usage:`-namespaced actions (no new tables needed). Admin dashboard: `/admin` → "Användning".
- Error messages to clients must be generic Swedish — log the raw DB error server-side (`throwDbError` pattern in `word-practice.functions.ts`).

### DB migrations

SQL files in `supabase/migrations/` — run manually in Supabase SQL editor (production has no CLI migration runner). After adding a table, update `src/integrations/supabase/types.ts` manually.

### Things a schema dump does NOT carry (found moving to the new project)

A `pg_dump` of `public` restores tables, policies and functions — and silently
leaves out everything below. All are fixed now, but check them first when a
"restored" database behaves as if it were empty:

- **Triggers on `auth.users`.** `public.handle_new_user()` came across; the trigger
  calling it did not, because it lives in the `auth` schema. Every signup then landed
  in `auth.users` with no `public.users` row, and nothing errored — guest play just
  broke silently, since `useGuestPlay` relies on the trigger and never inserts the
  profile itself. Restored in `20260814123000_restore_auth_user_trigger.sql`.
- **Auth settings.** Anonymous sign-ins were off (they power all guest play),
  `site_url` still said `http://localhost:3000`, and `uri_allow_list` was empty.
  These live in the auth config, reachable via the Management API:
  `GET/PATCH https://api.supabase.com/v1/projects/<ref>/config/auth`.
- **Views default to bypassing RLS.** A view runs as its owner, and `postgres` owns
  the tables — so anyone holding the public anon key could read `health_check` and
  get `users_count: 530`. Any new view needs
  `ALTER VIEW ... SET (security_invoker = true)`; see
  `20260814120000_views_security_invoker.sql`.

### Edge functions

`verify_jwt` is **not** an authorization check — anonymous sign-in is enabled, so
anyone can mint a valid JWT in one request. Destructive or paid functions must call
`requireAdmin()` from `supabase/functions/_shared/require-admin.ts`, which verifies
the caller's token and reads `is_admin` with the service role. `import-gamla-prov`
(deletes the whole gamla-prov set before re-importing) and `clean-math-questions`
(bills per AI call) both use it.

Deploy with the standalone CLI binary and an access token:
`SUPABASE_ACCESS_TOKEN=... supabase functions deploy <name> --project-ref <ref>`.
`clean-math-questions` also needs `LOVABLE_API_KEY` set under Edge Functions →
Secrets; it is **not** set in the new project, so that function cannot run yet.
