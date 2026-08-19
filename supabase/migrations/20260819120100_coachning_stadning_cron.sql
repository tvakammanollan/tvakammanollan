-- Schemaläggning av städaren (pg_cron).
--
-- KÖRS INTE RAKT AV — byt ut <SWEEP_SECRET> mot värdet på Cloudflare-hemligheten
-- COACHING_SWEEP_SECRET innan du kör den här i SQL-editorn. Hemligheten står
-- medvetet inte i filen: repot är publikt hos GitHub och Cloudflare bygger
-- direkt från det.
--
-- Varför pg_cron och inte Cloudflares Cron Triggers: den byggda Workern har
-- visserligen en `scheduled`-export (nitro lägger dit den), men den ropar på
-- nitro-hooken `cloudflare:scheduled`, och TanStack Start ger oss ingen väg att
-- registrera en nitro-plugin. Kroken finns alltså men går inte att haka i.
--
-- Var femtonde minut räcker gott: fristen för en obetald tid är 45 minuter, och
-- den precisa släppningen sköts ändå av Stripes `checkout.session.expired`.
-- Svepet är skyddsnätet, framför allt för tider som bokats helt utanför
-- köpflödet.
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('coachning-stada-obetalda-tider')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'coachning-stada-obetalda-tider');

SELECT cron.schedule(
  'coachning-stada-obetalda-tider',
  '*/15 * * * *',
  $$
    SELECT net.http_get(
      url := 'https://tvakommanollan.se/api/coaching/sweep?secret=<SWEEP_SECRET>',
      timeout_milliseconds := 30000
    );
  $$
);

-- Kontroll efteråt — utan den ser ett jobb som aldrig kört ut precis som ett
-- jobb som kör felfritt:
--   SELECT jobid, jobname, schedule, active FROM cron.job;
--   SELECT status, return_message, start_time
--     FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'coachning-stada-obetalda-tider')
--    ORDER BY start_time DESC LIMIT 5;
