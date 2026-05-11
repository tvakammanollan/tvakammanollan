
CREATE TABLE public.user_word_correct (
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  first_correct_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX idx_user_word_correct_user ON public.user_word_correct(user_id);

ALTER TABLE public.user_word_correct ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uwc_select_own" ON public.user_word_correct
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "uwc_insert_own" ON public.user_word_correct
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
