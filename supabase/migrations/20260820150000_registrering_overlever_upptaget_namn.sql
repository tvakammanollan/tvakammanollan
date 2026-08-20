-- Ett upptaget användarnamn ska kosta namnet, inte kontot.
--
-- 2026-08-20 dog gästläget för 75 % av besökarna. Gästnamnet skickades med i
-- metadatan vid signInAnonymously, `users.username` är UNIQUE, och namnlistan
-- är tjugo ord lång. Triggern fick unique_violation — och eftersom den kör i
-- samma transaktion som INSERT i `auth.users` rullades hela registreringen
-- tillbaka. Auth svarar då `500 "Database error creating anonymous user"`, och
-- klienten har inget vettigt att visa: användaren såg "Kunde inte starta
-- gästläge" utan att något gick att felsöka från appen.
--
-- Anropssidan är rättad — inget namn skickas längre, se `guest-name.ts`. Men
-- vägen står öppen: `/signup` låter användaren välja namn själv, och två
-- personer som väljer samma namn i samma sekund kommer förbi den kontrollen
-- och får var sin 500 i stället för ett formulärfel.
--
-- Faller det önskade namnet bort får kontot triggerns egen fallback, och i
-- sista hand hela UUID:t — unikt per konstruktion. `isAutoUsername` och
-- `isAutoGuestName` känner igen båda formaten (regexen är `user_` + sex
-- respektive åtta hextecken *eller fler*), så ett konto som hamnar här
-- renderas som gäst och hålls utanför topplistan tills ett namn väljs.
--
-- Notera att ordningen är medveten: det önskade namnet först, alltid. Den som
-- valt ett ledigt namn ska få det.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  hex        text := replace(NEW.id::text, '-', '');
  onskat     text := NULLIF(btrim(NEW.raw_user_meta_data->>'username'), '');
  reserv     text := 'user_' || substr(hex, 1, 8);
  sista      text := 'user_' || hex;
  verifierad timestamptz := CASE
    WHEN COALESCE(NEW.is_anonymous, false) THEN NULL
    WHEN COALESCE(NEW.raw_app_meta_data->>'provider', 'email') <> 'email' THEN now()
    ELSE NULL
  END;
  namn       text;
BEGIN
  -- Backfillen i 20260814123000 kan ha hunnit före; då är vi klara.
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  FOREACH namn IN ARRAY ARRAY[COALESCE(onskat, reserv), reserv, sista] LOOP
    BEGIN
      INSERT INTO public.users (id, username, email, email_verified_at)
      VALUES (NEW.id, namn, NEW.email, verifierad);
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      NULL;  -- namnet var taget, prova nästa
    END;
  END LOOP;

  -- Går inte att nå: `sista` bär hela UUID:t. Men om det ändå sker ska det
  -- synas i loggen i stället för att kontot tyst blir utan profilrad — det
  -- felet tog en gång all gästspelning ner utan ett spår någonstans.
  RAISE EXCEPTION 'handle_new_user: kunde inte skapa profilrad för %', NEW.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
