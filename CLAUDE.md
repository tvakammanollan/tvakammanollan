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

Both Supabase and Cloudflare now live in Niklas' own accounts. Cloudflare Workers
Builds is connected straight to the GitHub repo, so **push to `main` = build +
deploy**, no button to click anywhere. Build command `npm run build`, deploy
command `npx wrangler deploy`. Live at `tvakammanollan.niklas-pellkvist.workers.dev`;
`hpkampen.se` still resolves via Strato DNS and has not been cut over yet.

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

- **No `SUPABASE_SERVICE_ROLE_KEY` locally** — `supabaseAdmin` is a lazy proxy: importing it is safe, *calling* it throws. Server functions and admin views can only be exercised in production; ask Niklas to test destructive flows (e.g. account deletion) with a throwaway account after deploy.
- **Lovable pushes its own commits** to `main` ("Changes", MCP updates). If push is rejected: `git pull --rebase origin main`, then re-verify tsc + build (new deps may need `npm install`) before pushing.
- External curls of `/_serverFn/` endpoints always 500 (seroval framing) — not a bug.
- `eslint src` reports ~900 pre-existing `prettier/prettier` errors across files nobody
  has touched. Lint the files you changed (`npx eslint <path>`) instead of the tree, and
  do not run `--fix` repo-wide unless that reformat is the actual task.
- Verifying rendered pages: `--dump-dom` snapshots fire before React finishes its
  async queries, so pages look empty at random. Drive Chrome over CDP with
  `--remote-debugging-port` and poll `document.body.innerText` until the expected text
  shows up (Node 24 has a global `WebSocket`, so no puppeteer needed).

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

### Key conventions

- All user-facing text is in Swedish (sv-SE)
- `displayCategory()` in `src/lib/sv-format.ts` — always use this to render question category names (maps `"LAS"→"LÄS"`; other codes like ORD, MEK, ELF are already display-safe)
- Number/date formatting helpers (`formatInt`, `formatDecimal`, `formatRelativeTime`, etc.) are in `src/lib/sv-format.ts` — use these everywhere instead of raw `toLocaleString`
- `@/` path alias maps to `src/`
- Animations: use `m.div` etc. from framer-motion (`import { m } from "framer-motion"`), NOT `motion.div` — the app runs under `<LazyMotion strict>` (root) with features async-loaded via `src/lib/motion-features.ts`; `motion.` throws at runtime in this setup
- Do NOT add extra Vite plugins — `@lovable.dev/vite-tanstack-config` already includes tanstackStart, viteReact, tailwindcss, tsConfigPaths, and cloudflare
- **Design (anti vibe-coded):** the app is always-dark. Card surface = `border border-white/10 bg-white/[0.02] backdrop-blur-sm`; brand accents amber `#f2a65a` / teal `#6fb3b8` on `--navy #170d05`. Never hardcode light surfaces (`bg-white`, light gradients) — inherited cream text becomes unreadable. Icons = Lucide SVG, never emoji-as-icon in UI chrome. New interactive elements need visible hover + the global amber focus ring works automatically.
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
- **Scanned exam figures** need the `.exam-figure` class, not `bg-white` — the
  remap layer turns `bg-white` into navy, which would hide black line art.
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

### GDPR / privacy — non-negotiable

- `/integritetspolicy` must stay **factually true** — it promises no tracking cookies and no third-party analytics. Never add a third-party script (ads, analytics) without a consent platform + policy update; AdSense was removed for exactly this reason (see comment in `__root.tsx`).
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
