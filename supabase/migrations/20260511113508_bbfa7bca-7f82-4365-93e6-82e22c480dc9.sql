-- Identify bad questions, then cascade-delete dependents and the questions themselves
WITH bad AS (
  SELECT id FROM public.questions
  WHERE 
    category = 'DTK'
    OR (question_text ~ '\?.{3,}\?')
    OR (question_text ~ '\?\s+[A-ZÅÄÖa-zåäö]')
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(options) o WHERE o->>'text' LIKE '%?%')
    OR (subject_type='math' AND EXISTS(SELECT 1 FROM jsonb_array_elements(options) o WHERE length(o->>'text') > 60))
    OR (subject_type='math' AND EXISTS(SELECT 1 FROM jsonb_array_elements(options) o WHERE o->>'text' ~ '(Vilket|Vad |Hur )'))
    OR (subject_type='math' AND question_text ~ '\$')
    OR (subject_type='math' AND EXISTS(
      SELECT 1 FROM jsonb_array_elements(options) o 
      WHERE o->>'text' ~ '^[xX]\d+ - \d+ \d+$' 
         OR o->>'text' ~ '^\d+ \d+$'
         OR o->>'text' ~ '\d+ cm \d+$'
    ))
    OR (length(question_text) < 15 AND category != 'ORD')
)
DELETE FROM public.match_answers WHERE question_id IN (SELECT id FROM bad);

WITH bad AS (
  SELECT id FROM public.questions
  WHERE 
    category = 'DTK'
    OR (question_text ~ '\?.{3,}\?')
    OR (question_text ~ '\?\s+[A-ZÅÄÖa-zåäö]')
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(options) o WHERE o->>'text' LIKE '%?%')
    OR (subject_type='math' AND EXISTS(SELECT 1 FROM jsonb_array_elements(options) o WHERE length(o->>'text') > 60))
    OR (subject_type='math' AND EXISTS(SELECT 1 FROM jsonb_array_elements(options) o WHERE o->>'text' ~ '(Vilket|Vad |Hur )'))
    OR (subject_type='math' AND question_text ~ '\$')
    OR (subject_type='math' AND EXISTS(
      SELECT 1 FROM jsonb_array_elements(options) o 
      WHERE o->>'text' ~ '^[xX]\d+ - \d+ \d+$' 
         OR o->>'text' ~ '^\d+ \d+$'
         OR o->>'text' ~ '\d+ cm \d+$'
    ))
    OR (length(question_text) < 15 AND category != 'ORD')
)
DELETE FROM public.match_questions WHERE question_id IN (SELECT id FROM bad);

DELETE FROM public.questions
WHERE 
  category = 'DTK'
  OR (question_text ~ '\?.{3,}\?')
  OR (question_text ~ '\?\s+[A-ZÅÄÖa-zåäö]')
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(options) o WHERE o->>'text' LIKE '%?%')
  OR (subject_type='math' AND EXISTS(SELECT 1 FROM jsonb_array_elements(options) o WHERE length(o->>'text') > 60))
  OR (subject_type='math' AND EXISTS(SELECT 1 FROM jsonb_array_elements(options) o WHERE o->>'text' ~ '(Vilket|Vad |Hur )'))
  OR (subject_type='math' AND question_text ~ '\$')
  OR (subject_type='math' AND EXISTS(
    SELECT 1 FROM jsonb_array_elements(options) o 
    WHERE o->>'text' ~ '^[xX]\d+ - \d+ \d+$' 
       OR o->>'text' ~ '^\d+ \d+$'
       OR o->>'text' ~ '\d+ cm \d+$'
  ))
  OR (length(question_text) < 15 AND category != 'ORD');