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

---

## Commands

```bash
npm run dev        # Start dev server (Vite + TanStack Start SSR)
npm run build      # Production build (Cloudflare Workers via wrangler)
npm run lint       # ESLint
npx tsc --noEmit   # Type-check without building
```

The app deploys to Cloudflare Workers via Lovable — push to `main` on GitHub, then trigger deploy from Lovable.

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
- Do NOT add extra Vite plugins — `@lovable.dev/vite-tanstack-config` already includes tanstackStart, viteReact, tailwindcss, tsConfigPaths, and cloudflare

### Rate limiting

`src/lib/rate-limit.ts` provides an in-memory rate limiter for Cloudflare Workers (single-process, per-region). Pre-configured limits are exported as `limits.*` (e.g. `limits.matchmaking`, `limits.friendRequest`).

### DB migrations

SQL files in `supabase/migrations/` — run manually in Supabase SQL editor (production has no CLI migration runner). After adding a table, update `src/integrations/supabase/types.ts` manually.
