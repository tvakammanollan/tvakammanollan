CREATE OR REPLACE FUNCTION public.get_users_basic(_ids uuid[])
RETURNS TABLE(id uuid, username text, elo_verbal integer, elo_math integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.id, u.username, u.elo_verbal, u.elo_math
  FROM public.users u
  WHERE u.id = ANY(_ids)
$$;

GRANT EXECUTE ON FUNCTION public.get_users_basic(uuid[]) TO authenticated;