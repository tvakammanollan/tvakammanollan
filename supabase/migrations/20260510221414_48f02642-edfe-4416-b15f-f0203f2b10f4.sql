
CREATE OR REPLACE FUNCTION public.get_leaderboard(_match_type text)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  elo integer,
  games_played integer,
  wins integer,
  losses integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY
      CASE WHEN _match_type = 'math' THEN u.elo_math ELSE u.elo_verbal END DESC,
      u.games_played DESC,
      u.username ASC
    ) AS rank,
    u.id AS user_id,
    u.username,
    (CASE WHEN _match_type = 'math' THEN u.elo_math ELSE u.elo_verbal END)::integer AS elo,
    u.games_played,
    u.wins,
    u.losses
  FROM public.users u
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(text) TO authenticated;
