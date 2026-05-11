-- Allow training answers (no match) in match_answers
ALTER TABLE public.match_answers
  ALTER COLUMN match_id DROP NOT NULL;

ALTER TABLE public.match_answers
  ADD COLUMN IF NOT EXISTS is_training BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.match_answers
  ADD COLUMN IF NOT EXISTS difficulty INTEGER;

CREATE INDEX IF NOT EXISTS idx_match_answers_user_training
  ON public.match_answers (user_id, is_training);

-- Allow users to insert their own training answers (no match_id required)
CREATE POLICY "match_answers_insert_training_self"
  ON public.match_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND is_training = TRUE
    AND match_id IS NULL
  );

-- Allow users to read their own training answers
CREATE POLICY "match_answers_select_own_training"
  ON public.match_answers
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND is_training = TRUE
    AND match_id IS NULL
  );
