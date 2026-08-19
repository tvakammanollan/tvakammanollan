-- Matchens klocka får en egen tidpunkt.
--
-- Bakgrund: den visade "tid" på resultatsidan räknades som
-- `submitted_at - created_at`. Men `created_at` är när matchRADEN skapades,
-- inte när spelaren fick se första frågan:
--
--   * Privat rum / inbjudan — raden skapas när rummet öppnas och står som
--     `waiting` tills motparten accepterar. En match som spelades på 3 minuter
--     kunde därför redovisas som 14 minuter, alltså längre än de 5 som passet
--     alls varar.
--   * Bot — raden skapas, sedan laddas åtta frågor. Sekunderna däremellan
--     räknades som speltid.
--
-- Klienten hade redan ett eget ankare (`sessionStorage`, se
-- `match.$matchId.tsx`) för själva nedräkningen, men det ankaret finns bara i
-- en webbläsare: resultatsidan, botens simulerade tid och tidsgolvet mot
-- fusk (`isImplausiblyFast`) läste alla `created_at` och kom därför fram till
-- olika svar om samma match.
--
-- `started_at` sätts när matchen faktiskt blir spelbar: vid skapandet för
-- botmatcher (frågorna finns direkt), och när motparten går med för rum och
-- inbjudningar. NULL för alla matcher som redan ligger i tabellen — läskoden
-- faller tillbaka på `created_at` för dem, vilket är exakt vad som gällde förut.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

COMMENT ON COLUMN public.matches.started_at IS
  'När matchen blev spelbar (frågorna fanns och båda parter var på plats). Klockan och all tidsredovisning räknas härifrån, inte från created_at. NULL på matcher skapade före 2026-08-19.';

-- Backfill: för botmatcher är created_at rätt svar, de blev spelbara direkt.
-- Rum och inbjudningar lämnas NULL — vi kan inte i efterhand veta när
-- motparten gick med, och en gissning hade sett ut som en mätning.
UPDATE public.matches
   SET started_at = created_at
 WHERE started_at IS NULL
   AND is_bot_match = true;
