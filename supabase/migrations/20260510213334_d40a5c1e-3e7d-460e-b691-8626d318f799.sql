CREATE UNIQUE INDEX IF NOT EXISTS match_answers_unique_per_user_question
  ON public.match_answers (match_id, user_id, question_id);