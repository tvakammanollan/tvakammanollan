CREATE POLICY "questions_admin_insert" ON public.questions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "questions_admin_update" ON public.questions
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "questions_admin_delete" ON public.questions
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP FUNCTION IF EXISTS public.get_match_review(uuid);
CREATE FUNCTION public.get_match_review(_match_id uuid)
 RETURNS TABLE(question_id uuid, question_order integer, category text, subject_type text, question_text text, passage_text text, passage_id text, options jsonb, difficulty integer, correct_answer text, explanation text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT q.id, mq.question_order, q.category, q.subject_type, q.question_text,
         q.passage_text, q.passage_id, q.options, q.difficulty, q.correct_answer, q.explanation
  FROM public.match_questions mq
  JOIN public.questions q ON q.id = mq.question_id
  JOIN public.matches m ON m.id = mq.match_id
  WHERE mq.match_id = _match_id
    AND m.status = 'finished'
    AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
  ORDER BY mq.question_order;
$function$;