-- Coachning: köp via Stripe Checkout.
--
-- Före det här var `coaching_requests` en ren bokningsförfrågan som alltid kom
-- från en inloggad användare med ifyllt formulär. Nu skapas raden av servern i
-- samma stund som kassan öppnas — då finns varken namn, mejl eller önskad tid,
-- och köparen kan vara utloggad (landningssidan säljer till besökare som inte
-- har konto). Därför släpps NOT NULL på de fyra fälten; de fylls i av webhooken
-- när Stripe berättar vad köparen skrev.
ALTER TABLE public.coaching_requests
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN preferred_time DROP NOT NULL;

ALTER TABLE public.coaching_requests
  ADD COLUMN IF NOT EXISTS stripe_session_id     text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent text,
  -- Belopp i minsta enhet (ören), precis som Stripe rapporterar det.
  ADD COLUMN IF NOT EXISTS amount_total          integer,
  ADD COLUMN IF NOT EXISTS currency              text,
  ADD COLUMN IF NOT EXISTS paid_at               timestamptz,
  -- Var köpet startade: 'dashboard' | 'landing'. Räcker för att se vilken yta
  -- som säljer, utan att bygga en egen tabell för det.
  ADD COLUMN IF NOT EXISTS source                text;

-- Idempotens. Webhooken och tacksidan bekräftar samma köp oberoende av
-- varandra, och Stripe skickar om händelser vid fel — utan den här får ett
-- köp två rader.
CREATE UNIQUE INDEX IF NOT EXISTS coaching_requests_stripe_session_key
  ON public.coaching_requests (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- Adminvyn tittar nästan alltid på "betalda, senaste först".
CREATE INDEX IF NOT EXISTS coaching_requests_paid_at_idx
  ON public.coaching_requests (paid_at DESC)
  WHERE paid_at IS NOT NULL;

-- RLS är oförändrad: allt skrivande sker med service role (som kringgår RLS),
-- och `coaching_select_own` (auth.uid() = user_id OR is_admin) gör att en rad
-- utan user_id bara syns för admin. Insert-policyn för klienten står kvar men
-- används inte längre — den kräver fortfarande auth.uid() = user_id, så en
-- utloggad kan inte skapa rader på egen hand.
COMMENT ON COLUMN public.coaching_requests.paid_at IS
  'Sätts av Stripe-webhooken (och som reserv av tacksidan). NULL = kassan öppnades men betalning slutfördes aldrig.';
