import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from mekgen_lib import it, write, G
def one(a,g,t,txt,k,ds,dt,ok,lt,ex): it(a,g,t,txt,[k],[[d] for d in ds],dt,[[1],[1],[1]],[ok],[lt],ex)
two=it; three=it
F2=[[2],[1],[1,2]]; T2=[["de","fa"],["fa","de"],["fa","fa"]]
F3=[[3],[1],[1,2,3]]; T3=[["de","de","fa"],["fa","de","de"],["fa","fa","fa"]]
O=[["fa"],["fa"],["fa"]]
# ---------- en lucka ----------
one("med","myn","1177 Njursten",f"En njursten kan sitta där helt utan att ge besvär, och då upptäcks den ofta av en {G}, till exempel när man röntgas av något helt annat skäl.",
 "slump",["vana","regel","plan"],O,"s","kol",
 "Rätt svar är slump. Att stenen syns när man undersöks för något annat visar att ingen letade efter den. En vana, regel eller plan förklarar inte att stenen hittas när man söker något annat.")
one("med","myn","1177 Sängvätning hos barn",f"Sängvätning är inte farligt för kroppen, men det kan ge barnet sämre självförtroende. Barnet behöver därför höra att det inte är dess {G} att sängen blir blöt.",
 "fel",["vana","tur","sjukdom"],O,"s","ors",
 "Rätt svar är fel. Barnet ska inte känna att det har gjort något dåligt, och det är så självförtroendet skyddas. Vana, tur och sjukdom handlar inte om att barnet ska slippa skämmas.")
one("med","pop","Nysning",f"Nysningen är, liksom hostningen, kroppens sätt att {G} luftvägarna, och den framkallas oftast av att något retar nervcellerna i näsan.",
 "rensa",["kyla","fukta","vidga"],O,"v","kol",
 "Rätt svar är rensa. Något som retar näsan ska bort, och en snabb utblåsning av luft blåser bort det. Att kyla, fukta eller vidga luftvägarna gör inte en nysning.")
one("kul","pop","Rotmos",f"Till skillnad från potatismos görs rotmos vanligen utan mjölk och grädde. I stället används oftast {G} för att få rätt konsistens på moset.",
 "kokvattnet",["smöret","ägget","osten"],O,"s","kon",
 "Rätt svar är kokvattnet. I stället visar att en annan vätska tar mjölkens och gräddens plats, och rotfrukterna har kokats i vatten. Smör, ägg och ost är ingen vätska att späda moset med.")
one("kul","pop","Brännvin",f"Förr var brännvin ett {G} namn på alla spritdrycker, även whisky och konjak, men numera syftar ordet framför allt på sprit i nordisk stil.",
 "övergripande",["nedsättande","tekniskt","utländskt"],O,"a","kon",
 "Rätt svar är övergripande. Ett namn på alla spritdrycker samlar många sorter under sig, och men numera ställer det mot den snävare betydelsen. Nedsättande, tekniskt och utländskt säger inget om att ordet täckte alla sorter.")
one("kul","pop","Marionett",f"Marionetten är en docka med rörliga leder som styrs med trådar, och trådarna är så tunna att de på håll ser {G} ut.",
 "osynliga",["ljusa","böjda","färgade"],O,"a","ors",
 "Rätt svar är osynliga. Så fina att visar vad som händer med trådar som är mycket tunna, nämligen att man inte ser dem. Fina trådar ser inte ljusa, böjda eller färgade ut på avstånd för att de är tunna.")
one("his","pop","Ammor",f"En amma ger bröstmjölk åt ett spädbarn som hon inte själv är {G} mor till, och bruket var särskilt vanligt i Europas överklass under 1700-talet.",
 "biologisk",["ogift","fattig","vanlig"],O,"a","kon",
 "Rätt svar är biologisk. Inte själv mor till visar att amman inte har fött barnet. Att inte vara ogift, fattig eller vanlig mor till ett barn ger ingen mening.")
one("his","pop","Lasarett",f"Ordet lasarett är bildat av namnet Lasaros, som i den katolska kyrkan räknas som de sjukas {G}, och därför fick de medeltida sjukhusen för spetälska namn efter honom.",
 "skyddshelgon",["fiende","granne","motpol"],O,"s","ors",
 "Rätt svar är skyddshelgon. Därför visar att sjukhusen fick namn efter Lasaros för att han hade en särskild ställning för de sjuka i kyrkan. Ingen uppkallar sjukhus efter de sjukas fiende, granne eller motpol.")
one("sam","pop","Rådhus",f"Ett rådhus var i Sverige den byggnad där stadens rådhusrätt höll till. När tingsrätterna infördes 1971 {G} domstolen från kommunens förvaltning.",
 "skildes",["räknades","beskattades","valdes"],O,"v","kol",
 "Rätt svar är skildes. Kommun och domstol hade delat byggnad, och reformen förde dem åt var sitt håll. Verksamheter räknas, beskattas eller väljs inte från varandra.")
one("bio","pop","Mördarsnigel",f"Mördarsnigeln har spridits av människan, eftersom ägg och sniglar följer med när plantor och jord {G}, och i många trädgårdar har den blivit ett gissel.",
 "flyttas",["vattnas","gödslas","beskärs"],O,"v","ors",
 "Rätt svar är flyttas. Sniglar som följer med plantor och jord sprids när de förs från ett ställe till ett annat. Att vattna, gödsla eller beskära plantor sprider inte sniglarna till nya platser.")
one("bio","pop","Rödhake",f"Rödhaken är huvudsakligen en {G}, men den äter också bär och frön.",
 "insektsätare",["fröätare","växtätare","asätare"],O,"s","kon",
 "Rätt svar är insektsätare. Men också visar att bär och frön är ett komplement till den vanliga födan, så den kan inte vara frön. En växtätare äter redan bär och frön, och en liten tätting är ingen asätare.")
one("bio","pop","Gräsand",f"Gräsanden är mycket vanlig på norra halvklotet, och tillsammans med myskanden är den {G} till tamankorna.",
 "ursprunget",["fienden","konkurrenten","grannen"],O,"s","kol",
 "Rätt svar är ursprunget. Tamdjur kommer från vilda arter, och två vilda arter som tillsammans står bakom tamankorna är deras ursprung. En fiende, konkurrent eller granne till tamankorna förklarar inte varifrån de kommer.")
one("lit","pop","Protagonist",f"Protagonisten är den person i en berättelse som läsarens största {G} och identifikation ska ligga hos.",
 "sympati",["tvivel","avsky","förvåning"],O,"s","par",
 "Rätt svar är sympati. Identifikation står i samma led, och den man identifierar sig med känner man med. Tvivel, avsky och förvåning hör inte ihop med att identifiera sig med någon.")
one("utb","pop","Hedersdoktor",f"En hedersdoktor får titeln som en ren utmärkelse, alltså utan att ha {G} doktorsexamen vid universitetet.",
 "avlagt",["sökt","granskat","underkänt"],O,"v","kol",
 "Rätt svar är avlagt. En examen avläggs, och alltså visar att utmärkelsen ges utan den vanliga vägen till titeln. Att ha sökt, granskat eller underkänt en examen är inte det man annars behöver för att bli doktor.")
one("eko","pop","Checkkonto",f"Ett checkkonto används för pengar som ofta sätts in och tas ut, och i gengäld ger banken normalt ingen eller mycket låg {G} på pengarna som står där.",
 "ränta",["skatt","försäkring","rabatt"],O,"s","kol",
 "Rätt svar är ränta. Det banken ger för pengar på ett konto är ränta, och i gengäld visar att friheten att ta ut pengar kostar avkastningen. Banken ger ingen skatt, försäkring eller rabatt på pengar på ett konto.")
one("jur","pop","Myndighetsålder",f"Den som är myndig har rätt att på egen hand ingå {G} avtal, till exempel om ekonomiska överenskommelser.",
 "giltiga",["muntliga","olagliga","internationella"],O,"a","kol",
 "Rätt svar är giltiga. Att vara myndig innebär att avtalen man ingår gäller. Rätten handlar inte om muntliga eller internationella avtal, och ingen har rätt att ingå olagliga avtal.")
one("fil","pop","Panteism",f"Panteismen är en gudsuppfattning där allt anses vara besjälat av ett andligt väsen, och därför ses Gud och universum som {G}.",
 "identiska",["åtskilda","jämbördiga","oförenliga"],O,"a","ors",
 "Rätt svar är identiska. Om allt är besjälat av det gudomliga finns inget skilt mellan Gud och världen, och därför visar att de är samma sak. Åtskilda och oförenliga strider mot att allt är besjälat, och jämbördiga förutsätter två olika saker.")
one("mil","pop","Erosion",f"Erosion är att berg och jord nöts ned av vind, vatten eller is. Till skillnad från vittring kräver erosion också att materialet {G}.",
 "förs bort",["vittrar","kristalliseras","löses upp"],O,"utr","kon",
 "Rätt svar är förs bort. Till skillnad från visar att erosion har något som vittringen saknar, och nedbrutet material som stannar kvar har bara vittrat. Vittrar är just vittring, och kristalliseras eller löses upp är ingen skillnad mot vittring.")
one("psy","pop","Ögonkontakt",f"Med ögonkontakt kommunicerar man utan ord, men hur blicken används och tolkas {G} starkt mellan olika kulturer.",
 "skiftar",["dalar","läcker","prövas"],O,"v","kon",
 "Rätt svar är skiftar. Mellan olika kulturer visar att det handlar om skillnader, och men ställer det mot att ögonkontakt är ett gemensamt sätt att kommunicera. Dalar, läcker och prövas säger inget om skillnader mellan kulturer.")
one("tek","pop","Hiss",f"Elisha Otis säkerhetssystem för hissar visades 1853 och förändrade marknaden, eftersom det tidigare hade varit {G} att åka hiss.",
 "riskabelt",["dyrt","tröttsamt","bekvämt"],O,"a","ors",
 "Rätt svar är riskabelt. Ett säkerhetssystem förändrar marknaden om hissarna tidigare var farliga. Dyrt och tröttsamt löser inte ett säkerhetssystem, och bekvämt hade inte krävt något nytt.")
# ---------- två luckor ----------
two("med","myn","1177 Urinvägsinfektion hos kvinnor",f"Vid urinvägsinfektion kan det {G} när man kissar och strax efteråt, och det kan värka längst ned i magen. Efter ett par dagar {G} besvären ofta, och de kan gå över utan behandling.",
 ["svida","lättar"],[["göra ont","eskalerar"],["domna","ger med sig"],["klia","uppstår"]],T2,F2,["v","v"],["kol","kon"],
 "Rätt svar är svida och lättar. En infektion i urinvägarna ger en sveda när man kissar, och göra ont fungerar också. Att besvären sedan kan försvinna visar att de blir mindre, och ger med sig säger samma sak. Det domnar eller kliar inte när man kissar vid en infektion, och besvär som eskalerar eller uppstår efter några dagar går inte över av sig själva.")
two("med","myn","1177 Överaktiv blåsa",f"Många med en överaktiv blåsa lär sig att {G} med besvären, och det finns bra hjälp om de påverkar vardagen. Hjälp kan behövas till exempel om sömnen {G} av att man måste gå upp och kissa på natten.",
 ["leva","störs"],[["trivas","förbättras"],["tävla","avbryts"],["skämta","fördjupas"]],T2,F2,["v","v"],["kol","ors"],
 "Rätt svar är leva och störs. Att lära sig att klara vardagen trots besvär är att leva med dem, och trivas fungerar också. Att behöva gå upp på natten gör sömnen sämre, och avbryts fungerar också. Man tävlar eller skämtar inte med besvären, och sömnen förbättras eller fördjupas inte av att man går upp.")
two("med","myn","1177 Kronisk njursjukdom",f"Kronisk njursjukdom utvecklas under lång tid, ofta tio till trettio år, och det dröjer ofta flera år innan några symtom {G}. Man kan inte bli frisk, utan målet är att {G} sjukdomen så att njurarna inte blir ännu sämre.",
 ["visar sig","bromsa"],[["syns","påskynda"],["avklingar","hejda"],["botas","sprida"]],T2,F2,["v","v"],["kol","kon"],
 "Rätt svar är visar sig och bromsa. En sjukdom som utvecklas långsamt ger tecken först efter lång tid, och syns fungerar också. Utan ställer att bli frisk mot att få sjukdomen att gå långsammare, och hejda fungerar också. Symtom avklingar eller botas inte innan de har kommit, och ingen vill påskynda eller sprida en njursjukdom.")
two("med","myn","1177 Blåssten",f"Blåssten bildas av små kristaller som {G} till stenar i urinblåsan. Blåsstenar kan finnas i flera år utan att man {G} dem, och små stenar kan man kissa ut.",
 ["klumpar ihop sig","märker"],[["fogas samman","önskar"],["löses upp","känner av"],["smälter","tillåter"]],T2,F2,["utr","v"],["kol","kol"],
 "Rätt svar är klumpar ihop sig och märker. Små kristaller blir till stenar genom att fastna i varandra, och fogas samman fungerar också. I flera år utan att visar att stenen inte ger några tecken, och känna av fungerar också. Kristaller som löses upp eller smälter blir inga stenar, och ingen önskar eller tillåter blåssten.")
two("kul","pop","Dockteater",f"I dockteater framställs rollerna av dockor. Marionetter styrs {G} med linor eller stavar, medan stavdockor och handdockor styrs {G}.",
 ["ovanifrån","nedifrån"],[["uppifrån","ovanifrån"],["inifrån","underifrån"],["utifrån","framifrån"]],T2,F2,["adv","adv"],["kol","kon"],
 "Rätt svar är ovanifrån och nedifrån. Dockor som hänger i linor styrs från en plats över dem, och uppifrån fungerar också. Medan ställer de andra dockorna mot marionetterna, och en hand i en docka kommer underifrån. Inifrån och utifrån beskriver inte var linorna sitter, och ovanifrån eller framifrån står inte i motsats till marionetterna.")
two("kul","pop","Kabaré",f"Kabaré är en underhållningsform som främst {G} på restauranger och nattklubbar, med sketcher, sång och dans. Den europeiska kabarén bygger oftare på nyskapande än på {G} trender.",
 ["förekommer","kommersiella"],[["ges","konstnärliga"],["stängs","populära"],["tystnar","radikala"]],T2,F2,["v","a"],["kol","kon"],
 "Rätt svar är förekommer och kommersiella. En underhållningsform finns på vissa platser, och ges fungerar också. Nyskapande ställs mot det som är gjort för att sälja, och populära fungerar också. En underhållningsform stängs eller tystnar inte på restauranger, och konstnärliga eller radikala trender står inte i motsats till nyskapande.")
two("his","pop","Skeppsbyggnad",f"Att bygga skepp och fartyg är ett gammalt hantverk som bedrivs på ett {G}, och förr byggdes skeppen på en stapelbädd som {G} på en strand.",
 ["varv","låg"],[["skeppsvarv","flöt"],["kontor","stod"],["sjukhus","sjönk"]],T2,F2,["s","v"],["kol","kol"],
 "Rätt svar är varv och låg. Skepp byggs på ett varv, och skeppsvarv säger samma sak. En stapelbädd på en strand finns där, och stod fungerar också. Skepp byggs inte på kontor eller sjukhus, och en bädd på en strand flyter eller sjunker inte.")
two("his","pop","Tullstation",f"En tullstation finns vid en gräns mellan två områden för att {G} dem som passerar till en bestämd åtgärd och kontrollera att reglerna {G}.",
 ["tvinga","efterlevs"],[["förmå","undviks"],["locka","följs"],["hylla","ignoreras"]],T2,F2,["v","v"],["kol","kol"],
 "Rätt svar är tvinga och efterlevs. En kontroll vid gränsen gör att de som passerar måste göra något, och förmå fungerar också. Man kontrollerar att regler blir följda, och följs säger samma sak. En tullstation lockar eller hyllar inte dem som passerar, och ingen kontrollerar att regler undviks eller ignoreras.")
two("kul","pop","Friluftsmuseum",f"Ett friluftsmuseum visar en stor del av sina samlingar {G}, och grundstommen utgörs oftast av {G} byggnader som har flyttats dit.",
 ["utomhus","historiska"],[["under bar himmel","nybyggda"],["inomhus","gamla"],["virtuellt","provisoriska"]],T2,F2,["adv","a"],["def","kol"],
 "Rätt svar är utomhus och historiska. Ordet friluft visar att samlingarna visas ute, och under bar himmel fungerar också. Ett museum visar det som bevarats från förr, och gamla fungerar också. Inomhus och virtuellt strider mot friluft, och nybyggda eller provisoriska byggnader är inga museiföremål.")
two("sam","pop","Bostadsbrist",f"Bostadsbrist innebär att tillgången på bostäder är mindre än {G}. Den kan leda till trångboddhet och hemlöshet och i en marknadsekonomi till {G} hyror och priser.",
 ["efterfrågan","stigande"],[["behovet","sjunkande"],["utbudet","ökande"],["byggandet","frysta"]],T2,F2,["s","a"],["def","ors"],
 "Rätt svar är efterfrågan och stigande. Brist betyder att det finns färre bostäder än det finns folk som vill ha dem, och behovet fungerar också. När många vill ha det som är ont om blir det dyrare, och ökande säger samma sak. Utbudet är just tillgången, byggandet är inte vad tillgången jämförs med, och brist ger inte sjunkande eller frysta priser på en marknad.")
two("bio","pop","Vildsvin",f"Tamsvinet är den {G} formen av vildsvin. Vilda och tama svin parar sig gärna med varandra, och därför avgör man ofta utifrån {G} där populationen finns.",
 ["domesticerade","platsen"],[["tämjda","färgen"],["vilda","området"],["utrotade","antalet"]],T2,F2,["a","s"],["def","ors"],
 "Rätt svar är domesticerade och platsen. Ett tamdjur är ett djur som människan har gjort tamt, och tämjda fungerar också. Om djuren inte går att skilja åt genom avel avgör var de lever, och området fungerar också. Vilda och utrotade beskriver inte tamsvinet, och färgen eller antalet där populationen finns ger ingen mening.")
two("lit","pop","Översättare",f"Översättare överför texter mellan olika språk. Sker översättningen muntligt och i stunden kallas översättaren {G}, och facköversättare är ofta {G} på ett eller flera ämnen, som medicin eller juridik.",
 ["tolk","specialiserade"],[["simultantolk","ointresserade"],["redaktör","inriktade"],["lektör","okunniga"]],T2,F2,["s","a"],["def","kol"],
 "Rätt svar är tolk och specialiserade. Den som översätter muntligt är en tolk, och simultantolk fungerar också. En facköversättare har sitt fack, alltså ett ämne den kan särskilt väl, och inriktade säger samma sak. En redaktör eller lektör översätter inte muntligt, och en facköversättare är inte ointresserad av eller okunnig i sina ämnen.")
two("utb","pop","Seminarium",f"Till skillnad från en föreläsning förutsätter ett seminarium att alla deltagare är beredda att spela en {G} roll. Slutsatser dras och {G} sedan mot varandra.",
 ["aktiv","prövas"],[["deltagande","skrivs av"],["passiv","vägs"],["tyst","hyrs ut"]],T2,F2,["a","v"],["kon","kol"],
 "Rätt svar är aktiv och prövas. Till skillnad från en föreläsning, där man lyssnar, ska alla bidra, och deltagande fungerar också. Slutsatser som ställs mot varandra jämförs och bedöms, och vägs fungerar också. Passiv och tyst strider mot till skillnad från en föreläsning, och slutsatser skrivs inte av eller hyrs ut mot varandra.")
two("utb","pop","Speciallärare",f"En speciallärare arbetar med elever som behöver {G} stöd, till exempel vid svårigheter med läsning eller matematik. Till skillnad från specialpedagogen inriktar sig specialläraren på det {G} arbetet med eleverna.",
 ["särskilt","direkta"],[["extra","indirekta"],["ekonomiskt","praktiska"],["juridiskt","administrativa"]],T2,F2,["a","a"],["kol","kon"],
 "Rätt svar är särskilt och direkta. Elever med svårigheter i läsning behöver mer stöd än andra, och extra fungerar också. Till skillnad från specialpedagogen arbetar specialläraren själv med eleverna, och praktiska fungerar också. Ekonomiskt och juridiskt stöd hjälper inte mot svårigheter i läsning, och indirekta eller administrativa uppgifter är inte arbete direkt med eleverna.")
two("eko","pop","Sparbank",f"En sparbank saknar egentliga ägare och drivs utan enskilt {G}. Vinsten får därför bara delas ut till sådant som gynnar bygden eller {G} i banken.",
 ["vinstintresse","återinvesteras"],[["vinstsyfte","förskingras"],["kapital","plöjas ned"],["kontor","spelas bort"]],T2,F2,["s","v"],["def","kon"],
 "Rätt svar är vinstintresse och återinvesteras. En bank utan ägare har ingen som ska tjäna pengar på den, och vinstsyfte fungerar också. Vinsten som inte delas ut stannar i verksamheten, och plöjas ned säger samma sak. En bank drivs inte utan kapital eller kontor av det skälet, och vinsten får inte förskingras eller spelas bort.")
two("jur","pop","Köprätt",f"Köprätten är den del av avtalsrätten som {G} köp av olika slag. Köp av fast egendom ingår dock inte, utan {G} i stället till fastighetsrätten.",
 ["behandlar","hör"],[["reglerar","beror"],["ignorerar","räknas"],["hyllar","lämnas"]],T2,F2,["v","v"],["def","kol"],
 "Rätt svar är behandlar och hör. Ett rättsområde tar upp en viss sorts frågor, och reglerar fungerar också. Köp av fast egendom tillhör ett annat område, och räknas fungerar också. Köprätten ignorerar eller hyllar inte köp, och köp beror eller lämnas inte till fastighetsrätten.")
two("fil","pop","Pacifism",f"Pacifismen är en hållning som av religiösa eller etiska skäl {G} våld som ett sätt att lösa konflikter. Därför har man utvecklat tekniker för icke-våldsförsvar som ett {G} till militärt försvar.",
 ["avvisar","alternativ"],[["förkastar","komplement"],["förespråkar","substitut"],["förfinar","hot"]],T2,F2,["v","s"],["def","ors"],
 "Rätt svar är avvisar och alternativ. Den som är för fred tar avstånd från våld, och förkastar fungerar också. Den som avvisar militärt försvar behöver något i stället, och substitut säger samma sak. En pacifist förespråkar eller förfinar inte våld, och ett komplement eller hot till militärt försvar ersätter det inte.")
two("mil","myn","Övergödning",f"Övergödning uppstår när stora mängder kväve och fosfor sprids i vatten och mark. Då {G} mängden alger, och problemet är att vattenkvaliteten {G} och att det kan uppstå syrebrist.",
 ["ökar","försämras"],[["mångdubblas","förbättras"],["reduceras","blir sämre"],["smälter","höjs"]],T2,F2,["v","v"],["ors","kon"],
 "Rätt svar är ökar och försämras. Näring i vattnet får algerna att växa, och mångdubblas fungerar också. Att det är ett problem och att det blir syrebrist visar att vattnet blir sämre, och blir sämre fungerar också. Algerna reduceras inte av näring, alger smälter inte, och vattenkvalitet som förbättras eller höjs är inget problem.")
two("psy","pop","Kroppsspråk",f"Kroppsspråk är en form av {G} kommunikation, både medveten och omedveten. Det skiljer sig mellan människor och grupper och fungerar därför också som social och kulturell {G}.",
 ["icke-verbal","markör"],[["ordlös","kliché"],["skriftlig","signal"],["digital","fiende"]],T2,F2,["a","s"],["def","ors"],
 "Rätt svar är icke-verbal och markör. Kroppsspråk kommunicerar utan ord, och ordlös fungerar också. Något som skiljer grupper åt visar vilken grupp man hör till, och signal fungerar också. Kroppsspråk är varken skriftligt eller digitalt, och en kliché eller fiende visar inte tillhörighet.")
two("spr","pop","Versal",f"Versaler är alfabetets stora bokstäver, i {G} till gemener. På engelska kallas de upper case, eftersom typerna förr {G} i den övre av två lådor vid handsättning.",
 ["kontrast","förvarades"],[["opposition","trycktes"],["likhet","låg"],["harmoni","brändes"]],T2,F2,["s","v"],["kon","ors"],
 "Rätt svar är kontrast och förvarades. Stora bokstäver står mot de små, och opposition fungerar också. Namnet övre lådan kommer av var typerna hade sin plats, och låg fungerar också. Likhet och harmoni strider mot att stora och små bokstäver ställs mot varandra, och typer trycks eller bränns inte i en låda.")
# ---------- tre luckor ----------
three("kul","pop","Spinneri",f"Spinning är framställning av tråd eller garn, och metoden är {G}: handspinning har minst 8 000 år på nacken. Sländan är tusentals år gammal, medan spinnrockar {G} först under och efter medeltiden. Sedan 1800-talets mitt har fabrikerna helt {G} den storskaliga tillverkningen av garn.",
 ["uråldrig","introducerades","tagit över"],[["urgammal","kom","övergett"],["ny","blev vanliga","dominerat"],["bortglömd","brann upp","förlorat greppet om"]],T3,F3,["a","v","utr"],["def","kon","kol"],
 "Rätt svar är uråldrig, introducerades och tagit över. Kolonet förklarar med de 8 000 åren, och urgammal säger samma sak. Medan ställer de gamla sländorna mot rockarna som kom senare, och kom eller blev vanliga fungerar också. Helt visar att industrin står för hela tillverkningen, och dominerat fungerar också. En metod som är 8 000 år är inte ny eller bortglömd, rockar brann inte upp under medeltiden, och fabrikerna har inte övergett eller förlorat greppet om tillverkningen.")
three("sam","pop","Barnbidrag",f"Barnbidrag är statligt {G} till familjer med barn. Sverige har en {G} modell: år 1947 ersattes ett behovsprövat bidrag med ett {G} barnbidrag som alla familjer får.",
 ["understöd","generell","allmänt"],[["bistånd","enhetlig","inkomstprövat"],["skatt","selektiv","gemensamt"],["kredit","provisorisk","behovsprövat"]],T3,F3,["s","a","a"],["kol","def","kon"],
 "Rätt svar är understöd, generell och allmänt. Ett bidrag är en hjälp med pengar, och bistånd fungerar också. Kolonet förklarar modellen med ett bidrag som gäller alla, och enhetlig fungerar också. Ett bidrag som alla familjer får är för alla, och gemensamt fungerar också. Ett bidrag är inte en skatt eller kredit, en modell för alla är inte selektiv eller provisorisk, och inkomstprövat eller behovsprövat strider mot att alla får det.")
three("sam","pop","Välgörenhet",f"Välgörenhet är privat verksamhet för att hjälpa {G} människor. Den som ger en gåva till ett gott ändamål kallas donator, och hjälporganisationerna drivs ofta av {G}. Där staten och kommunerna sköter mycket av välfärden spelar välgörenheten en mer {G} roll.",
 ["behövande","volontärer","underordnad"],[["nödställda","ideellt arbetande","central"],["rika","eldsjälar","blygsam"],["friska","ämbetsverk","avgörande"]],T3,F3,["a","s","a"],["kol","kol","ors"],
 "Rätt svar är behövande, volontärer och underordnad. Välgörenhet hjälper dem som saknar något, och nödställda fungerar också. Privat verksamhet som ofta drivs av människor som ställer upp utan lön, och ideellt arbetande eller eldsjälar fungerar också. Där det offentliga tar ansvaret behövs välgörenheten mindre, och blygsam säger samma sak. Rika och friska behöver ingen hjälp, privat verksamhet drivs inte av ämbetsverk, och central eller avgörande strider mot att det offentliga tar ansvaret.")
three("lit","pop","Bokmässa",f"En bokmässa samlar förlag, bokhandlare, bibliotek, författare och läsare. Handel med {G} är en central del av verksamheten, och många mässor har varje år ett {G} som riktar ljuset mot ett land, ett ämne eller ett språk. Det finns både fackmässor för branschen och mässor som {G} sig till allmänheten.",
 ["utgivningsrättigheter","tema","vänder"],[["rättigheter","motto","stänger"],["frimärkssamlingar","fokusområde","riktar"],["vapen","skuldebrev","gömmer"]],T3,F3,["s","s","v"],["kol","def","kon"],
 "Rätt svar är utgivningsrättigheter, tema och vänder. På en mässa för bokbranschen handlar förlagen med rätten att ge ut böcker, och rättigheter fungerar också. Något som riktar ljuset mot ett land eller ämne är mässans tema, och motto eller fokusområde fungerar också. Både och ställer branschen mot allmänheten som publik, och riktar säger samma sak. Frimärkssamlingar och vapen säljs inte på en bokmässa, ett skuldebrev riktar inte ljuset mot ett land, och en mässa stänger eller gömmer sig inte till allmänheten.")
three("lit","pop","Redaktör",f"En redaktör är den som {G} eller redigerar innehållet i en tidning, en tidskrift eller ett bokverk. På en föreningstidning med {G} upplaga får redaktören ofta sköta många roller själv av {G} skäl.",
 ["bestämmer över","liten","ekonomiska"],[["avgör","begränsad","religiösa"],["trycker","blygsam","finansiella"],["censurerar","enorm","medicinska"]],T3,F3,["utr","a","a"],["kol","kol","ors"],
 "Rätt svar är bestämmer över, liten och ekonomiska. En redaktör väljer vad som ska stå i tidningen, och avgör fungerar också. Den som sköter alla roller själv arbetar på en tidning som inte har råd med fler, och begränsad eller blygsam fungerar också. Skälet att en person gör allt är brist på pengar, och finansiella säger samma sak. En redaktör trycker eller censurerar inte innehållet, en enorm upplaga har råd med fler anställda, och religiösa eller medicinska skäl förklarar inte att en person gör allt.")
three("utb","pop","Waldorfpedagogik",f"Waldorfpedagogiken bygger på antroposofins {G} och lägger lika stor vikt vid {G} av barnens tankar, känslor och vilja. Skolan strävar efter att ha {G} klasser från första till tolfte året.",
 ["människosyn","utvecklingen","sammanhållna"],[["världsbild","mognaden","splittrade"],["ekonomi","tillväxten","samlade"],["arkitektur","försämringen","nyinsatta"]],T3,F3,["s","s","a"],["kol","kol","def"],
 "Rätt svar är människosyn, utvecklingen och sammanhållna. En pedagogik bygger på en uppfattning om människan, och världsbild fungerar också. Tankar, känslor och vilja hos barn är något som växer, och mognaden eller tillväxten fungerar också. Från första till tolfte året visar att klassen ska hålla ihop, och samlade säger samma sak. En pedagogik bygger inte på ekonomi eller arkitektur, ingen skola lägger vikt vid barns försämring, och splittrade eller nyinsatta klasser hålls inte ihop i tolv år.")
three("eko","pop","Devalvering",f"Vid en devalvering skrivs värdet {G} på en valuta som har fast växelkurs. Syftet är ofta att förbättra bytesbalansen, eftersom en devalvering {G} exporten. Samtidigt blir importerade varor dyrare, och då riskerar {G} att öka.",
 ["ned","gynnar","inflationen"],[["om","stärker","arbetslösheten"],["upp","främjar","prisnivån"],["in","hämmar","räntan"]],T3,F3,["adv","v","s"],["kol","ors","ors"],
 "Rätt svar är ned, gynnar och inflationen. En devalvering sänker valutans värde, och skrivs om fungerar också. En billigare valuta gör landets varor billigare utomlands, och stärker eller främjar fungerar också. Dyrare importvaror höjer priserna, och prisnivån säger samma sak. Ett värde skrivs inte upp eller in vid en devalvering, en devalvering hämmar inte exporten, och dyrare import ökar inte arbetslösheten eller räntan av sig själv.")
three("eko","pop","Postorder",f"Postorder är en försäljningsform där varorna {G} med posten och där köpare och säljare oftast inte har någon {G} kontakt. Förr i tiden {G} kunden oftast varorna i en katalog och beställde sedan via telefon eller brev.",
 ["levereras","fysisk","valde ut"],[["skickas","direkt","returnerade"],["återlämnas","egentlig","letade fram"],["förstörs","skriftlig","skrev"]],T3,F3,["v","a","utr"],["kol","kol","kol"],
 "Rätt svar är levereras, fysisk och valde ut. Varor som köps på distans kommer hem med posten, och skickas fungerar också. Säljare och köpare träffas inte, alltså har de ingen kontakt öga mot öga, och direkt eller egentlig fungerar också. En katalog är till för att hitta det man vill köpa, och letade fram säger samma sak. Varor återlämnas eller förstörs inte med posten vid ett köp, beställningar via brev är skriftlig kontakt, och man returnerar eller skriver inte varor i en katalog innan man beställt.")
three("jur","pop","Tomträtt",f"Tomträtt är en rätt att {G} mark som tillhör stat eller kommun och som har avdelats för att bebyggas. Rätten är betydligt {G} än en vanlig nyttjanderätt, men själva äganderätten {G} hos upplåtaren.",
 ["besitta","starkare","ligger kvar"],[["inneha","fastare","upphör"],["avyttra","tryggare","består"],["riva","svagare","flyttar"]],T3,F3,["v","a","utr"],["def","kol","kon"],
 "Rätt svar är besitta, starkare och ligger kvar. Tomträtt är en rätt att ha och bruka marken, och inneha fungerar också. Men visar att rätten är stark utan att ägandet följer med, och fastare eller tryggare fungerar också. Ägaren behåller marken, och består säger samma sak. Den som inte äger marken kan inte avyttra den, ingen river mark, svagare strider mot men, och ägandet upphör eller flyttar inte hos upplåtaren.")
three("spr","pop","Kursiv",f"Kursiv är en {G} bokstavsform. Namnet kommer av latinets ord för att löpa, och stilen uppstod som en {G} i påvens kansli på 1400-talet. Som trycktyp {G} den år 1501 av boktryckaren Aldus Manutius.",
 ["högerlutande","snabbskrift","lanserades"],[["snedställd","kortskrift","brändes"],["upprätt","hastig handstil","introducerades"],["fyrkantig","prydnadsskrift","makulerades"]],T3,F3,["a","s","v"],["kol","ors","kol"],
 "Rätt svar är högerlutande, snabbskrift och lanserades. Kursiv är den lutande stilen, och snedställd fungerar också. En skrift som fått namn efter att löpa skrevs fort, och kortskrift eller hastig handstil fungerar också. En boktryckare som för första gången erbjuder en ny typ för den ut i tryck, och introducerades säger samma sak. Upprätt och fyrkantig är inte kursiv, en prydnadsskrift skrivs inte fort, och en boktryckare bränner eller makulerar inte sina egna nya typer.")
write(28)
