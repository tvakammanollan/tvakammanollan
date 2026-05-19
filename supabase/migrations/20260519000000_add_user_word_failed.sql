-- Track words a user has answered incorrectly, with spaced-repetition metadata.
CREATE TABLE IF NOT EXISTS public.user_word_failed (
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id     uuid        NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  fail_count      int         NOT NULL DEFAULT 1,
  review_streak   int         NOT NULL DEFAULT 0,  -- consecutive correct reviews since last fail
  last_failed_at  timestamptz NOT NULL DEFAULT now(),
  next_review_at  timestamptz NOT NULL DEFAULT now(),
  interval_days   float       NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX idx_uwf_user_review ON public.user_word_failed(user_id, next_review_at);

ALTER TABLE public.user_word_failed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uwf_all_own"
  ON public.user_word_failed FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
