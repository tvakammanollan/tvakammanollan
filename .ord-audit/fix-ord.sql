-- ORD-audit FIX-SQL
-- Manuell granskning 2026-05-14 av Claude
-- 132 high-confidence fixar (säkra)
-- 1 medium-confidence fixar (genomtänkta men dubbelchecka)
-- 1 low-confidence fixar (tveksamma — uteslut helst)

-- Säkerhetslogik: WHERE-villkoret på current correct_answer = fix.from gör
-- att en redan ändrad rad EJ skrivs över (idempotent).

BEGIN;

-- ============ HIGH-CONFIDENCE (säkra) ============
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('OFFERT') AND correct_answer = 'B';  -- kostnadsförslag
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('PROPORTIONERLIG') AND correct_answer = 'A';  -- väl avpassad
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('HEKTAR') AND correct_answer = 'D';  -- ytmått, 10000 m²
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SEDERMERA') AND correct_answer = 'C';  -- så småningom
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ATTRIBUT') AND correct_answer = 'B';  -- kännetecken
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SNARSTUCKEN') AND correct_answer = 'A';  -- lättstött
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('MASKOPI') AND correct_answer = 'B';  -- hemligt samförstånd
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ETERISK') AND correct_answer = 'C';  -- flyktig, lätt
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('HEREDITÄR') AND correct_answer = 'D';  -- ärftlig
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('HUSKUR') AND correct_answer = 'C';  -- folklig behandlingsmetod
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('TRÅNGSYNT') AND correct_answer = 'B';  -- fördomsfull
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('MÖDA') AND correct_answer = 'B';  -- ansträngning
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('RAFFINEMANG') AND correct_answer = 'C';  -- förfining
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('HYSA AGG') AND correct_answer = 'D';  -- vara fientligt inställd
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KONTINUUM') AND correct_answer = 'C';  -- obruten följd
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('VIMMELKANTIG') AND correct_answer = 'B';  -- yr
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KRILL') AND correct_answer = 'B';  -- kräftdjur
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('RESTRIKTIV') AND correct_answer = 'D';  -- återhållsam
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SÄRDRAG') AND correct_answer = 'D';  -- utmärkande egenskap
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('EMPATI') AND correct_answer = 'C';  -- inlevelseförmåga
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('BORDLÄGGA') AND correct_answer = 'A';  -- uppskjuta
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('TAKTFULL') AND correct_answer = 'D';  -- finkänslig
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('BESTÅENDE') AND correct_answer = 'A';  -- permanent
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('HANDRÄCKNING') AND correct_answer = 'B';  -- hjälp
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('MOTHUGG') AND correct_answer = 'A';  -- häftig kritik
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('PORÖS') AND correct_answer = 'A';  -- genomsläpplig
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SOLIDITET') AND correct_answer = 'C';  -- finansiell stabilitet
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('FÖRLORA MÅLFÖRET') AND correct_answer = 'C';  -- bli stum
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('OBEFOGAD') AND correct_answer = 'B';  -- grundlös
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('EMBALLAGE') AND correct_answer = 'A';  -- förpackning
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('TIDVIS') AND correct_answer = 'C';  -- ibland
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('FRAMFUSIG') AND correct_answer = 'D';  -- påträngande
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('EXTRAVAGANS') AND correct_answer = 'B';  -- överdåd
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('GE SIG TILL TÅLS') AND correct_answer = 'A';  -- lugnt invänta
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('BARYTON') AND correct_answer = 'B';  -- röstläge
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('MAXIM') AND correct_answer = 'B';  -- levnadsregel
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('IHÄRDIG') AND correct_answer = 'D';  -- envis och uthållig
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('HEREDITET') AND correct_answer = 'D';  -- ärftlighet
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('BEGRUNDA') AND correct_answer = 'B';  -- fundera på
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KLÄDSAM') AND correct_answer = 'A';  -- passande
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('MED NÖD OCH NÄPPE') AND correct_answer = 'D';  -- nästan inte
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('UTFALL') AND correct_answer = 'B';  -- resultat
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('CEMENTERA') AND correct_answer = 'A';  -- göra beständig
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('TROLLBUNDEN') AND correct_answer = 'C';  -- fascinerad
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('VAG') AND correct_answer = 'C';  -- obestämd
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('MORALISERA') AND correct_answer = 'C';  -- predika rätt och fel
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('PÅ MÅFÅ') AND correct_answer = 'A';  -- slumpmässigt
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('MAUSOLEUM') AND correct_answer = 'C';  -- gravbyggnad
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('INSKRÄNKT') AND correct_answer = 'D';  -- begränsad
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SKENRÄTTEGÅNG') AND correct_answer = 'B';  -- avgjord på förhand
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('VARA UNDER UPPSEGLING') AND correct_answer = 'C';  -- närma sig
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SIGNUM') AND correct_answer = 'B';  -- särmärke
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('AVART') AND correct_answer = 'A';  -- sämre variant
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ENAHANDA') AND correct_answer = 'B';  -- enformig
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('FEBRIL') AND correct_answer = 'B';  -- hektisk
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('METABOLISM') AND correct_answer = 'A';  -- ämnesomsättning
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('PURITAN') AND correct_answer = 'A';  -- renlevnadsmänniska
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('FÖRSUMMA') AND correct_answer = 'C';  -- strunta i
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('DUBIER') AND correct_answer = 'A';  -- tvivel
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('BLOTT') AND correct_answer = 'B';  -- endast
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KOKETTERA') AND correct_answer = 'D';  -- göra sig intressant
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KURAGE') AND correct_answer = 'C';  -- tapperhet
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ABRUPT') AND correct_answer = 'A';  -- plötsligt
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('TORGFÖRA') AND correct_answer = 'C';  -- öppet uttrycka
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('PREFERENSER') AND correct_answer = 'D';  -- något man föredrar
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('NISCHAD') AND correct_answer = 'B';  -- specialiserad
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('DOMÄN') AND correct_answer = 'D';  -- område
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SVULSTIG') AND correct_answer = 'B';  -- alltför utsmyckad
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('CELIAKI') AND correct_answer = 'C';  -- glutenintolerans
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SÅTA VÄNNER') AND correct_answer = 'B';  -- nära vänner
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SYMTOMATISK') AND correct_answer = 'B';  -- kännetecknande
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('DRÄNAGE') AND correct_answer = 'B';  -- bortledning av vätska
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ÖGONBLICKLIGEN') AND correct_answer = 'C';  -- utan dröjsmål
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ESKAPISM') AND correct_answer = 'B';  -- verklighetsflykt
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ANVISA') AND correct_answer = 'C';  -- tilldela
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('JÄMKNING') AND correct_answer = 'C';  -- anpassning
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('MISSUNNSAM') AND correct_answer = 'B';  -- ogenerös
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SKRÖNA') AND correct_answer = 'A';  -- fantasifull berättelse
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('REPRESENTERA') AND correct_answer = 'D';  -- motsvara
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('DEDUKTION') AND correct_answer = 'B';  -- härledning
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SIGNALEMENT') AND correct_answer = 'D';  -- beskrivning av person
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('UPPSÅTLIG') AND correct_answer = 'A';  -- avsiktlig
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('TALG') AND correct_answer = 'B';  -- fett
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KONTRASTERA') AND correct_answer = 'B';  -- bilda motsats
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('EKLIPS') AND correct_answer = 'C';  -- förmörkelse
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SNART SAGT') AND correct_answer = 'D';  -- så gott som
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('AKTUALITET') AND correct_answer = 'B';  -- nyhet
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('INMUNDIGA') AND correct_answer = 'A';  -- äta
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KRUM') AND correct_answer = 'B';  -- böjd
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('TIRADER') AND correct_answer = 'D';  -- mångordiga yttranden
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KULMEN') AND correct_answer = 'C';  -- höjdpunkt
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('VERKNINGSFULLT') AND correct_answer = 'C';  -- effektivt
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('GE UPPHOV TILL') AND correct_answer = 'B';  -- orsaka
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ENSEMBLE') AND correct_answer = 'D';  -- grupp
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('PROVOKATION') AND correct_answer = 'D';  -- utmaning
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('TAKTIL') AND correct_answer = 'A';  -- känsel och beröring
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('CHIMÄR') AND correct_answer = 'C';  -- inbillning
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('OBLAT') AND correct_answer = 'C';  -- nattvardsbröd
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('INFRIA') AND correct_answer = 'C';  -- uppfylla (löfte)
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ALGEBRA') AND correct_answer = 'A';  -- räkning med symboler
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('RATIONELL') AND correct_answer = 'A';  -- förnuftig
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('TROJKA') AND correct_answer = 'C';  -- tremannavälde
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SPORADISKT') AND correct_answer = 'D';  -- vid enstaka tillfällen
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('LAMELL') AND correct_answer = 'D';  -- skiva
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ABONNERA') AND correct_answer = 'B';  -- förhandsbeställa
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('RUNDLIG') AND correct_answer = 'B';  -- riklig
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KAKI') AND correct_answer = 'B';  -- sandfärgat tyg
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ILLUSTRERA') AND correct_answer = 'C';  -- belysa
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('REMINISCENS') AND correct_answer = 'D';  -- svag minnesbild
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('SOM EN LÖPELD') AND correct_answer = 'D';  -- snabbt
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('DELIRIUM') AND correct_answer = 'D';  -- förvirringstillstånd
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('INNEVARANDE') AND correct_answer = 'C';  -- pågående
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('AVPOLLETTERA') AND correct_answer = 'D';  -- skicka iväg
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('FÖRORÄTTAD') AND correct_answer = 'C';  -- sårad
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ANTOLOGI') AND correct_answer = 'B';  -- textsamling
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('NAIV') AND correct_answer = 'C';  -- godtrogen
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('HÖGAKTNING') AND correct_answer = 'C';  -- vördnad
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KANDERA') AND correct_answer = 'B';  -- överdra med socker
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('FÖRBEHÅLL') AND correct_answer = 'C';  -- villkor
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('OAVVÄNT') AND correct_answer = 'C';  -- oupphörligt
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KAROTEN') AND correct_answer = 'A';  -- färgämne
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('BRUKARE') AND correct_answer = 'A';  -- vårdtagare/användare
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('GENMÄLA') AND correct_answer = 'A';  -- svara
UPDATE questions SET correct_answer = 'A' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KANON') AND correct_answer = 'C';  -- utvald samling
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('PICCOLO') AND correct_answer = 'C';  -- hotellpojke
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('NYCKFULL') AND correct_answer = 'C';  -- oberäknelig
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('FÖREKOMST') AND correct_answer = 'B';  -- existens
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('IN NATURA') AND correct_answer = 'A';  -- i annat värde än pengar
UPDATE questions SET correct_answer = 'D' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('MAKULATUR') AND correct_answer = 'A';  -- kasserade trycksaker
UPDATE questions SET correct_answer = 'C' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('FÖRLIKNING') AND correct_answer = 'B';  -- uppgörelse
UPDATE questions SET correct_answer = 'B' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('DERIVERA') AND correct_answer = 'C';  -- härleda
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('ALLUSION') AND correct_answer = 'C';  -- anspelning

-- ============ MEDIUM-CONFIDENCE (kommentera ut om osäker) ============
UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('FÖRSITTA') AND correct_answer = 'A';  -- ⚠ primärbet: missa (sekundärbet: nöta finns)

-- ============ LOW-CONFIDENCE (kommentera ut by default) ============
-- UPDATE questions SET correct_answer = 'E' WHERE category = 'ORD' AND UPPER(question_text) = UPPER('KURANT') AND correct_answer = 'C';  -- ⚠⚠ frisk (svag — kan även betyda syrlig) (DISABLED)

-- Granska "affected rows" innan COMMIT — eller kör ROLLBACK om något ser fel ut.
COMMIT;
-- ROLLBACK;