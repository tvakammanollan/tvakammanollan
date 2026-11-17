-- Kontoraderingen gick aldrig igenom.
--
-- `deleteAccount` (src/lib/account.functions.ts) anonymiserar users-raden
-- med `email = null`, men triggern nedan har sedan 2026-05-10 stoppat ALLA
-- ändringar av users.email, även från servern (service role). Uppdateringen
-- avvisades med "email is immutable via this table", användaren fick
-- "Kunde inte radera kontot" och steg 1 hade då redan hunnit radera en del
-- av datan. Hittat 2026-11-17 vid mobiltest av hela flödet.
--
-- Spärren finns för att en inloggad användare inte ska kunna byta sin
-- e-post i tabellen via sin RLS-tillåtna UPDATE. Den gäller därför bara
-- anrop som inte görs av service role; servern får tömma fältet.

CREATE OR REPLACE FUNCTION public.users_prevent_immutable_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'id is immutable';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email
     AND coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'email is immutable via this table';
  END IF;
  RETURN NEW;
END;
$$;
