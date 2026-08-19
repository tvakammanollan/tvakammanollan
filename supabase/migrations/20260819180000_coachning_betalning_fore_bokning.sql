-- Coachning: betalningen först, tiden sedan.
--
-- FÖRE
-- Modalen visade Calendlys tidsväljare INNAN kassan öppnades. En bokning är ett
-- åtagande i samma sekund den görs, medan Checkout går att överge — så en tid
-- kunde bli stående utan betalning. Det hände på riktigt 2026-08-18. Städaren
-- (`coaching-sweep`) byggdes för att riva sådana bokningar i efterhand, men den
-- lagar en följd och inte orsaken: den publika Calendly-länken låg dessutom i
-- iframens `src` och gick att spara undan och boka på utan att passera kassan.
--
-- EFTER
-- Kassan är första steget. Tidsväljaren visas först på `/coachning/tack`, och
-- bara för en session som Stripe bekräftat som betald. Länken dit är
-- engångsgenererad per betalt köp. Städaren står kvar som andra lager — den som
-- redan känner den publika sluggen kommer fortfarande förbi länkskyddet.
--
-- Kolumnen nedan finns för bekräftelsemejlet: det ska gå EN gång per köp, och
-- både webhooken och tacksidan kan bokföra samma köp (webhooken är sanningen,
-- tacksidan reserv när webhooken är sen). Utan en tidsstämpel att sätta i samma
-- villkorade UPDATE hade båda vägarna kunnat skicka var sitt mejl.
ALTER TABLE public.coaching_requests
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;

COMMENT ON COLUMN public.coaching_requests.confirmation_email_sent_at IS
  'När bekräftelsemejlet skickades. Sätts i en UPDATE med "IS NULL"-villkor, vilket är det som gör att webhooken och tacksidan inte kan skicka var sitt mejl för samma köp.';

-- Vyn över obetalda bokningar står kvar oförändrad. Den ska inte kunna få nya
-- rader genom sajtens eget flöde längre, men den som bokar via en känd publik
-- Calendly-slug hamnar fortfarande där — och då vill vi se det.
COMMENT ON VIEW public.coaching_obetalda_bokningar IS
  'Bokade tider utan betalning. Efter 2026-08-19 kan sajtens eget flöde inte skapa dessa (kassan går före tidsvalet) — en rad här betyder att någon bokat direkt via Calendly, eller att en betalning återkallats. Städaren avbokar dem automatiskt; kolumnen calendly_cancel_url finns för att göra det för hand.';
