
-- Dedup elo_history: behåll äldsta per (user_id, match_id)
DELETE FROM public.elo_history a
USING public.elo_history b
WHERE a.user_id = b.user_id
  AND a.match_id = b.match_id
  AND a.created_at > b.created_at;

-- Trigger på users: blockera klient-skrivningar till känsliga fält
CREATE OR REPLACE FUNCTION public.users_protect_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
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
  THEN
    RAISE EXCEPTION 'Field is server-managed and cannot be modified directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_protect_sensitive_fields_trg ON public.users;
CREATE TRIGGER users_protect_sensitive_fields_trg
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.users_protect_sensitive_fields();

-- No self-match
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS no_self_match;
ALTER TABLE public.matches
  ADD CONSTRAINT no_self_match
  CHECK (player2_id IS NULL OR player2_id <> player1_id);

-- Idempotency för elo_history
CREATE UNIQUE INDEX IF NOT EXISTS elo_history_user_match_unique
  ON public.elo_history (user_id, match_id);
