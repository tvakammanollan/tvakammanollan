
-- 1) Hide correct_answer column from client roles
REVOKE SELECT ON public.questions FROM anon, authenticated;
GRANT SELECT (id, category, subject_type, question_text, passage_text, passage_id, options, difficulty, source, created_at)
  ON public.questions TO anon, authenticated;

-- 2) Secure RPC to fetch questions with correct_answer for a finished match (participants only)
CREATE OR REPLACE FUNCTION public.get_match_review(_match_id uuid)
RETURNS TABLE (
  question_id uuid,
  question_order integer,
  category text,
  subject_type text,
  question_text text,
  passage_text text,
  passage_id text,
  options jsonb,
  difficulty integer,
  correct_answer text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, mq.question_order, q.category, q.subject_type, q.question_text,
         q.passage_text, q.passage_id, q.options, q.difficulty, q.correct_answer
  FROM public.match_questions mq
  JOIN public.questions q ON q.id = mq.question_id
  JOIN public.matches m ON m.id = mq.match_id
  WHERE mq.match_id = _match_id
    AND m.status = 'finished'
    AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
  ORDER BY mq.question_order;
$$;

REVOKE ALL ON FUNCTION public.get_match_review(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_match_review(uuid) TO authenticated;

-- 3) Tighten match_answers INSERT to require participation in an active match
DROP POLICY IF EXISTS "match_answers_insert_own" ON public.match_answers;
CREATE POLICY "match_answers_insert_participant"
  ON public.match_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.status = 'active'
        AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
    )
  );

-- Allow upsert (UPDATE) for own answers in active matches as well
DROP POLICY IF EXISTS "match_answers_update_participant" ON public.match_answers;
CREATE POLICY "match_answers_update_participant"
  ON public.match_answers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.status = 'active'
        AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
    )
  );

-- 4) Restrict realtime.messages subscriptions to match participants
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_match_participants_only" ON realtime.messages;
CREATE POLICY "realtime_match_participants_only"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id::text = realtime.topic()
        AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
    )
  );
