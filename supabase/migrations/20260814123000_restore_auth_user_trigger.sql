-- public.handle_new_user() följde med i schemadumpen, men triggern som anropar
-- den satt på auth.users — och en dump av public-schemat tar inte med objekt i
-- auth-schemat. Efter flytten till det nya projektet fick alltså inga nya konton
-- någon rad i public.users.
--
-- Konsekvens: appen anropar signInAnonymously() och går direkt vidare till
-- createMatch (se useGuestPlay.ts) utan att själv skapa profilraden, så allt
-- gästspel och all nyregistrering var trasig — utan felmeddelande i loggarna.
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: konton som hann skapas i glappet mellan importen och den här
-- migrationen saknar profilrad. Samma namnlogik som handle_new_user().
INSERT INTO public.users (id, username, email)
SELECT au.id,
       COALESCE(au.raw_user_meta_data->>'username', 'user_' || substr(au.id::text, 1, 8)),
       au.email
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);
