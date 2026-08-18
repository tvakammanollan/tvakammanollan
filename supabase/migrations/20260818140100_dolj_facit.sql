-- STEG 2 av 2. Körs EFTER att koden är utrullad — aldrig före.
--
-- Bakgrund: anonym inloggning är påslagen, så vem som helst kan skaffa en
-- giltig token med ett HTTP-anrop. Med den gick questions.correct_answer att
-- läsa för godtyckliga fråge-id — inklusive de tio som just då låg i någon
-- annans pågående match. Matchsidan utelämnade kolumnen ur sin select, men det
-- skyddar bara mot att svaret syns i nätverksfliken; det hindrar ingen från att
-- ställa sin egen fråga till PostgREST. Rättningen sker redan på servern i
-- submitMatch, men det hjälper inte när spelaren kan skicka rätt svar varje
-- gång — ELO gick alltså att odla osynligt.
--
-- Rättigheten fanns för att /train läste kolumnen med webbläsarklienten. Den
-- hämtningen går nu via fetchTrainingBatch, där anroparen inte får peka ut
-- vilka frågor den vill ha. Kör inte det här före den utrullningen: då slutar
-- träningsläget fungera.
--
-- Efteråt kommer bara service_role åt kolumnen, alltså serverfunktionerna,
-- plus admin_question_answer() från steg 1.

revoke select (correct_answer) on public.questions from anon, authenticated;

-- OBS: questions.explanation är tom i hela beståndet idag. Börjar den fyllas
-- med text som avslöjar svaret måste den kolumnen dras in på samma sätt.
