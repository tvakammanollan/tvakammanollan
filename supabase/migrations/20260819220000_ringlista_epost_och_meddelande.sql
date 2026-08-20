-- Ringlistan får e-post och meddelande.
--
-- Formuläret tog namn och telefonnummer. Det räckte för att ringa, men inte
-- för mycket annat: går personen inte att nå på telefon finns ingen andra väg,
-- och den som har något specifikt att berätta ("jag skriver om tre veckor och
-- fastnar på NOG") har ingenstans att skriva det. Båda fälten är frivilliga —
-- telefonnumret är fortfarande det enda som krävs, eftersom det är ett
-- telefonsamtal som är produkten.
ALTER TABLE public.coaching_leads
  ADD COLUMN IF NOT EXISTS email   text,
  ADD COLUMN IF NOT EXISTS message text;

COMMENT ON COLUMN public.coaching_leads.email IS
  'Frivillig e-postadress. Personuppgift, precis som numret — samma samtycke (consent_at) och samma radering med kontot. Se /integritetspolicy.';
COMMENT ON COLUMN public.coaching_leads.message IS
  'Frivillig fritext från formuläret: vad personen vill prata om.';

-- Söker man i ringlistan söker man på namn, nummer eller adress. Ett
-- trigram-index gör LIKE-sökningen på tre kolumner billig även när listan
-- växer; utan det blir varje tangenttryck en full tabellskanning.
-- Indexet är en optimering, inte ett krav: sökningen fungerar utan det, bara
-- långsammare. Saknas rättighet att skapa tillägget ska det INTE fälla resten
-- av migrationen — därför i ett block som sväljer felet och säger till.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX IF NOT EXISTS coaching_leads_sok_idx
    ON public.coaching_leads
    USING gin ((coalesce(name, '') || ' ' || phone || ' ' || coalesce(email, '')) gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Hoppade över trigram-indexet för ringlistan: %. Sökningen fungerar ändå.', SQLERRM;
END $$;
