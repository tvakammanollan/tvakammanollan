-- Ta bort de fyra bottade topplistekontona (2026-08-17)
--
-- Bakgrund: verbal-topplistan ("Alltid") toppades av konton som ligger långt
-- utanför fältet i övrigt:
--
--   #1  xing xong                                          ELO 2241, 200 matcher, 87 % vinst
--   #2  vad_ar_skillnaden_pa_niklas_och_en_hink_med_bajs?  ELO 2226, 300 matcher, 85 % vinst
--   #3  admin'--                                           ELO 1929,  40 matcher, 85 % vinst
--   #4  /*                                                 ELO 1757,  20 matcher, 95 % vinst
--   #5  inquam                                             ELO 1582   <- första som får vara kvar
--
-- Bara elo_verbal är uppblåst; elo_math står kvar på 1000, så automatiken har
-- körts uteslutande mot den verbala kön.
--
-- Bevisläget skiljer sig mellan paren. #1 och #2 är statistiskt omöjliga: 200
-- respektive 300 matcher, 300+ ELO över resten av fältet. #3 och #4 har mycket
-- tunnare underlag — 40 och 20 matcher — och tas med för att användarnamnen är
-- SQL-injektionssträngar och mönstret är detsamma. Del 1b visar siffrorna per
-- konto; titta på dem innan del 2 körs.
--
-- Beslut (Niklas, 2026-08-17):
--   * Kontona raderas helt och inloggningen dödas.
--   * Motståndarnas ELO lämnas ORÖRD. Deras games_played/wins/losses räknas
--     alltså inte om, och ELO de förlorat mot fuskkontona ligger kvar.
--
-- Körs manuellt i Supabase SQL editor — produktion har ingen migrationsrunner,
-- och en deploy av sajten kör INTE den här filen.
-- KÖR DEL 1 FÖRST, läs av utskriften, kör sedan DEL 2.
--
-- Obs: 'admin''--' är ett escapat enkelfnutt, inte ett stavfel. Användarnamnet
-- är literalt  admin'--  och den dubbla fnutten är hur Postgres skriver den.


-- ============================================================================
-- DEL 1 — INSPEKTION (läser bara, ändrar ingenting)
-- ============================================================================
-- 1a) Vilka konton träffar användarnamnen? Ska ge EXAKT fyra rader.
--     Kontrollera id:na här innan du kör del 2. Obs: 'xing long' (#90 på
--     listan) är ett ANNAT konto och ska inte med.

SELECT id, username, elo_verbal, elo_math, games_played, wins, losses, created_at
FROM public.users
WHERE username IN (
  'xing xong',
  'vad_ar_skillnaden_pa_niklas_och_en_hink_med_bajs?',
  'admin''--',
  '/*'
)
ORDER BY elo_verbal DESC;


-- 1b) Vad omfattas av raderingen, per konto?
--     Kolumnen "riktiga motståndare" är den som betyder något: är den 0 har
--     kontot bara farmat botmatcher och ingen annan spelare påverkas alls.

WITH fusk AS (
  SELECT id, username FROM public.users
  WHERE username IN (
    'xing xong',
    'vad_ar_skillnaden_pa_niklas_och_en_hink_med_bajs?',
    'admin''--',
    '/*'
  )
),
matcher AS (
  SELECT f.id AS fusk_id, f.username, m.id AS match_id, m.is_bot_match,
         CASE WHEN m.player1_id = f.id THEN m.player2_id ELSE m.player1_id END AS motstandare
  FROM fusk f
  JOIN public.matches m
    ON m.player1_id = f.id OR m.player2_id = f.id
)
SELECT
  username,
  count(*)                                                   AS matcher_totalt,
  count(*) FILTER (WHERE is_bot_match)                       AS botmatcher,
  count(*) FILTER (WHERE NOT is_bot_match)                   AS mot_spelare,
  count(DISTINCT motstandare) FILTER (
    WHERE NOT is_bot_match
      AND motstandare IS NOT NULL
      AND motstandare NOT IN (SELECT id FROM fusk)
  )                                                          AS riktiga_motstandare
FROM matcher
GROUP BY username
ORDER BY matcher_totalt DESC;


-- 1c) Totalsummor.

WITH fusk AS (
  SELECT id FROM public.users
  WHERE username IN (
    'xing xong',
    'vad_ar_skillnaden_pa_niklas_och_en_hink_med_bajs?',
    'admin''--',
    '/*'
  )
),
fusk_matcher AS (
  SELECT id FROM public.matches
  WHERE player1_id IN (SELECT id FROM fusk) OR player2_id IN (SELECT id FROM fusk)
)
SELECT 'konton som matchar användarnamnen' AS post, count(*)::text AS antal FROM fusk
UNION ALL SELECT 'matcher som raderas',              count(*)::text FROM fusk_matcher
UNION ALL SELECT 'elo_history-rader som följer med', count(*)::text FROM public.elo_history
                                                     WHERE match_id IN (SELECT id FROM fusk_matcher)
UNION ALL SELECT 'match_answers som följer med',     count(*)::text FROM public.match_answers
                                                     WHERE match_id IN (SELECT id FROM fusk_matcher)
UNION ALL SELECT 'rader i matches_archive',          count(*)::text FROM public.matches_archive
                                                     WHERE player1_id IN (SELECT id FROM fusk)
                                                        OR player2_id IN (SELECT id FROM fusk);


-- ============================================================================
-- DEL 2 — RADERING (destruktiv, körs i en transaktion)
-- ============================================================================
-- Allt eller inget: varje guard nedan gör ROLLBACK på hela körningen om
-- verkligheten inte ser ut som förväntat.

BEGIN;

-- Lås fast vilka konton det gäller.
CREATE TEMP TABLE fusk_konton ON COMMIT DROP AS
SELECT id, username FROM public.users
WHERE username IN (
  'xing xong',
  'vad_ar_skillnaden_pa_niklas_och_en_hink_med_bajs?',
  'admin''--',
  '/*'
);

-- Säkrare variant om användarnamnen hunnit ändras mellan del 1 och del 2:
-- kommentera bort blocket ovan och klistra in id:na från 1a i stället.
--
-- CREATE TEMP TABLE fusk_konton ON COMMIT DROP AS
-- SELECT id, username FROM public.users
-- WHERE id IN ('<uuid-1>', '<uuid-2>', '<uuid-3>', '<uuid-4>');

DO $$
BEGIN
  IF (SELECT count(*) FROM fusk_konton) <> 4 THEN
    RAISE EXCEPTION
      'Avbryter: hittade % konton, väntade 4. Kör del 1a och pinna id:na i stället.',
      (SELECT count(*) FROM fusk_konton);
  END IF;
END $$;

CREATE TEMP TABLE fusk_matcher ON COMMIT DROP AS
SELECT id FROM public.matches
WHERE player1_id IN (SELECT id FROM fusk_konton)
   OR player2_id IN (SELECT id FROM fusk_konton);

-- 1) Matchhistoriken.
--    match_questions, match_answers och elo_history hänger på matches med
--    ON DELETE CASCADE och följer med av sig själva — inklusive motståndarens
--    rader i just dessa matcher, vilket är avsikten: matchen ska bort helt.
--
--    Matcherna måste bort FÖRE kontot. matches.player1_id är ON DELETE CASCADE
--    men player2_id är ON DELETE SET NULL, så att bara radera användaren hade
--    lämnat kvar varannan match med tom motståndare.
DELETE FROM public.matches WHERE id IN (SELECT id FROM fusk_matcher);

-- 2) matches_archive är en ren arkivtabell utan främmande nycklar
--    (se 20260813090000_matches_archive_rls.sql) — inget cascar hit.
DELETE FROM public.matches_archive
WHERE player1_id IN (SELECT id FROM fusk_konton)
   OR player2_id IN (SELECT id FROM fusk_konton);

-- 3) Sidotabeller som saknar FK mot users och därför inte städas av någon
--    cascade. Dessa är lätta att missa — user_id är bara en lös uuid-kolumn.
DELETE FROM public.ord_practice_stats WHERE user_id IN (SELECT id FROM fusk_konton);
DELETE FROM public.user_word_correct  WHERE user_id IN (SELECT id FROM fusk_konton);
DELETE FROM public.bug_reports        WHERE user_id IN (SELECT id FROM fusk_konton);
DELETE FROM public.coaching_requests  WHERE user_id IN (SELECT id FROM fusk_konton);
DELETE FROM public.match_invites
WHERE from_user IN (SELECT id FROM fusk_konton)
   OR to_user   IN (SELECT id FROM fusk_konton);

-- 4) Sidotabeller som HAR cascade — raderas ändå explicit, så att resultatet
--    inte hänger på att varje FK är definierad som vi tror.
DELETE FROM public.user_word_failed          WHERE user_id     IN (SELECT id FROM fusk_konton);
DELETE FROM public.matchmaking_queue         WHERE player_id   IN (SELECT id FROM fusk_konton);
DELETE FROM public.question_reports          WHERE reporter_id IN (SELECT id FROM fusk_konton);
DELETE FROM public.weekly_challenge_entries  WHERE player_id   IN (SELECT id FROM fusk_konton);
DELETE FROM public.friendships
WHERE requester_id IN (SELECT id FROM fusk_konton)
   OR addressee_id IN (SELECT id FROM fusk_konton);
DELETE FROM public.messages
WHERE sender_id    IN (SELECT id FROM fusk_konton)
   OR recipient_id IN (SELECT id FROM fusk_konton);

-- 5) Auth-kontot. public.users.id -> auth.users(id) ON DELETE CASCADE, så
--    users-raden försvinner med — och därmed kontot från alla topplistor.
--    audit_log.user_id är ON DELETE SET NULL, så loggen bevaras utan avsändare.
DELETE FROM auth.users WHERE id IN (SELECT id FROM fusk_konton);

-- 6) Kontroll före commit.
DO $$
DECLARE
  kvar_users int;
  kvar_matcher int;
BEGIN
  SELECT count(*) INTO kvar_users
  FROM public.users u JOIN fusk_konton f ON f.id = u.id;

  SELECT count(*) INTO kvar_matcher
  FROM public.matches m
  WHERE m.player1_id IN (SELECT id FROM fusk_konton)
     OR m.player2_id IN (SELECT id FROM fusk_konton);

  IF kvar_users <> 0 OR kvar_matcher <> 0 THEN
    RAISE EXCEPTION
      'Avbryter: % users-rader och % matcher finns kvar efter raderingen.',
      kvar_users, kvar_matcher;
  END IF;
END $$;

COMMIT;


-- ============================================================================
-- EFTERÅT
-- ============================================================================
-- Topplistan läser direkt ur users (fetchLeaderboard i
-- src/lib/leaderboard.functions.ts, service role, inget cacheat lager), så den
-- är korrekt vid nästa laddning — ingen deploy behövs.
--
-- Efter körningen ska toppen se ut så här: #1 inquam 1582, #2 pernillapi 1526.
--
-- Kvar att fundera på, utanför den här körningen:
--   * Ingenting hindrar att det görs om. Botskyddet sitter i dag bara i
--     rate-limit per isolat (src/lib/rate-limit.ts) och users.bot_matches_today.
--   * #13 heter dDos+MegaELO och #90 xing long — samma mönster i namngivningen,
--     men inga onormala siffror. Lämnade orörda.
