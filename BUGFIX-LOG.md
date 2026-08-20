# BUGFIX-LOG

Arbetslogg för buggfix- och förbättringsuppdraget (påbörjat 2026-08-19).
En rubrik per punkt: **vad som var fel**, **vad jag ändrade**, **filer**,
**hur jag verifierade**, och **antaganden**.

---

## 0. Kartläggning av kodbasen

**Stack.** TanStack Start (SSR) + React 19 + TypeScript + Tailwind 4 +
Supabase + Cloudflare Workers. Byggs och deployas av Cloudflare Workers Builds
direkt från `main`.

### Routing

Filbaserade routes i `src/routes/`, route-trädet genereras till
`src/routeTree.gen.ts` (redigeras aldrig för hand). Viktiga vyer:

| Route | Vad |
| --- | --- |
| `/` | `HeroLanding` för utloggade, `HomeDashboard` för inloggade |
| `/matchmaking` | rankad kö, faller tillbaka på bot |
| `/match/$matchId` | själva matchen (8 frågor, 5 min) |
| `/result/$matchId` | resultat + genomgång med facit |
| `/train` | solo-träning, egen setup-vy |
| `/ord` | ORD-repetition (SM-2) |
| `/gamla-prov`, `/gamla-prov/$term`, `/gamla-prov/$term/$pass` | provarkivet |
| `/leaderboard`, `/friends`, `/stats`, `/admin` | topplista, vänner, statistik, admin |
| `/forum…` | forumet |
| `/coachning/tack` | kvitto efter Stripe-köp |

Serverfunktioner (`createServerFn`) i `src/lib/*.functions.ts`, server-only
hjälpare i `src/lib/*.server.ts`. `src/server.ts` äger det som måste svara före
React: `/api/health`, `/api/stripe/webhook`, `/api/coaching/sweep`,
`/forum-sitemap.xml`, kanonisk värd och 301:or.

### Supabase-schema (det som rör uppdraget)

- **`users`** — profil + spelstatus: `elo_verbal`, `elo_math`,
  `elo_verbal_peak`, `elo_math_peak`, `games_played`, `wins`, `losses`,
  `current_streak`, `longest_streak`, `last_active_date`, `username`,
  `is_admin`, forum-fälten. Raden skapas av triggern `handle_new_user()` på
  `auth.users`.
- **`questions`** — hela frågebanken (ORD, MEK, LAS, ELF, XYZ, KVA, NOG, DTK)
  med `correct_answer`, `options`, `explanation`, `definition`, `image_url`,
  `cleaned_question_text` / `cleaned_options` / `clean_status` för matte.
  `correct_answer` är kolumnskyddad sedan `20260818140100_dolj_facit.sql`.
- **`matches`** — `player1_id`, `player2_id`, `player{1,2}_score`,
  `player{1,2}_submitted_at`, `winner_id`, `status`, `is_bot_match`,
  `bot_elo`, `room_code`, `created_at`.
- **`match_questions`** — kopplingstabell match ↔ fråga med `question_order`.
- **`match_answers`** — ett svar per (match, användare, fråga). Används också
  för träning med `match_id = null` och `is_training = true`.
- **`elo_history`** — `elo_before` / `elo_after` / `elo_change` per match och
  användare, unikt index på (user_id, match_id).
- **`user_word_failed` / `user_word_correct`** — ORD-repetitionen (SM-2).
- **`coaching_requests`** — ett köp: Stripe-fälten + Calendly-fälten.
- **`coaching_leads`** — ringlistan från kvalificeringsformuläret.
- **`bug_reports`**, `audit_log`, `page_views`, forumets sju tabeller.

### Auth

- Klient: `useAuth()` (`src/hooks/useAuth.ts`) → `user`, `profile`, `loading`.
- Anonymt spel: `supabase.signInAnonymously()` via `useGuestPlay`.
- Serverfunktioner som kräver inloggning kör `.middleware([requireSupabaseAuth])`
  (läser Bearer-token). `optionalSupabaseAuth` när inloggning är frivillig.
- Token injiceras i alla `/_serverFn/`-anrop av `installSupabaseFetchAuth()`
  som anropas en gång i `__root.tsx`.
- Inloggning med användarnamn går via `signInWithUsername` — uppslaget
  namn→e-post ligger på servern med flit.

### Matchflöde

`createMatch` / `inviteFriendToMatch` → `joinMatch` / `acceptMatchInvite`
lägger in frågorna och sätter `status='active'` → båda svarar → `submitMatch`
rättar på servern och sätter `player{1,2}_submitted_at` → när båda lämnat in
kör `processMatchResultServer` ELO, `winner_id` och `status='finished'`.
Botens poäng och tid simuleras i `simulateBotMatch`.

### E-postflödet

**Fanns inte.** Ingen Resend, ingen utgående e-post alls i repot vid start —
Stripe skickade sitt eget kvitto och Calendly sin egen bokningsbekräftelse, och
det var allt. Byggt i punkt 18–19.

### Betalflödet

`CoachingModal` → (tidigare) Calendly-tidsval → Stripe Checkout (redirect, ingen
SDK; REST via `fetch` i `src/lib/stripe.server.ts`) → `/coachning/tack`.
Webhooken i `src/server.ts` bokför, tacksidan är reserv. `markCoachingPaid()` är
idempotent. Städaren (`coaching-sweep*`) avbokade obetalda tider i efterhand.

---

## Kör detta FÖRE nästa push till `main`

Sju migrationer i `supabase/migrations/` är skrivna men **inte körda**.
Produktionen har ingen CLI-runner, så de körs för hand i Supabases SQL-editor,
i den här ordningen:

```
20260819160000_match_started_at.sql
20260819170000_egen_epostverifiering.sql
20260819180000_coachning_betalning_fore_bokning.sql
20260819190000_prov_forsok.sql
20260819200000_match_review_bild_och_forklaring.sql
20260819210000_buggrapport_utan_konto.sql
20260819220000_ringlista_epost_och_meddelande.sql
```

Koden är byggd för att tåla att de INTE är körda (se punkt 32), så ordningen kan
inte släcka sajten. Men innan de är körda saknas funktionerna de bär: tiden
räknas från `created_at` som förut, provsvar sparas inte i databasen, forumets
mejlgrind läser fortfarande `auth.users.email_confirmed_at`.

**Utanför repot, och kan bara du göra:**

1. **Supabase → Authentication → Providers → Email → "Confirm email" AV.**
   Det är den här inställningen punkt 2 handlar om. Utan den slutförs inte
   registreringen direkt.
2. **`RESEND_API_KEY`** som krypterad Cloudflare-Secret:
   `wrangler versions secret put RESEND_API_KEY` följt av
   `wrangler versions deploy "<id>@100%"`. Utan den skickas inga mejl alls —
   allt loggas och släpps, och inget flöde går sönder.
3. **DNS för e-post** — se punkt 19. Domänen måste verifieras i Resend, och
   `tvakommanollan.se` saknar SPF helt trots `_dmarc p=reject`.

---

## P0 – Kritiskt

### 1. Betalning kringgås vid bokning ✅

**Vad som var fel.** Tidsväljaren visades **före** kassan. En Calendly-bokning
binder tiden i samma sekund den görs medan Checkout går att stänga, så en tid
kunde tas i anspråk utan att någon betalade — det hände på riktigt 2026-08-18.
Värre: den publika bokningslänken låg i iframens `src` på varje sidvisning och
gick att spara undan och boka på helt utan att passera sajten.

Ordningen var ett medvetet val (den som har en tid i kalendern slutför köpet
oftare) med en dokumenterad baksida och en städare som rev obetalda tider i
efterhand. Städaren lagar en följd, inte orsaken.

**Vad jag ändrade.** Vände ordningen.

- `CoachingModal` har inget bokningssteg längre — knappen går rakt till Stripe.
- `startPaidCoachingBooking` kontrollerar betalningen **mot Stripe** (inte mot
  vår egen rad, som kan vara osynkad om webhooken är sen) och ger först då en
  engångsgenererad Calendly-länk.
- `completeCoachingBooking` skriver tiden på raden bara om `paid_at` är satt
  **och** sessionens `coaching_request_id` pekar på just den raden. Den skapar
  inte längre någon Checkout-session.
- Tidsväljaren renderas av nya `CoachingScheduler` på `/coachning/tack`.
- Avbruten eller misslyckad betalning ger varken bokning eller mejl, eftersom
  båda hänger på `sessionIsPaid(session)`.

Städaren står kvar som andra lager: den som redan känner den publika sluggen
kommer förbi länkskyddet, och det är städaren som är garantin.

**Filer.** `src/lib/coaching.functions.ts`, `src/components/CoachingModal.tsx`,
`src/components/CoachingScheduler.tsx` (ny), `src/routes/coachning.tack.tsx`,
`src/components/CoachingPrompt.tsx`, `src/routes/villkor.tsx`,
`supabase/migrations/20260819180000_coachning_betalning_fore_bokning.sql`.

**Verifierat.** `npx tsc --noEmit`, `npm run test`, `npm run build`. Själva
köpet går inte att provköra utan att dra ett riktigt kort — se "Vad som återstår".

**Antagande.** Konverteringen kan sjunka något, eftersom argumentet för den
gamla ordningen var reellt. Du bad uttryckligen om betalning först, och en tid
som tas utan betalning är ett åtagande vi inte får.

### 2. Registrering krävde verifierad e-post ✅

**Vad som var fel.** `mailer_autoconfirm: false` i Supabase Auth (verifierat mot
`/auth/v1/settings`). `signUp` gav då ingen session, och `/signup` visade en
"kolla din mejl"-skärm. Google-inloggning slapp det eftersom adressen redan är
verifierad där.

**Vad jag ändrade.** Två halvor, och båda behövs:

1. **I Supabase (gör själv):** Authentication → Providers → Email →
   **"Confirm email" AV**. Motsvarar `mailer_autoconfirm = true` i
   auth-konfigurationen, och går även att sätta via Management API:
   `PATCH https://api.supabase.com/v1/projects/<ref>/config/auth`. Jag har ingen
   `SUPABASE_ACCESS_TOKEN` här, så jag kunde inte göra det åt dig.
2. **I koden:** en egen verifiering vid sidan av. `users.email_verified_at`, en
   tokentabell med **hashade** engångstoken (bara SHA-256 lagras), routen
   `/verifiera-epost`, och `EmailVerificationNotice` — en stängbar remsa under
   navbaren med "skicka igen". Inget blockeras under tiden.

**Varför en egen flagga och inte GoTrues.** Med autoconfirm på sätter GoTrue
`email_confirmed_at` redan vid registreringen, alltså innan någon klickat på
något. Den kolumnen betyder efter ändringen "adressen är angiven", inte
"adressen är bevisat din" — och forumets spamgrind byggde på just det beviset.
Utan en egen flagga hade grinden tystnat utan att en rad kod ändrats.
`forum_can_post()` och `forum_post_block_reason()` läser nu `email_verified_at`,
med backfill från `auth.users.email_confirmed_at` för alla befintliga konton.

**Låser något?** Nej. Google-konton märks verifierade direkt av
`handle_new_user()` (providern är inte `email`). Det enda som kräver bekräftad
adress är att skriva i forumet, och grinden säger vilket som saknas.

**Filer.** `supabase/migrations/20260819170000_egen_epostverifiering.sql`,
`src/lib/email-verification.functions.ts`, `src/routes/verifiera-epost.tsx`,
`src/components/EmailVerificationNotice.tsx`, `src/routes/signup.tsx`,
`src/routes/__root.tsx`, `src/lib/rate-limit.ts`.

### 3. Fel vinnare i match mot annan spelare ✅
### 4. "Oavgjort" visades vid vinst ✅

Samma rot, därför tillsammans.

**Vad som var fel.** Resultatsidan jämförde `player1_score` mot `player2_score`
i en rad den läste **en gång**, direkt efter egen inlämning. Två följder:

- **Båda kunde vinna.** Motståndarens poäng var inte skriven än och lästes som
  `0`, så varje spelare såg sig själv som vinnare i sin egen webbläsare.
- **Vinst visades som oavgjort.** Två oskrivna poäng är lika, alltså "Oavgjort!".

Och ett andra, självständigt fel bakom just botfallet: `winner_id` sätts till
`match.player2_id`, som är **NULL för botmatcher**. En förlorad botmatch fick
alltså `winner_id = null` — vilket statistiksidans historik läste som oavgjort.

**Vad jag ändrade.**

- Ny ren modul `src/lib/match-outcome.ts`: utfallet är **odefinierat tills
  matchen är `finished`**. Den som frågar innan dess ska visa "räknar ut", inte
  gissa. Är den klar är `winner_id` svaret, med poängjämförelse som reserv för
  just bot-NULL-fallet.
- Resultatsidan pollar tills matchen är färdigräknad (max ~40 s) och ber
  servern räkna under tiden.
- `submitMatch` skriver aldrig om en färdig match och simulerar aldrig boten två
  gånger. En andra inlämning kunde annars ge en **ny** motståndarpoäng efter att
  vinnaren avgjorts, så poängen och vinnaren sa emot varandra.
- En match där motparten aldrig lämnar in avgörs på sparade svar efter 45 s
  (`FORCE_FINISH_AFTER_MS`), i stället för att bli stående. Klientens
  30-sekundersnedräkning hjälper bara om motpartens flik är öppen.

**Filer.** `src/lib/match-outcome.ts` + `.test.ts` (nya), `src/lib/match.server.ts`,
`src/lib/match.functions.ts`, `src/routes/result.$matchId.tsx`, `src/routes/stats.tsx`.

**Verifierat.** Åtta enhetstester som bland annat pinnar att båda aldrig kan
vinna och att ett halvskrivet läge ger `null` och inte "draw". End-to-end mot
skarpa databasen: botmatch 1–6 → **"Du förlorade"** (tidigare "Oavgjort").

### 5. Poängräkningen normerade mot fel prov ✅

**Vad som var fel.** All normering gick genom **en** handskriven
approximationstabell — densamma för vårprovet 2012 och höstprovet 2025. UHR
normerar varje prov för sig och sätter gränserna efter provdagen, och de rör
sig: 72 rätt av 80 verbalt är **1,8** på höstprovet 2020 men gav **1,9** ur
approximationen.

**Vad jag ändrade.** `scripts/hp-import/normering.py` hämtar UHR:s riktiga
tabeller → `src/data/prov/normering.json`. **26 av 30 provtillfällen** har nu
båda delarna officiellt normerade.

Tre saker var svårare än de såg ut:

- **Bara det senaste provet har tabellerna länkade** från sin provsida. Resten
  ligger avlänkade kvar på servern, precis som ELF-originalen. De letas via
  Internet Archives register över `normeringstabeller/` plus gissade namn i de
  fem mappformer UHR använt sedan 2011.
- **Vilket prov en tabell hör till läses ur PDF:ens egen rubrik**, aldrig ur
  filnamnet. Koden i filnamnet (`22a1`) är tvetydig de terminer som hade två
  prov. Vårprovet 2016 krävde dessutom samma datumalias som `build.py` har.
- **Layouten har två former.** Höstprovet 2018 är satt kolumnvis (alla
  intervall först, sedan alla poäng); en radvis läsning gav då en enda rad.
  Parsern provar båda och tar den som validerar.

Antalet uppgifter läses ur tabellen och antas **inte** vara 80: vårprovet 2012
hade 76 i den verbala delen.

Provtillfällen utan tabell (2019ht, 2023ht, 2024ht, 2025vt saknar en del var)
faller tillbaka på approximationen, och gränssnittet **säger vilket det är** i
stället för att presentera båda som samma sak.

**Filer.** `scripts/hp-import/normering.py` (ny), `src/data/prov/normering.json`
(ny, genererad), `src/lib/normering.ts`, `src/lib/prov-results.ts`,
`src/components/prov/ProvScore.tsx`, `src/components/prov/ProvResult.tsx`.

**Verifierat.** Nya tester i `normering.test.ts` (monotoni över hela skalan,
olika prov ger olika poäng, 2012 års 76 uppgifter). Tre befintliga tester i
`prov-results.test.ts` ändrade värde från 1,9 till 1,8 — det är buggen,
demonstrerad.

**Antagande.** Poängräknaren på `/hogskoleprovet-poangraknare` rör jag inte: den
tar emot råpoäng utan provtillfälle och har inget prov att normera mot. Den
säger redan att den är en uppskattning.

### 6. "0/8" frågor ✅

**Vad som var fel.** Svaren skrevs löpande med **webbläsarens** Supabase-klient
i `persistAnswer`, och ett fel där loggades bara till konsolen. En RLS-miss, ett
tappat nät eller en sövd flik gav noll rader i `match_answers` — och servern
räknar poängen ur den tabellen. Resultatet blev "0/8" bredvid åtta besvarade
frågor. Nämnaren var dessutom hårdkodad `/8`.

**Vad jag ändrade.** Hela svarsbilden skickas med inlämningen och skrivs om med
service role i samma anrop som rättar den. Frågorna sållas mot matchens egna
`match_questions`, så ingen kan skicka in svar på frågor som inte ingår.
`is_correct` kommer fortfarande aldrig från klienten. Nämnaren är matchens antal
frågor.

**Filer.** `src/lib/match.functions.ts`, `src/routes/match.$matchId.tsx`,
`src/routes/result.$matchId.tsx`.

**Verifierat.** End-to-end: 1/8, inte 0/8.

### 7. Streak visade noll trots att man spelat idag ✅

**Vad som var fel.** `new Date().toISOString().slice(0,10)` — alltså **UTC**.
Sverige ligger 1–2 timmar före, vilket ger ett fönster varje kväll där appen och
användaren inte är överens om vilken dag det är:

- Ett pass 00:30 natten till tisdag bokfördes på **måndag**. Spelade man sedan
  på tisdagen räknades det bort som "redan räknad idag" — streaken stod stilla.
- Åt andra hållet: 00:30 tisdag och 23:00 onsdag såg i UTC ut som måndag →
  onsdag, alltså ett hoppat dygn, och streaken nollades trots två dagar i rad.

Dessutom räknades bara match och träning som aktivitet. En dag med bara
ordträning eller ett skrivet provpass syntes inte alls.

**Vad jag ändrade.** All datumräkning i `src/lib/streak-dates.ts`, i
`Europe/Stockholm`. `previousDate` räknar i kalendern och inte i millisekunder,
så sommartidsskiftets 23-timmarsdygn inte flyttar resultatet. Ett datum i
framtiden räknas som avbrott och inte som "fortsatt" — annars kan en felställd
klocka ge en streak som växer utan att någon spelar. `updateStreak` anropas nu
också från `/ord` och från gamla prov-inlämningen.

**Filer.** `src/lib/streak-dates.ts` + `.test.ts` (nya), `src/lib/streak.ts`,
`src/routes/ord.tsx`, `src/components/prov/ProvRunner.tsx`.

**Verifierat.** Nio tester: spelat idag, spelat igår, två dagar i rad, uppehåll,
aldrig spelat, framtida datum, sommartid, års- och skottårsskifte.

### 8. ELO-trackern hade "golv" på 1000 ✅
### 9. ELO byttes inte med ämne ✅

Samma rad kod: `StatusRow elo={Math.max(profile.elo_verbal, profile.elo_math)}`.

Ett verbalt ELO som sjunkit till 850 doldes bakom mattens orörda 1000 — det är
"golvet", och det finns inte i datan. Och siffran ändrade sig aldrig när man
växlade Verbal/Matte i kortet nedanför, eftersom `Math.max` inte bryr sig om
valet. Nu följer den `activeElo` och skriver ut **vilket** ELO som visas.

**Fil.** `src/components/HomeDashboard.tsx`.

**Kvar med flit:** navbarens avatarbricka visar fortfarande högsta ELO av de
två. Det är "ditt bästa" på en yta där ämnesvalet inte finns, och punkten gällde
hemskärmen. Säg till om du vill ha samma ändring där.

### 10. Tidtagningen stämde inte ✅

**Vad som var fel.** Den visade tiden räknades som
`submitted_at - matches.created_at`. `created_at` är när matchRADEN skapades,
inte när spelaren fick se första frågan:

- **Privat rum / inbjudan:** raden skapas när rummet öppnas och står som
  `waiting` tills motparten accepterar. En match spelad på tre minuter kunde
  redovisas som fjorton — längre än de fem minuter passet överhuvudtaget varar.
- **Bot:** raden skapas, sedan laddas åtta frågor. Sekunderna däremellan
  räknades som speltid.

Klienten hade redan ett eget ankare i `sessionStorage` för nedräkningen, men det
finns bara i en webbläsare: resultatsidan, botens simulerade tid och
fusk-golvet läste alla `created_at` och kom fram till olika svar om samma match.

**Vad jag ändrade.** `matches.started_at`, satt när matchen blir spelbar (vid
skapandet för bot, vid join för rum/inbjudan/rankad). Klockan, botens
inlämningstid, `isImplausiblyFast` och den redovisade tiden räknar nu alla
därifrån. Serverns värde går före det lokala ankaret, som finns kvar som reserv
för äldre matcher (`started_at` är NULL där).

**Filer.** `supabase/migrations/20260819160000_match_started_at.sql`,
`src/lib/match.functions.ts`, `src/lib/match.server.ts`,
`src/lib/friends.functions.ts`, `src/lib/ranked.functions.ts`,
`src/routes/match.$matchId.tsx`, `src/routes/result.$matchId.tsx`.

**Verifierat.** End-to-end: ~10 sekunders faktisk speltid redovisades som
`00:09`.

---

## P1 – Fel innehåll och trasiga flöden

### 11. Dagens ord var inte konsekvent ✅
### 12. Dagens ord laddade sist ✅

**Vad som var fel.** Kortet hämtade **fyrtio slumpade ord i webbläsaren** och tog
det första med en förklaring. Det gav ett eget "dagens ord" per besökare, som
dessutom byttes så fort någon rensade localStorage. Och eftersom kortet inte
monteras förrän både session och profil landat började hämtningen sist av allt.

**Vad jag ändrade.** `fetchWordOfTheDay` väljer på servern ur dagens datum i
`Europe/Stockholm`. Steget genom listan är ett **primtal** (7919), inte en hash:
`(dag × steg) mod antal` går igenom hela beståndet innan ett ord kan komma
tillbaka, medan en hash ger dubbletter med några veckors mellanrum
(födelsedagsparadoxen) — vilket är precis det "undvik att samma ord återkommer
för tätt" handlar om. Ordningen är `id`, som är stabil.

Laddningsordningen: ordet hämtas i `/`-routens **loader** och är med i den
serverrenderade HTML:en. Serverfunktionen cachar dygnets svar per isolat, så det
kostar inte ett anrop per sidvisning.

**Filer.** `src/lib/word-practice.functions.ts`, `src/components/WordOfTheDay.tsx`,
`src/routes/index.tsx`, `src/components/HomeDashboard.tsx`,
`src/lib/word-of-the-day.test.ts` (ny).

**Verifierat.** Fem tester: samma hela dygnet, byte vid svensk midnatt (inte
UTC:s), olika ord 60 dagar i rad, hela listan gås igenom innan upprepning.

### 13. "Träna" gav slumpmässiga frågor ✅

**Vad som var fel.** Startvyn hade "alla verbala delprov" **förvalt** bakom en
stor Starta-knapp, med de fyra stegkorten dolda bakom "Anpassa". Den som
klickade Träna fick alltså ett pass med blandade ORD/MEK/LÄS/ELF-frågor i
slumpad ordning — och eftersom ORD är den största kategorin började det nästan
alltid med ord.

**Vad jag ändrade.** Valet är första steget och ligger öppet: åtta kort med vad
varje delprov faktiskt är, plus ett uttryckligt "hela verbala delen" för den som
vill ha blandat. Svårighet och antal visas först när något valts.

Passet hålls dessutom ihop även när flera delprov valts: kategorierna kommer i
tur och ordning i stället för huller om buller, och frågor som delar lästext
ligger bredvid varandra (annars dök samma text upp två gånger med tre frågor
emellan, och överstrykningarna såg ut att försvinna).

**Bonusfynd.** Svårighetsknapparna gick till **5** medan serverfunktionen bara
tar emot **1–3**. Nivå 4 och 5 gav "Kunde inte hämta frågor" utan förklaring. Nu
tre nivåer med namn: Lätt, Medel, Svår.

**Filer.** `src/routes/train.tsx`, `src/lib/train.functions.ts`.

### 14. Rättningen visade inte facit — inte heller för gamla prov ✅

**Vad som var fel.** Två saker.

- **Genomgången listade bara FELEN.** Den som svarat rätt genom att gissa fick
  aldrig veta det, och en uppgift man var osäker på men råkade pricka gick inte
  att hitta tillbaka till.
- **Gamla försök gick inte att rätta.** Ett inlämnat provpass lämnade två spår,
  båda i localStorage: hela försöket under `tkn:prov-progress` (som städas efter
  en vecka) och bara summan under `tkn:prov-resultat`. Kom man tillbaka till ett
  prov man skrivit för två veckor sedan fanns alltså bara siffran. Byte av
  webbläsare raderade allt.

**Vad jag ändrade.** Ny tabell `prov_attempts` med svaren per försök, RLS så att
bara man själv ser sina, unikt index på (user_id, term, pass). Poängen räknas
**alltid om på servern** ur provdatans facit — klienten skickar bara vilka
bokstäver som valdes, annars kan vem som helst skriva 40/40. localStorage står
kvar som huvudväg: gamla prov ska gå att skriva utan konto.

Startvyn erbjuder "Se din rättning" när ett tidigare försök finns, och
genomgången listar nu **alla** uppgifter — fel först, sedan rätt — med ditt svar,
rätt svar och utfall. `acceptedAnswers` och inte `q.answer`: UHR har i efterhand
godkänt flera svar på ett antal uppgifter, och att skriva ut ett av dem hade
markerat ett godkänt svar som fel.

Matchgenomgången visade redan facit per fråga och rör jag inte, utöver punkt 15
och 16.

**Filer.** `supabase/migrations/20260819190000_prov_forsok.sql`,
`src/lib/prov-attempts.functions.ts` (ny), `src/components/prov/ProvRunner.tsx`,
`src/components/prov/ProvResult.tsx`.

### 15. Matterättningen förklarade för lite ✅ (delvis — se nedan)

**Vad som var fel.** `questions.explanation` fanns i tabellen men var **NULL på
samtliga 12 338 rader** (räknat mot produktionsdatabasen 2026-08-19, inklusive
alla 2 764 mattefrågor). Förklaringsblocket ritades alltså aldrig ut, och hela
rättningen på mattedelen var "rätt svar: C".

Och `get_match_review` returnerade överhuvudtaget inte `explanation` — sidan
läste `q.explanation` ur svaret och fick `undefined` varje gång. Tyst.

**Vad jag ändrade.**

- RPC:n returnerar nu `explanation` **och** `image_url`, plus de rensade
  mattekolumnerna så att genomgången visar samma version av uppgiften som
  matchen gjorde.
- `ExplanationBlock` har en reserv: finns ingen förklaring skrivs rätt svar ut i
  **klartext** (`C — 4711`), med KaTeX på mattefrågor. En ensam bokstav lär ingen
  någonting.
- `scripts/generate-math-explanations.ts` fyller fältet på riktigt. Modellen får
  facit och ska förklara vägen dit; landar den i ett annat svar, eller säger att
  uppgiften inte går att förstå, skrivs **ingenting** — en lösning som motsäger
  facit är den värsta möjliga produkten. Torrkörning som standard, `--apply` för
  att skriva. `bun run gen:math-explanations`.

**Vilka frågor som saknar förklaring.** Alla, tills scriptet körts. Av de 2 764
mattefrågorna är **2 260 bildutsnitt** ur provhäftet (737 XYZ, 607 KVA, 197 NOG,
719 DTK) — där är `question_text` PDF-extraktionen och obrukbar, så scriptet
hoppar över dem och redovisar antalet. De kräver att bilden skickas med, vilket
är ett eget jobb (`--vision`, ej byggt). **Cirka 504 mattefrågor och alla
verbala** går att generera direkt.

**Kräver ett beslut från dig:** scriptet kostar pengar per uppgift och behöver
`ANTHROPIC_API_KEY`. Jag har inte kört det.

**Filer.** `supabase/migrations/20260819200000_match_review_bild_och_forklaring.sql`,
`src/components/ExplanationBlock.tsx`, `src/routes/result.$matchId.tsx`,
`src/routes/train.tsx`, `scripts/generate-math-explanations.ts` (ny).

### 16. Matteuppgifternas rendering standardiserad ✅

**Vad som var fel.** Bilduppgifterna renderades dubbelt: `question_text` ovanför
och samma uppgift, korrekt satt, i bilden strax under. Texten är
PDF-extraktionen — `3 27 x 2 =` där häftet visar en kubikrot — och alternativen
lagras som `{id:"A", text:"A"}`, alltså fyra tomma textrader under bilden.

Gamla prov-vyn hade redan rätt beteende (`question.text && !question.image`);
match, träning och matchgenomgång hade det inte.

**Vad jag ändrade.** Ny ren modul `src/lib/math-question.ts`. Testet är
**datadrivet, inte kategoribaserat**: en regel som "XYZ och KVA döljer texten"
hade varit fel för de 114 XYZ-uppgifter som saknar bild och för de 197
NOG-uppgifter som har en. Det som faktiskt skiljer formerna åt är att
bildvarianten saknar alternativtexter — vilket är samma sak som att
alternativen står i bilden. Tillämpat i match, träning och genomgång.

**Filer.** `src/lib/math-question.ts` + `.test.ts` (nya),
`src/routes/match.$matchId.tsx`, `src/routes/train.tsx`,
`src/routes/result.$matchId.tsx`.

### 17. "Motståndare" i stället för användarnamn ✅

Ersatt i match, resultat och statistikens historik. `displayName()` ger
gästkonton sitt lundnamn i stället för `user_86b94273` — även ens eget namn på
resultatsidan. Raderade konton blir **"Okänd spelare"**: matchen finns kvar
eftersom kontoradering bevarar motpartens historik, men raden i `users` gör det
inte.

**Bonusfynd.** Statistiksidans historik läste förlorade botmatcher som
**oavgjorda** (`draw = m.winner_id === null`, och `winner_id` är NULL för
bottar). Går nu genom `outcomeFor`, och en pågående match står som "Pågår" i
stället för att visas som ett resultat.

**Filer.** `src/routes/match.$matchId.tsx`, `src/routes/result.$matchId.tsx`,
`src/routes/stats.tsx`.

### 18. Bekräftelsemail ✅

**Vad som var fel.** Det fanns inga. Stripe skickade sitt kvitto och Calendly sin
bokningsbekräftelse; sajten skickade ingenting.

**Vad jag ändrade.** Bekräftelsen skickas från **webhooken** när betalningen
bokförts — den kommer även om köparen stänger fliken mitt i betalningen — med
tacksidan som reserv när webhooken är sen.

**Exakt en gång per köp.** Spärren är en villkorad UPDATE på
`confirmation_email_sent_at`, samma mönster som `paid_at`: den som lyckas sätta
tidsstämpeln medan den är NULL är den som får skicka. Tidsstämpeln sätts
**före** utskicket med flit — ett dubbelmejl läser som en andra debitering, och
det är värre än ett uteblivet.

Innehållet skiljer på bokad och obokad tid, eftersom tiden nu väljs efter köpet.
Mejlet kastar aldrig: ett misslyckat utskick får inte göra att webhooken svarar
500 och Stripe försöker bokföra köpet om och om igen.

**Filer.** `src/lib/coaching.server.ts`, `src/server.ts`,
`src/lib/coaching.functions.ts`, `src/lib/email-templates.ts`.

### 19. Resend och svarbar avsändaradress ✅ (kod klar, DNS åt dig)

**Vad som var fel.** Ingen Resend, ingen utgående e-post alls i repot.

**Vad jag ändrade.** `src/lib/email.server.ts` — REST via `fetch`, ingen SDK, av
samma skäl som Stripe-klienten inte har någon. Tre regler:

1. **Ingenting kastar.** Ett mejl som inte går fram får aldrig ta ner köpet,
   registreringen eller buggrapporten som utlöste det.
2. **`reply_to` är alltid satt** och pekar på `EMAIL_REPLY_TO`
   (`info@tvakommanollan.se`). Avsändaren är en no-reply på den verifierade
   domänen — Resend kräver att `from` ligger på en domän vi äger — men den som
   trycker "svara" ska hamna hos en människa. Buggrapporter och leads sätter
   `reply_to` till **rapportörens** adress i stället, så ett svar går rakt
   tillbaka.
3. **Ej konfigurerat är ett giltigt läge.** Utan `RESEND_API_KEY` loggas mejlet
   och släpps, så lokal utveckling inte skickar riktig post till riktiga
   adresser.

Mallarna ligger rent och testat i `email-templates.ts`: HTML **och** text (ett
mejl utan textdel hamnar oftare i skräpposten), inline-CSS, inga bilder, och all
inkommande data escapas.

**Vad du måste göra i DNS — jag kan inte:**

| Vad | Var | Varför |
| --- | --- | --- |
| Verifiera `tvakommanollan.se` i Resend | Resend → Domains | `from` måste ligga på en domän du äger |
| **DKIM**-posterna Resend visar | Cloudflare DNS | Utan dem signeras inte mejlen |
| **SPF** på apex: `v=spf1 include:_spf.resend.com include:spf.rzone.de ~all` | Cloudflare DNS | **`tvakommanollan.se` saknar SPF helt** trots `_dmarc p=reject` — utgående mejl riskerar att avvisas redan idag, oberoende av den här ändringen. `spf.rzone.de` måste vara med, annars slår det ut Strato-brevlådan. |
| `RESEND_API_KEY` som krypterad Secret | Cloudflare | `wrangler versions secret put` + `versions deploy` |

`info@tvakommanollan.se` ligger hos Strato och är en levande inkorg — den
duger som `reply_to` utan ändringar.

**Filer.** `src/lib/email.server.ts`, `src/lib/email-templates.ts` + `.test.ts`
(nya), `wrangler.jsonc`.

### 20. "Rapportera bugg" ledde ingenstans ✅

**Vart den ledde.** Knappen finns i footern och öppnade en dialog som skrev en
rad i `bug_reports` via `submit_bug_report`-RPC:n. Två problem:

- **Den krävde inloggning** (`user_id` var NOT NULL) och svarade "Du måste vara
  inloggad för att rapportera buggar" — alltså ingen väg alls för den som stötte
  på ett fel i startsidan, registreringen eller gamla prov, som alla går att
  använda utan konto.
- **Ingen läste tabellen.** Inget mejl, ingen notis, ingen admin-vy. **Tio
  rapporter låg olästa** när jag kollade.

**Vad jag ändrade.** Serverfunktion som skriver raden med service role (så
inloggning inte behövs) och mejlar rapporten till `EMAIL_ADMIN`, med `reply_to`
satt till rapportörens adress. Utloggade kan lämna en frivillig svarsadress.
Rutan visar en riktig bekräftelse med vad som händer härnäst i stället för att
bara stängas — och rapporten räknas som mottagen även om mejlet inte går fram.

**Filer.** `supabase/migrations/20260819210000_buggrapport_utan_konto.sql`,
`src/lib/bug-report.functions.ts` (ny), `src/components/BugReportButton.tsx`.

---

## P2 – UI och navigation

### 21. Duell saknades i navbaren ✅
Tillagd i både desktopnavigationen och mobilmenyn, med `/matchmaking` som mål
och `activeProps` för aktivt läge. Duellen är sajtens kärna men nåddes bara via
ett kort på startsidan. **Fil:** `src/components/Navbar.tsx`.

### 22. Tomt uppe till vänster ✅
Ordmärket **Tvåkommanollan** står nu bredvid 2,0-märket, i display-snittet och
med å (CLAUDE.md: å i text, `a` i teknik). Döljs under `sm` så raden inte trängs
på en liten skärm; `aria-label` på länken bär namnet oavsett.
**Fil:** `src/components/Navbar.tsx`.

### 23. "Nästa" på gamla prov ✅
Primärknapp (röd) med fokusring och hover. Den är det man gör 39 gånger av 40,
och en outline-knapp bredvid "Föregående" gav ingen ledtråd om vilken som förde
provet framåt. **Fil:** `src/components/prov/ProvRunner.tsx`.

### 24. "Lämna in" på sista frågan ✅
Nästa och Lämna in delar **en** plats med fast bredd (`w-[9.5rem]`), så raden
inte hoppar när texten byts. Inlämning kräver nu en bekräftelse som säger hur
många uppgifter som är obesvarade — en felklickad inlämning på uppgift 12 av 40
kostade hela passet. **Fil:** `src/components/prov/ProvRunner.tsx`.

### 25. LinkedIn-knappen ✅
Låg som en solid LinkedIn-blå platta i en spalt där allt annat är gräddvitt med
brun ram — den enda främmande färgen på sidan, och en som inte finns i märket.
Följer nu samma kortform som de tre andra. **Fil:** `src/routes/kontakt.tsx`.

### 26. Topplistan ✅
`LEADERBOARD_SIZE` 50 → **10**, vilket styr alla flikarna. Veckolistan fick
samma egen-placering-rad under tabellen som totallistan redan hade, och hämtar
nu 200 rader för att kunna visa den.
**Filer.** `src/lib/leaderboard.functions.ts`, `src/routes/leaderboard.tsx`.

### 27. Varning innan man tar bort en vän ✅
Bekräftelsedialog med vännens namn, vad som händer (och inte: ELO och spelade
matcher påverkas inte) och avbryt. Papperskorgen sitter bredvid två knappar man
trycker ofta, och borttagningen gick förut igenom direkt.
**Fil:** `src/routes/friends.tsx`.

### 28. Versionsnumret på Om-sidan ⚠️ delvis — kräver ett beslut

**Vad jag hittade.** Det finns **inget mjukvaruversionsnummer** någonstans på
sajten. Den enda "1,9" på `/om` är meningen *"Jag heter Niklas och fick 1,9 på
Högskoleprovet"* — alltså ditt provresultat, inte en version.

**Vad jag gjorde.** Byggde det du bad om: `version` i `package.json`,
`src/lib/app-version.ts` som läser den, och en diskret rad längst ned på `/om`.
Satte **2.0.0**, med motiveringen att namnbytet till Tvåkommanollan och den ljusa
Lunden-temat är en majorändring. Ändra i `package.json` om du vill ha en annan.

**Vad jag INTE gjorde, och som du behöver ta ställning till.** `/om` säger att du
fick **1,9**. Coachningskortet, modalen, nudgen och villkoren säger alla
"**1,95 eller högre**". En av dem är fel, och det är samma sajt som säger båda.
Jag rör inte en siffra om ditt eget provresultat utan att du säger till — att
skriva upp den vore värre än att skriva ner den. Säg vilken som stämmer så
rättar jag den andra.

**Filer.** `package.json`, `src/lib/app-version.ts` (ny), `src/routes/om.tsx`.

### 29. Städning av de små sidorna ✅

- **Integritetspolicyn stämmer igen.** Passet lade till fyra sorters uppgifter
  som den inte kände till: engångsnyckeln i verifieringsmejlet, sparade provsvar
  för inloggade, svarsadressen i en buggrapport, samt e-post och meddelande i
  ringlistan. **Resend saknades helt** i listan över tredjepartstjänster.
  Calendly-stycket säger nu att tiden väljs efter köpet. Datum uppdaterat.
- **Villkoren** beskrev leveransen som "vi kontaktar dig inom 24 timmar" — nu
  står det att tiden väljs direkt efter betalningen, med 24-timmarslöftet som
  reserv.
- **"Till hem"** (404-sidan och den serverrenderade felsidan) → "Till
  startsidan". Felsidans "gå tillbaka till hem" likaså.
- **"Gamla prov 2022–2026"** på fyra ställen (`/faq`, 404-sidan, `/guider`,
  `/om`) → **2012–2026**, vilket är vad arkivet faktiskt innehåller sedan det
  blev komplett 2026-08-17. `/om` säger nu också 30 provtillfällen och 4 800
  uppgifter.
- **Nudgens "Boka en tid · 350 kr"** lovade ett steg som inte längre kommer
  först.

**Filer.** `src/routes/integritetspolicy.tsx`, `src/routes/villkor.tsx`,
`src/routes/__root.tsx`, `src/lib/error-page.ts`, `src/routes/faq.tsx`,
`src/routes/guider/index.tsx`, `src/routes/om.tsx`,
`src/components/CoachingPrompt.tsx`.

---

## P3 – Nya funktioner

### 30. Ringlista: formulär → Supabase → admin-vy ✅

**Vad som redan fanns.** Kedjan var byggd 2026-08-19: `CoachingQuizCard` på
dashboarden, tabellen `coaching_leads` med RLS (noll policies, bara service
role) och `AdminLeadsTab` under `/admin`. Jag byggde vidare i stället för att
bygga en ny yta, som du bad om.

**Vad som saknades och nu finns.**

- **Formuläret** tog bara namn och nummer. Nu även frivillig **e-post**
  (validerad i klient och server) och ett **meddelandefält**. Går personen inte
  att nå på telefon fanns tidigare ingen andra väg alls.
- **Notismejl** till `EMAIL_ADMIN` vid varje nytt lead, med `reply_to` satt till
  personens adress. Ett lead som ingen ser är ett samtal som inte blir av.
- **Sök** på namn, nummer eller e-post — i databasen, inte i klienten: listan kan
  innehålla hundratals rader, och att skicka alla till webbläsaren för att
  filtrera där är att skicka andras telefonnummer i onödan. `%`, `,` och `*`
  escapas, eftersom de är metatecken i PostgREST:s or-syntax.
- **Sortering:** äldsta först (standard för obehandlade — den som väntat längst
  ska ringas först), nyaste först, namn A–Ö.
- **CSV-export** av exakt det som visas, samma filter och sortering.
- **Status** (ny / uppringd / såld / nej tack) och anteckning fanns redan.

**CSV:n är egen och pytteliten** i stället för ett bibliotek: det enda som är
svårt med CSV är citering. Den skrivs med **BOM** (annars läser Excel filen som
Windows-1252 och varje å, ä, ö blir mojibake), **semikolon** (svenskt Excel
läser komma som decimaltecken) och **CRLF**. Fält som börjar med `=`, `+`, `-`
eller `@` prefixas med apostrof — ett telefonnummer i E.164 hade annars räknats
ut som ett tal, och ett `=`-fält kan köra kod i Excel.

**Filer.** `supabase/migrations/20260819220000_ringlista_epost_och_meddelande.sql`,
`src/lib/coaching-leads.functions.ts`, `src/components/CoachingQuizCard.tsx`,
`src/components/AdminLeadsTab.tsx`, `src/lib/csv.ts` + `.test.ts` (nya).

### 31. ELO över tid ✅

**Vad som redan fanns.** En kurva på `/stats`, och `elo_history` sparar redan
`elo_after`, `elo_change` och `created_at` per match — alltså fanns underlaget.

**Vad som var fel med den.**

- **Ett gemensamt `limit(30)`** över båda delarna. Den som spelat trettio
  mattematcher hade inte en enda verbal punkt kvar i urvalet, och den linjen
  försvann utan förklaring.
- **Raderna var interfolierade.** En verbal match gav en punkt där bara `verbal`
  var satt, så mattelinjen fick ett hål som `connectNulls` drog en rak linje
  över — ELO såg ut att ha ändrats vid en tidpunkt då ingenting hänt i den delen.
- **X-axeln var matchens ordningsnummer.** Två matcher samma kväll låg lika långt
  isär som två med en månad emellan.
- **Tooltipen gav båda linjerna samma delta**, så en verbal vinst såg ut att ha
  höjt matte-ELO.

**Vad jag ändrade.** 50 matcher hämtas **per del**, och `buildEloSeries` (ren,
testad) bygger en gemensam tidsaxel där varje punkt bär senast kända värde för
båda delarna. Riktig tidsaxel. Tooltipen tillskriver ändringen den del som
faktiskt spelades. Ovanför grafen står nuläge, förändring sedan urvalets start
och antal matcher per del — det skiljer "har inte spelat matte" från "matte står
stilla", vilket en linje inte kan.

**Backfill:** ingen. Matcher utan rad i `elo_history` går inte att härleda i
efterhand — `users.elo_*` bär bara nuvarande värde, och att räkna baklänges ur
matchresultat skulle kräva K-faktorn och motståndarens ELO vid varje tillfälle,
som båda ändrats sedan dess. En gissad kurva är värre än en kort.

**Filer.** `src/lib/elo-series.ts` + `.test.ts` (nya), `src/routes/stats.tsx`.

---

## 32. Utöver uppdraget: en deploy-fälla som hittades under testningen

Inte en punkt du bad om, men den hade tagit ner sajten.

**Vad som hände.** End-to-end-testet mot skarpa databasen svarade "Kunde inte
starta en match". Orsak: PostgREST avvisar hela skrivningen med `PGRST204` när
den nämner en kolumn den inte känner till — och `matches.started_at` fanns i
koden men inte i databasen, eftersom migrationerna körs för hand medan koden
rullas ut av en push. **Det gick alltså inte att starta en match alls i
glappet.** Typkontrollen kan inte se det: `types.ts` är handskriven och
beskriver hur schemat ska se ut, inte hur det ser ut.

**Vad jag gjorde.** `writeTolerant()` gör om skrivningen utan de kolumner
databasen ännu inte känner till — och bara de som anropet själv pekat ut som
valfria, så en felstavad kolumn fortfarande är ett riktigt fel. Samma tanke som
`elo_history`-skrivningen, som infogar och ignorerar 23505 "så ingen
deploy-ordning krävs mot migrationen".

Tillämpat där en ny kolumn annars tar ner ett helt flöde: matchskapande (bot,
rum, inbjudan, rankad), ringlistan (ett tappat nummer är ett tappat samtal) och
buggrapporten.

**Filer.** `src/lib/schema-tolerant.server.ts` + `.test.ts` (nya),
`src/lib/match.functions.ts`, `src/lib/friends.functions.ts`,
`src/lib/ranked.functions.ts`, `src/lib/coaching-leads.functions.ts`,
`src/lib/bug-report.functions.ts`.

---

## Verifiering

Kört efter varje punkt, och en gång till på slutet, i CLAUDE.md:s ordning:

| Steg | Resultat |
| --- | --- |
| `npx tsc --noEmit` | rent |
| `npx eslint <ändrade filer>` | 0 fel |
| `npm run test` | **390 tester** i 39 filer (från 325 i 29) |
| `npm run build` | grönt, byggt på ~15 s |
| SSR-rök: 16 routes | alla 200 |
| SSR-rök: ogiltiga slugs | `/finns-inte`, `/gamla-prov/1999xx`, `/gamla-prov/2025ht/9` → alla 404 |
| Headless med injicerad session | `/`, `/train`, `/ord`, `/stats`, `/friends`, `/leaderboard`, `/gamla-prov` renderade, **inga console-fel**, ingen "Något gick snett" |
| End-to-end botmatch | match startade, 8 frågor besvarade, inlämnad → **"Du förlorade" 1/8 mot 6/8** (inte "Oavgjort"), tid `00:09` för ~10 s spel, motståndaren hette `emma` |

`npx eslint src` över hela trädet kör jag inte: ~900 pre-existerande
`prettier/prettier`-fel i filer ingen rört, precis som CLAUDE.md beskriver.

**Nya tester (65 stycken):** `match-outcome`, `streak-dates`, `email-templates`,
`word-of-the-day`, `math-question`, `csv`, `elo-series`, `schema-tolerant`, plus
utökade `normering` och ändrade `prov-results`.

---

## Sammanfattning

### Fixat

Alla 31 punkter är åtgärdade, med två undantag som är delvis och som står
utskrivna nedan (15 och 28).

### Kvarstår — kräver att du gör något

1. **Kör de sju migrationerna** i Supabases SQL-editor, i ordningen högst upp i
   den här filen. Koden tål att de inte är körda, men funktionerna de bär
   saknas tills de är det.
2. **Stäng av "Confirm email"** i Supabase (punkt 2). Utan den slutförs inte
   registreringen direkt, vilket var hela poängen med punkten.
3. **Sätt `RESEND_API_KEY`** som Cloudflare-Secret och **verifiera domänen i
   Resend**. Utan den skickas inga mejl — allt loggas och släpps.
4. **Lägg SPF på `tvakommanollan.se`** (punkt 19). Den saknas **idag**, trots
   `_dmarc p=reject`, och det gäller oberoende av det här passet: utgående mejl
   riskerar att avvisas redan nu.
5. **Slå INTE på "Collect payment"** på Calendly-event-typen. Det gällde förut
   och gäller fortfarande — nu betalar köparen i Stripe före bokningen, så en
   påslagen betalning i Calendly vore en ren dubbeldebitering.

### Kräver ett beslut från dig

1. **1,9 eller 1,95?** `/om` säger att du fick 1,9 på högskoleprovet.
   Coachningskortet, modalen, nudgen och villkoren säger "1,95 eller högre". Jag
   rörde ingen av dem. Säg vilken som stämmer.
2. **Ska jag köra `gen:math-explanations`?** Den kostar pengar per uppgift och
   behöver `ANTHROPIC_API_KEY`. Cirka 504 mattefrågor och alla verbala går att
   generera; de 2 260 bildutsnitten kräver att bilden skickas med, vilket är ett
   eget jobb.
3. **Appversionen är satt till 2.0.0** som ett antagande. Ändra i `package.json`
   om du vill ha något annat.
4. **Navbarens ELO-bricka** visar fortfarande högsta av verbal och matte. Punkt
   8 och 9 gällde hemskärmen; säg till om du vill ha samma ändring där.
5. **Fyra provtillfällen saknar officiell normering** (2019ht, 2023ht, 2024ht,
   2025vt saknar en provdel var). De faller tillbaka på approximationen och
   märks ut som uppskattning. Hittar du tabellerna någon annanstans lägger jag
   in dem — kör annars `python3 scripts/hp-import/normering.py` igen om ett tag,
   UHR publicerar dem med fördröjning.

### Inte pushat

Femton commits ligger på `main` **lokalt**. Enligt CLAUDE.md ändrar en push till
`main` den skarpa sajten, och punkt 3 i "How to Operate" säger att sådant kräver
din bekräftelse. Jag har inte pushat. Kör migrationerna först, sedan pushar du —
eller säg till så gör jag det.
