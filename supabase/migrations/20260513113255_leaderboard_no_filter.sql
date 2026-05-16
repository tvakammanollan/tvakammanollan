-- =====================================================================
-- LEADERBOARD: ta bort ALLA filter
-- Alla som spelat (inkl gäster, inkl test-konton) ska synas.
-- Endast krav: minst 1 match spelad (annars syns folk som aldrig spelat).
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
    WHERE u.games_played >= 1
  )
  SELECT rank, user_id, username, elo, games_played, wins, losses
  FROM ranked
  ORDER BY rank
  LIMIT _limit OFFSET _offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, integer, integer) TO anon, authenticated;

-- Ord-leaderboard: minst 1 svar (var 5)
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
    GROUP BY wp.user_id, u.username
    HAVING COUNT(*) >= 1
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
