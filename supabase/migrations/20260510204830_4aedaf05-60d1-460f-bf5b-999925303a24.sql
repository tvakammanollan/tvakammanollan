
-- Fix mutable search_path
ALTER FUNCTION public.users_prevent_immutable_changes() SET search_path = public;

-- match_visible_to_user: switch to SECURITY INVOKER (relies on caller's RLS on matches)
CREATE OR REPLACE FUNCTION public.match_visible_to_user(_match_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = _match_id
      AND (player1_id = _user_id OR player2_id = _user_id)
  );
$$;

-- handle_new_user: trigger only, revoke execute from API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
