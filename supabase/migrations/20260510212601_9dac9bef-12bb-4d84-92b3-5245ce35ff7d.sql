-- Ta bort dubbletter (behåll äldsta rad per unik question_text, case-insensitive)
DELETE FROM public.questions a
USING public.questions b
WHERE a.ctid > b.ctid
  AND lower(a.question_text) = lower(b.question_text);

-- Unik begränsning så framtida seedningar inte skapar dubbletter
CREATE UNIQUE INDEX questions_unique_text_idx
  ON public.questions (lower(question_text));