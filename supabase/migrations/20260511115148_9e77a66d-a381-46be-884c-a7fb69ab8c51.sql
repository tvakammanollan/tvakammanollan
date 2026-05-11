
-- Friendships table
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_distinct CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_unique UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY friendships_select_involved
  ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY friendships_insert_self
  ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

CREATE POLICY friendships_update_addressee
  ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id AND status IN ('accepted','blocked'));

CREATE POLICY friendships_delete_involved
  ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Match invites
CREATE TABLE public.match_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  match_id uuid NOT NULL,
  match_type text NOT NULL CHECK (match_type IN ('verbal','math')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  CONSTRAINT match_invites_distinct CHECK (from_user <> to_user)
);

CREATE INDEX idx_match_invites_to ON public.match_invites(to_user, status);
CREATE INDEX idx_match_invites_from ON public.match_invites(from_user);

ALTER TABLE public.match_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_invites_select_involved
  ON public.match_invites FOR SELECT TO authenticated
  USING (auth.uid() = from_user OR auth.uid() = to_user);

-- Inserts only via server function (uses service role); no insert policy

CREATE POLICY match_invites_update_to_user
  ON public.match_invites FOR UPDATE TO authenticated
  USING (auth.uid() = to_user)
  WITH CHECK (auth.uid() = to_user);

-- Helper: look up user by username (returns id + username only)
CREATE OR REPLACE FUNCTION public.find_user_by_username(_username text)
RETURNS TABLE(id uuid, username text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.username
  FROM public.users u
  WHERE lower(u.username) = lower(_username)
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.find_user_by_username(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.find_user_by_username(text) TO authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_invites;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER friendships_set_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
