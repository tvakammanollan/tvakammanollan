-- Vyer körs som sin ägare (postgres) om inget annat anges, och postgres äger
-- de underliggande tabellerna — därför gick RLS förbi helt via vyerna.
-- Konkret: vem som helst med den publika anon-nyckeln kunde läsa
--   select * from health_check   -> users_count = 530
-- trots att public.users bara släpper igenom den egna raden för inloggade.
-- questions_needing_images var samma sak: den exponerar question_text från
-- questions, vars policy kräver authenticated. Den råkar vara tom idag, så
-- läckan var latent snarare än aktiv.
--
-- security_invoker gör att vyn körs som den som frågar, så tabellernas RLS
-- gäller igen. Ofarligt för befintlig användning:
--   - /api/health hämtar bara ?select=status (en literal, inte tabelldata)
--   - questions_needing_images används inte av appen; adminflöden går via
--     service role, som ändå kringgår RLS.
ALTER VIEW public.health_check SET (security_invoker = true);
ALTER VIEW public.questions_needing_images SET (security_invoker = true);
