
ALTER TABLE public.matchmaking_queue
  ADD COLUMN IF NOT EXISTS match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
ALTER TABLE public.matchmaking_queue REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.pair_ranked_match(
  p_creator uuid,
  p_opponent uuid,
  p_match_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE public.matchmaking_queue
     SET status = 'matched', match_id = p_match_id
   WHERE player_id IN (p_creator, p_opponent)
     AND status = 'waiting';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated < 2 THEN
    -- Roll back: someone else already matched one of them
    UPDATE public.matchmaking_queue
       SET match_id = NULL,
           status = CASE WHEN player_id = p_creator AND status = 'matched' AND match_id = p_match_id THEN 'waiting' ELSE status END
     WHERE player_id IN (p_creator, p_opponent)
       AND match_id = p_match_id;
    RETURN false;
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.pair_ranked_match(uuid, uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.pair_ranked_match(uuid, uuid, uuid) TO service_role;
