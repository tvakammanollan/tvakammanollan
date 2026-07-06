# src/lib — server functions & core logic

Rules for this folder. They exist because every past production incident
traced back to one of these being skipped.

## File taxonomy
- `*.functions.ts` — server functions (`createServerFn`), callable from the
  client via `useServerFn()`. Run on Cloudflare Workers.
- `*.server.ts` — server-only helpers. Never import from client components.
- Everything else — isomorphic pure logic. Keep it pure and testable.

## Every new server function MUST
1. **Validate input with zod** in `.inputValidator()` — never trust client
   data (scores, ids, `is_correct`, anything).
2. **Auth**: `.middleware([requireSupabaseAuth])` for anything user-specific
   or mutating. Guests are authenticated (anonymous) users — they pass.
3. **Rate limit — first line of the handler:**
   - per user: `assertRateLimit(\`thing:${userId}\`, limits.xxx)`
   - public GET: `assertRateLimit(ipKey("thing"), limits.publicRead)`
   Add a new config to `limits` in `rate-limit.ts` rather than inlining numbers.
4. **Never leak raw DB errors to the client.** Log server-side, throw a
   generic Swedish message (see `throwDbError` in `word-practice.functions.ts`).
   User-facing error copy is Swedish, specific, and actionable.
5. **Authorize ownership**: verify the row belongs to `userId` before acting
   (`player1_id/player2_id`, `to_user`, etc.) — supabaseAdmin bypasses RLS,
   so YOUR check is the only check.

## supabaseAdmin
Lazy proxy — importing is side-effect-free (tests can import this folder),
but any call throws locally (no service key). Typed updates: cast dynamic
objects to the generated types (`Database["public"]["Tables"][T]["Update"]`),
never `as any`.

## Pure logic & tests
Business math (ELO, normering, achievements, hpScore) lives in small pure
modules with colocated `*.test.ts` (vitest, `npm run test`). If a function
needs testing but sits next to DB code, extract the pure part. New scoring/
threshold logic without tests is not done.

## Concurrency & idempotency
- Anything that can run twice (retries, double-submit) must be idempotent:
  insert + ignore duplicate-key `23505` beats upsert-with-onConflict (which
  breaks in prod if the unique index migration hasn't run yet).
- ELO writes are guarded by an `elo_history` uniqueness check — keep it.

## Misc
- New tables/columns: SQL file in `supabase/migrations/` (Niklas runs it in
  the SQL editor) + manually extend `src/integrations/supabase/types.ts`.
- Usage/analytics events: `logUsageEvent` → `audit_log` with a
  `usage:`-namespaced action. Don't invent new event tables casually.
- PostgREST returns max ~1000 rows — for aggregations, paginate (see
  `pageColumn` in `usage.functions.ts`) or write an RPC migration.
