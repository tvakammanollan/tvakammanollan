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

### Namnet (2026-08-18)

Sajten heter **Tvåkommanollan** — med å, i bestämd form, i all text som en
människa läser. Namnet är märket utskrivet: 2,0 är högsta möjliga resultat på
högskoleprovet. Det gamla namnet **HP Kampen är utrotat ur koden**; dyker det
upp igen är det något som kopierats från en gammal gren.

- **`å` i text, `a` i teknik.** Rubriker, brödtext, `<title>`, JSON-LD `name`,
  manifestet och alla meddelanden skriver `Tvåkommanollan`. Domän, paketnamn,
  user-agent-strängar, MCP-servernamn och lagringsnycklar skriver
  `tvakommanollan` — en URL eller ett npm-namn tål inte å. JSON-LD har
  `alternateName: "Tvakommanollan"` just för att det är så folk skriver det när
  de söker.
- **`hpkampen.se` i koden är inte namnet, det är den gamla domänen** och ska
  ligga kvar: `LEGACY_HOSTS` i `canonical-host.ts`, dess test, och de två
  routerna i `wrangler.jsonc`. Att "städa bort" dem släcker 301:an som Google
  ska följa i minst ett år till. Se avsnitten ovan.
- **Lagringsnycklarna och de egna eventen heter `tkn`** sedan namnbytet:
  `tkn-analytics-consent`, `tkn-coaching-prompt`, `tkn:ach:v1:<uid>`,
  `tkn:wotd:<datum>`, `tkn:prov-resultat:v1`, `tkn:consent-changed`,
  `tkn:achievements:check`.
  De två förstnämnda flyttas över från sina `hpk-`-föregångare. Båda modulerna läser den gamla
  `hpk-`-nyckeln en gång och skriver om den — utan flytten hade varje besökare
  som redan svarat om samtycke fått bannern igen, och varje köpare av
  studieupplägget fått nudgen igen. Flytten är pinnad i `consent.test.ts` och
  `coaching-prompt.test.ts`; ta bort den tidigast när `hpk-`-nycklarna rimligen
  hunnit försvinna ur alla webbläsare.
- **Workern heter fortfarande `tvakammanollan`** (`wrangler.jsonc`), med
  stavfelet — "kamma", inte "komma". Namnet är Workerns identitet: byts det i
  konfigen skapar nästa deploy en **ny** Worker medan den gamla behåller
  routerna, alltså en tyst nedsläckning. Ska det rättas görs det för hand, i
  ordningen ny Worker → flytta routes → verifiera → ta bort den gamla.
  `package.json` heter numera `tvakommanollan` — det är ett lokalt namn och rör
  inte driften.
- **`public/hpkampen-1778669612-…​.txt`** är en verifieringsfil åt en tredje
  part (innehållet = filnamnet). Den är inte ett varumärke och får inte döpas
  om — ta bort den först när du vet vem som frågar efter den.
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
- **Routerna står i `wrangler.jsonc`, inte i dashboarden** (sedan 2026-08-18).
  De låg tidigare bara i dashboarden och **apex på den nya domänen saknade
  sin**: `tvakommanollan.se` svarade 522 medan `www.` gick fram, i två dygn,
  utan att något i koden såg fel ut. Utan matchande route går Cloudflare till
  origin, och origin finns inte. Nitro kopierar `routes` till
  `.output/server/wrangler.json` precis som `vars` — kontrollera där om du
  tvivlar.
- **Kanonisk värd hanteras i koden, inte i Cloudflare.** `canonicalRedirect()`
  (`src/lib/canonical-host.ts`, anropad först i `src/server.ts`) 301:ar de tre
  icke-kanoniska värdnamnen till `tvakommanollan.se`. En Redirect Rule i
  dashboarden hade gjort samma sak men inte gått att testa — och undantaget
  nedan är hela poängen med att den är testbar.
- **`CANONICAL_REDIRECT` är en grind, inte en flagga att städa bort.** Den stod
  `off` tills apex bevisligen svarade 200; med den `on` samtidigt som apex var
  nere hade *hela* sajten 301:at till en död värd. Den är `on` sedan
  2026-08-18 13:18. Ska målvärdnamnet någonsin flyttas igen: sätt `off`, byt
  route, verifiera 200, sätt `on` — i den ordningen, två deployer.
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

### Inloggning med användarnamn

Fältet på `/login` tar både e-post och användarnamn; `@` skiljer dem åt (namn får bara innehålla a–z, 0–9, `_` och `-`, så ett namn kan aldrig innehålla @). E-post går som förut rakt på `signInWithPassword`.

Namnvägen går via `signInWithUsername` (`src/lib/auth.functions.ts`). Supabase känner bara till e-post och telefon, så namnet måste översättas till en adress — och **det uppslaget får aldrig ligga i klienten**: en endpoint som svarar på "vilken e-post hör till lina_p" låter vem som helst skörda adresser ur topplistan. Servern slår upp, loggar in och returnerar `{access_token, refresh_token}`, klienten kör `supabase.auth.setSession()`. Svaret är detsamma vare sig namnet saknas eller lösenordet är fel.

Inloggningen görs med den publika nyckeln, inte service role — annars kringgås Supabase egna spärrar (bannade konton, obekräftad adress). Uppslaget använder `.eq`, inte `.ilike` som vänsöket: `_` är jokertecken i LIKE och tillåtet i namn, så `lina_p` skulle matcha även `linaxp` och `maybeSingle()` fela. Gästkonton (auto-namn) filtreras bort med `isAutoUsername` så de inte går att sondera.

### Google-inloggning

`GoogleButton` (`src/components/auth/GoogleButton.tsx`) på `/login` och `/signup`. Flödet är **implicit grant** — `client.ts` sätter inget `flowType` och auth-js default är implicit, så Supabase skickar tillbaka access-token i URL-fragmentet och `detectSessionInUrl` plockar upp den i webbläsaren. Fragmentet når aldrig servern; SSR:en behöver inte veta något om returen.

`redirectTo` pekar på `/onboarding`, samma mål som e-postregistreringen. Google skickar inget username, så `handle_new_user()` ger nya konton auto-namnet `user_xxxxxxxx` och onboarding är där man byter till ett riktigt (annars hamnar kontot utanför topplistan, se `isRankable`). Återvändare bounceas vidare till `/` av sidans guard — den väntar in `profileLoaded` från `useAuth()` först, annars blinkar namnformuläret förbi vid varje inloggning.

**Knappen fungerar bara om providern är påslagen i Supabase.** Kolla utan att öppna dashboarden:

```bash
curl -s "$SUPABASE_URL/auth/v1/settings" -H "apikey: $SUPABASE_PUBLISHABLE_KEY" | grep -o '"google":[a-z]*'
```

Är den av svarar `/auth/v1/authorize` 400 `{"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`. `signInWithOAuth` navigerar utan att först fråga API:t, så användaren landar på en rå JSON-sida i stället för hos Google — och klienten får aldrig något fel att visa. Det var så knappen såg trasig ut innan den plockades bort i `5daf101` (2026-05-19).

Att slå på den kräver tre saker, alla utanför repot:

1. Google Cloud Console → OAuth 2.0 Client ID (Web application) med redirect-URI `<VITE_SUPABASE_URL>/auth/v1/callback` (ref:en står i `.env`)
2. Supabase → Authentication → Providers → Google: på, med client ID + secret
3. Supabase → Authentication → URL Configuration: Site URL `https://tvakommanollan.se` och redirect-allowlist för `https://tvakommanollan.se/**` + `http://localhost:8080/**` (dev-porten kommer från `@lovable.dev/vite-tanstack-config`). Saknas `/onboarding` i allowlistan kastar Supabase tyst bort `redirectTo` och skickar användaren till Site URL i stället.

Fel på vägen tillbaka (`#error=access_denied…`) fångas av `useOAuthErrorToast()` i `RootComponent` — den ligger i roten och inte på en callback-sida, eftersom landningsroute:n beror på både `redirectTo` och Site URL. Parsern är ren och testad i `src/lib/oauth-error.test.ts`.

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

#### Klockan får bara gå på en `active` match (2026-08-21)

Steg 3 ovan skriver **frågorna först och statusen sedan**. Mellan de två
skrivningarna finns en match som har åtta frågor men inte har börjat, och
matchsidan gick bara på "finns det frågor?". Inbjudarens flik började därför
räkna ned redan där — och sparade ankaret i sessionStorage. När vännen sedan
accepterade var de fem minuterna brända, och matchen lämnades in automatiskt i
samma sekund den blev spelbar, med "Tiden är slut" i rutan. Reproducerat mot
skarpa data: en `waiting`-rad med frågor gav löpande klocka och
`player1_submitted_at` satt, poäng 0.

- **`matchIsLive(status)` (`match-clock.ts`) är grinden** och gäller klockan,
  auto-inlämningen, `active_match`-posten och `ResumeMatchBanner`. Bara
  `"active"` räknas.
- **Botmatch och rankad match skapas direkt som `active` med `started_at`**, så
  fönstret finns bara på vänmatcher och privata rum. Det är hela förklaringen
  till att buggen syntes just där.
- **Ankarreglerna är rena och testade** (`resolveMatchAnchor`): server först,
  lokalt ankare sedan, `nu` sist. Ett oläsbart eller framtida ankare läses som
  "nyss", aldrig som "urgammalt" — samma regel som `coaching-sweep.ts`, av
  samma skäl: ett trasigt värde ska inte kunna avsluta någons match. Ett
  **gammalt men giltigt** ankare behålls med flit; den som somnade om fliken
  SKA mötas av en match vars tid tagit slut.
- En `finished` match skickas till resultatsidan i stället för att renderas som
  ett spelbart bräde med noll på klockan.

#### Oavgjort finns inte (2026-08-21)

Vid lika poäng vinner **den som lämnade in först**. Regeln bor i
`decideWinnerSide()` i `src/lib/match-outcome.ts` och **bara** där: servern
anropar den när `winner_id` skrivs, klienten när `winner_id` är NULL (vilket
det alltid är när en bot vinner — en bot har inget konto att peka på). Två
kopior av regeln var precis vad som lät resultatskärmen och historiken säga
olika saker om samma match.

- Ordningen: poäng → inlämningstid → (saknas båda tiderna) player1. Det sista
  är ett **deterministiskt** fallback, inte en gissning: servern och båda
  klienterna måste komma fram till samma svar utan att prata med varandra, och
  `player2_id` är NULL i varje botmatch.
- `Outcome` är `"win" | "loss"`. Lägg inte tillbaka `"draw"` — varken i typen,
  i `ProductEvents` eller i UI-strängar.
- Lika poäng skrivs ut på resultatsidan ("Lika många rätt – du lämnade in
  först"). Utan den raden ser "6–6, du vann" ut som ett fel.

### ELO & ranks

K-factor tiers in `src/lib/match.server.ts`: `<1500 → 96`, `1500–1800 → 60`, `>1800 → 30`. Bot ELO is randomized ±150 from the player's ELO.

**Tidsgolvet mot fusk är en KLAMP, inte ett hopp över (2026-08-21).**
`isImplausiblyFast` avbröt tidigare hela uträkningen: `status = finished` och
retur. Följden var att en snabbt inlämnad match inte gav någon ELO alls, ingen
`winner_id` och ingen rad i `elo_history` — en förlust var gratis och
resultatskärmen kunde inte säga vem som vann. Nu räknas matchen som vanligt och
`applyEloFloor()` klampar bara **vinsten** till ±0; en förlust dras i sin
helhet. Asymmetrin är poängen: det går inte att klicka sig uppåt, men det
kostar alltid att klicka sig till en förlust. Verifierat 2026-08-21 mot skarpa
data (inlämning på 11,7 s mot golvets 16 s): förloraren −55, vinnaren ±0, båda
med rad i `elo_history`.

**ELO-skrivningarna felkontrolleras.** `update()`-anropen mot `users` låg som
nakna `await` utan att svaret lästes: gick de fel markerades matchen ändå som
`finished`, resultatsidan visade en ELO-ändring som aldrig nådde databasen, och
skillnaden syntes först som ett omöjligt tal på topplistan långt senare.

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
- **Matten i `questions` kommer ur arkivet sedan 2026-08-19.**
  `scripts/import-prov-questions.ts` (torrkörning som standard, `--apply` för att
  skriva) flyttar över alla matteuppgifter: 2 343 rader — XYZ 696, KVA 580,
  NOG 348, DTK 719 — märkta med `exam_term`/`provpass_num`/`q_num` och
  `clean_status = 'ok'`. Före det fanns 512 skrapade rader och **noll DTK**.
  - **DTK:s bild är diagramuppslaget, inte uppgiftsutsnittet.** Arkivet kopplar
    det via `figure`-index i passet, inte via `q.image`; missar man det
    importeras 642 uppgifter utan det diagram de ska läsas ur. Av samma skäl
    följer `crop` i `options` bara med när `image_url` faktiskt *är* utsnittet —
    koordinaterna är räknade mot det och pekar ut fel yta på ett diagram.
  - **De skrapade raderna raderades inte.** `match_answers`, `match_questions`
    och `question_reports` har främmande nycklar mot `questions.id`; 421 rader
    var refererade och fick `clean_status = 'retired'`, 91 orefererade togs bort.
  - **`questions` har ett unikt index på `lower(question_text)`.** Det gäller
    även pensionerade rader, så 279 av dem fick prefixet `[utgången] ` för att
    släppa fram arkivets version av samma uppgift. Fem skilda XYZ-uppgifter
    frågar dessutom "Hur stor är vinkeln v?" — de 17 interna krockarna får
    provtillfället tillagt i texten.
  - `clean-math-questions` är borttagen. Den bad en LLM rekonstruera skräpet och
    **hittade på**: alternativ B `31x` blev `$\frac{31x}{27}$`. Den kunde inte
    heller återskapa ett DTK-diagram som aldrig fanns i indata.
  - **`import-prov-questions.ts` går inte att köra om rakt av längre.** Steg 1
    raderar blint alla rader med `exam_term` satt innan det infogar de nya —
    säkert bara innan någon match spelats med en arkivfråga. Sedan
    2026-08-2x pekar `match_questions.question_id` (ON DELETE RESTRICT) på
    288+ arkivrader, så en omkörning stoppas av databasen på just det steget.
  - **XYZ/KVA/NOG skrivs om provpass för provpass från bildutsnitt till text
    i `src/data/prov/`** (se avsnittet om gamla prov ovan), men den ändringen
    når aldrig `questions` av sig själv — tabellen är en frusen ögonblicksbild
    från importtillfället. `scripts/sync-prov-clean-status.ts` (torrkörning
    som standard, `--apply` för att skriva) synkar i stället **på plats**,
    matchat på `exam_term`+`provpass_num`+`q_num`: text-uppgifter får
    `clean_status="ok"`, uppgifter som fortfarande är bildutsnitt får
    `"pending"` och filtreras då bort av `match.server.ts`s
    `eq("clean_status","ok")` — samma spärr som redan fanns, bara påslagen
    per uppgift i stället för blint `"ok"` på alla. DTK rörs aldrig; den
    kategorin är och förblir bilduppgifter med flit. **Kör om det här
    skriptet efter varje ny omgång konverterade provpass** så att duellerna
    börjar visa dem. Träningsläget (`train.functions.ts`) använder en annan
    spärr (`clean_status != "retired"`) och påverkas inte.
  - **Samma unika index på `lower(question_text)` gäller här också.** Flera
    XYZ/KVA-uppgifter över olika provpass delar exakt samma standardstam
    ("Vilket svarsalternativ är störst?"), vilket kraschade den första
    körningen (23505) halvvägs igenom. Skriptet dedupar nu likadant som
    `import-prov-questions.ts` gör, plus en riktad reträtt om en kollision
    ändå slinker igenom mot en rad utanför XYZ/KVA/NOG (skedde en gång, mot
    en rad skriptet inte rör). Det gör körningen idempotent: avbryts den
    halvvägs (som den gjorde första gången) plockar nästa körning bara upp
    resten, ingen skada skedd.
- **`build.py` går inte att köra om — arkivet blir fattigare.** Den raderar allt i
  `src/data/prov/` och bygger från cachen, men cachen går inte att återskapa:
  ELF-häftena från flera terminer finns inte kvar hos UHR utan har hämtats för
  hand och matats in med `adopt_elf.py`. En körning med bara `fetch.py` bakom sig
  ger 140 uppgifter per prov i stället för 160 (all ELF borta) och kraschar
  dessutom på 2012vt, som behöver `html_prov.py`. Ska bara enstaka fält läggas
  till i efterhand: skriv ett skript som *muterar* de befintliga filerna, som
  `add_crops.py`. Provdatan ligger i git, så `git checkout -- src/data/prov`
  återställer efter ett misstag.
- **`add_crops.py` lägger beskärningskoordinater på bilduppgifterna** utan att
  bygga om arkivet (`--apply` för att skriva; torrkörning annars). Den sätter
  `crops` och `imageAspect`, och flyttar de NOG/DTK vars text är sönderskuren av
  extraktionen till bildläge. 1 518 av 1 594 bilduppgifter (95 %) har crops;
  resten faller tillbaka på hela utsnittet med en bokstavsrad under.
- **`crops` låter kortet rita sina egna knappar.** Bilden innehåller hela
  uppgiften — nummer, stam *och* alternativ — vilket förr gav fyra tomma
  bokstavsknappar under en bild där alternativen redan stod, plus numret två
  gånger. `crops` säger var varje del sitter som andelar av bilden, och
  `CropView` visar en av dem. Samma fil till alla utsnitt, alltså en hämtning —
  och **aldrig `loading="lazy"` på dem**: bilden är avsiktligt förskjuten utanför
  sin klippruta, så webbläsaren räknar den som osynlig och laddar den aldrig.
- **Vårprovet 2012:s kvantitativa pass har inga bilder och kan inte få några.**
  `2012vt-{3,5}.json` byggdes på en annan maskin (`source` är en macOS-sökväg)
  där `pass{3,5}-kvant.pdf` fanns i cachen; JSON:en committades men de renderade
  bilderna aldrig. 57 uppgifter pekade därför på filer som inte finns i git och
  renderades som trasiga bilder. PDF:erna går inte att få tillbaka — den
  kvantitativa delen publicerades bara som webbsidor med en GIF per uppgift och
  de bilderna arkiverades aldrig (Internet Archive har bara årets broschyr).
  `fix_missing_images.py` tar bort döda bildreferenser och sätter
  `figureMissing`, så kortet säger rakt ut att svarsalternativen saknas.
  Uppgiftstexten finns kvar i 50 av 57 fall. Kör skriptet igen om en framtida
  import lämnar fler bildlösa uppgifter efter sig.
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

### Ordförklaringarna (`questions.definition`)

Varje ORD-rad har en förklaring, skrapad från svenska.se (SO primärt, sedan
SAOL, SO:s idiom, SAOB), Wiktionary och Wikipedia — `scripts/scrape-ord-definitions.ts`
bygger `scripts/ord-definitions.json`, `scripts/apply-ord-definitions.ts`
skriver in den. Täckningen är 100 % (8 761 av 8 761).

- **`src/lib/ord-definition.ts` äger allt som rör förklaringar** — utskrivning
  av förkortningar, textformatet, parsern och `ordDefinition()` självt.
  `sv-format.ts` återexporterar `ordDefinition`/`hasOrdDefinition` eftersom
  hela appen redan importerar dem därifrån. **UI ska använda
  `ordDefinitionParts()`**, inte `ordDefinition()` — den senare ger rå text
  inklusive sektionsraderna.
- **Ordböckerna skriver förkortat och det skrivs ut vid rendering**, inte i
  databasen: "el." → eller (1 028 rader), "särsk." → särskilt (814), "äv." →
  även, "anv." → används, "p.g.a.", "t.ex.", "m.m." med flera. Samma funktion
  körs i skrapan, så nyskrapade rader är redan utskrivna och renderingslagret
  är skyddsnätet för äldre rader. Lägg till nya förkortningar **i
  `ABBREVIATIONS` i fallande längdordning** — annars äter `el.` upp `el. d.`
  och `t.ex.` blir halvt utskrivet. Varje mönster kräver att ingen bokstav
  står omedelbart före, annars blir "modell." till "modeleller".
- **Tre förkortningar böjs efter ett framförställt ord** (`s.k.`, `eg.`,
  `urspr.`) via `agreeingForm()`: "de eg. invånarnas" → egentliga, "något eg.
  resultat" → egentligt, "som man eg. är beroende av" → egentligen. Utan det
  blev var tredje fel.
- **Definitionen är ett textfält med märkta sektioner sist**, inte egna
  kolumner:

  ```
  1. Ta sig upp i eller ombord på rigg respektive fartyg.
  2. Göra entré på en scen eller dylikt.
  Exempel: äntra stormasten | lotsen kunde äntra skeppet trots sjögången
  Liknande ord: borda, entré
  Ordklass: verb
  ```

  `formatOrdDefinition()` skriver formen, `parseOrdDefinition()` läser den.
  Skälet är att en ny kolumn hade krävt en migration mot produktion för rent
  presentationsdata, och att texten fortfarande läses rakt av den som slår upp
  ordet i databasen eller via MCP-verktyget. **Parsern måste fortsätta klara
  den äldre formen** där betydelserna låg på en rad separerade med dubbla
  mellanslag (`1. ...  2. ...`) — det är så alla rader såg ut före 2026-08-18.
- **Exempelmening, liknande ord och ordklass kommer gratis ur SO-svaret** och
  användes inte alls tidigare: `syntex` (finns för ~83 % av orden),
  JFR-hänvisningarna i `hänvisningar` (~53 %) och `ordklass` (100 %).
  JFR-listan är den viktigaste — för "frist" ger den andrum, anstånd,
  nådatid, respit, rådrum och uppskov, alltså precis de synonymer ORD-frågorna
  handlar om. `collectRich()` i skrapan hämtar dem, även ur
  `underbetydelser`.
- **Homografsiffror.** svenska.se numrerar likstavade uppslagsord och siffran
  följde med skrapet, både klistrad vid ordet ("2smitta") och som eget ord
  ("Ge ifrån sig 1 något viktigt"). Det andra fallet städas av
  `stripLooseHomographDigit()`, som måste skilja markören från riktiga tal
  ("med början 1 januari", "heltal mellan 1 och …", "1 Mos. 11:1–9") **och
  från betydelsenumreringen** — en siffra följd av punkt rörs aldrig, annars
  slås betydelse 1 och 2 ihop till en enda text.
- **Gissade uppslagsord måste stämmas mot facit.** Tre vägar i skrapan slår
  upp ett *annat* ord än det efterfrågade: stavningsrättelsen
  (`lookupSuggest`), närmaste granne på redigeringsavstånd (`lookupFuzzy`)
  och frasens huvudord (`lookupPhraseHead`) — plus engelska Wiktionary, som
  har egna homografer. Alla fyra går genom `corroboratedByAnswer()`, som
  kräver att definitionen delar något med ORD-uppgiftens eget rätta svar.
  Utan den grinden fick **`blam`** definitionen av *blad*, `keratit` av
  *keratin*, `hema-` av *hemi-*, `töra` av *tora*, `fysikus` av *fysikum*,
  `vinna gehör` av *vinna* ("utgå som segrare i tävling") och `linda in
  orden` av *linda* (tygremsan spädbarn lindades med). Redigeringsavståndet
  var 1 i samtliga fall, så avståndet kan omöjligt skilja rätt från fel —
  **det kan bara betydelsen göra**, och facit är den enda betydelse vi
  äger. Faller gissningen bort landar ordet till slut på facit-synonymen,
  som är rätt per definition: en tunn men riktig förklaring slår en fyllig
  och felaktig.
- **Jämförelsen är generöst satt och ska förbli det.** Fem tecken prefix plus
  containment åt båda håll, med funktionsorden bortsållade. Fyra tecken
  räckte inte (`förlåta` och `förlöpa` delar sina fyra första, vilket
  godkände fel definition för `tillge`), och utan stoppordslistan
  korroborerades `punktur` av att både facit och definitionen innehöll
  "med". Ett falskt larm kostar bara en fylligare formulering; ett missat fel
  visar något osant för den som pluggar.
- **Kvalifikationerna i `definition_source` måste synas i UI:t.**
  `definitionSourceLabel()` i `ord.tsx` skriver ut både `– om "X"` och
  `rättstavat "X"`. Kapas de bort ser en förklaring av *sälla* ut som en
  förklaring av *sälla sig till*, och läsaren har inget sätt att märka det.
- **`apply:ord-defs` skriver bara rader där `definition IS NULL`.** Har
  skrapan byggts om måste `--overwrite` med, annars landar ingenting — alla
  8 761 rader är redan ifyllda. Även med `--overwrite` hoppas rader med
  identisk text över, så en omkörning rör ingenting.
- Skrapan är återupptagbar via `scripts/.ord-defs/cache.json`; en full
  omskrapning av alla ord tar ~25–40 min vid `--concurrency 8`. Cachen har
  samma form som artefakten, så ändras textformatet måste cachen bort.

**Sätt inte `exam_term` på ORD-rader.** Gamla-prov-importen gör
`delete().not("exam_term", "is", null)` innan den importerar om, så allt med
`exam_term` satt raderas nästa gång någon kör den. Terminen ligger i
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
### Ordlistan — /ordlista (2026-08-20)

ORD-beståndet är sajtens största textmängd (8 761 rader, 8 760 sluggar) och gick
fram till nu bara att nå genom att öva. Ordlistan ger varje uppslag en egen
adress: betydelse, exempelmening, liknande ord, ordklass — och **uppgiften ordet
faktiskt kom ur**, med sina fem alternativ och facit. Det sista är poängen: utan
det är sidan en ordboksavskrift, med det är den något som inte finns någon
annanstans.

Tre adresser: `/ordlista` (nav), `/ordlista/bokstav/<b>` (register) och
`/ordlista/<ord>` (uppslaget). Ren logik i `ord-slug.ts`, databasdelen i
`ordlista.server.ts`, serverfunktionerna i `ordlista.functions.ts`.

- **`bokstav` är ett statiskt mellanled och måste förbli det.** `/ordlista/<b>`
  hade krockat med uppslagssidan, och det finns uppslag på ett tecken.
- **Å, Ä och Ö står kvar i sluggen — translitterera dem aldrig.** `får`/`far`,
  `hår`/`har` och `mål`/`mal` är olika uppslag i det här beståndet och slås ihop
  av a/a/o. Länkar, canonical och sitemap procentkodar likadant
  (`%C3%A5b%C3%A4kig`); ändras kodningen på ett av de tre ställena får varje ord
  med å, ä eller ö två adresser.
- **Inledande och avslutande bindestreck trimmas inte** — de är affixen
  (`-ism`, `a-`), och trimmade går de inte att skilja från vanliga ord.
- **Registret cachas per isolat i en timme.** Slugen står inte i databasen utan
  räknas ur `question_text`, så uppslagningen behöver hela listan. Ett
  `ilike`-mönster (bindestreck ↔ ett tecken) är *nästan* nog men matchar
  ingenting för de sju uppslag som tappar tecken i slugen (`crêpe`, `garçon`,
  `di-,diko-` …). `building`-löftet finns för att en kall isolat annars startar
  nio databasanrop *per* samtidig crawlerbegäran.
- **Två uppslag ger samma slug** (`crème de la crème` / `crème-de-la-crème`).
  Valet mellan dem är deterministiskt (kortast, sedan alfabetiskt) — annars
  pekar sitemapen på en rad och länkarna på en annan beroende på svarsordning.
- **Visningsformen går genom `ordText()`.** 953 rader står versalt i databasen
  ("VAKANT", "VALÖR"); en rubrik som skriker läses som ett fel.
- **Länkvägarna är tre, och de behövs alla.** Ordbokens JFR-ord räcker bara till
  var sjätte sida (15,5 %), så alternativen i uppgiften länkas också när de
  själva är uppslag, och varje sida bär grannarna i bokstavsordning. Kedjan är
  det som gör hela listan krypbar utan att något ligger djupt.
- **Sitemapen är egen** (`/ordlista-sitemap.xml`, 8 791 adresser, ~1 MB) och
  står i `robots.txt` bredvid de två andra. `public/sitemap.xml` bär bara navet
  — den är handskriven och kan inte bära nio tusen adresser.
- **Förklaringarna är hämtade ur ordböcker** (91 % SO/svenska.se) och källan
  skrivs ut på varje sida via `definitionSourceLabel()`. Kapas källraden ser en
  ordboksdefinition ut som vår egen text. Att publicera dem som indexerbara
  sidor exponerar dem bredare än övningsläget gjorde — det är ett medvetet val
  och värt att ompröva om Svenska Akademien hör av sig.

### SEO-städning vid domänflytten (2026-08-20)

- **FAQPage-datan låg i `__root.tsx`** och renderades därför på alla 189 sidor,
  även provpass och guider där inget av svaren syns. Googles krav är att
  FAQ-innehållet står synligt på just den sidan, så markupen var ogiltig
  överallt utom på `/faq` — som dessutom har en egen, korrekt FAQPage och alltså
  bar två. Borttagen ur roten. **Lägg inte tillbaka den där**: rätt ställe är
  den enskilda sidan vars innehåll faktiskt är frågorna.
- **hreflang låg också i roten**, hårdkodad till `/`. Varje undersida sa alltså
  åt Google att dess alternativa version var startsidan, tvärtemot sidans egen
  canonical. Sajten finns på ett språk och ska då inte ha hreflang alls.
- **"8 frågor på 8 minuter" stod på fem ställen** och matchen är 5 minuter
  (`TOTAL_SECONDS`, `match.$matchId.tsx`). Rättat i FAQ, tidspress-guiden och
  `llms.txt`.
- **`llms.txt` är statisk och driver AI-sökmotorernas svar.** Den hade 4 363
  uppgifter (är 4 800), "tio prov med ELF" (är alla 60 verbala pass), gratis
  coachning (är sajtens enda betaltjänst) och 1,9 i stället för 1,95. Den
  uppdateras inte av något bygge — rätta den för hand när fakta ändras.
- **En forumkategori utan trådar sätter `noindex, follow`.** Sex sidor med en
  rubrik och en mening är tunt innehåll som drar ner hela sajten. Grinden
  släpper av sig själv när första tråden postas; den är inte en flagga att
  komma ihåg.
- `antal()` i `sv-format.ts` finns för att "1 trådar" stod på forumets
  startsida — alltså på en indexerad sida.

### Resultat på gamla prov (2026-08-19)

Provlistan visar vad du fått: rätt av antal på varje skrivet provpass, en poäng
per provdel så snart båda dess pass är skrivna, och en totalpoäng när alla fyra
är det. `src/lib/prov-results.ts` räknar, `components/prov/ProvScore.tsx`
renderar, och samma siffror står på tre ytor — provlistan, provtillfällets sida
och resultatskärmen efter ett inlämnat pass.

- **Resultatet är ett eget lager, inte ett fält i `prov-progress.ts`.**
  Progressen är färskvara och städas efter en vecka (`MAX_AGE_MS`); resultatet
  ska stå kvar. Och det som sparas är summan (`score`/`total`), inte de fyrtio
  svaren: listsidan summerar trettio provtillfällen, och att räkna rätt ur
  svaren hade krävt att alla 120 provpassfilerna laddades — en chunk var — för
  att svara på en fråga som ryms i två heltal.
- **Nyckeln är `tkn:prov-resultat:v1`**, ett objekt med `"<term>:<pass>"` som
  nyckel. Lokalt lagrat av samma skäl som resten av gamla prov-flödet: det ska
  fungera utan konto, och servern har ingen anledning att veta vad någon övat
  på.
- **Totalpoängen är medelvärdet av delarnas poäng, inte en uppslagning av den
  sammanlagda råpoängen.** Så räknas provet — delarna normeras var för sig och
  snittas — och det är också det svar en provskrivare väntar sig: 1,90 verbalt
  och 2,00 kvantitativt blir 1,95. De två vägarna skiljer sig så fort delarna
  går isär, eftersom normeringstabellen inte är rät: 20 av 80 plus 80 av 80 blir
  1,10 som snitt men 1,25 som summa. `normeringFromParts` gör det förra.
  Poängräknaren på `/hogskoleprovet-poangraknare` gör det senare och ska
  fortsätta göra det — den tar emot råpoäng och har inga delpoäng att snitta.
- **En provdel får ingen poäng förrän båda dess provpass är skrivna.** Ett pass
  är fyrtio uppgifter av åttio, och en normering ur halva underlaget hade sett
  ut som ett provresultat utan att vara det. Rutan skriver därför ut vad som
  saknas ("1 av 2 pass") i stället för att bara utelämna siffran.
- **`useProvResults` returnerar `null` fram till första effekten.** Sidorna är
  serverrenderade och identiska för alla; läses lagringen redan under första
  renderingen blir det en hydreringsmiss på varje kort som har ett resultat.
- **Övningsläget räknas med, men märks ut.** Svaret låses när det läggs, så
  poängen är riktig — det som saknas är tidspressen, och det står vid passet
  och i rutans fottext.
- Poster som inte håller kastas i `parseResults`. localStorage är besökarens
  egen fil: ett `NaN` som slinker igenom hamnar inte i en logg utan i en poäng,
  som "NaN/40" bredvid provpasset.

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
- **Ingen tröskel på antal matcher sedan 2026-08-18.** Ett valt användarnamn är
  hela kravet: ett nyregistrerat konto står på listan direkt med 1000 i ELO och
  tankstreck (inte `0 %`) i Win %. Bakgrunden: 22 av 88 riktiga konton hade
  aldrig spelat en match och syntes därför inte alls, vilket gjorde listan
  kortare än antalet registrerade — 65 rader på 605 konton. Tröskeln har nu
  ändrats medvetet två gånger; återinför den inte utan att fråga.
- **Listan visar 50 rader**, `LEADERBOARD_SIZE` i `leaderboard.functions.ts`,
  och talet styr alla tre flikarna (verbal, matte, ord). `limit` i anropen
  måste förbli **större** än det: den som ligger utanför toppen får ändå se sin
  egen placering under tabellen, och den raden plockas ur samma svar.
- **Tre ytor visar samma lista och måste lyda samma regler**: topplistan,
  topp 5-blocket på landningssidan (`landing.functions.ts`) och MCP-verktyget
  `get_leaderboard`. Verktyget saknade dessutom namnfiltret helt fram till
  2026-08-18 och listade alltså gästkonton — det hämtar nu 500 rader och
  sållar med `isRankable` som de andra två.
- **Sedan tröskeln föll är `!me` i `AllTimeTable` liktydigt med "har inte valt
  användarnamn"**, inte "har inte spelat". Tomma tillståndet pekar därför på
  `/onboarding`, inte på "spela en match" — det senare hjälper inte.

### Landningssidans siffror (2026-08-20)

`getLandingStats` (`landing.functions.ts`) driver "N spelare · N matcher
spelade" under CTA:n. Alla siffror är riktiga och ska förbli det.

- **`totalMatches` är matcher PLUS påbörjade provpass.** Räknat på bara
  `matches` visade raden 780 medan gamla prov — 30 provtillfällen, 120 pass,
  sajtens mest besökta yta — bidrog med noll, eftersom provflödet inte lämnade
  något spår alls på servern. Etiketten står kvar som "matcher spelade" på
  begäran; ett provpass är 40 uppgifter mot matchens 8, så det är inte en
  uppräkning av siffran utan av vad den mäter.
- **Provdelen är framåtriktad och kan inte fyllas i bakåt.** Före 2026-08-20
  fanns skrivna provpass bara i besökarens localStorage
  (`tkn:prov-resultat:v1`) och i PostHog; `prov_attempts` kräver inloggning och
  hade noll rader. Historiken finns alltså inte att hämta någonstans.
- **Räkningen ligger i `audit_log` och kräver migrationen ovan.** Utan den
  avvisas varje `usage:`-rad av CHECK-villkoret, tyst, och siffran står still
  på antalet matcher.
- Endpointen är publik och `logProvStart` skriver en rad per klick på
  "Provläge"/"Övningsläge". Det är en yta för uppblåsning av en publik siffra;
  `limits.provStart` (60/h per IP) är bromsen, och den är per isolat.

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
- **Kassan är INBÄDDAD sedan 2026-08-29** (`ui_mode`, `client_secret`,
  `StripeCheckoutEmbed.tsx`). Det var tidigare en ren redirect till
  `checkout.stripe.com`, och den vägen finns kvar som reserv — men den är inte
  längre normalfallet, så tre saker som stod här förut gäller inte längre:
  - **Den publicerbara nyckeln behövs nu i klienten.**
    `STRIPE_PUBLISHABLE_KEY` (pk_live_…) ligger i `wrangler.jsonc` och skickas
    ut via `fetchCoachingOffer`, inte som en `VITE_`-variabel: en sådan går
    bara att sätta vid bygget, och ett kontobyte hade då krävt en ny build i
    stället för en ny deploy. **Är den tom bäddas kassan inte in** utan köparen
    skickas till Stripe som förut. Det är ett giltigt läge, men inte det man
    vill ha: hela poängen med att tiden väljs före betalningen är att köparen
    inte lämnar sidan däremellan.
  - **CSP:n måste släppa fram Stripe.** `script-src https://js.stripe.com`,
    `connect-src https://api.stripe.com https://m.stripe.network` och fyra
    värdnamn i `frame-src` (js, checkout, hooks, m.stripe.network). Faller ett
    bort syns det som en tom eller halv kassa plus en rad i konsolen — inget
    kastas.
  - **`ui_mode` heter `embedded_page`, inte `embedded`.** Namnet byttes mellan
    API-versioner och vi pinnar ingen version, så kontots version avgör.
    Verifierat mot skarpa kontot 2026-08-29; fel värde ger 400 med exakt
    beskedet vilket värde som gäller. Konstanten heter `EMBEDDED_UI_MODE`, och
    `openCheckout` faller tillbaka på den hostade kassan om sessionen inte går
    att skapa — ett versionsbyte får kosta bekvämlighet, inte försäljning.
  - **Klient-API:t heter `createEmbeddedCheckoutPage`** och laddas från
    `https://js.stripe.com/dahlia/stripe.js`. `/v3/` är föregångaren och saknar
    den funktionen; `initEmbeddedCheckout` är det gamla namnet och anropas som
    reserv. Scriptet får inte buntas eller speglas — Stripe kräver att det
    hämtas från deras domän, och PCI-efterlevnaden hänger på det.
  - Inga kortuppgifter passerar vår kod i något av lägena. Kassan är Stripes
    egen iframe.
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

**Tratten, steg för steg (2026-08-19).** Hela vägen mäts, och stegen är valda så
att varje avhopp går att peka ut. Alla ligger i `ProductEvents` och bär `source`
(`dashboard` / `landing` / `popup`), så samma tratt går att bryta ner per yta:

```
coaching_card_viewed      kortet/blocket syntes på skärmen
coaching_offer_opened     modalen öppnades           (+ available)
coaching_booking_opened   tidsvalet begärdes         (+ scheduling)
coaching_calendar_viewed  Calendlys väljare renderade
coaching_time_selected    en ledig tid klickades
coaching_time_booked      bokningen bekräftades
coaching_checkout_started skickades till Stripe      (+ is_guest)
coaching_purchase_completed  betalt (en gång per köp, från tacksidan)
```

- **Visningen är nämnaren.** Utan `coaching_card_viewed` betyder ett lågt antal
  öppningar antingen "ingen vill" eller "ingen skrollade dit", och de två kräver
  motsatta åtgärder. Den mäts med `useImpression` (`src/hooks/useImpression.ts`),
  en **callback-ref** och inte `useInView` från framer-motion: den senare läser
  `ref.current` i en effekt vars beroenden saknar elementet, så ett kort som
  monteras senare än komponenten (dashboarden renderar skelett tills profilen
  landat) hade aldrig fått någon observer — tyst.
- **`available` i `coaching_offer_opened` var falsk för alla fram till
  2026-08-19.** Flaggan finns för att skilja "ingen vill köpa" från "ingen kunde
  köpa", och rapporterades i samma andetag som modalen öppnades — innan priset
  hunnit in i statet. Två saker rättades: händelsen väntar på att hämtningen
  landat, och `useCoachingOffer` läser modulcachen **i renderingen** i stället
  för i en effekt. Det senare tog också bort en bildruta där modalen sa "köp
  direkt i appen är inte igång just nu" fast priset stod på knappen bakom.
- Nudgens egna `coaching_prompt_*` ligger före det här i kedjan; se avsnittet
  om den. En popup-öppning hoppar över erbjudandesteget (`autoStart`), men
  `coaching_offer_opened` fyras ändå — den betyder "modalen öppnades", inte
  "erbjudandet lästes".

### Tidsbokning i coachningen (Calendly, 2026-08-18)

Köparen väljer en tid **innan** kassan öppnas. Modalen har tre steg:
erbjudandet, Calendlys tidsväljare i en iframe och Stripes kassa i en annan.
`startCoachingBooking` skapar raden och länken, `completeCoachingBooking` läser
den bokade tiden ur Calendlys API, skriver den på raden och skapar först då
Stripe-sessionen. **Ingen av de tre lämnar sidan.**

- **Ordningen har vänts två gånger. Läs det här innan du vänder den en tredje.**
  En Calendly-bokning är ett åtagande i samma sekund den görs, medan en kassa
  går att överge — så en tid kan bli stående obetald, och det hände på riktigt
  2026-08-18 (någon bokade, stängde kassan och hade en timme gratis).
  - **2026-08-19** vändes ordningen till betala-först, och tidsvalet flyttades
    till `/coachning/tack` bakom en betald session.
  - **2026-08-29** vändes den tillbaka, med kassan **inbäddad** i samma modal.
    Det som gjorde tid-först dyrt var att kassan låg på ett annat värdnamn: den
    som stängde fliken hos Stripe lämnade en bokad, obetald tid efter sig. Med
    kassan i samma ruta är avståndet mellan "tiden är vald" och "det är betalt"
    ett klick. Skälet att välja tid först är oförändrat: den som redan har en
    tid i kalendern slutför köpet oftare än den som ska höra av sig sen.
  - **Baksidan finns kvar i det lilla** och `COACHING_SWEEP` måste därför vara
    `"on"` i drift — utan städaren är det här flödet en gratisbokningsautomat.
    Kassan går dessutom ut efter `CHECKOUT_TTL_MIN` (35 min, kortare än
    städarens `UNPAID_GRACE_MS`, pinnat i test) och `checkout.session.expired`
    släpper tiden direkt.
  - `startPaidCoachingBooking` / `attachPaidCoachingBooking` på tacksidan är
    **reserven**, inte normalvägen: den fångar köp som ändå blivit betalda utan
    tid (Calendly nere när modalen öppnades). Den kräver en betald session och
    går alltså inte att använda för att kringgå ordningen.
  - Vyn `coaching_obetalda_bokningar` listar det som ändå blir kvar
    (`paid_at IS NULL AND scheduled_at IS NOT NULL AND canceled_at IS NULL`)
    och avbokas för hand via `calendly_cancel_url`.
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
  ett giltigt läge. Sedan 2026-08-19 syns det även i mätningen:
  `coaching_booking_opened` utan ett `coaching_calendar_viewed` efter sig
  betyder att iframen laddade något annat än en väljare (se tratten nedan).
- **Slå INTE på "Collect payment" på event-typen i Calendly.** Kontot är kopplat
  till Stripe, men `is_paid` måste förbli `false`: annars betalar köparen i
  Calendly *och* `completeCoachingBooking` öppnar en andra Checkout-session
  efteråt. Det är en dubbeldebitering, och inget i koden upptäcker den.
- **Vad som händer inne i iframen läses ur Calendlys postMessage**, inte ur
  deras `widget.js` — det enda scriptet gör är att lyssna på samma meddelanden,
  och att göra det själva håller CSP:n vid `frame-src`. Parsern ligger i
  `src/lib/calendly-embed.ts` (ren och testad, eftersom URI:n därifrån går
  vidare in i ett anrop med vårt Bearer-token). Verifierat mot den skarpa
  widgeten 2026-08-19: den skickar `event_type_viewed` (två gånger, därav
  avdupliceringen), `date_and_time_selected` när "Next" trycks, och
  `page_height` däremellan som vi ignorerar.
- Migration: `supabase/migrations/20260818090000_coachning_calendly.sql`.
  `scheduled_at`, `calendly_*`-kolumnerna, unikt index på
  `calendly_invitee_uri` (en bokning hör till exakt ett köp) och vyn ovan med
  `security_invoker = true`.

### Städaren — obetalda tider rivs automatiskt (2026-08-19)

Det gick att kringgå Stripe på två sätt: boka i modalen och stänga kassan, eller
gå direkt på den publika Calendly-länken (den låg i iframens `src`) och aldrig
röra sajten. Båda lämnade en levande tid i kalendern. Tre lager stänger det.

- **`src/lib/coaching-sweep.ts` äger beslutet, `-.server.ts` gör jobbet.** Den
  rena delen ligger för sig därför att det handlar om att avboka någon annans
  möte: det ska gå att läsa och tvista om utan att ett nätverk är inblandat.
  Två frister, och de är olika långa med flit — en obetald rad är bevisligen vår
  och bevisligen obetald (`UNPAID_GRACE_MS`, 45 min), medan en bokning helt utan
  rad kan vara sekunder från att få sin (`ORPHAN_GRACE_MS`, 15 min).
- **`UNPAID_GRACE_MS` måste förbli längre än `CHECKOUT_TTL_MIN`** (35 min,
  `coaching.server.ts`, satt som `expires_at` på sessionen så snart en tid är
  bokad). Annars går det att betala för en tid vi just släppt, och köparen står
  med en betald rad utan tid i kalendern. Testet pinnar olikheten.
- **Städaren tittar BARA på coachningens egen event-typ.** Ska du boka in någon
  för hand — gör det på en **annan** event-typ i Calendly, annars river städaren
  bokningen och personen får ett avbokningsmejl. Det är den enda riktigt farliga
  egenskapen hos den här funktionen.
- **`COACHING_SWEEP` är en grind, inte en flagga att städa bort** — samma tanke
  som `CANONICAL_REDIRECT`. `on` avbokar, `report` räknar och loggar utan att
  röra något, osatt betyder **av**. Att osatt är av är avsiktligt: `.env.local`
  bär produktionstoken, så en lokal dev-server hade annars kunnat avboka skarpa
  möten. Kör alltid `?dry=1` mot skarpa data innan du slår på den.
- **Ett oläsbart `created_at` läses som "nyss", aldrig som "urgammal".** Motsatsen
  hade avbokat allt på en gång den dag Calendly ändrar sitt tidsformat.
- **Raden märks först när Calendly sagt ja.** Omvänd ordning ger en rad som ser
  avbokad ut medan tiden står kvar i kalendern — det enda utfallet som är sämre
  än att inte städa alls. Misslyckas Calendly-anropet görs inget, och nästa svep
  tar den (raden med `status='canceled'` men levande tid behandlas som "försök
  igen", inte som "klar").
- **Tre saker triggar den:**
  1. `checkout.session.expired` i Stripe-webhooken → släpper just den tiden
     direkt. Det är det exakta beskedet "den här köparen tänker inte betala".
     **Eventet måste vara påslaget på webhook-endpointen** — den lyssnade bara
     på `completed` + `async_payment_succeeded` fram till 2026-08-19.
  2. `GET /api/coaching/sweep?secret=…` var 15:e minut via **pg_cron**
     (`20260819120100_coachning_stadning_cron.sql`). Hemligheten står inte i
     filen — repot är publikt.
  3. Samma endpoint för hand, med `?dry=1` för torrläge.
- **Cloudflares Cron Triggers går inte att använda här.** Den byggda Workern
  *har* en `scheduled`-export (nitro lägger dit den, syns i
  `.output/server/index.mjs`), men den ropar bara på nitro-hooken
  `cloudflare:scheduled`, och TanStack Start ger ingen väg att registrera en
  nitro-plugin. Kroken finns men går inte att haka i — därför pg_cron.
- **`GET /scheduled_events` kräver `user`, `organization` eller `group`.** Ett
  filter på bara `event_type` avvisas med 400. Det syns inte i en curl som råkar
  ha `user` med, bara i en riktig körning.
- **Engångslänkar i stället för den publika slugen.**
  `createSingleUseSchedulingLink()` (`POST /scheduling_links`, `max_event_count:
  1`) ger en `calendly.com/d/…`-länk per bokningsförsök, så den publika
  `/60min`-adressen ligger inte längre i sidkällan. Den faller tillbaka på den
  publika länken om Calendly strular — en hicka får ta bort skyddet, inte köpet.
  **Skyddet är inte komplett:** den som redan känner slugen kommer förbi det, och
  event-typen svarar även när den är satt till "secret" i Calendly. Det är
  städaren som är garantin, inte länken.
- **Event-typens URI slås upp ur `CALENDLY_EVENT_URL`**, den står inte som egen
  variabel: två strängar som pekar på samma sak glider isär, och slugen är redan
  en känd tyst felkälla. Byts slugen matchar ingen event-typ, loggen säger det
  rakt ut, och städaren gör då **ingenting** (den avbokar aldrig i blindo).

### Nudgen om studieupplägget (2026-08-18)

Erbjudandet kommer upp av sig självt: **var sjunde sidvisning eller varannan
avslutade match**, det som inträffar först. `CoachingPrompt` (monterad i
`__root` under `SafeBoundary`) äger rutan, `lib/coaching-prompt.ts` äger
räkningen, och knappen går in i samma `CoachingModal` som korten på start- och
landningssidan — det finns fortfarande bara en väg till Stripe.

- **`MAX_PROMPTS = 1` är hela engångsspärren.** Allt annat är redan byggt
  återkommande: räknarna nollas vid visning, `PROMPT_COOLDOWN_MS` (24 h) står
  där och `promptTrigger` respekterar den. Att slå på återkommande är alltså
  att höja en siffra, inte att bygga om — och `coaching-prompt.test.ts` pinnar
  både trösklarna och vilotiden redan nu.
- **Räkningen ligger i localStorage** (`tkn-coaching-prompt`, versionerad som
  samtycket) och inte i databasen: nudgen ska gälla besökare utan konto, och
  "hur många sidor har du tittat på" hör inte hemma hos oss. Trasig eller
  gammal lagring tolkas som ett rent blad — värsta utfallet blir en visning för
  mycket, aldrig en räkning som tystnar för alltid.
- **Aldrig mitt i något.** `isPromptablePath` håller den borta från matcher,
  provpass, kassan och inloggningen. `/train` och `/ord` ligger med trots att de
  har en startvy: själva passet byter aldrig URL, så det går inte att skilja
  "har inte börjat" från "mitt i". En tröskad nudge på en blockerad väg går
  inte förlorad — räknarna står kvar och den kommer vid nästa tillåtna sida.
- **Aldrig ovanpå något annat.** Är en annan overlay uppe (utmärkelser,
  rank-up, onboarding, samtyckesbannern) hoppas visningen över helt.
  Kontrollen är `[role="dialog"]:not([data-state="closed"])` — Radix sätter
  `data-state`, de handrullade sätter `aria-modal`, alla sätter `role`.
- **Priset hämtas först när rutan ska upp** (`useCoachingOffer(öppen)`).
  Annars hade varje sidladdning i appen kostat ett anrop till en endpoint som
  bara nudgen behöver. Av samma skäl monteras `CoachingModal` först när nudgen
  visats — den drar in `useAuth`, alltså en auth-lyssnare och en profil-query
  per mount.
- **`autoStart` hoppar förbi erbjudandesteget** och går rakt på tidsväljaren,
  eftersom nudgen redan visat pris och argument. Bara när tidsbokning
  bevisligen är påslagen: utan Calendly faller `öppnaTidsval` vidare till
  Stripe, och att skicka någon in i en betalning på ett klick är inte samma sak
  som att visa lediga tider.
- **Köpet tystar den permanent.** `/coachning/tack` anropar
  `stopCoachingPrompts()` vid varje bekräftat köp, inte bara det första —
  `firstConfirmation` är falskt vid en omladdning.
- Matchen räknas när **resultatet visas**, inte när matchen startas: en
  påbörjad match som aldrig lämnas in är ingen spelad match. Samma engångsspärr
  som `match_result_viewed` gäller, så en omladdning räknar inte igen.
- Mätning: `coaching_prompt_{shown,clicked,dismissed}` med `trigger`
  (`pageviews` / `matches`). Källan in i Stripe-raden är `source: "popup"` —
  tillagd i alla tre zod-enumen i `coaching.functions.ts`.

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

### Provdatum och Event-data (2026-08-20)

Search Console rapporterade fyra "mindre allvarliga" Event-varningar på
`/hogskoleprovet-datum` — `image`, `offers`, `endDate` och `performer`
saknades. Alla fyra är rekommenderade fält i Googles Event-dokumentation och
är nu satta. Under fixen visade det sig att **alla tre provdatum var fel**,
vilket är den allvarligare halvan av det som rättades.

- **`HP_DATES` i `src/lib/hp-dates.ts` är enda källan** och matas rakt in i
  Event-datan, alltså i det Google kan visa som provdatum. **Lägg aldrig in
  ett gissat datum.** Kontrollera mot uhr.se:s kalender, studera.nu *och*
  hogskoleprov.nu — alla tre ska säga samma sak.
- **Vårprovet ligger på en lördag i april, höstprovet på en söndag i oktober**
  (söndag sedan 2022). Listan hade lördagsdatum för båda och låg 6 dagar fel
  på höstprovet 2026. Testet i `hp-dates.test.ts` pinnar veckodagen per
  årstid — det hade fångat felet.
- **Anmälan görs på `hogskoleprov.nu`, inte antagning.se.** Antagning.se är
  ansökan till utbildningar. Sidan, FAQ:n och `llms.txt` hänvisade alla fel.
- **Anmälningsperioden är en dryg vecka**, ett par månader före provdagen
  (11–18 aug 2026, 7–14 jan 2027), inte "tre månader innan" som texten sa.
  Provavgiften är 550 kr, `HP_FEE_SEK`.
- **Ett provtillfälle utan publicerad anmälningsperiod får ingen Event-data.**
  `hasRegistrationWindow` sållar. Google vill ha `validFrom` på `offers`, och
  ett halvt `offers` ger tillbaka exakt den varning fältet finns för att ta
  bort. Datumet får däremot gärna stå i den synliga listan.
- **`stockholmOffset()` räknar ut +01:00/+02:00, det får inte hårdkodas.**
  Höstprovet 2025 låg den 26 oktober, dagen efter sommartidsbytet — med det
  gamla hårdkodade `+02:00` hade nedräkningen legat en timme fel.
- **Datumtexter låses till UTC** (`hpDateLong`, `hpDateShort`,
  `registrationPeriodText`). Servern renderar i UTC och webbläsaren i sin
  egen zon; utan låsningen blir det en hydreringsmiss för alla öster om
  Sverige. `timeZone: "Europe/Stockholm"` löser det bara om runtime har full
  ICU, vilket inte är något att förlita sig på i en Worker.
- **`performer` är UHR.** Fältet är skrivet för konserter, men schema.org
  tillåter Organization och UHR är det enda ärliga svaret på "vem utför
  det här". `availability: SoldOut` betyder "anmälan är stängd" — av Googles
  tre värden är det enda som säger att man inte kan anmäla sig nu.
- **Samma mening stod handskriven på tre ställen** (FAQ-sidan, FAQPage-datan
  i `__root.tsx`, `llms.txt`) och alla tre bar kvar de gamla datumen. De två
  första kommer nu ur `hpDatesAnswer()`. **`llms.txt` är statisk och måste
  rättas för hand** när listan ändras.
- **Bilderna ritas av `scripts/build-event-image.py`** (tre bildformat,
  1200 px breda) och är medvetet datumlösa — en bild med "18 oktober 2026"
  tryckt i sig blir fel dagen efter provet, och Google cachar bilder länge.
  Gemensamma byggstenar för den och delningsbilden ligger i
  `scripts/brand_image.py`.
- Efter en ändring: **validera på <https://search.google.com/test/rich-results>**
  innan push, och begär omvalidering i Search Console efteråt.

### Märket, delningsbilden och omdömena (2026-08-18)

- **Märket är talet 2,0**, inte "HP" i en ruta. Det sitter i navbaren, i
  `public/favicon.svg` och i delningsbilden, och faviconen är ritad för 16 px:
  bara talet i en ton, kommat som form. PNG-varianterna (`icon-32`, `icon-192`,
  `apple-touch-icon`) måste finnas kvar — Google och Androids "lägg till på
  hemskärmen" tar inte SVG och faller annars tillbaka på en skalad skärmdump.
- **Byt URL, inte bara innehåll, när delningsbilden ändras.** Snapchat, Facebook,
  LinkedIn och Slack cachar förhandsbilden på URL:en, ofta i månader, och
  Cloudflare svarade `CF-Cache-Status: HIT` på den gamla vägen. Bilden heter
  därför `og-image-4.png` — nästa gång blir det `-5`. Fyra ställen följer med:
  `__root` (`og:image` + `twitter:image`), `guider-meta.tsx`, `manifest.json`
  och kommentaren i `page-meta.ts`.
- **Bilden ritas av `scripts/build-og-image.py`** sedan 2026-08-19 (Pillow,
  `python3 scripts/build-og-image.py`). Den var tidigare en PNG utan källa, och
  det kostade: `-3` hann ligga ute med **`HP Kampen`** som ordmärke i ett dygn
  efter namnbytet, eftersom en bild inte syns i en `grep` efter det gamla
  namnet. Ändras namnet, domänen eller siffrorna igen — kör om scriptet.
  Typsnitten hämtas ur `public/fonts/` om de finns, annars ur commit `189d203`
  till `.og-cache/` (gitignorerad), så scriptet fungerar trots att mappen är
  borta ur arbetsträdet.
- **Delningsbilden är centrerad, och det är ett krav — inte smak.** WhatsApp och
  iMessage beskär 1200×630 till en kvadrat mitt i bilden (x 285–915). Den
  vänsterställda `-3` la märket på x=96 och statistikraden ut till x=1104, så
  båda föll utanför den beskärningen. `SQUARE_SAFE` i scriptet krymper
  ordmärket tills det ryms, och allt innehåll ligger inom x 293–906.
- **Domänen står i bildens pixlar** — nederkantens rad. `-2` gjordes på en gren
  som saknade domänbytet och hade `hpkampen.se` tryckt där. Byts domänen måste
  `FOOTER` i scriptet med.
- **Centrering mäts, den ögonmåttas inte.** Två fel som såg rätt ut i
  förhandsvisningen: jämnt fördelade kolumnmitter i statistikraden la radens
  bläck 16 px vänster om mitten (`10 000+` är tre gånger bredare än `8`), och
  `ImageDraw.rectangle` ritar inklusive slutkoordinaten, så det övre bandet blev
  en pixel tjockare än det undre. Mät blockens bläck-bbox efteråt i stället för
  att titta.
- **Bytet av bild och bytet av domän gjordes på var sin gren och möttes först i
  en rebase.** Den ena sidan hade `hpkampen.se/og-image-2.png`, den andra
  `tvakommanollan.se/og-image.png`, och båda hade rätt i var sin halva. Sitter
  du i samma konflikt igen: **ny domän, nytt filnamn.**
- **`public/fonts/` är återställd 2026-08-19, som WOFF2.** Mappen togs bort i
  revert `98d852a` medan `styles.css` fortsatte `@font-face`:a fem filer
  därifrån, så sajten 404:ade sina egna typsnitt vid varje sidladdning och
  renderade i Georgia/system-ui. Felet överlevde i månader därför att ett
  saknat typsnitt **inte syns som ett fel någonstans** — texten renderas, bara
  med fel snitt, och varken bygget, testerna eller konsolen klagar.
- **Typsnitt kontrolleras i webbläsaren, inte i CSS:en.** Att `@font-face`
  står rätt bevisar ingenting. `document.fonts.check('16px "Young Serif"')` kan
  dessutom svara `true` på fallbacken i vissa lägen, så mät i stället samma
  sträng mot snittet och mot dess fallback i en canvas: skiljer sig bredden
  används den egna filen (Young Serif 354,4 px mot Georgia 310,3 px).
  Kör Chrome över CDP enligt avsnittet om verifiering ovan.
- **Snitten ligger som WOFF2, källorna som TTF i `189d203`.** 141 kB mot 360 kB
  för samma fem snitt. Konvertering:
  `python3 -m fontTools.ttLib.woff2 compress -o X.woff2 X.ttf` (`pip install
  fonttools brotli`). OFL-filerna måste ligga kvar bredvid — licensen kräver
  det. `Instrument Sans italic` laddas inte på startsidan och står som
  `unloaded` i `document.fonts`; det är CSS Font Loading API som bara hämtar
  snitt sidan faktiskt använder, inte ett fel.
- **Snittbetyget på landningssidan räknas ur `OMDOMEN`** (`SNITTBETYG` i
  `HeroLanding.tsx`), det skrivs aldrig för hand. `Stjarnor` tar `betyg` och
  fyller sista stjärnan delvis — fem hela stjärnor bredvid "4,8" säger emot
  siffran. Omdömena är riktiga personer; lägg aldrig till ett citat som ingen
  har sagt, och justera aldrig snittet utan att listan ändras.

### Mobil: säkra ytor och tryckytor (2026-08-21)

- **`viewport-fit=cover` står i `__root.tsx` och hör ihop med `pb-safe` /
  `pt-safe` / `px-safe` i `styles.css`.** Utan `cover` är varje `env(safe-area-
  inset-*)` noll; med `cover` men utan padding hamnar innehållet UNDER
  systemfälten. Lägger du till ett nytt element som ligger an mot en skärmkant
  (sticky/fixed upptill eller nedtill) måste det bära en av klasserna — annars
  är det matchens inlämningsknapp i hemindikatorns gestområde om igen.
  Klasserna adderar till befintlig padding, de ersätter den inte.
- **44×44 är minsta tryckyta.** `Button`s standardhöjd är 36 px (`h-9`), så
  knappar i matchflödet sätter `min-h-[44px]` explicit. Höjden kommer från
  padding, inte från en fast höjd, så texten fortsätter styra bredden.
- **Ingenting får läggas ovanpå ett pågående pass.** `isPromptablePath()` i
  `coaching-prompt.ts` är den gemensamma regeln, och **samtyckesbannern lyder
  under den sedan 2026-08-21**: på telefon är den full bredd och tog ~40 % av
  skärmen, alltså svarsalternativ D och E plus hela inlämningslisten, medan
  klockan tickade. Att skjuta upp frågan är dessutom integritetsmässigt säkert
  — utan svar laddas ingen analys.

### Key conventions

- All user-facing text is in Swedish (sv-SE)
- `displayCategory()` in `src/lib/sv-format.ts` — always use this to render question category names (maps `"LAS"→"LÄS"`; other codes like ORD, MEK, ELF are already display-safe)
- Number/date formatting helpers (`formatInt`, `formatDecimal`, `formatRelativeTime`, etc.) are in `src/lib/sv-format.ts` — use these everywhere instead of raw `toLocaleString`
- `@/` path alias maps to `src/`
- Animations: use `m.div` etc. from framer-motion (`import { m } from "framer-motion"`), NOT `motion.div` — the app runs under `<LazyMotion strict>` (root) with features async-loaded via `src/lib/motion-features.ts`; `motion.` throws at runtime in this setup
- **En rubrik får inte byggas av blocknivåboxar.** Webbläsaren lägger en
  RADBRYTNING i kopierad text vid varje sådan gräns, och tar dessutom med text
  som ligger osynlig i DOM:en. `CyclingTitle` var en `inline-grid` där alla ord
  låg i samma cell — att kopiera `/guider`:s rubrik gav
  `"Bemästra \nOrd.\nLäsning.\nMatte.\nTidspress."`, fem rader varav fyra ord
  aldrig hade synts. Rutan är nu `position: relative; display: inline-block`
  med det synliga ordet i flödet och resten absolutpositionerade och
  `select-none`. Mätt i Chrome: `inline-grid` → radbrytning, `inline-block` →
  ren rad. `user-select: none` tar bort de osynliga orden men INTE
  radbrytningen — det är boxtypen som avgör den. `SplitText`s ord är
  `inline-block` och kopierar därför rent redan.
- **En klippmask på ett inline-element får ALDRIG vara `overflow: hidden`.** En
  inline-block vars overflow inte är `visible` tar sin baslinje från
  **bottenmarginalkanten** i stället för från texten, alltså hamnar ordet
  ~0,19em för högt mot allt annat på samma rad (12 px vid 64px-rubriken). Det
  var därför det cyklande röda ordet i `CyclingTitle` såg ut att "hänga lägre"
  än rubriken på /ord, /om, /train, /leaderboard och /guider — i själva verket
  satt det röda ordet rätt och `SplitText` satt högt, och samma rubrik stod på
  två olika höjder beroende på om besökaren hade reduced motion på (då renderas
  ren text, utan mask). Båda maskerar nu i höjdled med
  `clip-path: inset(0 -100%)`, som lämnar baslinjen i fred och dessutom inte
  klipper i sidled. Mät alltid ihop de två: `blackWrap.top === grid.top` på
  samma rad, och kontrollera att bläcket ryms i fönstret (smalaste marginalen i
  beståndet är 2,7 px, för "LÄS." uppåt och "betydelser." nedåt).
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
- **`--success-ink` / `--danger-ink` hör hemma på SOLID botten, ingen annanstans.**
  De är ljusa (`#e7f0e3`, `#fff1f0`) och avsedda för text ovanpå `--success`
  respektive `--danger` i full styrka. Läggs de på `--success-soft` /
  `--danger-soft`, eller rakt på kortet, blir kontrasten **1,0–1,2** — texten
  försvinner helt utan att något ser trasigt ut i koden. Det hände på fem
  ställen samtidigt: rätt svar i `/ord` (`text-green-100` på `bg-green-500/10`,
  1,14), "Löst"-pillret, "Bästa svar", avstängningsbrickan och
  anmälningslistan. **På mjuk botten är texten `--success` / `--destructive`**
  (5,09 / 7,21). `--danger` som text på `--danger-soft` räcker inte — 3,94,
  under 4,5.
- **Mönstret för rätt/fel-alternativ står i `/train`** och `/ord` följer det:
  själva svarstexten är innehåll och behåller `text-foreground` (12,7), medan
  bokstavsbrickan är solid `--success`/`--danger` och bär färgen. Färga aldrig
  svarstexten efter status — den som just svarat vill kunna läsa vad ordet var.
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
- **Inga tankstreck mitt i en mening** (2026-08-21). Sajten hade 95 stycken i
  text besökare läser, nästan alla i samma konstruktion: färdig sats, streck,
  påhängd förklaring ("alla 8 delprov – helt gratis"). Em-streck (`—`) är
  dessutom en engelsk konvention; svenskt tankstreck är kort streck med
  mellanslag och används sparsamt. I den tätheten läser texten som
  maskinskriven, vilket är precis vad en sajt byggd med LLM inte vill se ut
  som. Välj i stället det skiljetecken strecket gjorde jobbet åt: **punkt**
  mellan två självständiga satser, **komma** vid apposition, **kolon** före en
  uppräkning, **parentes** vid inskott, och `·` — sajtens egen separator — där
  strecket skilde namn från etikett i en titel.
  - **Ett komma är inte lösningen.** Att byta `– helt gratis` mot
    `, helt gratis` behåller konstruktionen och därmed problemet; det var så
    startsidans `ogDescription` slank igenom första svepet. Skriv om ledet till
    en egen mening, eller flytta in ordet i satsen ("Träna **gratis** på ORD,
    …").
  - **Strecket som betyder "inget värde" är något annat** och ska vara kvar:
    `formatPercent(null)` → `–`, tomma tabellceller, `PodiumRank` utan
    placering. Det är en symbol, inte skiljetecken. Använd tankstreck (`–`)
    till det, aldrig em-streck — de två glyferna användes tidigare om vartannat
    för exakt samma sak.
  - **Intervall behåller sitt streck utan mellanslag** (`2012–2026`, `A–E`,
    `11–18 augusti`). Det är korrekt och skvallrar inte.
  - Kodkommentarer är undantagna. Repot är skrivet i den stilen rakt igenom och
    ingen besökare läser dem; att städa dem är brus utan effekt.
  - **`index.tsx` sätter egen `description`/`ogDescription` och överrider alltså
    `__root.tsx` för `/`.** Det är den texten som syns när någon delar
    startsidan. Rättar du rotens strängar utan den, ändras ingenting utåt.

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

### Gästnamnet får aldrig skrivas till `users.username` (2026-08-20)

`users.username` är **UNIQUE**, och `guestName()` lottar ur en lista på **20
ord**. Mellan 2026-08-18 och 2026-08-20 skickade `useGuestPlay` och
`matchmaking.tsx` med namnet i metadatan vid `signInAnonymously()`, så triggern
skrev in det — och det tjugoförsta gästkontot som lottade ett upptaget namn
fick unique-violation i `handle_new_user`, vilket auth svarar på med
`500 "Database error creating anonymous user"`. Användaren såg **"Kunde inte
starta gästläge"**.

- **Felet ratchetar och är därför inte reproducerbart på beställning.** Varje
  lyckad gäst gör nästa sämre: vid upptäckten var 15 av 20 namn tagna, alltså
  föll 75 % av alla försök, slumpmässigt. Det såg ut som ett flakigt nätverk.
- **Ingen migration behövs och ingen ska göras.** Triggerns fallback
  `'user_' || left(id, 8)` är unik per konstruktion, och `displayName()`
  (`guest-name.ts`) gör om den till "Gäst ekorre" **vid rendering** — navbar,
  match och resultatskärm går alla genom den. Namnet var alltså redundant med
  visningslagret hela tiden.
- **`guestName()` är en ren visningshjälpare.** Kollisioner är acceptabla där
  och bara där. Skriv den aldrig till databasen igen.
- De 15 rader som hann skrivas ligger kvar och är giltiga; `isAutoUsername`
  känner igen båda schemana, pinnat i `username.test.ts` och
  `guest-name.test.ts`.
- **`20260820150000_registrering_overlever_upptaget_namn.sql` ÄR körd**
  (verifierat mot produktion 2026-08-21: `pg_proc.prosrc` för
  `handle_new_user` innehåller loopen). Den gör triggern tålig mot ett upptaget
  namn: önskat namn → `user_<8 hex>` → `user_<hela uuid>`, i den ordningen, och
  `RAISE EXCEPTION` om alla tre skulle falla. Koden är inte beroende av den —
  den är ett skyddsnät för `/signup`, där två personer kan välja samma namn i
  samma sekund och annars fick var sin 500 i stället för ett formulärfel.
- **Regexen i `isAutoGuestName` är `user_[0-9a-f]{8,}`, inte `{8}`.** Migrationen
  ovan kan skriva hela UUID:t som namn; låst vid exakt åtta hade de kontona
  visat sitt id i UI:t och rankats på topplistan.

### GDPR / privacy — non-negotiable

- `/integritetspolicy` must stay **factually true**. Since 2026-08-15 it documents PostHog analytics behind explicit consent — update it whenever what we collect changes.
- **Consent gate (added 2026-08-15).** `src/lib/consent.ts` stores the choice (`tkn-analytics-consent` in localStorage, versioned); `src/lib/analytics.ts` loads posthog-js via **dynamic `import()` only after a yes** — never import it statically, that would run the script before the user answers and defeats the whole gate. `<ConsentBanner />` asks, `<ConsentSettings />` (on `/integritetspolicy`) lets the user revoke, `<Analytics />` does identify + SPA `$pageview`. Bump `CONSENT_VERSION` when collection expands — old consents stop counting and the banner returns.
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
- **Och sedan stoppades samma rader av ett CHECK-villkor** (upptäckt
  2026-08-20). `audit_log.action` skapades med
  `CHECK (action IN ('insert','update','delete','admin_action','dispute','rate_limit_hit'))`,
  alltså släpper den inte in `usage:`-namnrymden alls. Inserten avvisas med
  23514, felet `console.error`:as (statistik får aldrig störa användarflödet)
  och tabellen stod på **noll rader totalt** medan admin-vyn läste noll och såg
  helt normal ut. Två tysta fel i rad på samma väg — det andra osynligt bakom
  det första. `20260821100000_audit_log_slapper_in_anvandningshandelser.sql`
  släpper in `action LIKE 'usage:%'` och indexerar kolumnen. **Kontrollera att
  raden faktiskt landade** när du lägger till en ny `usage:`-händelse; ett 200
  från serverfunktionen bevisar ingenting, den sväljer felet med flit.
- **Var PostHog nås står på ett ställe i koden**: `src/lib/analytics-host.ts`.
  Klientens `api_host` och Workerns CSP läser samma `VITE_PUBLIC_POSTHOG_HOST`,
  därför att en CSP som pekar på en annan värd än klienten ringer blockerar
  varje händelse **utan att något kastas eller loggas** — siffrorna planar bara
  ut. Vite bakar in `.env`-värdet i *båda* bundlarna vid bygget (verifierat i
  `.output/server/_ssr/index.mjs`), så det är `.env` som avgör; `process.env`
  är en reserv som optimeras bort i ett normalt bygge. Håll kopian i
  `wrangler.jsonc` i synk ändå.
- **Managed reverse proxy (PostHog → Settings → Managed reverse proxy)** är inte
  påslagen ännu. Den finns för att ad-blockerare blockerar `eu.i.posthog.com` på
  värdnamnet; en egen underdomän går förbi filtren. Gratis på PostHog Cloud.
  Ordningen är hela poängen — koden är redan förberedd, det som saknas är
  domänen:
  1. Skapa proxyn i PostHog och välj en **neutral** underdomän. Inte `analytics`,
     `track` eller `stats` — de orden står i filterlistorna, och då var hela
     övningen förgäves. `lund.tvakommanollan.se` eller liknande.
  2. CNAME i Cloudflare från underdomänen till värdet PostHog visar
     (`<hash>.proxy-eu.posthog.com`), **DNS only / grått moln**. Med orange moln
     terminerar Cloudflare TLS och PostHog kan aldrig utfärda sitt certifikat.
  3. Vänta 2–30 min på certifikatet. Under tiden **hårdfelar** underdomänen i
     webbläsaren, eftersom vårt HSTS-huvud har `includeSubDomains` med ett års
     max-age — det är väntat, inte ett fel att felsöka.
  4. Sätt `VITE_PUBLIC_POSTHOG_HOST` till `https://<underdomän>` i `.env` (det
     är den som bakas in) och i `wrangler.jsonc`, pusha, och kontrollera i
     nätverksfliken att
     anropen går till underdomänen och svarar 200. CSP:n följer med av sig
     själv. `ui_host` ska fortsätta peka på `https://eu.posthog.com` — det är
     bara länkarna in i PostHogs eget gränssnitt.
  PostHogs egna värdnamn står kvar i CSP:n även efter bytet. Det försämrar inte
  proxyn (blockeraren läser adressen i anropet, inte CSP-huvudet) och gör att
  steg 4 inte kan släcka analysen om proxyn ännu inte svarar.
- posthog-js renames config keys between versions. `enable_heatmaps` is gone (now `capture_heatmaps`), and the exported client type moved, so `analytics.ts` derives it via `(typeof import("posthog-js"))["default"]` instead of importing a name. Verify keys against `@posthog/types/dist/posthog-config.d.ts` before adding any — the keys are **not** in `posthog-js`'s own `.d.ts`.
- Also on: `capture_dead_clicks`, `capture_performance` (web vitals + network
  timing). `capture_exceptions` is explicitly `false` — errors have their own path
  and would drown the funnels. That a feature is live is verifiable in the
  browser: PostHog fetches `web-vitals.js` / `dead-clicks-autocapture.js` from
  `eu-assets.i.posthog.com` only when the matching config is on.
- Account deletion exists (`src/lib/account.functions.ts` + danger zone on `/stats`): deletes personal data, anonymizes the `users` row (empty username hides it from leaderboards, match FKs survive), hard-deletes the auth user with scramble+ban fallback.
- Usage analytics go through `logUsageEvent` → `audit_log` with `usage:`-namespaced actions (no new tables needed). Admin dashboard: `/admin` → "Användning".
- **`logProvStart` är den enda av dem som inte kräver konto.** Gamla prov är
  sajtens mest använda yta *och* den enda som fungerar helt utan inloggning, så
  allt som loggas bakom `requireSupabaseAuth` mäter per definition en delmängd.
  Den går genom `optionalSupabaseAuth` och skriver `user_id: null` för
  utloggade (kolumnen är nullable). Åtgärderna står i `usage-actions.ts`, inte
  som strängar på båda sidor — skrivningen och räkningen får inte kunna glida
  isär utan att något felar.
- Error messages to clients must be generic Swedish — log the raw DB error server-side (`throwDbError` pattern in `word-practice.functions.ts`).

### DB migrations

- **En kolumn-`REVOKE` mot en tabellbred `GRANT` gör ingenting.**
  `revoke select (correct_answer) on public.questions from authenticated`
  lyckas utan att ändra något, eftersom rättigheten är beviljad på hela
  tabellen. Kolumnskydd kräver att tabellrättigheten dras in och beviljas om
  kolumn för kolumn — se `20260818140100_dolj_facit.sql`. Kontrollera alltid
  efteråt i `information_schema.column_privileges`; utan den kontrollen ser en
  verkningslös migration ut som en genomförd.
- **Kolumnlistan måste hållas i synk.** Läggs en ny kolumn till på `questions`
  saknar klienterna `SELECT` på den tills den lagts in i grant-listan.


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
the caller's token and reads `is_admin` with the service role. `clean-math-questions`
(bills per AI call) uses it. `import-gamla-prov` gjorde det också, men togs bort
2026-08-19: den hämtade `https://hpkampen.se/gamla-prov-data.json`, en fil som
försvann när provdatan flyttade in i `import.meta.glob`, på den gamla domänen.

Deploy with the standalone CLI binary and an access token:
`SUPABASE_ACCESS_TOKEN=... supabase functions deploy <name> --project-ref <ref>`.
`clean-math-questions` also needs `LOVABLE_API_KEY` set under Edge Functions →
Secrets; it is **not** set in the new project, so that function cannot run yet.
