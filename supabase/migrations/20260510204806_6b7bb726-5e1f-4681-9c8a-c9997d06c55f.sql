
-- ============ USERS (profiles) ============
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  elo_verbal int NOT NULL DEFAULT 1000 CHECK (elo_verbal >= 600),
  elo_math int NOT NULL DEFAULT 1000 CHECK (elo_math >= 600),
  elo_verbal_peak int NOT NULL DEFAULT 1000,
  elo_math_peak int NOT NULL DEFAULT 1000,
  games_played int NOT NULL DEFAULT 0,
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Forbid changing id/email via update
CREATE OR REPLACE FUNCTION public.users_prevent_immutable_changes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'id is immutable';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'email is immutable via this table';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_prevent_immutable_changes
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_prevent_immutable_changes();

-- Auto-create profile on signup (uses username from raw_user_meta_data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ QUESTIONS ============
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('ORD','MEK','LAS','ELF','XYZ','KVA','NOG','DTK')),
  subject_type text NOT NULL CHECK (subject_type IN ('verbal','math')),
  question_text text NOT NULL,
  passage_text text,
  passage_id text,
  options jsonb NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A','B','C','D','E')),
  difficulty int CHECK (difficulty BETWEEN 1 AND 5),
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX questions_category_idx ON public.questions(category);
CREATE INDEX questions_subject_type_idx ON public.questions(subject_type);
CREATE INDEX questions_passage_id_idx ON public.questions(passage_id);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select_authenticated" ON public.questions
  FOR SELECT TO authenticated USING (true);
-- INSERT/UPDATE/DELETE: no policies = denied for non-service-role (admin only via service role)

-- ============ MATCHES ============
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type text NOT NULL CHECK (match_type IN ('verbal','math')),
  room_code text UNIQUE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','finished')),
  player1_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  player2_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_bot_match boolean NOT NULL DEFAULT false,
  bot_elo int,
  player1_submitted_at timestamptz,
  player2_submitted_at timestamptz,
  player1_score int,
  player2_score int,
  winner_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX matches_player1_idx ON public.matches(player1_id);
CREATE INDEX matches_player2_idx ON public.matches(player2_id);
CREATE INDEX matches_status_idx ON public.matches(status);
CREATE INDEX matches_room_code_idx ON public.matches(room_code);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_select_participant" ON public.matches
  FOR SELECT TO authenticated
  USING (player1_id = auth.uid() OR player2_id = auth.uid());

-- Helper: check if a match is visible to current user (used by child tables)
CREATE OR REPLACE FUNCTION public.match_visible_to_user(_match_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = _match_id
      AND (player1_id = _user_id OR player2_id = _user_id)
  );
$$;

-- ============ MATCH_QUESTIONS ============
CREATE TABLE public.match_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_order int NOT NULL CHECK (question_order BETWEEN 1 AND 8),
  UNIQUE (match_id, question_order)
);

CREATE INDEX match_questions_match_idx ON public.match_questions(match_id);

ALTER TABLE public.match_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_questions_select_visible" ON public.match_questions
  FOR SELECT TO authenticated
  USING (public.match_visible_to_user(match_id, auth.uid()));

-- ============ MATCH_ANSWERS ============
CREATE TABLE public.match_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  selected_answer text,
  is_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX match_answers_match_idx ON public.match_answers(match_id);
CREATE INDEX match_answers_user_idx ON public.match_answers(user_id);

ALTER TABLE public.match_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_answers_select_own" ON public.match_answers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "match_answers_insert_own" ON public.match_answers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ ELO_HISTORY ============
CREATE TABLE public.elo_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  match_type text NOT NULL CHECK (match_type IN ('verbal','math')),
  elo_before int NOT NULL,
  elo_after int NOT NULL,
  elo_change int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX elo_history_user_idx ON public.elo_history(user_id);

ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "elo_history_select_own" ON public.elo_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_answers;
