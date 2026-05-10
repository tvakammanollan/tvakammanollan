CREATE UNIQUE INDEX IF NOT EXISTS match_answers_unique_per_user_q
ON public.match_answers (match_id, user_id, question_id);