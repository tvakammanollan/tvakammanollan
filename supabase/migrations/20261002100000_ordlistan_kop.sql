-- Hela ordlistan: engångsköp (50 kr) som låser upp ORD-övningen efter de
-- första 40 orden.
--
-- En rad per användare. `user_id` är primärnyckel (ett köp låser upp kontot en
-- gång för alla gånger) och `stripe_session_id` är unikt, vilket är det som gör
-- dubbelbokföring omöjlig när både webhooken och återvändandet till /ord
-- bokför samma betalning.
--
-- Ingen RLS-policy med flit: allt går genom serverfunktioner med service role.
-- Att klienten kan läsa sin egen rad är ingen vinst, och en skrivbar policy
-- hade gjort att vem som helst kunde ge sig själv åtkomst.
CREATE TABLE IF NOT EXISTS public.ord_purchases (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  stripe_session_id text NOT NULL UNIQUE,
  stripe_payment_intent text,
  amount_total integer,
  currency text,
  paid_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ord_purchases ENABLE ROW LEVEL SECURITY;
