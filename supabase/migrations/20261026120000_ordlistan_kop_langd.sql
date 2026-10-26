-- Hela Ordlistan + MEK säljs som två köp: en månad och sex månader.
--
-- Längden bokförs per köp. NULL betyder sex månader: det var det enda som
-- såldes innan planerna fanns, och raderna från då ska läsas så.
-- Köp före 2026-10-21 gäller för alltid oavsett värdet här (se
-- `TIME_LIMITED_FROM` i `src/lib/ord-paywall.ts`).
ALTER TABLE public.ord_purchases
  ADD COLUMN IF NOT EXISTS access_months smallint
  CHECK (access_months IS NULL OR access_months IN (1, 6));
