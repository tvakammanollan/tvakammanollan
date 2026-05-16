-- ============================================================
-- Add image support to questions table
-- ============================================================
-- För DTK + en del XYZ/KVA-frågor behövs en figur för att kunna lösa uppgiften.
-- image_url pekar mot Supabase Storage eller extern CDN.

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_caption text;

-- Index för att snabbt hitta frågor som SAKNAR bild men borde ha en
CREATE INDEX IF NOT EXISTS idx_questions_no_image
  ON public.questions(category)
  WHERE image_url IS NULL;

-- Funktion: bedöm om en fråga troligen behöver en bild
-- (används för att flagga frågor som måste få bild uppladdad)
CREATE OR REPLACE FUNCTION public.question_likely_needs_image(
  category text,
  question_text text
) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT
    category = 'DTK'  -- DTK kräver alltid figur
    OR (
      category IN ('XYZ', 'KVA', 'NOG')
      AND question_text ~* '\b(triangel|cirkel|figur|räta linjen|kvadrat|fyrhörning|graf|diagram|tabell|axel|koordinatsystem|cylinder|rektangel|kub|prisma|kon|sfär|rätvinklig|vinkel|hörn|sida|omkrets|area|volym)\b'
    );
$$;

-- Vy: alla frågor som troligen behöver bild
CREATE OR REPLACE VIEW public.questions_needing_images AS
SELECT
  id,
  category,
  question_text,
  source,
  created_at
FROM public.questions
WHERE image_url IS NULL
  AND public.question_likely_needs_image(category, question_text);

GRANT SELECT ON public.questions_needing_images TO authenticated;
