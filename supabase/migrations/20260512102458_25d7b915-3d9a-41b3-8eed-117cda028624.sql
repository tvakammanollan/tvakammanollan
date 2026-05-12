CREATE TABLE public.coaching_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  preferred_time text NOT NULL,
  goal text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coaching_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaching_insert_self" ON public.coaching_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coaching_select_own" ON public.coaching_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "coaching_admin_update" ON public.coaching_requests
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));