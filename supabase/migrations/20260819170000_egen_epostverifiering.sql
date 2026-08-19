-- Egen e-postverifiering — så att registrering inte längre är en vägg.
--
-- BAKGRUND
-- Supabase Auth stod med "Confirm email" påslaget (`mailer_autoconfirm=false`).
-- `signUp` gav då ingen session: den som registrerade sig med e-post och
-- lösenord kastades ut till en "kolla din mejl"-skärm och kunde inte göra
-- någonting i appen förrän hen klickat i mejlet. Google-inloggning slapp det,
-- eftersom adressen redan är verifierad där. Det är den enskilt dyraste
-- friktionen i registreringsflödet.
--
-- ÄNDRINGEN, I TVÅ HALVOR
--   1. I Supabase: "Confirm email" stängs AV (Authentication → Providers →
--      Email → "Confirm email", motsvarar `mailer_autoconfirm = true` i
--      auth-konfigurationen). Då returnerar `signUp` en session direkt och
--      användaren är inloggad på en gång.
--   2. Här: sajten får en EGEN verifieringsflagga, `users.email_verified_at`,
--      med ett eget mejl (Resend) och en egen länk (/verifiera-epost).
--
-- Varför en egen flagga? Med autoconfirm sätter GoTrue `email_confirmed_at`
-- redan vid registreringen, alltså innan någon klickat på någonting. Den
-- kolumnen betyder efter ändringen "adressen är angiven", inte "adressen är
-- bevisat din" — och forumets spamgrind byggde på just det beviset. Utan en
-- egen flagga hade grinden tystnat utan att någon rad i koden ändrats.
--
-- Se även `src/lib/email-verification.functions.ts` och BUGFIX-LOG.md punkt 2.

-- ============== FLAGGAN ==============

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

COMMENT ON COLUMN public.users.email_verified_at IS
  'När användaren bevisligen klickat i verifieringsmejlet (eller loggat in med en provider som redan verifierat adressen). Sätts bara av servern. auth.users.email_confirmed_at duger inte längre som bevis: med autoconfirm på sätts den vid registreringen.';

-- Backfill: allt som var bekräftat FÖRE den här ändringen var bekräftat på
-- riktigt, eftersom autoconfirm då var av. Utan backfillen hade alla
-- befintliga konton plötsligt räknats som overifierade och tappat forumet.
UPDATE public.users u
   SET email_verified_at = au.email_confirmed_at
  FROM auth.users au
 WHERE au.id = u.id
   AND u.email_verified_at IS NULL
   AND au.email_confirmed_at IS NOT NULL;

-- ============== TOKENTABELL ==============
-- Egen tabell och inte en kolumn på users: en token är kortlivad, kan finnas i
-- flera exemplar (användaren ber om ett nytt mejl) och ska gå att räkna för
-- att strypa utskick. Som kolumn hade "skicka igen" skrivit över den token
-- som redan ligger i någons inkorg.
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  -- SHA-256 av token, aldrig token själv. Läcker databasen ska ingen kunna
  -- verifiera någon annans adress med innehållet.
  token_hash text NOT NULL UNIQUE,
  -- Adressen mejlet gick till. Byter användaren adress ska en gammal länk
  -- inte kunna verifiera den nya.
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at    timestamptz
);

CREATE INDEX IF NOT EXISTS email_verifications_user_idx
  ON public.email_verifications (user_id, created_at DESC);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
-- Noll policies med flit: tabellen läses och skrivs bara av serverfunktioner
-- med service role. En klient som kunde läsa den kunde verifiera vem som helst.
REVOKE ALL ON public.email_verifications FROM anon, authenticated;

-- ============== SKYDDA FLAGGAN MOT SJÄLVBETJÄNING ==============
-- users har en RLS-tillåten UPDATE för den egna raden. Utan att lägga till
-- kolumnen i skyddstriggern kan vem som helst sätta sin egen
-- email_verified_at och gå förbi hela verifieringen — precis som med
-- forum_banned_until (se 20260816120000_forum.sql).
CREATE OR REPLACE FUNCTION public.users_protect_sensitive_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Oförändrat från 20260816120000_forum.sql, plus email_verified_at sist.
  -- current_user och inte bara auth.role(): forumets statistiktrigger är
  -- SECURITY DEFINER och körs som postgres, där auth.role() inte är
  -- 'service_role'.
  IF current_user IN ('postgres', 'service_role', 'supabase_admin')
     OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.elo_verbal IS DISTINCT FROM OLD.elo_verbal
     OR NEW.elo_math IS DISTINCT FROM OLD.elo_math
     OR NEW.elo_verbal_peak IS DISTINCT FROM OLD.elo_verbal_peak
     OR NEW.elo_math_peak IS DISTINCT FROM OLD.elo_math_peak
     OR NEW.wins IS DISTINCT FROM OLD.wins
     OR NEW.losses IS DISTINCT FROM OLD.losses
     OR NEW.games_played IS DISTINCT FROM OLD.games_played
     OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.bot_matches_today IS DISTINCT FROM OLD.bot_matches_today
     OR NEW.last_bot_match_date IS DISTINCT FROM OLD.last_bot_match_date
     OR NEW.forum_banned_until IS DISTINCT FROM OLD.forum_banned_until
     OR NEW.forum_ban_reason IS DISTINCT FROM OLD.forum_ban_reason
     OR NEW.forum_post_count IS DISTINCT FROM OLD.forum_post_count
     OR NEW.email_verified_at IS DISTINCT FROM OLD.email_verified_at
  THEN
    RAISE EXCEPTION 'Field is server-managed and cannot be modified directly';
  END IF;

  RETURN NEW;
END;
$$;

-- Andra lagret, samma mönster som forumfälten: utan UPDATE-rätt på kolumnen
-- kan ingen klient ens försöka. Kontrolleras före RLS och före triggers.
REVOKE UPDATE (email_verified_at) ON public.users FROM anon, authenticated;

-- ============== FORUMETS GRIND LÄSER DEN EGNA FLAGGAN ==============

CREATE OR REPLACE FUNCTION public.forum_can_post(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.users u ON u.id = au.id
    WHERE au.id = _uid
      AND COALESCE(au.is_anonymous, false) = false        -- inga gästkonton
      AND u.email_verified_at IS NOT NULL                 -- bevisad adress
      AND au.created_at < now() - interval '10 minutes'   -- ingen engångsspam
      AND length(btrim(u.username)) > 0
      AND COALESCE(u.forum_banned_until, '-infinity'::timestamptz) < now()
  );
$$;

CREATE OR REPLACE FUNCTION public.forum_post_block_reason(_uid uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, auth AS $$
DECLARE
  _anon    boolean;
  _conf    timestamptz;
  _created timestamptz;
  _name    text;
  _ban     timestamptz;
BEGIN
  SELECT COALESCE(au.is_anonymous, false), u.email_verified_at, au.created_at,
         btrim(u.username), u.forum_banned_until
  INTO _anon, _conf, _created, _name, _ban
  FROM auth.users au
  JOIN public.users u ON u.id = au.id
  WHERE au.id = _uid;

  IF NOT FOUND THEN RETURN 'konto'; END IF;
  IF _anon THEN RETURN 'gast'; END IF;
  IF _conf IS NULL THEN RETURN 'ej_bekraftad'; END IF;
  IF _created >= now() - interval '10 minutes' THEN RETURN 'for_nytt'; END IF;
  IF _name IS NULL OR _name = '' THEN RETURN 'anvandarnamn'; END IF;
  IF _ban IS NOT NULL AND _ban >= now() THEN RETURN 'avstangd'; END IF;
  RETURN NULL;
END;
$$;

-- ============== NYA KONTON FRÅN EN PROVIDER SOM REDAN VERIFIERAT ==============
-- Google har bevisat adressen åt oss. Ett Google-konto ska därför vara
-- verifierat direkt, precis som förut. Providern läses ur raw_app_meta_data;
-- för e-post/lösenord står det 'email' och flaggan lämnas NULL.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, username, email, email_verified_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    CASE
      WHEN COALESCE(NEW.is_anonymous, false) THEN NULL
      WHEN COALESCE(NEW.raw_app_meta_data->>'provider', 'email') <> 'email' THEN now()
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
