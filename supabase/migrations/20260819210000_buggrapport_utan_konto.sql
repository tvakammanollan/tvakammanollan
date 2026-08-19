-- Buggrapporter: går att skicka utan konto, och går att svara på.
--
-- FÖRE
-- `bug_reports.user_id` var NOT NULL, och knappen svarade "Du måste vara
-- inloggad för att rapportera buggar." Den som stötte på ett fel i det
-- utloggade flödet — startsidan, registreringen, gamla prov, som alla går att
-- använda utan konto — hade alltså ingen väg att berätta det. Rapporten gick
-- dessutom bara till en tabell ingen tittade i: inget mejl, ingen vy, ingen
-- notis. Tio rader låg där olästa.
--
-- EFTER
-- user_id får vara NULL, och en frivillig `reply_email` gör att vi kan svara
-- den som inte har konto. Serverfunktionen `submitBugReport` skriver raden med
-- service role och mejlar den vidare (se src/lib/bug-report.functions.ts).
ALTER TABLE public.bug_reports
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.bug_reports
  ADD COLUMN IF NOT EXISTS reply_email text;

COMMENT ON COLUMN public.bug_reports.reply_email IS
  'Frivillig svarsadress. Ifylld av utloggade rapportörer; för inloggade används kontots adress. Personuppgift — se /integritetspolicy.';

-- Kolumnen har inget index och ska inte ha det: den läses aldrig som filter,
-- bara som fält på en rad någon redan hittat.
