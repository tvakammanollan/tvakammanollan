-- Användningshändelser i audit_log — CHECK-villkoret släppte aldrig in dem.
--
-- `audit_log.action` skapades 2026-05-13 med
--   CHECK (action IN ('insert','update','delete','admin_action','dispute','rate_limit_hit'))
-- och `logUsageEvent` skriver sedan 2026-08-17 `usage:gamla_prov_submit`.
-- Varje sådan insert har alltså avvisats med 23514 — och eftersom felet bara
-- console.error:as (statistik får inte störa användarflödet) syntes det
-- ingenstans: tabellen stod på NOLL rader medan admin-vyns siffra läste noll
-- och såg korrekt ut. Samma vägg tog `usage:gamla_prov_start`.
--
-- Villkoret behålls för de sex ursprungliga värdena — det är fortfarande ett
-- verkligt skydd mot stavfel i triggarna — men `usage:`-namnrymden släpps in.
-- Prefixet är hela poängen: det skiljer mätning från revisionsspår i samma
-- tabell, och en tabellbred fribiljett hade tagit bort skyddet för båda.

alter table public.audit_log
  drop constraint if exists audit_log_action_check;

alter table public.audit_log
  add constraint audit_log_action_check
  check (
    action in ('insert', 'update', 'delete', 'admin_action', 'dispute', 'rate_limit_hit')
    or action like 'usage:%'
  );

-- Landningssidan räknar `usage:gamla_prov_start` vid varje rendering, och det
-- är den räkningen som växer snabbast av allt i tabellen. Utan index blir den
-- en seq scan över hela revisionsloggen.
create index if not exists audit_log_action_idx
  on public.audit_log (action);
