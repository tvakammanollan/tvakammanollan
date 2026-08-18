-- Coachning: tidsbokning via Calendly före betalningen.
--
-- Flödet blir: raden skapas när modalen öppnar bokningssteget (status
-- 'booking'), köparen väljer en tid i Calendly-iframen, servern läser tiden ur
-- Calendlys API och skriver den här — och först då öppnas Stripe-kassan
-- (status 'checkout'). Webhooken sätter 'paid' som förut.
--
-- Följden av ordningen: en bokad tid kan finnas utan betalning, om köparen
-- hoppar av i kassan. De raderna är avsiktligt kvar med status 'booking'/
-- 'checkout' och paid_at NULL — vyn längst ner listar dem så att de går att
-- avboka för hand via cancel_url.
ALTER TABLE public.coaching_requests
  ADD COLUMN IF NOT EXISTS calendly_event_uri      text,
  ADD COLUMN IF NOT EXISTS calendly_invitee_uri    text,
  ADD COLUMN IF NOT EXISTS calendly_cancel_url     text,
  ADD COLUMN IF NOT EXISTS calendly_reschedule_url text,
  -- Den bokade starttiden i UTC. `preferred_time` är kvar som fritext för de
  -- köp som gjordes innan bokningen fanns; den här är den riktiga tiden.
  ADD COLUMN IF NOT EXISTS scheduled_at            timestamptz;

-- En bokning hör till exakt ett köp. Utan det här kan samma invitee-URI
-- skickas in mot två rader och två köp se ut att ha samma tid.
CREATE UNIQUE INDEX IF NOT EXISTS coaching_requests_calendly_invitee_key
  ON public.coaching_requests (calendly_invitee_uri)
  WHERE calendly_invitee_uri IS NOT NULL;

-- Coachen tittar på "kommande tider, närmast först".
CREATE INDEX IF NOT EXISTS coaching_requests_scheduled_at_idx
  ON public.coaching_requests (scheduled_at)
  WHERE scheduled_at IS NOT NULL;

COMMENT ON COLUMN public.coaching_requests.scheduled_at IS
  'Starttid från Calendly (UTC). Satt innan betalningen — se coaching_obetalda_bokningar.';

-- Obetalda bokningar: en tid är tagen i kalendern men köpet gick aldrig igenom.
-- Avbokas för hand via cancel_url. security_invoker krävs — en vy kör annars
-- som ägaren (postgres) och kringgår RLS, vilket skulle göra den läsbar för
-- vem som helst med den publika anon-nyckeln.
CREATE OR REPLACE VIEW public.coaching_obetalda_bokningar AS
  SELECT id,
         created_at,
         scheduled_at,
         name,
         email,
         source,
         status,
         calendly_cancel_url
    FROM public.coaching_requests
   WHERE paid_at IS NULL
     AND scheduled_at IS NOT NULL
   ORDER BY scheduled_at;

ALTER VIEW public.coaching_obetalda_bokningar SET (security_invoker = true);
