-- matches_archive had no RLS policy after the project migration import (all
-- other tables carried theirs over from the dump; this one was missed).
-- Rows are only ever written by archive_old_bot_matches(), which is
-- SECURITY DEFINER and bypasses RLS, so only a participant SELECT policy
-- is needed here — mirrors matches_select_participant on public.matches.
ALTER TABLE public.matches_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY matches_archive_select_participant ON public.matches_archive
  FOR SELECT TO authenticated
  USING ((player1_id = auth.uid()) OR (player2_id = auth.uid()));
