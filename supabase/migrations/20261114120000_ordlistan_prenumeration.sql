-- Månadsköpet av Hela Ordlistan + MEK är en prenumeration i Stripe sedan
-- 2026-11: 149 kr per månad som förnyas tills den sägs upp. Sexmånaders-
-- köpet är fortfarande ett engångsköp.
--
-- Raden per användare står kvar (user_id är primärnyckel). En rad med
-- stripe_subscription_id satt är en prenumeration, och för den gäller
-- current_period_end, inte paid_at plus access_months. Webhooken håller
-- fälten i synk (invoice.paid, invoice.payment_failed,
-- customer.subscription.updated/deleted), se `syncOrdSubscription` i
-- `src/lib/ord-paywall.server.ts`.
ALTER TABLE public.ord_purchases
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

-- En prenumeration hör till exakt ett köp.
CREATE UNIQUE INDEX IF NOT EXISTS ord_purchases_stripe_subscription_id_key
  ON public.ord_purchases (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Rättelse: enmånadsköpet den 2026-11-12 bokfördes innan kolumnen
-- access_months fanns, och lästes därför som sex månader. Sessionen i
-- Stripe säger access_months=1.
UPDATE public.ord_purchases
  SET access_months = 1
  WHERE stripe_session_id LIKE 'cs_live_b0mA8y4IVj6K%'
    AND access_months IS NULL;
