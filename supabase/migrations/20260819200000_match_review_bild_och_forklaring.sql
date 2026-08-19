-- Matchgenomgången saknade bilden och förklaringen.
--
-- `get_match_review` skrevs 2026-05-10, innan `questions.image_url`,
-- `questions.explanation` och de rensade mattekolumnerna fanns. Funktionen
-- returnerade alltså aldrig dem — men resultatsidan läste `q.explanation` ur
-- svaret och renderade ett förklaringsblock på det. Fältet var `undefined`
-- varje gång, så blocket ritades aldrig ut, och ingenting felade.
--
-- Värre för matteuppgifterna: de flesta XYZ- och KVA-uppgifter ligger som
-- utsnitt ur provhäftet, där hela uppgiften OCH svarsalternativen står i
-- bilden. Utan `image_url` i svaret visade genomgången bara
-- PDF-extraktionen av samma uppgift ("3 27 x 2 =" där häftet visar en
-- kubikrot) och fyra alternativ som bara var bokstäverna A–D. Det gick alltså
-- inte att förstå vad frågan varit, än mindre varför svaret var fel.
--
-- Returtypen ändras, och då duger inte CREATE OR REPLACE — funktionen måste
-- släppas först.
DROP FUNCTION IF EXISTS public.get_match_review(uuid);

CREATE FUNCTION public.get_match_review(_match_id uuid)
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
  correct_answer text,
  image_url text,
  explanation text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- De rensade mattefälten går före råtexten, precis som i matchvyn: utan det
  -- visar genomgången en annan version av uppgiften än den man just svarade på.
  SELECT q.id, mq.question_order, q.category, q.subject_type,
         CASE
           WHEN q.clean_status = 'ok' AND q.cleaned_question_text IS NOT NULL
             THEN q.cleaned_question_text
           ELSE q.question_text
         END,
         q.passage_text, q.passage_id,
         CASE
           WHEN q.clean_status = 'ok' AND q.cleaned_options IS NOT NULL
             THEN q.cleaned_options
           ELSE q.options
         END,
         q.difficulty, q.correct_answer, q.image_url, q.explanation
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
