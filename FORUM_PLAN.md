# Forum — plan

Ett diskussionsforum på hpkampen.se. Flashback-modellen (platta trådar, citat,
öppet läsbart) fast för högskoleprovet, byggt på det som redan finns i appen.

Målet är inte "en forum-funktion". Målet är **den sida folk googlar sig till när
de undrar något om HP** — och därifrån hittar öva-läget, gamla prov och guiderna.
Forumet är alltså både community och SEO-motor, och planen nedan optimerar för båda.

---

## 1. Vad vi bygger — och vad vi inte bygger

**Bygger**
- Kategorier → trådar → inlägg. Platt kronologisk trådvy med **citat**, inte
  nästlade svarsträd.
- Öppet läsbart för alla (utloggade, sökmotorer, AI-crawlers). Skrivning kräver
  riktigt konto.
- Matte i inläggen via befintliga KaTeX (`MathTextLazy`).
- **Citera en riktig uppgift** ur gamla-prov-arkivet direkt i ett inlägg.
- "Bästa svar" på Q&A-kategorier.
- Prenumeration på tråd + notis i befintliga klockan.
- Rapportknapp + moderationskö i `/admin`.
- Postgres-fulltextsök på svenska.

**Bygger inte** (medvetet, skriv inte dessa senare av bara farten)
- Nästlade svarsträd. Flashback är platt av en anledning: en tråd ska gå att läsa
  uppifrån och ned. Citat löser 95 % av behovet.
- PM — finns redan (`messages`, vänner-bara). Behåll det som det är.
- Separat karma/rykte. ELO och ranks är redan sidans statuspoäng; ett andra system
  konkurrerar med det. Visa ELO-badge vid inlägg istället.
- Signaturer, avatarer utöver `UserAvatar`, BBCode, teman, användartitlar.
- Bilduppladdning vid lansering (se §7).
- Anonyma inlägg. Användarnamn *är* redan pseudonymer; äkta anonymitet gör
  moderation omöjlig för en ensam drivare.

---

## 2. Kategorier vid lansering

Fem kategorier. Inte tolv — tomma kategorier signalerar dött forum.

| # | Slug | Namn | Typ |
|---|------|------|-----|
| 1 | `allmant` | Högskoleprovet allmänt | discussion |
| 2 | `kvantitativ` | Kvantitativ del — XYZ, KVA, NOG, DTK | qa |
| 3 | `verbal` | Verbal del — ORD, LÄS, MEK, ELF | qa |
| 4 | `provdagen` | Anmälan, provdagen, normering & resultat | discussion |
| 5 | `plugg` | Plugg, motivation & studieteknik | discussion |

`kind = 'qa'` byter både UI (fråga/svar, "markera bästa svar") och structured data
(`QAPage` istället för `DiscussionForumPosting`).

Kategori 6 `meta` (feedback & buggar) läggs till när forumet har liv — den slår
ihop med `bug_reports` senare, inte nu.

Taggar/underforum: **nej vid start**. `prov_term`-fältet på tråden (t.ex. `2026vt`)
räcker som andra dimension och kopplar direkt mot arkivet.

---

## 3. URL:er och sidor

```
/forum                                   Startsida: kategorier + senaste aktivitet
/forum/$kategori                         Trådlista, paginerad ?sida=2
/forum/$kategori/$threadId-$slug         Tråd, paginerad ?sida=2 (30 inlägg/sida)
/forum/nytt?kategori=…                   Skapa tråd
/forum/sok?q=…                           Sök
/forum/regler                            Regler + vem som driver forumet (lagkrav, §10)
/u/$username                             Publik profil: inlägg + rank (senare fas)
```

**Id före slug** i tråd-URL:en (`/forum/kvantitativ/482-hur-loser-man-kva-med-rotter`).
Uppslag sker på id, så en ändrad rubrik gör aldrig en gammal länk trasig — fel slug
301:as till rätt.

Sidnumrering: `?sida=N`, `rel=canonical` mot sig själv (inte mot sida 1 — det gömmer
inlägg för Google). Sida 2+ ur sitemapen, kvar i indexet.

Allt SSR:as i route-`loader`, aldrig klient-fetch — annars finns ingen text att
indexera. Detta är hela poängen med forumet.

---

## 4. Datamodell

Ny migration i `supabase/migrations/`. Kör manuellt i SQL-editorn, uppdatera sedan
`src/integrations/supabase/types.ts` för hand (projektet auto-genererar inte).

```sql
-- ============== FORUM ==============

create table public.forum_categories (
  id          smallint primary key generated always as identity,
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name        text not null,
  description text not null default '',
  sort_order  smallint not null default 0,
  kind        text not null default 'discussion' check (kind in ('discussion','qa')),
  admin_only  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.forum_threads (
  id             bigint primary key generated always as identity,
  category_id    smallint not null references public.forum_categories(id),
  author_id      uuid not null references auth.users(id) on delete cascade,
  title          text not null check (length(btrim(title)) between 5 and 140),
  slug           text not null,
  is_pinned      boolean not null default false,
  is_locked      boolean not null default false,
  answer_post_id bigint,                       -- FK läggs på efter forum_posts
  prov_term      text,                         -- '2026vt' — koppling till arkivet
  status         text not null default 'visible'
                 check (status in ('visible','pending','hidden','deleted')),
  -- denormaliserat, underhålls av trigger
  reply_count    integer not null default 0,
  last_post_at   timestamptz not null default now(),
  last_post_by   uuid references auth.users(id) on delete set null,
  view_count     integer not null default 0,
  deleted_at     timestamptz,
  deleted_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  search_tsv     tsvector
);

create table public.forum_posts (
  id             bigint primary key generated always as identity,
  thread_id      bigint not null references public.forum_threads(id) on delete cascade,
  author_id      uuid not null references auth.users(id) on delete cascade,
  body           text not null check (length(btrim(body)) between 2 and 10000),
  quoted_post_id bigint references public.forum_posts(id) on delete set null,
  status         text not null default 'visible'
                 check (status in ('visible','pending','hidden','deleted')),
  helpful_count  integer not null default 0,
  edited_at      timestamptz,
  edit_count     smallint not null default 0,
  deleted_at     timestamptz,
  deleted_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  search_tsv     tsvector
);

alter table public.forum_threads
  add constraint forum_threads_answer_fk
  foreign key (answer_post_id) references public.forum_posts(id) on delete set null;

create table public.forum_reactions (
  post_id    bigint not null references public.forum_posts(id) on delete cascade,
  user_id    uuid   not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.forum_subscriptions (
  user_id      uuid   not null references auth.users(id) on delete cascade,
  thread_id    bigint not null references public.forum_threads(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  muted        boolean not null default false,
  primary key (user_id, thread_id)
);

create table public.forum_reports (
  id          bigint primary key generated always as identity,
  post_id     bigint not null references public.forum_posts(id) on delete cascade,
  reporter_id uuid   not null references auth.users(id) on delete cascade,
  reason      text   not null check (reason in ('spam','trakasseri','olagligt','upphovsratt','annat')),
  note        text   check (length(note) <= 500),
  handled_at  timestamptz,
  handled_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (post_id, reporter_id)
);

alter table public.users
  add column forum_banned_until timestamptz,
  add column forum_ban_reason   text,
  add column forum_post_count   integer not null default 0;
```

**Index** (utan dessa dör trådlistan så fort det finns några tusen inlägg):

```sql
create unique index on public.forum_threads (category_id, slug);
create index on public.forum_threads (category_id, is_pinned desc, last_post_at desc)
  where status = 'visible';
create index on public.forum_threads (last_post_at desc) where status = 'visible';
create index on public.forum_posts (thread_id, created_at) where status = 'visible';
create index on public.forum_posts (author_id, created_at desc);
create index forum_threads_tsv on public.forum_threads using gin (search_tsv);
create index forum_posts_tsv   on public.forum_posts   using gin (search_tsv);
```

**Designbeslut värda att notera**

- *Första inlägget är ett `forum_posts`-rad, inte text på tråden.* Redigering,
  citat, rapportering och radering blir då en enda kodväg istället för två.
- *Räknare denormaliseras.* `/forum` sorterar på `last_post_at` över alla trådar;
  att räkna fram det ur en join varje gång är det klassiska sättet att bygga ett
  forum som blir långsamt vid 10 000 inlägg. Trigger uppdaterar `reply_count`,
  `last_post_at`, `last_post_by`, `helpful_count`, `users.forum_post_count` och
  båda `search_tsv` i **en** funktion.
- *Ingenting raderas hårt.* `status='deleted'` + `deleted_by` + tidpunkt. En tråd
  där svar försvinner blir obegriplig, och du vill kunna ångra.
- *`view_count` vid start: hoppa över eller batcha.* En UPDATE per sidvisning är
  write-amplifiering på en tabell som läses konstant. Det finns redan `page_views`
  + batch-migrationen — låt den bära räkningen och uppdatera `view_count` med en
  periodisk RPC om siffran ens visar sig vara värd något.

---

## 5. Vem får skriva — den viktigaste frågan

**Sidan har anonym inloggning påslagen** (`signInAnonymously`, driver hela
gästspelet). Det betyder att `auth.uid() is not null` i en RLS-policy inte betyder
"en användare" — det betyder **vem som helst på internet, obegränsat antal konton,
ett HTTP-anrop bort**. Ett forum som släpper in det är spammat inom en vecka.

Så: läsa = alla. Skriva = riktigt konto.

```sql
create or replace function public.forum_can_post(_uid uuid)
returns boolean language sql stable security definer
set search_path = public, auth as $$
  select exists (
    select 1 from auth.users au
    join public.users u on u.id = au.id
    where au.id = _uid
      and coalesce(au.is_anonymous, false) = false        -- inga gästkonton
      and au.email_confirmed_at is not null               -- bekräftad mejl
      and au.created_at < now() - interval '10 minutes'   -- ingen engångsspam
      and length(btrim(u.username)) > 0
      and coalesce(u.forum_banned_until, '-infinity'::timestamptz) < now()
  );
$$;
```

Gäst som klickar "Svara" får en tydlig ruta: *"Skapa ett konto för att skriva —
det tar 20 sekunder och du behåller din statistik."* Det är dessutom den bästa
konverteringspunkten sidan har.

RLS på alla forumtabeller (läspolicy: `status='visible' or author_id = auth.uid()
or public.is_admin(auth.uid())`). Men eftersom serverfunktionerna kör med
`supabaseAdmin`, som **går förbi RLS**, är det dina egna `where`-satser som är det
riktiga skyddet — precis den fällan `src/lib/CLAUDE.md` punkt 5 varnar för. Filtrera
på `status` i varje läsning, inte bara i policyn.

---

## 6. Spam och moderation — byggt för att skötas av en person

Du kommer att svara på allt själv. Då måste moderation kosta sekunder, inte kvällar.

**Skrivgrindar**
- Nytt konto (< 24 h eller < 5 inlägg) = "ny användare": max 1 inlägg / 2 min,
  **länkar tillåts inte** — inlägg med URL hamnar i `status='pending'` istället för
  att avvisas. Detta enda regel stoppar det mesta av den automatiserade spammen.
- Takt: ny tråd 5/h, inlägg 20/h, redigeringar 30/h.
- **Strypningen måste ligga i databasen**, inte bara i `assertRateLimit`.
  `rate-limit.ts` är per Cloudflare-isolat — "en hammarbroms, inte en exakt kvot",
  som CLAUDE.md säger. Gör som `public.send_message` redan gör: räkna rader inom ett
  tidsfönster inuti RPC:n. `assertRateLimit` blir det billiga första lagret.
- Ordlista → `pending`, aldrig hård avvisning (avvisning lär spammaren vad som
  släpps igenom).

**Moderationsverktyg** (ny flik i `/admin`, samma mönster som `AdminUsageTab`)
- Kö: `pending`-inlägg + orapporterade `forum_reports`, äldst först.
- Per inlägg: godkänn / dölj / radera / radera + bannlys författare (7 d, 30 d,
  permanent) / radera allt från användaren senaste 24 h ("nuke", en knapp).
- Per tråd: nåla, lås, flytta kategori, byt rubrik, markera bästa svar.
- Allt loggas i befintliga `audit_log` med `forum:`-prefixade actions. Ingen ny
  loggtabell.

**Rapportknapp** på varje inlägg, öppen för inloggade (även gäster — att rapportera
är billigt och du vill ha signalen). Tre orapporterade rapporter på samma inlägg →
auto-`pending` tills du tittat.

---

## 7. Textformat, matte och uppgiftscitat

**Lagring:** råtext. **Rendering:** aldrig `dangerouslySetInnerHTML` på
användarinnehåll. En liten begränsad markdown-delmängd, parsad till React-noder:

`**fet**`, `*kursiv*`, `` `kod` ``, ```` ```block``` ````, `> citat`, punktlistor,
och autolänkade URL:er med `rel="nofollow ugc noopener"` + `target="_blank"`.

**Matte är obligatoriskt här.** Halva forumet kommer handla om KVA och XYZ.
`$...$` → befintliga `MathTextLazy` (KaTeX finns redan i beroendena). Ett
HP-forum där man inte kan skriva ett bråk är inte användbart.

**"Citera uppgift" — särskiljande funktion.** En väljare i skrivrutan låter dig
peka ut en riktig uppgift ur arkivet (provtillfälle → pass → nummer). Inlägget
lagrar referensen, och rendering visar uppgiften inbäddad med länk till
`/gamla-prov/2026vt/kvantitativ-1`.

Det löser tre saker samtidigt: folk slipper skärmdumpa, upphovsrätten hålls i
schack (vi länkar istället för att kopiera), och varje sådan tråd bygger en intern
länk in i arkivet — vilket är precis vad Google belönar.

**Bilder: fas 2.** Kravet dyker upp direkt ("hur löser man denna?"), men uppladdning
drar med sig lagring, EXIF-strippning, storleksgränser, olämpligt innehåll och
upphovsrätt. Uppgiftscitat täcker huvudfallet. När det byggs: Supabase Storage,
max 2 MB, endast konton med ≥ 3 inlägg, admin kan radera.

---

## 8. SEO — den strategiska poängen

Forumet kan bli sidans största trafikkälla, eftersom det producerar långsvansfrågor
i en takt som inga handskrivna guider kan matcha.

- **SSR i `loader`.** Ingen klient-fetch på trådsidor. Punkt.
- **`head()` per rutt** med `pageMeta` / `pageLinks` (`src/lib/page-meta.ts`),
  precis som guiderna. Titel = trådrubriken, beskrivning = första 155 tecknen av
  första inlägget.
- **Structured data:** `DiscussionForumPosting` för discussion-kategorier,
  `QAPage` med `acceptedAnswer` för Q&A-kategorier där bästa svar är markerat —
  det senare ger egen rich result i Google. `breadcrumbScript()` finns redan.
- **Dynamisk sitemap.** `public/sitemap.xml` är handskriven och kan inte bära
  trådar. Lägg en serverrutt `/forum-sitemap.xml` (samma mönster som `mcp.ts` /
  `[.well-known]`) som listar synliga trådar sorterade på `last_post_at`, max
  50 000 per fil, cachad 1 h vid kanten. Lägg till en andra rad i `robots.txt`:
  `Sitemap: https://hpkampen.se/forum-sitemap.xml`.
- **Korslänkning åt båda håll.** Varje guide och varje gamla-prov-pass får ett
  "Diskutera i forumet"-block; varje tråd länkar tillbaka till relevant guide.
  Det är samma guider ↔ öva ↔ gamla-prov-kluster som CLAUDE.md redan beskriver,
  med forumet som fjärde nod.
- **Kvalitetsgrind:** trådar med noll svar och under ~200 tecken bör inte spamma
  indexet. Enklast: håll dem ur sitemapen tills de fått ett svar. Inte `noindex` —
  bara inte aktivt inskickade.
- `llms.txt` uppdateras med forumets struktur. AI-crawlers är redan uttryckligen
  välkomnade i `robots.txt`, och ett Q&A-arkiv är exakt vad de vill ha.
- Utloggade läsare kan få edge-cache (`s-maxage=60, stale-while-revalidate=300`).
  **Men först när det är verifierat att inloggat läge inte kan hamna i den cachen**
  — en läckt personaliserad HTML är värre än långsamma sidor. Skjut till efter
  lansering.

---

## 9. Notiser och realtid

**Notiser:** `NotificationsBell` har ingen notistabell — den härleder allt ur
`friendships` + `match_invites`. Följ samma mönster: "trådar jag prenumererar på
som har inlägg nyare än mitt `last_read_at`". Ingen ny tabell behövs.

Auto-prenumeration när du skriver i en tråd, avprenumeration i ett klick.

**Realtid:** en diskret "3 nya inlägg — visa"-knapp, inte auto-inklistrade inlägg
(auto-append hoppar i scrollen mitt i att man läser).

Två regler ur CLAUDE.md som gäller här och som redan kraschat inloggningen en gång:
`postgres_changes`-kanaler måste ha **unikt namn per mount**
(`` `forum-thread-${id}-${Math.random().toString(36).slice(2)}` ``) med try/catch runt
`.subscribe()`, och widgeten lindas i `SafeBoundary`.

---

## 10. Juridik — läs det här innan lansering

Detta är ett publikt svenskt forum med användargenererat innehåll. Tre saker gäller:

1. **BBS-lagen (1998:112).** Som tillhandahållare har du skyldighet att ha *uppsikt*
   över tjänsten i skälig omfattning och att ta bort meddelanden som uppenbart
   utgör hets mot folkgrupp, barnpornografibrott, olaga våldsskildring, uppvigling
   eller uppenbart intrång i upphovsrätt. Du ska också **informera användarna om
   vem du är och vilka uppgifter som lagras**. Konkret: `/forum/regler` med din
   identitet och kontaktväg, en rapportknapp som fungerar, och en moderationskö du
   faktiskt tittar i. Allt det ligger i planen — men det är ett lagkrav, inte en
   trevlig detalj.
2. **GDPR.** Inlägg är personuppgifter. `/integritetspolicy` **måste** uppdateras
   (CLAUDE.md: den ska förbli faktiskt sann). Kontoradering i
   `account.functions.ts` anonymiserar redan `users`-raden — forumet måste därför
   rendera tomt användarnamn som "Borttagen användare" istället för en tom rad,
   och inläggen står kvar avidentifierade så trådarna förblir läsbara.
3. **Upphovsrätt.** UHR:s provtexter är skyddade — det är just därför ELF plockas
   bort ur häftena efter en vecka. Reglerna ska förbjuda att klistra in hela
   lästexter; uppgiftscitat-funktionen (§7) är det sanktionerade alternativet.

Utgivningsbevis från MPRT: **avrådes**. Det ger grundlagsskydd men gör dig till
ansvarig utgivare med ansvar för allt som publiceras — fel affär för ett öppet forum.

---

## 11. Kallstarten — hur forumet får liv

Ett tomt forum förblir tomt. Detta är den del av planen som faktiskt avgör om det
lyckas, och den är innehåll, inte kod.

- **Seeda 30–50 trådar innan lansering**, av dig, med riktiga svar. Råmaterialet
  finns redan i sidan: varje guide (`/guider/*`) ger 2–3 frågor, varje FAQ-post
  blir en tråd, varje provtillfälle får en "Diskussion: VT2026"-tråd.
- **Lansera med 5 kategorier, inte 12.** Fem kategorier med 10 trådar var ser
  levande ut; tolv med fyra var ser övergivet ut.
- **Entrén är inte `/forum`.** Den är blocket "Diskutera XYZ i forumet" på
  guide-, öva- och gamla-prov-sidorna, där folk redan är. Räkna med att större
  delen av de första inläggen kommer den vägen.
- **Svarstid är hela produkten i månad ett.** En obesvarad fråga i tre dagar lär
  besökaren att forumet är dött. Prenumerera på allt och svara inom timmar —
  det är därför notisdelen ligger i fas 1 och inte senare.
- **Säsongsprofilen är extrem.** HP-trafik toppar veckorna före provdagen och kring
  anmälan och resultat (`src/lib/hp-dates.ts` har datumen). Lansera 6–8 veckor före
  ett provdatum, inte i juli.

---

## 12. Faser

**Fas 1 — läs- och skrivbart forum (kärnan)**
Migration + typer · `/forum`, `/forum/$kategori`, tråd­sidan, skapa tråd, svara,
citera · `forum_can_post`-grinden · rate limits i både DB och `assertRateLimit` ·
markdown-renderare med KaTeX · SSR + `pageMeta` + JSON-LD · `/forum/regler` ·
uppdaterad integritetspolicy · rapportknapp · admin-flik med kö och grundåtgärder
(dölj/radera/lås/bannlys) · seedat innehåll.

*Utan admin-verktygen och regelsidan går forumet inte att lansera — de hör till
fas 1, inte "senare".*

**Fas 2 — det som gör det bra**
Prenumerationer + notiser i klockan · realtidsindikator · "hjälpsam"-reaktion och
bästa svar · dynamisk `/forum-sitemap.xml` + robots · fulltextsök (`swedish`-config,
`websearch_to_tsquery`) · uppgiftscitat-väljaren · korslänkblock på guider och
gamla prov.

**Fas 3 — tillväxt**
Publika profiler `/u/$username` · bilduppladdning · "obesvarade frågor"-vy ·
veckosammanfattning via mejl · edge-cache för utloggade · meta-kategori som slår
ihop `bug_reports`.

---

## 13. Risker och öppna frågor

| Risk | Motmedel |
|---|---|
| Anonym auth ⇒ obegränsade konton | `forum_can_post` (§5). Enskilt viktigaste beslutet i planen. |
| Spam från riktiga konton | Länkspärr för nya användare + kö + nuke-knapp |
| Forumet förblir tomt | Seedning + entré från guider/arkiv + snabb svarstid (§11) |
| Fusk/läckta provfrågor under pågående provperiod | Uttrycklig regel + lås trådar kring provdatum; det är den enda innehållstyp som kan skada sidans relation till UHR |
| Minderåriga användare | Inga PM från främlingar (redan vänner-bara), tydliga regler |
| Långsam trådlista vid volym | Denormaliserade räknare + partiella index (§4) |
| `supabaseAdmin` läcker dolt innehåll | `status`-filter i varje läsning, inte bara RLS |

**Att bestämma innan bygget startar**

1. **Krav på bekräftad mejl för att skriva?** Planen säger ja. Det kostar en del
   registreringar men är skillnaden mellan ett forum och en spam-kloak.
2. **Redigeringsfönster:** 30 min för vanliga användare, obegränsat för admin,
   "redigerad"-markering alltid synlig. Rimligt?
3. **Lanseringsdatum mot provdatum** — se säsongsprofilen i §11.
