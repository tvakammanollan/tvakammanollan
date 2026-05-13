-- =====================================================================
-- CRITICAL BACKEND HARDENING — addresses #1,3,4,5,7,8,9,11,14,17,18,19,21
-- =====================================================================

-- ============== #7: PERFORMANCE INDEXES ==============
CREATE INDEX IF NOT EXISTS idx_matches_player1_status
  ON public.matches (player1_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_player2_status
  ON public.matches (player2_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_finished_created
  ON public.matches (created_at DESC) WHERE status = 'finished';
CREATE INDEX IF NOT EXISTS idx_elo_history_user_created
  ON public.elo_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_elo_history_match_user
  ON public.elo_history (match_id, user_id);
CREATE INDEX IF NOT EXISTS idx_match_answers_user_created
  ON public.match_answers (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_answers_match_user
  ON public.match_answers (match_id, user_id);
CREATE INDEX IF NOT EXISTS idx_match_questions_match_order
  ON public.match_questions (match_id, question_order);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee_status
  ON public.friendships (addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_requester_status
  ON public.friendships (requester_id, status);
CREATE INDEX IF NOT EXISTS idx_match_invites_to_status
  ON public.match_invites (to_user, status);
CREATE INDEX IF NOT EXISTS idx_users_username_lower
  ON public.users ((lower(username)));
CREATE INDEX IF NOT EXISTS idx_users_elo_verbal
  ON public.users (elo_verbal DESC) WHERE games_played >= 3;
CREATE INDEX IF NOT EXISTS idx_users_elo_math
  ON public.users (elo_math DESC) WHERE games_played >= 3;

-- ============== #1, #9: SERVER-SIDE LEADERBOARD FILTER + PAGINATION ==============
-- Replaces previous get_leaderboard with server-side filter for test/guest accounts
-- and proper pagination so we don't ship 1000+ rows to the client.
DROP FUNCTION IF EXISTS public.get_leaderboard(text);
DROP FUNCTION IF EXISTS public.get_leaderboard(text, integer, integer);

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
                 u.id  -- stable tiebreaker
      ) AS rank
    FROM public.users u
    WHERE u.games_played >= 3
      AND lower(u.username) NOT IN ('niklastest', 'niklastest2')
      AND u.username !~* '^(spelare|gast|gäst|guest|anon)[_-]?[a-z0-9]*$'
      -- Skip anonymous Supabase users
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

-- Backward-compat wrapper
CREATE OR REPLACE FUNCTION public.get_leaderboard(_match_type text)
RETURNS TABLE (
  rank bigint, user_id uuid, username text, elo integer,
  games_played integer, wins integer, losses integer
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.get_leaderboard(_match_type, 200, 0);
$$;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text) TO anon, authenticated;

-- ============== #5: ATOMIC ELO UPDATE ==============
CREATE OR REPLACE FUNCTION public.apply_match_result(
  _match_id uuid,
  _winner_id uuid,
  _loser_id uuid,
  _match_type text,
  _winner_score integer,
  _loser_score integer,
  _winner_elo_change integer,
  _loser_elo_change integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _w_elo integer;
  _l_elo integer;
  _is_finished text;
  _first_id uuid;
  _second_id uuid;
BEGIN
  -- Lock match row first to prevent double-finalization
  SELECT status INTO _is_finished
  FROM public.matches
  WHERE id = _match_id
  FOR UPDATE;

  IF _is_finished IS NULL THEN
    RAISE EXCEPTION 'Match not found' USING ERRCODE = 'P0002';
  END IF;
  IF _is_finished = 'finished' THEN
    RAISE EXCEPTION 'Match already finished' USING ERRCODE = 'P0001';
  END IF;

  -- Lock both users in deterministic order to avoid deadlocks
  IF _winner_id < _loser_id THEN
    _first_id := _winner_id;
    _second_id := _loser_id;
  ELSE
    _first_id := _loser_id;
    _second_id := _winner_id;
  END IF;
  PERFORM 1 FROM public.users WHERE id = _first_id FOR UPDATE;
  PERFORM 1 FROM public.users WHERE id = _second_id FOR UPDATE;

  IF _match_type = 'verbal' THEN
    UPDATE public.users
    SET elo_verbal = elo_verbal + _winner_elo_change,
        elo_verbal_peak = GREATEST(COALESCE(elo_verbal_peak, 1000), elo_verbal + _winner_elo_change),
        wins = wins + 1,
        games_played = games_played + 1
    WHERE id = _winner_id;
    UPDATE public.users
    SET elo_verbal = GREATEST(100, elo_verbal + _loser_elo_change),
        losses = losses + 1,
        games_played = games_played + 1
    WHERE id = _loser_id;
    SELECT elo_verbal INTO _w_elo FROM public.users WHERE id = _winner_id;
    SELECT elo_verbal INTO _l_elo FROM public.users WHERE id = _loser_id;
  ELSE
    UPDATE public.users
    SET elo_math = elo_math + _winner_elo_change,
        elo_math_peak = GREATEST(COALESCE(elo_math_peak, 1000), elo_math + _winner_elo_change),
        wins = wins + 1,
        games_played = games_played + 1
    WHERE id = _winner_id;
    UPDATE public.users
    SET elo_math = GREATEST(100, elo_math + _loser_elo_change),
        losses = losses + 1,
        games_played = games_played + 1
    WHERE id = _loser_id;
    SELECT elo_math INTO _w_elo FROM public.users WHERE id = _winner_id;
    SELECT elo_math INTO _l_elo FROM public.users WHERE id = _loser_id;
  END IF;

  INSERT INTO public.elo_history (user_id, match_id, match_type, elo_after, elo_change)
  VALUES
    (_winner_id, _match_id, _match_type, _w_elo, _winner_elo_change),
    (_loser_id,  _match_id, _match_type, _l_elo, _loser_elo_change);

  UPDATE public.matches
  SET status = 'finished',
      winner_id = _winner_id,
      player1_score = CASE WHEN player1_id = _winner_id THEN _winner_score ELSE _loser_score END,
      player2_score = CASE WHEN player2_id = _winner_id THEN _winner_score ELSE _loser_score END
  WHERE id = _match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_match_result TO authenticated;

-- ============== #3: ANSWER VALIDATION HELPER ==============
CREATE OR REPLACE FUNCTION public.validate_answer_timing(
  _match_id uuid,
  _claimed_seconds integer
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _match_started timestamptz;
  _max_seconds integer := 8 * 60;
BEGIN
  SELECT created_at INTO _match_started FROM public.matches WHERE id = _match_id;
  IF _match_started IS NULL THEN
    RETURN false;
  END IF;
  IF _claimed_seconds < 0 OR _claimed_seconds > _max_seconds THEN
    RETURN false;
  END IF;
  -- Server clock vs claimed elapsed: cannot exceed wall-clock + 5s slack
  IF EXTRACT(EPOCH FROM (now() - _match_started)) < _claimed_seconds - 5 THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.validate_answer_timing TO authenticated;

-- ============== #11: AUDIT LOG ==============
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL CHECK (action IN ('insert','update','delete','admin_action','dispute','rate_limit_hit')),
  old_data jsonb,
  new_data jsonb,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log (table_name, created_at DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_log;
CREATE POLICY "audit_admin_read" ON public.audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Trigger: log admin flag changes
CREATE OR REPLACE FUNCTION public.audit_admin_flag_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    INSERT INTO public.audit_log (user_id, table_name, record_id, action, old_data, new_data)
    VALUES (auth.uid(), 'users', NEW.id::text, 'admin_action',
            jsonb_build_object('is_admin', OLD.is_admin),
            jsonb_build_object('is_admin', NEW.is_admin));
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_audit_admin_flag ON public.users;
CREATE TRIGGER trg_audit_admin_flag AFTER UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.audit_admin_flag_change();

-- ============== #14: RUNTIME APP CONFIG ==============
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "config_read_all" ON public.app_config;
CREATE POLICY "config_read_all" ON public.app_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "config_admin_write" ON public.app_config;
CREATE POLICY "config_admin_write" ON public.app_config FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));
INSERT INTO public.app_config (key, value, description) VALUES
  ('elo_k_factor', '32', 'K-factor for ELO updates'),
  ('elo_starting', '1000', 'Starting ELO for new users'),
  ('elo_min_floor', '100', 'Lowest possible ELO'),
  ('match_questions_count', '8', 'Questions per match'),
  ('match_time_seconds', '480', 'Total match time')
ON CONFLICT (key) DO NOTHING;

-- ============== #18: HEALTH CHECK ==============
CREATE OR REPLACE VIEW public.health_check AS
SELECT
  'ok' AS status,
  now() AS checked_at,
  (SELECT count(*) FROM public.users) AS users_count,
  (SELECT count(*) FROM public.matches WHERE status = 'finished'
   AND created_at > now() - interval '24 hours') AS matches_24h;
GRANT SELECT ON public.health_check TO anon, authenticated;

-- ============== #21: BUG REPORTS WITH RATE LIMIT ==============
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  resolved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_created
  ON public.bug_reports (user_id, created_at DESC);
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bug_admin_read" ON public.bug_reports;
CREATE POLICY "bug_admin_read" ON public.bug_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

CREATE OR REPLACE FUNCTION public.submit_bug_report(_message text, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _recent integer;
  _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- Rate limit: 1 per 15 min per user
  SELECT count(*) INTO _recent
  FROM public.bug_reports
  WHERE user_id = auth.uid()
    AND created_at > now() - interval '15 minutes';
  IF _recent >= 1 THEN
    INSERT INTO public.audit_log (user_id, table_name, action, meta)
    VALUES (auth.uid(), 'bug_reports', 'rate_limit_hit',
            jsonb_build_object('attempted_at', now()));
    RAISE EXCEPTION 'Vänta minst 15 minuter mellan bug-rapporter';
  END IF;
  INSERT INTO public.bug_reports (user_id, message, meta)
  VALUES (auth.uid(), substring(_message, 1, 4000), _meta)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_bug_report TO authenticated;

-- ============== #8: BOT MATCH ARCHIVAL ==============
CREATE TABLE IF NOT EXISTS public.matches_archive (LIKE public.matches INCLUDING ALL);
GRANT SELECT ON public.matches_archive TO authenticated;

CREATE OR REPLACE FUNCTION public.archive_old_bot_matches() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _moved integer;
BEGIN
  WITH moved AS (
    DELETE FROM public.matches
    WHERE is_bot_match = true
      AND status = 'finished'
      AND created_at < now() - interval '90 days'
    RETURNING *
  )
  INSERT INTO public.matches_archive SELECT * FROM moved;
  GET DIAGNOSTICS _moved = ROW_COUNT;
  RETURN _moved;
END;
$$;
-- To activate: SELECT cron.schedule('archive-bots', '0 3 * * *',
--   'SELECT public.archive_old_bot_matches()');

-- ============== #19: RLS HARDENING ==============
ALTER TABLE public.match_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "answers_own_only" ON public.match_answers;
CREATE POLICY "answers_own_only" ON public.match_answers FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.status = 'finished'
        AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "users_self_update_safe" ON public.users;
CREATE POLICY "users_self_update_safe" ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin = (SELECT is_admin FROM public.users WHERE id = auth.uid())
  );

REVOKE UPDATE (elo_verbal, elo_math, elo_verbal_peak, elo_math_peak, wins, losses, games_played)
  ON public.users FROM authenticated, anon;

-- ============== #17: WORD LEADERBOARD WITH PAGINATION ==============
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
    WHERE u.username !~* '^(spelare|gast|gäst|guest|anon)[_-]?[a-z0-9]*$'
      AND lower(u.username) NOT IN ('niklastest', 'niklastest2')
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
GRANT EXECUTE ON FUNCTION public.get_ord_leaderboard TO anon, authenticated;
