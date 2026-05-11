-- ============ EXTEND EXISTING TABLES ============

-- questions: explanation + tags
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS explanation TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- users (this project's "profiles" table): streak, goals, daily bot count, flags
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date DATE,
  ADD COLUMN IF NOT EXISTS target_score DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS preferred_type TEXT CHECK (preferred_type IN ('verbal','math','both')),
  ADD COLUMN IF NOT EXISTS bot_matches_today INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_bot_match_date DATE,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS profile_public BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- matches: ranked flag
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS is_ranked BOOLEAN NOT NULL DEFAULT FALSE;

-- match_answers: per-question time tracking
ALTER TABLE public.match_answers
  ADD COLUMN IF NOT EXISTS time_spent_seconds INT;

-- ============ NEW TABLES ============

CREATE TABLE IF NOT EXISTS public.question_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  reporter_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason        TEXT NOT NULL CHECK (reason IN ('wrong_answer','unclear_question','technical_error','other')),
  comment       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, reporter_id)
);

CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  match_type  TEXT NOT NULL CHECK (match_type IN ('verbal','math')),
  player_elo  INT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','matched','cancelled')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start    DATE NOT NULL UNIQUE,
  match_type    TEXT NOT NULL CHECK (match_type IN ('verbal','math')),
  question_ids  JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weekly_challenge_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score         INT NOT NULL DEFAULT 0,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, player_id)
);

-- ============ SECURITY DEFINER for admin check ============
-- Avoids recursion if used in RLS on the users table itself.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id AND is_admin = TRUE);
$$;

-- ============ RLS: question_reports ============
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qr_insert_own"
  ON public.question_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "qr_select_own"
  ON public.question_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "qr_admin_all"
  ON public.question_reports FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============ RLS: matchmaking_queue ============
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mq_select_all"
  ON public.matchmaking_queue FOR SELECT TO authenticated USING (true);

CREATE POLICY "mq_insert_own"
  ON public.matchmaking_queue FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "mq_update_own"
  ON public.matchmaking_queue FOR UPDATE TO authenticated
  USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);

CREATE POLICY "mq_delete_own"
  ON public.matchmaking_queue FOR DELETE TO authenticated
  USING (auth.uid() = player_id);

-- ============ RLS: weekly_challenges ============
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wc_select_public"
  ON public.weekly_challenges FOR SELECT USING (true);

-- ============ RLS: weekly_challenge_entries ============
ALTER TABLE public.weekly_challenge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wce_select_all"
  ON public.weekly_challenge_entries FOR SELECT TO authenticated USING (true);

CREATE POLICY "wce_insert_own"
  ON public.weekly_challenge_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_id);

-- ============ TIGHTEN: match_answers SELECT ============
-- Old policy allowed only own answers. New policy: own answers always,
-- plus all answers in matches that are finished and where you participated.
DROP POLICY IF EXISTS "match_answers_select_own" ON public.match_answers;

CREATE POLICY "match_answers_select_own_or_finished"
  ON public.match_answers FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
        AND m.status = 'finished'
    )
  );
