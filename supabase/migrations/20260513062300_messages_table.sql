-- ============== #13: DIRECT MESSAGES BETWEEN FRIENDS ==============
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_created
  ON public.messages (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_pair
  ON public.messages (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_read_own" ON public.messages;
CREATE POLICY "messages_read_own" ON public.messages FOR SELECT
  USING (auth.uid() IN (sender_id, recipient_id));

DROP POLICY IF EXISTS "messages_send_to_friends" ON public.messages;
CREATE POLICY "messages_send_to_friends" ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
        AND ((requester_id = sender_id AND addressee_id = recipient_id)
          OR (addressee_id = sender_id AND requester_id = recipient_id))
    )
  );

-- Mark-as-read RPC
CREATE OR REPLACE FUNCTION public.mark_messages_read(_other_user uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n integer;
BEGIN
  UPDATE public.messages
  SET read_at = now()
  WHERE recipient_id = auth.uid()
    AND sender_id = _other_user
    AND read_at IS NULL;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_messages_read TO authenticated;

-- Rate-limited send: max 30 messages/min between two users
CREATE OR REPLACE FUNCTION public.send_message(_recipient uuid, _body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _recent integer;
  _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() = _recipient THEN
    RAISE EXCEPTION 'Cannot message yourself';
  END IF;
  -- Throttle
  SELECT count(*) INTO _recent
  FROM public.messages
  WHERE sender_id = auth.uid()
    AND created_at > now() - interval '60 seconds';
  IF _recent >= 30 THEN
    RAISE EXCEPTION 'Du skickar för många meddelanden. Vänta lite.';
  END IF;
  INSERT INTO public.messages (sender_id, recipient_id, body)
  VALUES (auth.uid(), _recipient, _body)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.send_message TO authenticated;
