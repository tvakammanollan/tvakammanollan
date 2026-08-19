-- Coachning: obetalda tider städas nu bort automatiskt.
--
-- Bakgrund. Ordningen i köpet är tid först, betalning sedan — ett medvetet val
-- (den som redan har en tid i kalendern slutför köpet oftare), med en känd
-- baksida: man kan boka och sedan strunta i kassan. 2026-08-18 gjorde någon
-- precis det. Ordningen står kvar, men baksidan städas inte längre för hand:
-- `src/lib/coaching-sweep.server.ts` avbokar tiden i Calendly när betalfönstret
-- stängt, och märker raden här.
--
-- `status` får värdet 'canceled' och `canceled_at` tidpunkten. Skälet till att
-- båda finns: statusen är det städaren läser för att inte försöka igen, medan
-- tidpunkten är det *du* behöver när någon hör av sig och undrar vart deras tid
-- tog vägen.
ALTER TABLE public.coaching_requests
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

COMMENT ON COLUMN public.coaching_requests.canceled_at IS
  'Satt av städaren när tiden avbokats i Calendly för att köpet aldrig slutfördes.';

-- Den första avbokningen (2026-08-19, tiden som togs utan betalning) gjordes
-- för hand innan kolumnen fanns och hann bara få sin status. Utan den här
-- raden blir den kvar i vyn nedan för evigt, som en tid som behöver åtgärdas
-- fast den redan är åtgärdad.
UPDATE public.coaching_requests
   SET canceled_at = COALESCE(canceled_at, now())
 WHERE status = 'canceled'
   AND canceled_at IS NULL;

-- Vyn ska visa det som fortfarande KRÄVER en handpåläggning. En rad städaren
-- redan rivit gör inte det — står den kvar blir vyn en lista över gammalt
-- skräp, och då slutar man titta i den.
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
     AND canceled_at IS NULL
   ORDER BY scheduled_at;

ALTER VIEW public.coaching_obetalda_bokningar SET (security_invoker = true);
