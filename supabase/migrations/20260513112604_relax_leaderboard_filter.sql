-- =====================================================================
-- RELAX LEADERBOARD FILTER
-- Previous migration filtered ALL usernames matching ^spelare_* as "auto-
-- generated guests", but the original onboarding gave that exact pattern
-- to real users. Result: only ~6 of 100+ users showed up.
--
-- Fix: only block explicit test accounts. Anonymous-user filtering already
-- handled via auth.users.is_anonymous join.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  _match_type text,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  elo integer,
  games_played integer,
  wins integer,
  losses integer
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ranked AS (
    SELECT
      u.id AS user_id,
      u.username,
      CASE WHEN _match_type = 'verbal' THEN u.elo_verbal ELSE u.elo_math END AS elo,
      u.games_played,
      u.wins,
      u.losses,
      ROW_NUMBER() OVER (
        ORDER BY CASE WHEN _match_type = 'verbal' THEN u.elo_verbal ELSE u.elo_math END DESC,
                 u.id
      ) AS rank
    FROM public.users u
    WHERE u.games_played >= 3
      -- Block only explicit test accounts (NOT the spelare_* pattern which
      -- is what real onboarding flow gave users).
      AND lower(u.username) NOT IN ('niklastest', 'niklastest2', 'test', 'testuser')
      -- Skip anonymous Supabase users (guests)
      AND NOT EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = u.id AND au.is_anonymous = true
      )
  )
  SELECT rank, user_id, username, elo, games_played, wins, losses
  FROM ranked
  ORDER BY rank
  LIMIT _limit OFFSET _offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, integer, integer) TO anon, authenticated;

-- Same for get_ord_leaderboard
CREATE OR REPLACE FUNCTION public.get_ord_leaderboard(_limit integer DEFAULT 100)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  correct_count bigint,
  total_count bigint,
  accuracy integer
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH stats AS (
    SELECT
      wp.user_id,
      u.username,
      COUNT(*) FILTER (WHERE wp.is_correct) AS correct_count,
      COUNT(*) AS total_count
    FROM public.word_practice_answers wp
    JOIN public.users u ON u.id = wp.user_id
    WHERE lower(u.username) NOT IN ('niklastest', 'niklastest2', 'test', 'testuser')
      AND NOT EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = wp.user_id AND au.is_anonymous = true
      )
    GROUP BY wp.user_id, u.username
    HAVING COUNT(*) >= 10
  ), ranked AS (
    SELECT
      user_id, username, correct_count, total_count,
      (correct_count * 100 / NULLIF(total_count, 0))::integer AS accuracy,
      ROW_NUMBER() OVER (ORDER BY correct_count DESC, total_count DESC) AS rank
    FROM stats
  )
  SELECT rank, user_id, username, correct_count, total_count, accuracy
  FROM ranked
  ORDER BY rank
  LIMIT _limit;
$$;
GRANT EXECUTE ON FUNCTION public.get_ord_leaderboard(integer) TO anon, authenticated;
