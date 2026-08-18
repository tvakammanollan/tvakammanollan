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
-- OBS FÄLLAN: `revoke select (correct_answer) on public.questions` gör
-- INGENTING här. Rättigheten är beviljad på hela tabellen, och en tabellbred
-- GRANT går inte att peta hål i per kolumn — kommandot lyckas utan att ändra
-- något, och information_schema.column_privileges visar SELECT kvar efteråt.
-- Rätt väg är att dra in tabellrättigheten och bevilja om den kolumn för
-- kolumn, med correct_answer utelämnad. Det är därför listan nedan finns och
-- måste hållas i synk när nya kolumner läggs till på questions.
--
-- Efteråt kommer bara service_role åt kolumnen, alltså serverfunktionerna,
-- plus admin_question_answer() från steg 1.

begin;

revoke select on public.questions from anon, authenticated;

grant select (
  id, category, subject_type, question_text, passage_text, passage_id, options,
  difficulty, source, created_at, cleaned_question_text, cleaned_options,
  clean_status, cleaned_at, explanation, tags, image_url, image_caption,
  exam_term, provpass_num, q_num, definition, definition_source
) on public.questions to anon, authenticated;

commit;

-- Följd som är lätt att missa: `select=*` mot questions nekas nu för klienter,
-- eftersom jokertecknet inkluderar den skyddade kolumnen. All klientkod måste
-- lista kolumner explicit. Ingen gör något annat idag — men en ny `select("*")`
-- kommer att svara 42501 i stället för att bara läcka.
--
-- OBS: questions.explanation är tom i hela beståndet idag. Börjar den fyllas
-- med text som avslöjar svaret måste den kolumnen utelämnas ur listan ovan.
