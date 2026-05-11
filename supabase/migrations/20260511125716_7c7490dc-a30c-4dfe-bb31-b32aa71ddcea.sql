
CREATE TABLE public.ord_practice_stats (
  user_id uuid PRIMARY KEY,
  correct_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ord_practice_stats ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can read everyone's stats (needed for leaderboard)
CREATE POLICY "ord_stats_select_all" ON public.ord_practice_stats
  FOR SELECT TO authenticated
  USING (true);

-- No direct insert/update/delete from clients; server functions use service role.

CREATE OR REPLACE FUNCTION public.get_ord_leaderboard()
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  username text,
  correct_count integer,
  total_count integer,
  accuracy numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY s.correct_count DESC, s.total_count ASC, u.username ASC) AS rank,
    s.user_id,
    u.username,
    s.correct_count,
    s.total_count,
    CASE WHEN s.total_count > 0
      THEN ROUND((s.correct_count::numeric / s.total_count::numeric) * 100, 1)
      ELSE 0
    END AS accuracy
  FROM public.ord_practice_stats s
  JOIN public.users u ON u.id = s.user_id
  WHERE s.total_count > 0
$$;
