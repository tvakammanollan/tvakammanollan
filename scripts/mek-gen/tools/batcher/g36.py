import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from mekgen_lib import it, write, G
def one(a,g,t,txt,k,ds,dt,ok,lt,ex): it(a,g,t,txt,[k],[[d] for d in ds],dt,[[1],[1],[1]],[ok],[lt],ex)
two=it; three=it
F2=[[2],[1],[1,2]]; T2=[["de","fa"],["fa","de"],["fa","fa"]]
F3=[[3],[1],[1,2,3]]; T3=[["de","de","fa"],["fa","de","de"],["fa","fa","fa"]]
O=[["fa"],["fa"],["fa"]]
# ---------- en lucka ----------
one("med","myn","1177 Ont i halsen",f"Den som är förkyld får ofta ont i halsen, eftersom både näsan och svalget då är {G}. Bakom en förkylning ligger nästan alltid ett virus.",
 "inflammerade",["bedövade","avslappnade","nedkylda"],O,"a","ors",
 "Rätt svar är inflammerade. Ett virus som ger ont i halsen retar slemhinnorna så att de svullnar och gör ont. Bedövade och avslappnade slemhinnor gör inte ont, och ett virus kyler inte ned svalget.")
one("med","myn","1177 Vaxpropp",f"Den som har en vaxpropp i örat kan få lock för örat efter en dusch, eftersom vatten då blir {G} mellan proppen och trumhinnan.",
 "instängt",["uppvärmt","renat","fruset"],O,"a","ors",
 "Rätt svar är instängt. Vatten som inte kommer ut förbi proppen ger känslan av lock för örat. Uppvärmt och renat vatten ger inget lock, och vatten fryser inte i örat efter en dusch.")
one("med","myn","1177 Kristallsjuka",f"Vid kristallsjuka kommer yrseln när man vänder sig om eller lutar huvudet bakåt, och den går över när man håller huvudet {G}.",
 "stilla",["varmt","fuktigt","tungt"],O,"adv","kon",
 "Rätt svar är stilla. Yrseln kommer av rörelser, och den släpper alltså när huvudet inte rör sig. Varmt, fuktigt och tungt har inget med rörelserna att göra.")
one("med","pop","Skrubbsår",f"Ett skrubbsår uppstår när huden glider mot en {G} yta som nöter bort hudens yttersta lager.",
 "skrovlig",["blank","mjuk","hal"],O,"a","kol",
 "Rätt svar är skrovlig. En yta som nöter bort huden måste vara ojämn och sträv. En blank, mjuk eller hal yta nöter inte bort något.")
one("kul","pop","Karusell",f"En karusell är en åkattraktion med en plattform som {G}, och sittplatserna har ofta formen av djur, till exempel hästar.",
 "roterar",["lutar","rostar","viker sig"],O,"v","def",
 "Rätt svar är roterar. Det som utmärker en karusell är att man åker runt runt. En plattform som lutar, rostar eller viker sig är ingen åkattraktion.")
one("kul","pop","Knäck",f"Knäck är ett hemgjort julgodis av sirap, socker och grädde i lika delar. Smeten kokas ihop och hälls sedan i små pappersformar, där den får {G}.",
 "stelna",["jäsa","tina","ångas"],O,"v","kol",
 "Rätt svar är stelna. En kokt smet som hälls i formar svalnar och blir fast. Godis jäser inte, en varm smet tinar inte, och ångas ger ingen mening här.")
one("tek","pop","Tackjärn",f"Tackjärn görs av malm i en masugn och har en hög halt av kol. Oftast är det inte en färdig vara utan ett råmaterial som {G} vidare innan metallen kommer till användning.",
 "förädlas",["kasseras","spills","begravs"],O,"v","kon",
 "Rätt svar är förädlas. Ett råmaterial som inte är färdigt bearbetas till något bättre. Kasseras, spills och begravs strider mot att metallen sedan används.")
one("his","pop","Lagman",f"I äldre tider var lagmannen oftast den främste ämbetsmannen i landskapet, och en av hans viktigaste uppgifter var att {G} tinget.",
 "leda",["avskaffa","bojkotta","möblera"],O,"v","kol",
 "Rätt svar är leda. Den främste ämbetsmannen hade som uppgift att styra tinget. Han skulle inte avskaffa, bojkotta eller möblera det.")
one("eko","pop","Köpcentrum",f"Ett köpcentrum är en samling butiker och varuhus på samma plats. De som ligger i utkanten av en tätort är oftast byggda för kunder som kommer dit med {G}.",
 "bil",["båt","flyg","häst"],O,"s","kol",
 "Rätt svar är bil. Ett köpcentrum utanför tätorten ligger långt från bostäderna och nås lättast med bil. Båt, flyg och häst är inte hur man handlar i ett köpcentrum.")
one("bio","pop","Tornfalk",f"Tornfalken är en rovfågel av mellanstorlek som man ofta får se {G} över fält och myrar, alltså stå stilla i luften med snabba vingslag.",
 "ryttla",["dyka","glida","segla"],O,"v","def",
 "Rätt svar är ryttla. Att stå stilla i luften med snabba vingslag kallas att ryttla. Att dyka, glida eller segla är att röra sig, inte att stå stilla.")
one("bio","pop","Hussvala",f"Hussvalan äter insekter, som den tar i luften. På vintern flyttar den därför till trakter där det finns gott om {G} insekter.",
 "flygande",["döda","vattenlevande","stickande"],O,"a","ors",
 "Rätt svar är flygande. En fågel som fångar sin föda i luften behöver insekter som flyger. Döda, vattenlevande och stickande insekter fångar den inte i luften.")
one("bio","pop","Kricka",f"Krickan är en liten simand som är vanlig i stora delar av Eurasien, men i Sverige har den blivit så mycket färre att den räknas som {G}.",
 "sårbar",["vanlig","invasiv","tam"],O,"a","kon",
 "Rätt svar är sårbar. Men ställer det svenska beståndet mot det vanliga, och en art som blir färre räknas som hotad. Vanlig och invasiv strider mot att den blivit färre, och en vild and räknas inte som tam.")
one("kul","pop","Bokhylla",f"En bokhylla är en möbel för {G}, där man kan ställa böcker, pärmar och prydnadssaker.",
 "förvaring",["sittning","belysning","matlagning"],O,"s","def",
 "Rätt svar är förvaring. Att ställa böcker och saker på hyllorna är att förvara dem. En bokhylla är inte till för att sitta, lysa eller laga mat.")
one("eko","pop","Rast",f"En rast är ett längre uppehåll i arbetet, till exempel för lunch. Rasten räknas inte som arbetstid, och under den får man {G} sin tid som man vill.",
 "disponera",["redovisa","rapportera","dubblera"],O,"v","kol",
 "Rätt svar är disponera. Tid som inte är arbetstid bestämmer man själv över. Redovisa och rapportera sin tid gör man i arbetet, inte på rasten, och tid går inte att dubblera.")
one("utb","pop","Bibliotekskort",f"Med ett lånekort kan man låna och reservera böcker på biblioteket. I Sverige är kortet till de allmänna biblioteken {G}, men det kan kosta att få ett nytt om man har tappat bort sitt.",
 "gratis",["avgiftsbelagt","obligatoriskt","självlysande"],O,"a","kon",
 "Rätt svar är gratis. Men det kan kosta visar att det första kortet inte gör det. Avgiftsbelagt strider mot det, ingen är tvungen att ha ett lånekort, och kortet är inte självlysande.")
one("tek","pop","Godståg",f"Till skillnad från persontåg går godståg ofta inte efter fasta tidtabeller, utan de körs när det finns gods som behöver {G}.",
 "fraktas",["förvaras","tillverkas","lagas"],O,"v","kol",
 "Rätt svar är fraktas. Ett godståg är till för att flytta gods, och det körs när det finns något att flytta. Gods som ska förvaras, tillverkas eller lagas behöver inget tåg.")
one("mil","pop","Holme",f"En holme är en liten ö, vanligen {G}, som man bland annat hittar i skärgårdarna.",
 "obebodd",["vulkanisk","konstgjord","drivande"],O,"a","kol",
 "Rätt svar är obebodd. En liten ö i skärgården har sällan plats för människor att bo. Holmar i skärgården är inte vulkaniska eller konstgjorda, och en ö flyter inte.")
one("spr","pop","Frågetecken",f"Frågetecken sätts efter direkta frågor, men inte efter {G} frågor, som i meningen han frågade om vi skulle gå.",
 "indirekta",["långa","artiga","dumma"],O,"a","kon",
 "Rätt svar är indirekta. Direkta frågor ställs mot en annan sorts frågor, och exemplet återger en fråga utan att ställa den. Långa, artiga och dumma frågor är inte motsatsen till direkta.")
one("tek","pop","Elmotor",f"En elmotor omvandlar elektrisk energi till rörelseenergi. Det omvända, att göra el av rörelse, sköts av en {G}.",
 "generator",["transformator","termostat","säkring"],O,"s","kon",
 "Rätt svar är generator. En maskin som gör el av rörelse kallas generator. En transformator ändrar spänning, en termostat styr värme och en säkring bryter strömmen.")
one("sam","pop","Gatunamn",f"Gatunamn beslutas officiellt av kommunen, så att det inte ska uppstå {G} om vilken gata som är vilken.",
 "missförstånd",["enighet","samtal","beskattning"],O,"s","kol",
 "Rätt svar är missförstånd. Officiella namn behövs för att ingen ska ta fel på gatorna. Enighet om gatorna är något bra, samtal om gator undviker man inte, och beskattning har inget med namnen att göra.")
# ---------- två luckor ----------
two("med","myn","1177 Svårt att svälja",f"Den som har svårt att svälja kan behöva svälja flera gånger för varje {G}. Måltiderna tar då ofta längre tid, och den som äter långsamt riskerar att inte få tillräckligt med {G}.",
 ["tugga","näring"],[["munsbit","luft"],["dag","näringsämnen"],["stavelse","motion"]],T2,F2,["s","s"],["kol","ors"],
 "Rätt svar är tugga och näring. Det man sväljer när man äter är det man har tuggat, och munsbit fungerar också. Längre måltider gör det svårt att få i sig det kroppen behöver av maten, och näringsämnen fungerar också. Man sväljer inte för varje dag eller stavelse, och luft och motion får man inte av maten.")
two("med","myn","1177 Nedsatt hörsel",f"En hörselnedsättning kan vara allt ifrån att man har svårt att {G} vissa ljud till att man inte hör något alls. Den vanligaste orsaken är att kroppen och hörselorganen {G}.",
 ["uppfatta","åldras"],[["urskilja","tränas"],["baka","blir äldre"],["äta","svettas"]],T2,F2,["v","v"],["kol","kol"],
 "Rätt svar är uppfatta och åldras. Hörseln handlar om att ta in ljud, och urskilja fungerar också. Den vanligaste orsaken till sämre hörsel är att man blir gammal, och blir äldre säger samma sak. Man bakar eller äter inte ljud, och organ som tränas eller svettas ger inte sämre hörsel.")
two("med","myn","1177 Öroninflammation",f"Öroninflammation hos barn kommer ofta {G} och går över på några dagar, och därför kallas den akut. Ibland går hål på trumhinnan, och då brukar smärtan {G}.",
 ["hastigt","lätta"],[["abrupt","tillta"],["gradvis","mildras"],["rimligt","rimma"]],T2,F2,["adv","v"],["kol","kol"],
 "Rätt svar är hastigt och lätta. En inflammation som kallas akut kommer snabbt, och abrupt fungerar också. När det går hål på trumhinnan släpper trycket och det gör mindre ont, och mildras fungerar också. Gradvis strider mot akut, rimligt ger ingen mening om hur en sjukdom kommer, smärtan tilltar inte när trycket släpper, och smärta rimmar inte.")
two("his","pop","Kistebrev",f"Kistebrev var enkla och billiga tryck som sattes upp på insidan av kistlocket eller på väggen. De var mycket {G} i Skandinavien mellan omkring 1700 och 1850, och de trycktes i stora upplagor för att roa och {G} allmogen.",
 ["populära","upplysa"],[["omtyckta","plåga"],["fåtaliga","fostra"],["giftiga","fakturera"]],T2,F2,["a","v"],["kol","par"],
 "Rätt svar är populära och upplysa. Tryck som gjordes i stora upplagor var något många ville ha, och omtyckta fungerar också. Roa står bredvid, och trycken skulle också lära allmogen något, vilket fostra också säger. Fåtaliga strider mot de stora upplagorna, tryck är inte giftiga, och man trycker inte bilder för att plåga eller fakturera allmogen.")
two("kul","pop","Vallmusik",f"Vallmusik är musik som har hört till arbetet med att {G} boskap. I Skandinavien var det främst kvinnor som skötte djuren, och musiken förknippas därför med fäbodarna, dit de flyttade med djuren under {G}.",
 ["valla","sommaren"],[["vakta","vintern"],["slakta","betessäsongen"],["tapetsera","natten"]],T2,F2,["v","s"],["def","kol"],
 "Rätt svar är valla och sommaren. Ordet vallmusik visar att musiken hörde till arbetet med att sköta djuren på bete, och vakta fungerar också. Fäbodarna användes när djuren gick på bete, och betessäsongen säger samma sak. Man spelar inte musik för att slakta eller tapetsera boskap, och djuren flyttades inte till fäbodarna på vintern eller natten.")
two("his","pop","Tullkammare",f"En tullkammare var i Sverige en tullanstalt i de städer som fick handla med utlandet och vid vissa järnvägsstationer nära {G}. De största, i Stockholm, Göteborg och Malmö, {G} av tulldirektörer.",
 ["gränsen","leddes"],[["landgränsen","städades"],["centrum","förestods"],["fjällen","åts"]],T2,F2,["s","v"],["kol","kol"],
 "Rätt svar är gränsen och leddes. Tull tas ut där varor kommer in i landet, och landgränsen fungerar också. Tulldirektörer var chefer, och förestods säger samma sak. Centrum och fjällen är inte där tull tas ut, och en tullkammare städas eller äts inte av sina chefer.")
two("his","pop","Amerikabrev",f"Amerikabreven skickades mellan svenska emigranter och deras släkt hemma. De flesta skrevs på svenskamerikanska, en {G} av bygdemål och engelska, och ibland hade mottagaren svårt att {G} vad som stod i dem.",
 ["blandning","tyda"],[["sammansmältning","frankera"],["översättning","läsa ut"],["tävling","bränna"]],T2,F2,["s","v"],["def","ors"],
 "Rätt svar är blandning och tyda. Ett språk av bygdemål och engelska är båda på en gång, och sammansmältning fungerar också. Ett blandspråk kan vara svårt att förstå, och läsa ut säger samma sak. En översättning eller tävling är inte ett språk av två delar, och språket gör det inte svårt att frankera eller bränna breven.")
two("sam","pop","Ideell förening",f"En ideell förening består av människor som {G} av gemensamma idéer. Verksamheten får gynna medlemmarna, så länge den inte är {G} ekonomisk.",
 ["förenas","renodlat"],[["hålls samman","föga"],["splittras","uteslutande"],["äts","grönt"]],T2,F2,["v","adv"],["def","kol"],
 "Rätt svar är förenas och renodlat. Gemensamma idéer är det som håller ihop medlemmarna, och hålls samman fungerar också. En ideell förening får inte bara ha ekonomiska syften, och uteslutande fungerar också. Idéer splittrar inte en förening de är gemensamma för, föga ekonomisk ger ingen gräns för verksamheten, och äts eller grönt ger ingen mening.")
two("sam","myn","Proposition",f"En proposition är i Sverige ett förslag till beslut som regeringen {G} för riksdagen. I en förening är det i stället ett förslag från styrelsen som tas upp på {G}.",
 ["lägger fram","årsmötet"],[["presenterar","fikat"],["hemlighåller","stämman"],["jonglerar","gymmet"]],T2,F2,["utr","s"],["def","kol"],
 "Rätt svar är lägger fram och årsmötet. Ett förslag till riksdagen visas upp för att beslutas, och presenterar fungerar också. I en förening fattas de stora besluten på mötet där medlemmarna samlas, och stämman fungerar också. Regeringen hemlighåller eller jonglerar inte sina förslag, och styrelsens förslag tas inte upp på fikat eller gymmet.")
two("sam","pop","Valkrets",f"En valkrets är ett område som har ett {G} antal mandat i den församling som valet gäller. I en del valsystem fördelas mandaten efter hur många som {G} i området.",
 ["bestämt","är bosatta"],[["fastställt","semestrar"],["okänt","lever"],["rostigt","sover"]],T2,F2,["a","utr"],["def","kol"],
 "Rätt svar är bestämt och är bosatta. Varje område har ett visst antal platser, och fastställt fungerar också. Mandaten fördelas efter hur många som bor där, och lever fungerar också. Ett okänt eller rostigt antal mandat går inte att fördela, och antalet som semestrar eller sover avgör inte mandaten.")
two("bio","pop","Kopparödla",f"Kopparödlan är en ödla utan ben. Eftersom den saknar {G} liknar den en orm, men den hör inte till ormarna, och därför {G} namnet kopparödla framför kopparorm.",
 ["extremiteter","rekommenderas"],[["lemmar","bannlyses"],["fjäll","föredras"],["tänder","stavas"]],T2,F2,["s","v"],["kol","kon"],
 "Rätt svar är extremiteter och rekommenderas. Ett djur utan ben saknar armar och ben, och lemmar fungerar också. Eftersom den inte är en orm är kopparödla det namn som bör användas, och föredras säger samma sak. Ett djur som liknar en orm har fjäll, tänder säger inget om likheten, och att ett namn bannlyses eller stavas säger inget om vilket namn som bör användas.")
two("bio","pop","Sothöna",f"Sothönan är en vattenfågel med svart fjäderdräkt och en vit {G} i pannan, och när den simmar nickar den med huvudet. De som häckar i kalla trakter {G} söderut på vintern.",
 ["sköld","drar"],[["fläck","blir kvar"],["fjäder","beger sig"],["tunga","ruggar"]],T2,F2,["s","v"],["kol","kol"],
 "Rätt svar är sköld och drar. Fågeln har ett vitt fält utan fjädrar i pannan, och fläck fungerar också. Fåglar från kalla trakter flyttar till varmare områden, och beger sig fungerar också. Det vita i pannan är inte en fjäder eller en tunga, och söderut på vintern stämmer inte med att fåglarna blir kvar eller ruggar.")
two("lit","pop","Bondepraktikan",f"Bondepraktikan är en folkbok med råd till bönder, som kom ut första gången i Tyskland 1508. Den blev mycket {G} och gavs ut i över femtio upplagor, och många emigranter {G} den i kofferten när de reste till Amerika.",
 ["spridd","packade ned"],[["läst","tappade bort"],["obskyr","tog med"],["blöt","åt"]],T2,F2,["a","utr"],["kol","kol"],
 "Rätt svar är spridd och packade ned. En bok med över femtio upplagor fanns hos många, och läst fungerar också. Emigranterna hade boken med sig i kofferten, och tog med säger samma sak. Obskyr strider mot alla upplagor, en bok blir inte blöt av att tryckas, och emigranter tappade bort eller åt inte boken i kofferten.")
two("utb","pop","Privatlärare",f"En privatlärare är anställd privat, ofta av en familj, för att {G} barnen i hemmet. Förr var de vanliga i {G} hem, men de har blivit ovanliga.",
 ["lära","välbärgade"],[["handleda","fattiga"],["städa","förmögna"],["klä","tomma"]],T2,F2,["v","a"],["def","kol"],
 "Rätt svar är lära och välbärgade. En lärare är anställd för att lära barnen saker, och handleda fungerar också. Att anställa en egen lärare kostar pengar, och förmögna fungerar också. En lärare anställs inte för att städa eller klä barnen, och fattiga och tomma hem har ingen privatlärare.")
two("eko","pop","Likvidation",f"Likvidation är ett sätt att {G} ett aktiebolag. Likvidatorn ska göra om bolagets tillgångar till pengar och {G} dess skulder.",
 ["avveckla","lösa"],[["upplösa","fördubbla"],["grunda","göra upp"],["lackera","maskera"]],T2,F2,["v","v"],["def","kol"],
 "Rätt svar är avveckla och lösa. Ett bolag som likvideras läggs ned, och upplösa fungerar också. Pengarna från tillgångarna används för att betala skulderna, och göra upp fungerar också. Man grundar eller lackerar inte ett bolag genom likvidation, och skulderna ska inte fördubblas eller maskeras.")
two("eko","pop","Frihandelsavtal",f"Ett frihandelsavtal är en överenskommelse mellan länder om att {G} tullar och andra hinder för handeln. Flera länder i samma region kan på så sätt {G} en gemensam marknad.",
 ["slopa","skapa"],[["avveckla","stänga"],["införa","upprätta"],["hyvla","äta"]],T2,F2,["v","v"],["def","kol"],
 "Rätt svar är slopa och skapa. Fri handel betyder att tullarna tas bort, och avveckla fungerar också. Länder som tar bort hindren mellan sig bygger upp en gemensam marknad, och upprätta fungerar också. Införa tullar strider mot fri handel, man stänger inte en marknad genom att ta bort hinder, och hyvla och äta ger ingen mening.")
two("jur","pop","Beslag",f"Beslag är ett tvångsmedel som får användas när någon är {G} för ett brott. Föremål som kan ha betydelse för utredningen får tas i beslag, och vid de allvarligaste brotten även det som någon har {G} på brottet.",
 ["misstänkt","tjänat"],[["anklagad","förlorat"],["oskyldig","förtjänat"],["gift","lånat"]],T2,F2,["a","v"],["kol","kol"],
 "Rätt svar är misstänkt och tjänat. Ett tvångsmedel under en utredning används innan någon är dömd, och anklagad fungerar också. Det som tas från en brottsling är vinsten av brottet, och förtjänat fungerar också. En oskyldig eller gift person är inget skäl till beslag, och det man förlorat eller lånat på ett brott tas inte i beslag.")
two("rel","pop","Helgon",f"Ett helgon är en person som är föremål för {G}, särskilt efter sin död. Inom kristendomen är det en avliden människa som kyrkan anser har levt i ovanligt djup {G} med Gud.",
 ["vördnad","gemenskap"],[["dyrkan","fejd"],["förakt","samhörighet"],["tull","tävling"]],T2,F2,["s","s"],["def","kol"],
 "Rätt svar är vördnad och gemenskap. Ett helgon är någon som människor ser upp till, och dyrkan fungerar också. Den som har levt nära Gud har ett band till honom, och samhörighet fungerar också. Förakt och tull är inte vad ett helgon får, och fejd eller tävling med Gud gör ingen till helgon.")
two("mil","pop","Klapperstensfält",f"På ett klapperstensfält ligger rundade stenar som vågorna har {G} vid stranden. Namnet kommer av det {G} ljud som hörs när stenarna slår mot varandra i vågorna.",
 ["format","slamrande"],[["slipat","tysta"],["målat","skramlande"],["sålt","doftande"]],T2,F2,["v","a"],["kol","kol"],
 "Rätt svar är format och slamrande. Vågor som rundar stenar ger dem deras form, och slipat fungerar också. Stenar som slår mot varandra låter högt och hårt, och skramlande fungerar också. Vågor målar eller säljer inte stenar, och ett ljud som hörs är varken tyst eller doftande.")
two("psy","pop","Vana",f"En vana är en handling som man upprepar och oftast utför {G}, och som sätts igång av en viss miljö eller känsla. Vanor som ställer till problem för den som har dem brukar kallas {G}.",
 ["omedvetet","ovanor"],[["per automatik","dygder"],["medvetet","laster"],["på rim","tavlor"]],T2,F2,["adv","s"],["def","kol"],
 "Rätt svar är omedvetet och ovanor. En vana utförs utan att man tänker på den, och per automatik fungerar också. Dåliga vanor har ett eget namn, och laster fungerar också. Medvetet strider mot att vanan sätts igång av sig själv, man utför inte en vana på rim, och dygder och tavlor är inte problem för den som har dem.")
# ---------- tre luckor ----------
three("sam","myn","Ensamkommande",f"Enligt FN är ensamkommande barn de som är under 18 år och har sökt eller fått asyl i ett land där de inte har sina föräldrar eller några andra {G}. Som sådana räknas i regel {G}. Om barnet saknar giltiga papper som visar hur gammalt det är kan en {G} göras.",
 ["vårdnadshavare","släktingar","åldersbedömning"],[["förmyndare","anhöriga","folkräkning"],["kamrater","anförvanter","prövning av åldern"],["lärare","poliser","skattesänkning"]],T3,F3,["s","s","s"],["def","kol","kol"],
 "Rätt svar är vårdnadshavare, släktingar och åldersbedömning. Föräldrar står bredvid, och det som saknas är vuxna som ansvarar för barnet, vilket förmyndare också säger. De som räknas som andra vuxna med ansvar är familjen, och anhöriga eller anförvanter fungerar också. Papper som saknas om åldern ersätts av en bedömning av den, och prövning av åldern fungerar också. Kamrater, lärare och poliser är inte barnets vårdnadshavare, och en folkräkning eller skattesänkning visar inte hur gammalt ett barn är.")
three("lit","pop","Antihjälte",f"En antihjälte är en central gestalt i en bok eller film som inte har de egenskaper en hjälte brukar ha, som mod och snabbhet, men som ändå {G} sympati hos publiken. Antihjälten kan vara {G} eller god, och gränsen mot skurken är därför inte alltid {G}.",
 ["väcker","ond","tydlig"],[["vinner","elak","oklar"],["tappar","ondskefull","skarp"],["stryker","grön","blöt"]],T3,F3,["v","a","a"],["kol","kon","ors"],
 "Rätt svar är väcker, ond och tydlig. Men ändå visar att antihjälten får publiken på sin sida, och vinner fungerar också. Eller god ställer det mot motsatsen, och elak eller ondskefull fungerar också. Eftersom antihjälten kan vara ond är det inte alltid lätt att se skillnad mot skurken, och skarp fungerar också. Tappar sympati strider mot men ändå, stryker och grön ger ingen mening, och en gräns som är oklar eller blöt förklarar inte att den är svår att se.")
three("spr","pop","Hyperbol",f"En hyperbol är en retorisk figur där man {G} överdriver. Överdriften kan göra något större eller mindre än det är, och den kan stå för sig själv eller ingå i en {G}. Det var Aristoteles som {G} den som en figur inom retoriken.",
 ["medvetet","jämförelse","införde"],[["avsiktligt","liknelse","avskaffade"],["omedvetet","parallell","lanserade"],["ljudlöst","dusch","åt"]],T3,F3,["adv","s","v"],["def","kon","kol"],
 "Rätt svar är medvetet, jämförelse och införde. En retorisk figur använder man med flit, och avsiktligt fungerar också. Att stå för sig själv ställs mot att ingå i något där två saker ställs mot varandra, och liknelse eller parallell fungerar också. Aristoteles gjorde hyperbolen till en del av retoriken, och lanserade säger samma sak. Omedvetet strider mot en retorisk figur, man överdriver inte ljudlöst eller i en dusch, och Aristoteles avskaffade eller åt inte figuren.")
three("utb","pop","Nollning",f"Nollning är de ritualer som ska {G} nya studenter vid en skola. Syftet är att introducera dem till staden, skolan och studentlivet, men nollningen har kritiserats för {G} inslag, och många gymnasier har {G} den.",
 ["välkomna","kränkande","förbjudit"],[["ta emot","förnedrande","infört"],["skrämma bort","pennalistiska","stoppat"],["debitera","gröna","sjungit"]],T3,F3,["v","a","v"],["def","kon","ors"],
 "Rätt svar är välkomna, kränkande och förbjudit. Ritualer för nya studenter ska göra att de känner sig hemma, och ta emot fungerar också. Men visar att kritiken gäller inslag som är dåliga för de nya, och förnedrande eller pennalistiska fungerar också. Kritiken har lett till att skolor har satt stopp för nollningen, och stoppat säger samma sak. Nollningen ska inte skrämma bort eller debitera studenterna, gröna inslag kritiseras inte, och gymnasier har inte infört eller sjungit nollningen på grund av kritiken.")
three("eko","pop","Varumärkesbyggande",f"Ett varumärke är en viktig {G} för ett företag. Genom att bygga varumärket för företaget som helhet vill man {G} dess ställning på marknaden, och för en enskild vara försöker man använda företagets goda rykte för att varan ska {G}.",
 ["tillgång","stärka","kännas igen"],[["resurs","befästa","glömmas"],["belastning","förbättra","bli igenkänd"],["förkylning","försvaga","ruttna"]],T3,F3,["s","v","utr"],["def","kol","kol"],
 "Rätt svar är tillgång, stärka och kännas igen. Ett varumärke som är viktigt för ett företag är något värdefullt, och resurs fungerar också. Den som bygger ett varumärke vill få en starkare plats på marknaden, och befästa eller förbättra fungerar också. Företagets rykte ska göra att kunderna känner till varan, och bli igenkänd säger samma sak. En belastning eller förkylning är inget viktigt för ett företag att bygga, man vill inte försvaga sin ställning, och varan ska inte glömmas eller ruttna.")
three("jur","pop","Nöd",f"Ordet nöd kan betyda ett farligt läge efter en olycka, men också stor {G}. Enligt brottsbalken är en handling som görs i nöd inte ett brott, om den inte är {G} med tanke på faran och den skada som {G} någon annan.",
 ["fattigdom","oförsvarlig","orsakas"],[["misär","oförlåtlig","läks"],["rikedom","orimlig","vållas"],["lättnad","rättvis","fikas"]],T3,F3,["s","a","v"],["kol","kol","kol"],
 "Rätt svar är fattigdom, oförsvarlig och orsakas. Nöd kan också betyda att man inte har det man behöver, och misär fungerar också. En handling i nöd är tillåten bara om den går att försvara, och oförlåtlig eller orimlig fungerar också. Skadan som jämförs med faran är den som drabbar någon annan, och vållas fungerar också. Rikedom och lättnad är inte nöd, en handling som är rättvis behöver inget undantag, och en skada som läks eller fikas någon annan ger ingen mening.")
three("jur","pop","Stöld",f"Stöld är att {G} ta något som tillhör någon annan. Brottet har funnits så länge det har funnits {G} lagar, och i Sverige räknas det som ringa stöld om det som har tagits har {G} värde.",
 ["olovligen","skrivna","obetydligt"],[["obehörigen","nedtecknade","stort"],["med tillåtelse","kodifierade","litet"],["artigt","sjungna","grönt"]],T3,F3,["adv","a","a"],["def","kol","kol"],
 "Rätt svar är olovligen, skrivna och obetydligt. Det som gör ett tagande till stöld är att man inte har lov, och obehörigen fungerar också. Brottet är så gammalt som lagar som är nedskrivna, och nedtecknade eller kodifierade fungerar också. Ringa stöld gäller saker som är värda lite, och litet fungerar också. Med tillåtelse och artigt tagande är inte stöld, sjungna lagar finns inte, och ett stort eller grönt värde gör inte stölden ringa.")
three("fil","pop","Falsifierbarhet",f"Falsifierbarhet betyder att det går att tänka sig en situation där ett påstående visar sig vara {G}. Inom vetenskapsteorin är det ett villkor om en teori ska räknas som vetenskaplig: den måste kunna {G} så att den går att {G}.",
 ["falskt","prövas","förkastas"],[["felaktigt","testas","bekräftas"],["sant","undersökas","avfärdas"],["ljummet","sjungas","ätas"]],T3,F3,["a","v","v"],["def","kol","kol"],
 "Rätt svar är falskt, prövas och förkastas. Falsifierbarhet handlar om att påståendet kan visa sig fel, och felaktigt fungerar också. En teori som ska kunna visa sig fel måste gå att sätta på prov, och testas eller undersökas fungerar också. Poängen är att teorin ska kunna läggas åt sidan om den inte håller, och avfärdas säger samma sak. Sant och ljummet är inte vad falsifiering visar, en teori sjungs eller äts inte, och att den kan bekräftas är inte vad falsifierbarhet kräver.")
three("mil","pop","Älv",f"En älv är ett stort vattendrag, som rinner från högre till lägre {G} och oftast mynnar i havet eller i en stor sjö. Älvar och floder är en viktig del av vattnets {G}, och de kan användas för bevattning, som {G} och för att producera el.",
 ["terräng","kretslopp","transportleder"],[["mark","omlopp","gravplatser"],["temperatur","cirkulation","farleder"],["åldrar","prisläge","soffor"]],T3,F3,["s","s","s"],["kol","def","par"],
 "Rätt svar är terräng, kretslopp och transportleder. Vatten rinner nedför, från högt liggande till lågt liggande mark, och mark fungerar också. Vattnet går runt mellan hav, moln och mark, och omlopp eller cirkulation fungerar också. Bevattning och el står bredvid som nyttor, och en flod kan också användas för att färdas på, vilket farleder också säger. Vatten rinner inte från högre temperatur eller åldrar, en flod är inte en del av vattnets prisläge, och gravplatser och soffor är inga nyttor man får av en flod.")
three("psy","pop","Gråt",f"Gråt är ett känslomässigt beteende där tårar rinner från ögonen, och det är bara delvis {G}. Det framkallas oftast av känslor som sorg och förtvivlan, men också av stor {G} eller av smärta, och precis som skratt tenderar gråt att vara socialt {G}.",
 ["viljestyrt","lycka","smittsamt"],[["kontrollerat","eufori","ensamt"],["godtyckligt","fröjd","smittande"],["fyrkantigt","törst","grönt"]],T3,F3,["a","s","a"],["def","kon","par"],
 "Rätt svar är viljestyrt, lycka och smittsamt. Man kan inte helt bestämma själv när man gråter, och kontrollerat fungerar också. Men också ställer sorg och förtvivlan mot motsatta känslor, och eufori eller fröjd fungerar också. Precis som skratt sprider sig gråt till andra, och smittande säger samma sak. Gråt är inte delvis godtyckligt eller fyrkantigt, törst är ingen motsats till sorg, och ensamt eller grönt stämmer inte med att gråt liknar skratt.")
write(36)
