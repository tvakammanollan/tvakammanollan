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
