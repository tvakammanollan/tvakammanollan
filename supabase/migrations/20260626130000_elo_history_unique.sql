-- Idempotens-skydd: max en elo_history-rad per (match, användare).
-- Hindrar dubblerad ELO-historik om processMatchResultServer körs två gånger
-- (t.ex. båda spelarna lämnar in nära samtidigt). Server-koden använder
-- upsert(onConflict: match_id,user_id, ignoreDuplicates) tillsammans med detta index.
CREATE UNIQUE INDEX IF NOT EXISTS elo_history_match_user_uniq
  ON public.elo_history (match_id, user_id);
