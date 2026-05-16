-- ============================================================
-- Uppdatera trunkerade LÄS-passager för Vårens 2026 högskoleprov
-- Kör i Supabase SQL Editor
-- ============================================================
-- Detta uppdaterar passage_text på alla frågor i 'questions'-tabellen
-- som matchar en av de 6 LÄS-passagerna från vårens 2026 prov.
-- ============================================================

BEGIN;

-- Medborgarkompetens (PP2 Q11-12) (2343 tecken)
UPDATE public.questions
SET passage_text = $passage$I den offentliga debatten finns en tydlig förväntan på skolan att fungera som en arena för att utveckla unga människor till goda medborgare. När svensk utbildningspolitik har formulerats har medborgarperspektivet traditionellt haft en framträdande roll. Det finns emellertid ett avvägningsproblem mellan skolans medborgarfostrande, demokratiska uppdrag och uppdraget att förbereda elever för yrkeslivet.

Traditionellt har SO-undervisningen haft ett stort ansvar för skolans demokratiska uppdrag, för att lära eleverna hur man deltar och agerar som medborgare i ett demokratiskt samhälle. Bland SO-ämnena är det framför allt i ämnet samhällskunskap som man brukar ta upp och diskutera de demokratiska värdena och utveckla elevernas förmåga att granska, värdera och ta ställning i samhällsfrågor och internationella utvecklingsfrågor.

Reformen av gymnasieskolan (Gy 11) innebar en förändring så till vida att mindre fokus numera läggs på skolans medborgarfostrande uppdrag medan ett tydligare fokus läggs på att förbereda eleverna antingen för yrkeslivet och fortsatt yrkesutbildning eller för fortsatta studier. Detta kommer bland annat till uttryck i att ämnet samhällskunskap på gymnasieskolans yrkesprogram halverats från 100 till 50 poäng.

Det övergripande syftet med vårt forskningsprojekt är att undersöka om reformen av gymnasieskolan påverkar yrkesprogramelevernas medborgarkompetens, det vill säga deras demokratiska värderingar, tillit till egna färdigheter och kommunikativa förmågor samt politiska kunskaper och politiska engagemang.

I projektet fokuserar vi på två aspekter av samhällskunskapsundervisning. För det första undersöker vi effekter av undervisningsmängden (antalet undervisningstimmar). Här knyter vi an till en internationell diskussion om effekter av utbildning. Utbildningsreformen innebar dock inte enbart en minskning av antalet timmar utan också en viss förändring av formen för undervisningen i riktning mot mer traditionell katederundervisning. För det andra riktar vi därför in oss på typen av undervisning. Vi genomför ett empiriskt test där vi undersöker vilka effekter på medborgarkompetens så kallad deliberativ undervisning har jämfört med traditionell katederundervisning.

Joakim Ekman, Pär Zetterberg, Mikael Persson & Klas Andersson

(deliberativ undervisning = undervisning som bygger på samtal)$passage$
WHERE category = 'LAS'
  AND passage_text IS NOT NULL
  AND passage_text LIKE '%I den offentliga debatten finns en tydli%';

-- Ljudboksdebatt (PP2 Q13-16) (6847 tecken)
UPDATE public.questions
SET passage_text = $passage$Två inlägg i debatten om ljudboken

INLÄGG 1

I den senaste debatten om ljudböcker har det som vanligt handlat om pengar, branschen och de nya formaten. Den gamla floskeln att ljudboken vidgar det litterära formatet brukar följas av en ömsint men nedlåtande kommentar om boken som ålderdomlig, som om man vill hänga med i utvecklingen även när den leder mot botten. Mer sällan talar man om att det inte är samma sak att lyssna som att läsa. Vissa kritiker verkar inte ens reflektera över skillnaden, som exempelvis Expressens litteraturkritiker Jens Liljestrand som, utan att blygas, i en text om Lydia Sandgrens Samlade verk tillstår att han faktiskt inte har läst boken utan bara lyssnat till den: "Själv slukade jag den under veckor av ensamma barnvagnspromenader med Ludvig Josephsons varma röst i hörlurarna, genom trivsamma 28 timmar och 35 minuter."

När till och med en känd kritiker som Liljestrand inte förstår att det är en väsentlig skillnad mellan att läsa och att lyssna så blir det ju svårt att övertyga oss andra om det tryckta ordets överlägsenhet jämfört med det inspelade ljudet när det kommer till litteratur. Läsning av en bok kräver ett pågående arbete som ljudböcker inte kräver. I boken finns nämligen ingen gravitation. Man kan inte läsa en bok och diska samtidigt, eller läsa en bok och surfa på nätet samtidigt. När du vänder tillbaka blicken efter att ha tittat på något annat så är du kvar på samma sida i boken, som inte rör sig framåt av sig själv. Ljudboken har gått vidare, men boken går bara vidare genom din läsning. Det är det som gör boken svårare och det kanske också är det som ligger bakom litteraturens särställning.

Det ljudboken gör är att tala till människans urgamla vilja att få något utan att betala för det. Det är samma vilja som ligger bakom drömmarna om evighetsmaskiner, att kunna göra guld av gråsten eller vin av vatten – eller, som i fallet med ljudboken, att läsa utan att läsa. Jag har inget principiellt emot ljudboksformatet, bara man inte kallar det läsning, för det är det inte. Provocerande nog kommer sådana utsagor ofta från människor som arbetar med litteratur, och alltså borde kunna skilja på läsning och lyssning, och dessutom borde förstå att lyssningen aldrig kan ersätta den rikedom som läsandet av en bok ger. I Expressen skriver exempelvis Jakob Nilsson: "Bland ljudbokslyssnarna finns såväl de som annars inte alls hittat fram till litteraturen som de som tidigare konsumerat i huvudsak deckare, bara bytt format."

Problemet är att det inte fungerar så. Man råder inte bot på oförmågan att läsa litteratur genom att ta bort läsandet, lika lite som man råder bot på okunskap genom att ta bort det som kallas lärandets smärta, nämligen den förvandling av människan som sker i läsningen och i lärandet, men som är mödosam – därav smärtan – precis som all förändring. Dit kommer man inte när man kör bil, diskar eller försöker somna, utan det kräver fokus och ansträngning.

En annan sak man inte talar om är att digitaliseringen är en del av en helt ny marknadsekonomi som härstammar från Silicon Valley och som handlar om att teknikföretagen vill få så många människor på planeten som möjligt att streama och vara online för att dela med sig av information om sig själva, som i sin tur bearbetas för att skapa så kallade prediktionsprodukter som samma företag sedan säljer vidare till reklambyråerna så att de kan göra riktade annonser med så hög precision som möjligt. Med tanke på denna nya marknadslogik kan man faktiskt fråga sig om ljudboksföretaget Storytels affärsidé ens handlar om ljudböcker. Den gjorde säkert det från början, men numera handlar Storytels affärsidé sannolikt snarare om att få ut så mycket information som möjligt från sina kunder för att sedan tjäna nya pengar med hjälp av dessa data. För att detta ska bli så lönsamt som möjligt måste man ha många kanaler öppna mot användarna i form av streamingtjänster och enheter som samlar information. Man kan läsa om det i företagets integritetspolicy som finns på deras hemsida eftersom lagen kräver det, men som ändå ingen läser. Storytel hymlar inte heller med att man också vill komma åt allt innehåll från sina användares Facebook-konton. I sitt policydokument skriver man att man kommer "att samla in och behandla sådana personuppgifter som du har givit Facebook". Men som sagt, detta talar man aldrig om när man talar om ljudboken. Om debatten inte handlar om läsning, vilket den borde, så skulle den åtminstone kunna handla om detta.

Ola Nilsson

INLÄGG 2

Författaren Ola Nilssons text i Aftonbladet i helgen blev en vattendelare. En högljudd debatt fördes snart i en mängd kommentarsfält, och sällan har det varit så tydligt hur diametralt olika människor ser på det växande ljudboksformatet och vad det betyder för litteraturen. Jag har vänner som i princip fastslog att den var det mest sanna som skrivits om litteraturens erbarmliga tillstånd på flera år, medan andra ansåg texten bestå enbart av billigt effektsökeri. Värt att notera – båda extremerna uttrycktes av människor som är professionellt verksamma i bokbranschen.

Ola Nilssons påpekande att läsning till skillnad från lyssning kräver att man på egen hand för texten framåt är visserligen korrekt, men gör det verkligen att det blir svårare att läsa än att lyssna? Kan det inte lika gärna vara tvärtom? Att hänga med i ett skeende i en lyssnad text som någon annan styr över – är inte det svårare än att med sina egna ögon bestämma över tempo och pauser i sin läsning? Borde det inte vara en lika svår konst att bli en god lyssnare som en god läsare?

Missförstå mig inte – läsning är livsviktigt, och jag tillhör inte dem som tycker att lyssning och läsning alltid går att likställa och skulle aldrig säga att jag läst en ljudbok (däremot lyssnar jag på ljudböcker dagligen). Men samtidigt – är sysslorna verkligen så väsensskilda som många vill göra gällande?

Inte för hjärnan, vad det verkar. En ofta citerad forskare är amerikanen Daniel T Willingham, som studerat kognitiva processer vid läsning och lyssning. I en text i New York Times från 2018 beskriver han sysslorna som i stort sett identiska när hjärnan hanterar dem. Men i samma artikel citerar han även en empirisk jämförelsestudie där vissa studenter fick lyssna på en text och andra läsa den. När det sedan blev tentadags visade det sig att de som läst texten kom ihåg betydligt mer.

Men ... då är väl läsning trots allt bättre? Kanske, men inte nödvändigtvis. Skillnaden i prestation skulle också kunna bottna i att vi skolas betydligt mer i att lära oss läsa och tolka skriven text än vi lär oss att på allvar lyssna på och minnas det vi hör – studenterna saknade helt enkelt de rätta verktygen för att bäst komma ihåg och förstå vad de lyssnade på.

Ja, nu spekulerar jag mest, men det tycker jag nog att Ola Nilsson gjorde i sin artikel också.

Daniel Åberg$passage$
WHERE category = 'LAS'
  AND passage_text IS NOT NULL
  AND passage_text LIKE '%Två inlägg i debatten om ljudboken%';

-- Fiskodling Vindelälven (PP2 Q17-20) (6474 tecken)
UPDATE public.questions
SET passage_text = $passage$Fiskodling vid vattenkraftverk

Data från miljöövervakning av svenska inlandsvatten visar att vi de senaste 30 åren har haft en kraftig nedgång av halten närsalter (främst fosfor och kväve). Denna oligotrofiering kan vara positiv i odlingslandskapet och urbana områden, där vi sedan nära 100 år har byggt upp ett stort näringsöverskott. För vatten som avvattnar skog och fjäll, det vill säga majoriteten av våra norrländska älvar, är situationen däremot kritisk. Här ser vi idag att näringshalterna bara fortsätter att minska och nu har nått kritiskt låga nivåer även i de vattendrag som är minst påverkade av människan, med den oreglerade Vindelälven som ett påtagligt exempel. Den förhärskande teorin idag är att denna generella nedgång i näringshalter kan knytas till ett ökat näringsbehov i våra skogar påskyndat av ett varmare klimat och till minskad erosion då allt mer av kalfjället täcks av växter.

En annan möjlig faktor, som gör situationen än mer allvarlig, har att göra med de naturligt höga halter av aluminium och ökande mängder av järn som förekommer i våra norrländska vatten. Om det inte finns tillgängligt organiskt material i litoralen (strandzonen) som fosfor kan bindas in i, så kommer fosforn att reagera med detta aluminium och järn ute i pelagialen (den fria vattenmassan) och bli biologiskt otillgänglig. I en första pilotstudie i Ströms Vattudals vattenmagasin fann vi att bara en mindre del av fosforn i sedimentet är tillgänglig för biologisk produktion av just den anledningen. Detta var oberoende av om mätningen gjordes uppströms, nedströms eller direkt under den fiskodling som finns där, med den skillnaden att den totala mängden fosfor var större i sedimentprover tagna direkt under fiskodlingen. Denna pilotstudie indikerar att fosfor i sedimentet i dessa miljöer är betydligt hårdare bunden i aluminium och järn än den är i sediment under och nära fiskodlingar i Bottenhavet eller själva Östersjön.

Hur den sedimentbundna fosforns tillgänglighet kan ändras över tid och med ändringar i miljön i dessa vatten är nu föremål för mer detaljerade studier av forskare vid Sveriges lantbruksuniversitet (SLU). Studierna syftar till att öka förståelsen av de underliggande mekanismerna bakom fosforns omsättning och kretslopp i dessa vatten, liksom av hur en ändrad tillförsel av biologiskt tillgänglig fosfor påverkar fosforns kretslopp och därmed också systemets förutsättningar för biologisk produktion.

Från långtidsstudier vet vi att närsalterna lakas ut ur kraftverkens vattenmagasin efter en reglering och att de når en topp i pelagialen de första femton åren. Sedan sjunker näringshalterna och stabiliseras på en onaturligt oligotrof nivå, vilket beror på att upprepad och oregelbunden torrläggning av stränderna skadar eller helt slår ut litoralens vegetation och näringsväv. I en naturlig sjö utgör denna zon en viktig och mycket produktiv del av ekosystemet.

I den produktiva litorala zonen fångas näring in av strandvegetationens bottenlevande alger som i sin tur utgör en födobas för bakterier och andra nedbrytare samt för bottenlevande insekter och kräftdjur som är en viktig födoresurs för många fiskarter.

Vattenregleringen har med andra ord stöpt om födoväven från litoral till pelagial dominans, vilket annars bara brukar gälla för öppna hav eller mycket stora sjöar med liten landkontakt. Denna förändring i kombination med den generellt sjunkande halten av näringsämnen i alla våra inlandsvatten leder till att vi får en extrem näringsbrist i våra kraftverksdammar med minskad biologisk produktivitet och mångfald som följd. Detta begränsar i sin tur fiskens födotillgång och skapar populationer av tusenbröder, det vill säga små och långsamväxande individer.

Ett undantag från sådana ekosystemeffekter i dessa onaturligt oligotrofa vatten tycks nu skönjas i magasin som länge har haft öppen fiskodling, med andra ord vatten där det kontinuerligt och under lång tid har tillförts organiskt tillgänglig näring. Detta stämmer väl överens med såväl svenska som nordamerikanska studier där man tillfört konstgödning till kraftverksdammar och fått en signifikant och positiv ökning av den biologiska produktionen. En central målsättning är därför att utvärdera om biologiskt tillgänglig näring från fiskodling kan öka ekosystemets produktivitet och därmed tillväxten hos de vilda fiskbestånden, kopplat till en ökning av pelagiska mikroalger och bakterier. Det skulle i så fall kunna utgöra ett alternativ till den föda som i en naturlig sjö kommer från litoralen, vilken i reglerade kraftverksdammar är permanent utslagen.

Med andra ord skulle fiskodlingen kunna utföra en miljötjänst. Detta är speciellt intressant då ny forskning visar att fiskarnas gödsel utöver näringsämnen innehåller biologiskt aktiva metaboliter som producerats av deras tarmbakterier. Metaboliterna har en direkt påverkan på växters genetiska uttryck, stimulerar tillväxten och kan dessutom fungera som "probiotika" för växterna. Detta tycks även gälla för mikroalger som utgör basen i den pelagiska födokedjan som vi ser dominera system med förstörd litoral. Det kanske inte är en slump att människan i många tusen år har kombinerat fisk- och växtodling, där kombinationen fisk- och risodling i Sydostasien kanske är det äldsta och mest välkända exemplet.

Dagens kraftverksdammar är alla äldre och släpper inte längre ut betydande mängder näring nedströms, utan suger tvärtom girigt i sig den lilla mängd näring som finns för biologisk produktion. Historiskt återförde dåtidens stora populationer av vandringsfisk näring från havet till inlandet, men minskade vildpopulationer och kraftverksdammarnas vandringshinder begränsar i dagsläget detta.

Fiskodling baserad på kretsloppsbaserade foderråvaror som till del hämtas från Östersjön och dess avrinningsområde skulle till viss del kunna återställa en sådan historisk näringstransport. Lars Ove Eriksson, tidigare professor i Akvakultur vid SLU, kallade detta för "Robin Hood-effekten", det vill säga att ta från de rika och ge till de fattiga. På senare tid har forskare vid SLU genomfört en rad större projekt, dels tillsammans med våra grannländer runt Östersjön, dels i nationella projekt som 5 ton grön fisk i disk (5TFiD). Dessa projekt har visat att det är fullt möjligt, både ekonomiskt och praktiskt, att ta fram ett konkurrenskraftigt fiskfoder av hög kvalitet från lokala foderråvaror, där varje kilo foder minskar näringsbelastningen i Östersjön.

Anders Kiessling och Martyn Futter$passage$
WHERE category = 'LAS'
  AND passage_text IS NOT NULL
  AND passage_text LIKE '%Fiskodling vid vattenkraftverk%';

-- Vilse / Gunnar (PP4 Q11-12) (1643 tecken)
UPDATE public.questions
SET passage_text = $passage$Vilse

En av årets sista nätter sände döden en försändelse av mumlande mörker genom vår vän Gunnars blodomlopp. Ett polletterat kolli som felklarerats vid någon gränsstation för att till sist hamna på en lagerhylla bland oönskade reseffekter i det innersta av hjärtats rum. Gunnar dog i sömnen den natten. Dagarna därpå såg vi honom gång på gång: i kön vid snabbköpets kassa, på mellandagspromenad med en okänd hund, på skridskor över insjöns just tillfrusna istäcke ... Till och med in i nyårsdagens eftermiddagslångfilm på tv hade han tagit sig: en silhuett i motljuset vid en öppen verandadörr med hjältinnan vid sin sida.

Vi arbetar för att hålla oss kvar vid varandra, trots att tiden och dess nitiska budbärare och handgångna män oavbrutet söker hindra oss. De stryker ut reflexerna i fönstrens glas, imfigurerna i badrummens speglar, avtrycken efter försvunna kroppsdelar i sängkläder, soffkuddar och klädesplagg. De vill återställa världen till den plats av rationalitet där människors liv alltid utgör oönskat okända faktorer som hela tiden hotar att göra streck i räkningen och störa de himmelska ekvationernas kalla ordning. De är utsända från en ockupationsmakts propagandaministerium med uppgift att – trots att brev anländer öppnade, tummade och lästa, trots att tidningar censureras till att endast innehålla triviala rubriker, trots att truppförflyttningar och fångtransporter passerar nere på gatan hela nätterna – intala oss att allt är som det ska och att allt vad döden mumlar genom nätterna inte gäller oss.

Niklas Rådström

(polletterat kolli = bagage inlämnat för transport till resans slutpunkt; reseffekter = bagage)$passage$
WHERE category = 'LAS'
  AND passage_text IS NOT NULL
  AND passage_text LIKE '%Vilse%';

-- Omvårdnadsforskning (PP4 Q13-16) (6053 tecken)
UPDATE public.questions
SET passage_text = $passage$Omvårdnadsforskning

Att lösa medicinska gåtor är förstås en viktig forskningsuppgift, men allt fler inser att det är minst lika angeläget att forskningen inriktar sig direkt på att utveckla vården och omsorgen. Samtidigt som sökandet pågår efter exempelvis det som i framtiden botar eller förebygger demens, måste vi säkerställa att vården av dagens sjukdomsdrabbade bedrivs med högsta kvalitet. Till skillnad från för 25–30 år sedan är omvårdnadsforskning i dag ett etablerat forskningsområde, där forskarna bemöts med samma respekt som en alzheimerforskare. En av krafterna bakom denna utveckling är den internationellt kände Per-Olof Sandman, professor vid Umeå universitet, tillika gästprofessor vid Karolinska Institutet med inriktning omvårdnad av demenssjuka.

– Vi har visat att den forskning som vi bedriver har betydelse och är till nytta för vårt samhälle, säger han.

Särskilt betydelsefulla för att utveckla kunskapen inom demensvården i Sverige är de nationella riktlinjer som infördes 2010 efter flera års arbete av Per-Olof Sandman och ytterligare ett trettiotal forskare inom olika områden. Arbetet startade med utgångspunkt i forskares och verksamhetsföreträdares bedömning av inom vilka områden det fanns kunskap att sammanställa och var det fanns störst behov att normera vården. Det resulterade i kunskapsbaserade riktlinjer för att tillgodose grundläggande behov inom områden som exempelvis vård i livets slutskede, mat och ätande, fall, munhälsa, urininkontinens och förstoppning, men riktlinjerna lyfter också fram sådant som vårdklimat och betydelsen av personkontinuitet, en anpassad fysisk miljö, välutbildad personal och stöd till närstående.

Kunskapen finns alltså och de samhälleliga förutsättningarna i övrigt är förhållandevis goda. Men Per-Olof Sandman menar att vården trots detta ofta är uppgifts- och inte personcentrerad, med låga bemanningstal i relation till de förväntningar som finns på personalen. Ibland är det för lite fokus på att ge de boende en meningsfull vardag. Det finns också en överförskrivning av psykofarmaka och det är vanligt med undernäring, fysiska begränsningar och fall. Enligt Per-Olof Sandman är forskningens uppgift att förnya, att utveckla och att ta bort det som är felaktigt. Han beskriver omvårdnadsforskningen som ett ständigt pågående pussel, där det ännu kan vara svårt att få en skarp och entydig bild av forskningsläget.

– Inom mitt fält lägger vi någon liten pusselbit var, och arbetar väldigt tydligt med vissa motiv. Just nu är ett sådant motiv personcentrerad vård. Där håller vi på att lägga bitar – inte bara i Sverige – för att förstå hur man känner igen personcentrerad vård, hur den kan mätas och hur man ska intervenera för att främja de värderingar som bär upp den.

Enligt Per-Olof Sandman har omvårdnadsforskningen till dags dato främst varit explorativ. Intervjuer och observationer har använts för att kartlägga olika fenomen. Arbetet har varit betydelsefullt, men ska man få pengar till forskning i dag måste man enligt Per-Olof Sandman arbeta med innovation, implementering och intervention.

– Det vi har kartlagt och förstått måste omsättas i produkter eller idéer som kan användas på ett mer konkret sätt. Annars kommer vi inte att fortsätta få forskningsmedel. Det kan en del uppleva som hotfullt och andra ser det som en möjlighet. Men vi behöver konklusiv kunskap inom en del områden för att kunna säga: så här ska vi göra, men inte så här.

Centralt i den omvårdande uppgiften är att se personer som subjekt snarare än som objekt. I det så kallade caringperspektivet handlar omvårdnad alltid om en subjekt–subjekt-relation. Enligt Per-Olof Sandman är det något som över tid tydliggjorts och blivit starkare i sin kontur, men inom demensvården har man periodvis haft ett väldigt instrumentellt och objektifierande synsätt.

– På 1970- och 1980-talet organiserades omvårdnadsarbetet enligt industrins modell, det löpande bandet. Det kunde man göra eftersom man såg patienten som ett objekt. Men börjar man se kärnan i omvårdnaden som en subjekt–subjekt-relation så blir ju en sådan organisationsmodell omöjlig, säger han.

Att omvårdnadens organisation byggde på idén om det löpande bandet gjorde att det inte var viktigt med personliga relationer, allt handlade om uppgifter som skulle utföras. Det betydde att alla vårdare var utbytbara, vilket både patienter och vårdare reagerade mot. De krävde en vård som var mer personlig, säger Per-Olof Sandman.

På 2000-talet har ekonomiska faktorer men även fackliga krav på schemaläggningen lett till förändrade organisationsformer. Utvecklingen har därmed i viss mån stagnerat och till och med gått bakåt. Per-Olof Sandman berättar att han för en tid sedan frågade en sjukhusdirektör: Hur organiseras omvårdnadsarbetet?

– Då sa han: Det var en bra fråga.

Men Per-Olof Sandman framhåller att i jämförelse med 1970- och 1980-talet, då man inte ansågs behöva utbildning för att vårda den som var demenssjuk, är vården i dag mycket mer kunskapsbaserad. Personalomsättningen är inte heller lika hög som tidigare. En viktig forskningsuppgift för framtiden blir att titta på bemanningens betydelse för kvalitet, men också på ledarskapets betydelse.

– Vi vet vad vi ska göra, vi vet hur vi ska göra det, vi vill göra det, men vi behöver starka ledare som går före och visar, som upprätthåller idén om den goda vården, säger Per-Olof Sandman, som tycker att ledarskapet är helt centralt att lyfta fram. Han efterfrågar kompetenta ledare som kan leda genom sitt eget agerande. Det är något som enligt honom har försvunnit i och med att sjuksköterskor och arbetsterapeuter på många boenden har tagits bort.

– De professionella ledarna som kan komma med integrerad ny kunskap och som utifrån sin kompetens är goda förebilder saknas ofta.

Ledarskapet ställs också på sin spets i relation till personaltätheten i omvårdnaden.

– Det finns en risk att vi i framtiden har en väldigt välutbildad vårdpersonal som i teorin vet hur demensvård borde fungera men som inte har förutsättningar att genomföra det.

Jonas Nilsson$passage$
WHERE category = 'LAS'
  AND passage_text IS NOT NULL
  AND passage_text LIKE '%Omvårdnadsforskning%';

-- En afrikansk vår (PP4 Q17-20) (6861 tecken)
UPDATE public.questions
SET passage_text = $passage$En afrikansk vår?

Kommer vi att få se en afrikansk vår motsvarande den arabiska? Inte mycket tyder på det, även om det finns en gemensam nämnare för de arabiska länderna i norra Afrika och länderna söder om Sahara. I flera länder finns en stor och rastlös ungdomsgeneration som anser att äldre, diktatoriska män står i vägen för dem. Tack vare globaliseringen är dessa unga uppkopplade mot sociala medier och de inser vilka materiella möjligheter de går miste om. Lägg därtill att de nationellt växande inkomsterna inte fördelas rättvist bland invånarna. Om det någonsin kommer att uppstå en afrikansk vår så kommer den att drivas av en längtan efter välfärd.

Men mycket skiljer nord från syd, och den viktigaste skillnaden är att länder som Egypten och Tunisien är långt mer homogena samhällen än vad majoriteten av de afrikanska länderna är. Till exempel rymmer Nigeria 170 språkgrupper och i landet finns ännu så länge ingen större samlad rörelse som förmår utmana makten.

Vid ett gatustånd i Zambias huvudstad Lusaka sitter Loveness Malinga och säljer svamp. Hon gör det för att kunna köpa skoluniformer till sina barn och för att försörja sin familj. Men bara några kvarter bort shoppar medelklassen i nybyggda shoppinggallerior. Ett och samma land rymmer helt skilda verkligheter: medan lantbrukaren lever som på 1800-talet i lerhyddor utan el, kör huvudstadens medelklass runt i dyra bilar. Nya siffror visar att 60 procent av den zambiska befolkningen lever i fattigdom, det är ungefär samma andel som 1996.

Jag träffar statsvetaren Saviour Mwanbwa som i Lusaka driver tankesmedjan Center for Trade and Development. Han varnar för vad som kan hända i framtiden.

– De enorma inkomstskillnaderna leder till stora spänningar, det finns ett växande missnöje när det plötsligt verkar som om vissa människor har råd att unna sig vad de vill, medan andra stannar kvar i total fattigdom, säger han.

Den unge statsvetaren tillhör en växande afrikansk rörelse som kritiserar de utländska företag som deltar i tillväxtboomen men inte betalar skatt på sina vinster – pengar som skulle kunna bidra till landets utveckling. Han påpekar att Afrika förlorar mer i skatteflykt än vad kontinenten erhåller i bistånd. Och både fattiga och rika invånare lägger en stor del av skulden på de egna regeringarna, som inte tycks vara intresserade av att sprida välståndet.

Vissa hotbilder och larm från den afrikanska kontinenten har varit överrepresenterade i media. Samtidigt finns det andra hotbilder som inte uppmärksammas i tillräckligt stor omfattning. Arbetslöshet, kapital- och skatteflykt, klimatförändringar och islamisering är utan tvivel brännande aktuella frågor, och hur de hoten hanteras av afrikanska ledare och av världssamfundet är avgörande, men vad som ska hända i framtiden är till stor del också kopplat till ungdomsgenerationerna. I en undersökning som Världsbanken lät göra 2011 uppgav 40 procent av dem som gått med i rebellrörelser att det som drev dem var arbetslösheten och känslan av att inte ha någon uppgift i livet. Arbetslösheten bland unga blir på så sätt en tickande bomb; idag är 200 miljoner afrikaner mellan 15 och 24 år. Afrikas befolkning kommer enligt FN att fördubblas till år 2050, och då kommer var femte person på jordklotet att vara afrikan. Vad sker då med de unga som har låg eller ingen utbildning alls men hyser allt större förväntningar på materiell välfärd? Vad kommer att utmärka dem? Även om ungdomarna har låg utbildning talar de kanske flera språk. Är de flexibla och beredda att flytta? Frågorna är många.

Ungdomar utgör idag 60 procent av de arbetslösa. Kvinnor drabbas hårdare än män, för även om kvinnor har jämförbara kunskaper och erfarenheter så har de svårare att få anställning. Både OECD och African Development Bank har identifierat uppgiften att skapa jobb åt Afrikas alla unga som en av de största utmaningarna framöver. En rapport från Brooking-institutet i Washington visar att 70 procent av alla unga i Kongo-Kinshasa, Kongo-Brazzaville, Etiopien, Malawi, Ghana, Mali, Rwanda, Senegal och Uganda antingen är egenföretagare eller jobbar inom familjens jordbruk eller affärsrörelse. Det gör att unga personer enligt statistiken är fattigare än den genomsnittliga afrikanen. Den sudanesiske miljonären Mo Ibrahims stiftelse har i sin stora studie "Young Africans and the Employment Challenge" förslag på hur man ska möta de växande kullarna med lågutbildade afrikanska ungdomar. Förslagen är entydiga: fattigdomens utvägar går inte nödvändigtvis via städernas arbetsmarknad, utan via jordbruket.

Men att arbeta inom jordbruket är inte särskilt eftertraktat eftersom det är så förknippat med generationers slit. Därför anser Mo Ibrahim Foundation att det krävs upplysningskampanjer om vilka slags nya arbetstillfällen som kommer att erbjudas inom det moderna, industrialiserade afrikanska jordbruket: transport, förpackning, förvaring, växtförädling – det finns många nya jobb.

Samtidigt drabbas varje afrikanskt land nu på olika sätt av klimatförändringarna, och de allra fattigaste drabbas värst eftersom de varken har marginaler att hantera det alltmer oförutsägbara vädret eller kunskap om vad som egentligen sker, utan tiger och lider och sår, om och om igen.

Jag tänker ofta på John och Ruth som jag träffade i Kenya. De var ett par med en prydligt skött liten gård, de drev ett litet jordbruk, hade tre barn och två oxar. Men deras spannmålsförråd stod helt tomt och de levde i den sorts fattigdom som ekar av hopplöshet, med katastrofen ständigt hotande. Skörden hade just slagit fel – igen. Jag frågade John om han visste varför klimatet blir allt torrare. Svaret överraskade mig.

– Det är mitt fel, svarade han. Jag tvingas hugga ner träd på min shamba för att göra träkol. För en stor säck som jag säljer längs vägen kan jag försörja min familj en vecka. Men jag har förändrat klimatet genom att hugga ner träden.

Den kenyanska klimatexpert som följt med oss berättade då för honom om klimatförändringarna, om den rika världens koldioxidutsläpp och om växthuseffekten. John lyssnade noga och stod sedan länge tyst i skuggan av ett akaciaträd. Jag frågade vad han tänkte.

– Jag tänker att det alltid är den fattige som drabbas.

Han fick en kärleksfull kram av sin hustru Ruth, och jag frågade vad han tänkte om framtiden.

– Vi ska göra det vi alltid gör. Vi sår, och ber till Gud. När det blir missväxt sår vi igen – och ber till Gud.

Den dag John och Ruth har råd att köpa konstgödsel och en traktor, när de får tillgång till den senaste forskningen och därmed nya, mer torkresistenta grödor, när de får elektricitet, kan skicka sina barn till skolan, har råd att köpa en lastbil så att de kan sälja sina spannmål i närmaste stad, då finns det nya Afrika för alla.

Erika Bjerström

(den arabiska våren = folkliga uppror mot auktoritära regimer i Mellanöstern och norra Afrika 2011)$passage$
WHERE category = 'LAS'
  AND passage_text IS NOT NULL
  AND passage_text LIKE '%En afrikansk vår?%';

-- Visa hur många rader som påverkades per passage
SELECT
  LEFT(passage_text, 50) AS passage_start,
  count(*) AS questions_affected,
  max(length(passage_text)) AS passage_length
FROM public.questions
WHERE category = 'LAS'
  AND passage_text IS NOT NULL
  AND (
    passage_text LIKE '%I den offentliga debatten finns%'
    OR passage_text LIKE '%Två inlägg i debatten om ljudboken%'
    OR passage_text LIKE '%Fiskodling vid vattenkraftverk%'
    OR passage_text LIKE '%En av årets sista nätter sände döden%'
    OR passage_text LIKE '%Att lösa medicinska gåtor är förstås%'
    OR passage_text LIKE '%Kommer vi att få se en afrikansk vår%'
  )
GROUP BY LEFT(passage_text, 50)
ORDER BY passage_start;

COMMIT;
