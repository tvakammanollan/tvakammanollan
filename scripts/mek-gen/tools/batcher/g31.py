import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from mekgen_lib import it, write, G
def one(a,g,t,txt,k,ds,dt,ok,lt,ex): it(a,g,t,txt,[k],[[d] for d in ds],dt,[[1],[1],[1]],[ok],[lt],ex)
two=it; three=it
F2=[[2],[1],[1,2]]; T2=[["de","fa"],["fa","de"],["fa","fa"]]
F3=[[3],[1],[1,2,3]]; T3=[["de","de","fa"],["fa","de","de"],["fa","fa","fa"]]
O=[["fa"],["fa"],["fa"]]
# ---------- en lucka ----------
one("med","myn","1177 Diskbråck",f"Mellan ryggens kotor sitter mjuka diskar av brosk som fungerar som stötdämpare. Spricker en disk kan den mjuka kärnan {G} genom det fastare yttre lagret, och då har man fått ett diskbråck.",
 "bukta ut",["stelna","torka in","lösas upp"],O,"utr","kol",
 "Rätt svar är bukta ut. Ett bråck är något som tränger ut där det inte ska vara, och genom det yttre lagret visar riktningen. En kärna som stelnar, torkar in eller löses upp bildar inget bråck.")
one("med","myn","1177 Spinal stenos",f"Spinal stenos drabbar främst personer över 60. Värken sitter oftast i benen när man står eller går, och den lättar när man {G} sig framåt.",
 "böjer",["sträcker","vänder","spänner"],O,"v","kol",
 "Rätt svar är böjer. Framåt hör ihop med att kroppen kröks, och böja sig framåt är ett fast uttryck. Man sträcker, vänder eller spänner sig inte framåt för att lindra värken.")
one("med","pop","Puls",f"Hos en vuxen i vila slår hjärtat normalt 55 till 80 gånger i minuten. Pulsen ska vara jämn och {G}, och när man tar den bedöms också hur kraftig den är.",
 "rytmisk",["snabb","svag","långsam"],O,"a","par",
 "Rätt svar är rytmisk. Jämn och rytmisk hör ihop, eftersom båda beskriver att slagen kommer regelbundet. Snabb och långsam strider mot den normala vilopulsen, och svag strider mot att kraften bedöms för sig.")
one("kul","pop","Kladdkaka",f"Kladdkakan innehåller kakao, smör, socker, ägg och mjöl men inget bakpulver. Det är just {G} av luftbubblor i smeten som gör kakan kladdig.",
 "frånvaron",["mängden","storleken","färgen"],O,"s","ors",
 "Rätt svar är frånvaron. Utan bakpulver bildas inga bubblor, och det är därför kakan inte jäser upp. Mängden, storleken och färgen på luftbubblor förklarar inte att kakan saknar bakpulver.")
one("kul","pop","Kålpudding",f"Kålpudding är husmanskost, en låda med vitkål och köttfärs som gräddas i ugnen. Grundreceptet {G} kåldolmar, men puddingen har mer köttfärs och inget ris.",
 "påminner om",["konkurrerar med","ersätter","härstammar från"],O,"utr","kon",
 "Rätt svar är påminner om. Men ställer likheten mot skillnaderna i köttfärs och ris, alltså är recepten lika. Konkurrerar med och ersätter säger inget om likhet, och att puddingen härstammar från kåldolmar står inte i texten.")
one("his","pop","Vallgrav",f"En vallgrav är en bred och ofta vattenfylld grav runt murarna på en befäst anläggning. Sidorna är i regel {G}, så att den som anfaller får svårt att ta sig upp.",
 "branta",["grunda","flacka","gröna"],O,"a","ors",
 "Rätt svar är branta. Att anfallaren får svårt att ta sig upp visar att väggarna är svåra att klättra på. Grunda och flacka sidor är lätta att ta sig upp för, och gröna sidor stoppar ingen.")
one("sam","myn","Personnummer",f"Ett personnummer används för att {G} en person hos myndigheter, och det förekommer också i privata sammanhang, till exempel för att ange vem som är part i ett avtal.",
 "identifiera",["försäkra","värdera","anställa"],O,"v","kol",
 "Rätt svar är identifiera. Att ange vem som är part i ett avtal är att peka ut en bestämd person. Ett nummer försäkrar, värderar eller anställer ingen.")
one("sam","pop","Lekplats",f"På en lekplats finns ofta sandlåda, gungor och rutschkana. Moderna lekplatser byggs så att de är {G} och kan användas även av barn med funktionsnedsättning.",
 "tillgängliga",["målade","färgglada","inhägnade"],O,"a","def",
 "Rätt svar är tillgängliga. Att barn med funktionsnedsättning kan använda platsen är vad tillgänglighet innebär. Målade, färgglada och inhägnade lekplatser är inte därför möjliga att använda för alla.")
one("bio","pop","Storspov",f"Storspoven hör till världens största vadare, och den har långa ben. Näbben är lång och {G} nedåt.",
 "böjer av",["stelnar","ramlar","fäller"],O,"utr","kol",
 "Rätt svar är böjer av. En näbb som går nedåt har en krökt form. En näbb stelnar, ramlar eller fäller inte nedåt.")
one("bio","pop","Skäggdopping",f"Skäggdoppingen har fått sitt namn av den krage av svarta och rödbruna fjädrar som den vuxna fågeln {G} runt huvudet om sommaren.",
 "bär",["tappar","tvättar","gömmer"],O,"v","ors",
 "Rätt svar är bär. Namnet kommer av något som syns på fågeln, och ett krås i sommardräkten sitter på huvudet. En fågel som tappar eller gömmer sitt krås får inte namn efter det, och fåglar tvättar inte fjädrar på huvudet.")
one("bio","pop","Skrattmås",f"Den vuxna skrattmåsen har i sommardräkt mörkt huvud och röd näbb, medan nacke, bröst och buk är {G}.",
 "vita",["svarta","fläckiga","bruna"],O,"a","kon",
 "Rätt svar är vita. Medan ställer de övriga delarna mot det mörka huvudet, alltså är de ljusa. Svarta och bruna strider mot medan, och fläckiga står inte i motsats till mörkt.")
one("lit","pop","Idyll",f"Idyllen är en dikt om herdars och lantmäns enkla liv på landet, och hos den grekiske skalden Theokritos framstår herdelivet som ett {G} lugnt och lyckligt tillstånd.",
 "idealiskt",["hotat","förlorat","farligt"],O,"a","par",
 "Rätt svar är idealiskt. Lugnt och lyckligt beskriver ett tillstånd som ser fullkomligt ut. Hotat och farligt strider mot lugnt, och förlorat går inte ihop med att dikten skildrar livet som det är.")
one("lit","pop","Krönikör",f"En krönikör skriver krönikor i till exempel tidningar och utmärks av en {G} stil. Många är specialiserade och skriver om ekonomi, politik, kultur eller livsstil.",
 "egen",["anonym","juridisk","enhetlig"],O,"a","kol",
 "Rätt svar är egen. En krönika är en text där skribenten syns med sina egna åsikter. En anonym, juridisk eller enhetlig stil utmärker inte en krönikör.")
one("utb","pop","Huvudräkning",f"Huvudräkning är att räkna enbart med hjärnan, utan {G} som fingrar, kulram, papper eller miniräknare.",
 "hjälpmedel",["siffror","lärare","fel"],O,"s","def",
 "Rätt svar är hjälpmedel. Uppräkningen av fingrar, kulram och miniräknare visar vad som utesluts, och det är redskap. Man räknar inte utan siffror, och lärare eller fel är inte sådant som räknas upp.")
one("utb","pop","Miniräknare",f"Miniräknaren är en liten handhållen apparat för beräkningar, och den har {G} de äldre mekaniska räknemaskinerna och räknestickan.",
 "ersatt",["tillverkat","reparerat","ritat"],O,"v","kol",
 "Rätt svar är ersatt. Äldre visar att de gamla redskapen har fått lämna plats för den nya apparaten. En miniräknare tillverkar, reparerar eller ritar inte räknemaskiner.")
one("eko","pop","Minimilön",f"En minimilön är den lägsta lön som en arbetsgivare {G} betala för ett arbete. I Sverige finns ingen sådan i lag, utan den bestäms i kollektivavtal.",
 "får",["vill","brukar","hinner"],O,"v","kol",
 "Rätt svar är får. En lägsta tillåten lön handlar om vad som är lagligt, och utan i lag visar att det är en regel. Vad arbetsgivaren vill, brukar eller hinner betala är ingen minimilön.")
one("jur","pop","Klotter",f"Klotter är bilder, mönster eller budskap som ofta {G} på väggar och fordon, och brottet kan rubriceras som åverkan eller skadegörelse.",
 "olovligen målas",["lagligt ställs ut","försiktigt tvättas","gratis säljs"],O,"utr","kon",
 "Rätt svar är olovligen målas. Att det kan vara ett brott visar att målningen sker utan lov. Det som ställs ut lagligt, tvättas eller säljs är inget brott.")
one("mil","pop","Taiga",f"Taigan är det stora barrskogsbältet på norra halvklotet, från Skandinavien genom Sibirien till Kanada. Den rymmer större delen av jordens barrträd men är ändå ganska {G} på trädslag.",
 "fattig",["rik","känd","beroende"],O,"a","kon",
 "Rätt svar är fattig. Ändå visar att det ena går emot det andra, och trots många träd finns det få sorter. Rik strider mot ändå, och känd eller beroende på trädslag ger ingen mening.")
one("psy","pop","Ritual",f"Ritualer är sociala handlingar som bär en symbolisk mening och som {G} på fasta tider och i en fast form, till exempel en gudstjänst.",
 "upprepas",["uppfinns","ifrågasätts","glöms bort"],O,"v","kol",
 "Rätt svar är upprepas. Fasta tider och en fast form visar att handlingen görs om på samma vis. En ritual uppfinns, ifrågasätts eller glöms inte bort vid bestämda tider.")
one("tek","pop","Ficklampa",f"Den första ficklampan kom 1898 och förutsatte två andra uppfinningar, det torra batteriet och den lilla glödlampan. Den var från början för {G} för att rymmas i en ficka.",
 "stor",["ömtålig","ljus","svag"],O,"a","kol",
 "Rätt svar är stor. Få plats i en ficka handlar om storleken. En lampa som är ömtålig, ljus eller svag kan ändå få plats i fickan.")
# ---------- två luckor ----------
two("med","myn","1177 Ont i ryggen",f"Oftast sitter ryggvärken i ländryggen, och den börjar ofta svagt för att sedan {G}. Ryggskott är däremot en smärta som kommer {G}, ofta i samband med en rörelse.",
 ["tillta","plötsligt"],[["eskalera","gradvis"],["lägga sig","hastigt"],["släppa","periodvis"]],T2,F2,["v","adv"],["kon","kon"],
 "Rätt svar är tillta och plötsligt. Börjar svagt och sedan visar att värken blir starkare, och eskalera fungerar också. Däremot ställer ryggskottet mot den värk som kommer långsamt, och hastigt fungerar också. Lägga sig och släppa strider mot att värken börjar svagt, och gradvis eller periodvis står inte i motsats till en långsam start.")
two("med","myn","1177 Ryggbesvär hos barn",f"Hos barn hittar man sällan någon klar {G} till ryggbesvär. Värken kommer ofta när barnet anstränger sig på ett sätt det inte är vant vid, men också den som sitter {G} länge kan få ont.",
 ["orsak","still"],[["förklaring","i skuggan"],["medicin","stilla"],["lösning","upp"]],T2,F2,["s","adv"],["kol","kon"],
 "Rätt svar är orsak och still. Det man letar efter när ett barn har ont är varför, och förklaring fungerar också. Men också ställer stillasittande mot ansträngande rörelser, och stilla säger samma sak. En medicin eller lösning hittar man inte till besvären på det sättet, och att sitta i skuggan eller upp är inte motsatsen till rörelse.")
two("med","myn","1177 Pisksnärtskada",f"Pisksnärtskador uppstår oftast vid trafikolyckor där man blir påkörd {G}. Symtomen är bland annat ont i nacken och spända muskler, och de brukar komma {G} efter skadan, oftast inom några dygn.",
 ["bakifrån","snart"],[["från baksidan","sent"],["framifrån","strax"],["uppifrån","evigt"]],T2,F2,["adv","fu"],["kol","kol"],
 "Rätt svar är bakifrån och snart. En nacke som piskas till av en stöt kommer av att bilen träffas bakifrån, och från baksidan fungerar också. Oftast inom några dygn visar att symtomen kommer strax efter skadan, och strax fungerar också. Framifrån och uppifrån är inte det vanliga vid en påkörning, och sent eller evigt strider mot inom några dygn.")
two("med","myn","1177 Ont i nacke och axlar",f"Den som rör på sig {G} sin risk att få ont i rygg och nacke. Därför är det bra att fortsätta röra sig trots smärtan, till exempel att ta trapporna i stället för att åka {G}.",
 ["sänker","hiss"],[["reducerar","skidor"],["höjer","hissen"],["maskerar","cykel"]],T2,F2,["v","s"],["kol","kon"],
 "Rätt svar är sänker och hiss. Därför bra att röra sig visar att rörelsen skyddar mot värk, och reducerar fungerar också. I stället för att ta trapporna åker man något som lyfter en, och hissen fungerar också. Höjer och maskerar strider mot att det är bra att röra sig, och skidor eller cykel är inte det bekväma sätt att komma upp som trapporna ställs mot.")
two("kul","pop","Bonadsmålning",f"Bonadsmålningarna var målade utsmyckningar för bostaden, oftast med {G} motiv, och de målades på väv och senare även på papper. Traditionen kan följas tillbaka till senmedeltiden men hade sin {G} mellan 1750 och 1850.",
 ["bibliska","blomstring"],[["religiösa","nedgång"],["tekniska","glansperiod"],["juridiska","undergång"]],T2,F2,["a","s"],["kol","kon"],
 "Rätt svar är bibliska och blomstring. Bonader på landsbygden hade ofta motiv ur Bibeln, och religiösa fungerar också. Men ställer den långa historien mot den tid då traditionen var som starkast, och glansperiod säger samma sak. Tekniska och juridiska motiv målades inte på bonader, och nedgång eller undergång står inte i motsats till en lång historia.")
two("kul","pop","Fiol",f"Fiolen hör till stråkinstrumenten och har sedan 1600-talet varit ett av de {G} instrumenten i både klassisk musik och folkmusik. Det italienska ordet violino betyder egentligen liten viola och är alltså en {G}.",
 ["vanligaste","förminskningsform"],[["populäraste","pluralform"],["dyraste","diminutiv"],["tystaste","förstärkning"]],T2,F2,["a","s"],["kol","def"],
 "Rätt svar är vanligaste och förminskningsform. Ett instrument som spelas i både klassisk musik och folkmusik är mycket utbrett, och populäraste fungerar också. Liten viola visar att ordet gör något mindre, och diminutiv säger samma sak. Dyraste och tystaste följer inte av att fiolen spelas överallt, och en pluralform eller förstärkning betyder inte liten.")
two("his","pop","Krigsfånge",f"En krigsfånge är en person som fienden har {G} under ett krig. Sedan 1600-talet gäller att krigsfångar står under den krigförande statens välde och inte under den {G} soldat som har tagit dem.",
 ["frihetsberövat","enskilde"],[["fängslat","segrande"],["befriat","ensamme"],["anställt","döde"]],T2,F2,["v","a"],["def","kon"],
 "Rätt svar är frihetsberövat och enskilde. En fånge är någon som har tagits till fånga, och fängslat fungerar också. Staten ställs mot den person som själv tog fångarna, och ensamme fungerar också. Den som befriats eller anställts är ingen fånge, och den segrande eller döde soldaten är inte motsatsen till staten.")
two("his","pop","Legostadga",f"Legostadgan var en lag som {G} förhållandet mellan husbonde och tjänstehjon. Den första kom 1664, och den gav husbönderna skyldighet att erbjuda drängar och pigor {G} i form av årstjänst.",
 ["styrde","laga försvar"],[["ordnade","permission"],["upplöste","skydd"],["upphävde","plikter"]],T2,F2,["v","utr"],["def","kol"],
 "Rätt svar är styrde och laga försvar. En lag om förhållandet mellan två parter bestämmer hur det ska vara, och ordnade fungerar också. Årstjänst var det skydd husbonden skulle ge tjänstefolket, och skydd fungerar också. En lag upplöste eller upphävde inte förhållandet, och permission eller plikter ges inte i form av årstjänst.")
two("sam","pop","Insamlingsstiftelse",f"En stiftelse saknar både medlemmar, som en förening har, och {G}, som ett bolag har. Den förvaltar en förmögenhet som har avsatts för ett {G} ändamål.",
 ["ägare","särskilt"],[["delägare","okänt"],["ändamål","bestämt"],["kontor","påhittat"]],T2,F2,["s","a"],["kon","kol"],
 "Rätt svar är ägare och särskilt. Bolag har ägare och föreningar medlemmar, och stiftelsen saknar båda, och delägare fungerar också. En förmögenhet som avsätts för något bestämt har ett utpekat syfte, och bestämt fungerar också. En stiftelse har ändamål, ett kontor ersätter inte ett bolags ägare, och ett okänt eller påhittat ändamål går inte att förvalta för.")
two("sam","myn","Poströstning",f"Förtidsröstning är till för den som inte kan rösta i sin egen {G} på valdagen, till exempel sjömän eller den som vistas utomlands. Man kan rösta i en särskild lokal eller skicka rösten {G}, så kallad brevröstning.",
 ["vallokal","per post"],[["valkrets","elektroniskt"],["bostad","med posten"],["skola","muntligt"]],T2,F2,["s","utr"],["kol","def"],
 "Rätt svar är vallokal och per post. På valdagen röstar man i sin vallokal, och valkrets fungerar delvis också. Brevröstning sker genom att rösten skickas, och med posten säger samma sak. Man röstar inte i sin bostad eller skola på valdagen, och elektronisk eller muntlig röstning är inte brevröstning.")
two("bio","pop","Skogsödla",f"Skogsödlan kan bli 18 centimeter lång och lever i skogar och på andra platser med {G} mikroklimat och hög vegetation. Ryggen är brunaktig, och svansen är ofta {G} än kroppen.",
 ["fuktigt","mörkare"],[["blött","ljusare"],["torrt","dunklare"],["salt","tunnare"]],T2,F2,["a","a"],["kol","kol"],
 "Rätt svar är fuktigt och mörkare. Skog med hög vegetation håller kvar fukten, och blött fungerar också. Svansen beskrivs i jämförelse med den bruna ryggen, och dunklare fungerar också. Torrt och salt mikroklimat finns inte i en skog med hög vegetation, och ljusare eller tunnare är inte det som står om svansen.")
two("bio","pop","Makrill",f"Makrillen är en {G} matfisk som i Sverige främst fiskas på västkusten, och den är Bohusläns landskapsfisk. Den gör regelbundna {G} för att leka och söka föda.",
 ["omtyckt","vandringar"],[["uppskattad","pauser"],["giftig","förflyttningar"],["fridlyst","dykningar"]],T2,F2,["a","s"],["kol","kol"],
 "Rätt svar är omtyckt och vandringar. En fisk som är landskapsfisk och fiskas mycket är populär, och uppskattad fungerar också. Att leka och söka föda på olika platser kräver att fisken rör sig, och förflyttningar fungerar också. En giftig fisk är ingen matfisk, en fridlyst fisk fiskas inte alls, och pauser eller dykningar tar fisken inte till nya platser.")
two("lit","pop","Psalmbok",f"En psalmbok är en sångsamling som ett kristet samfund officiellt har {G}. När den trycks läggs ofta en samling böner till, och arbetet med en ny psalmbok brukar ledas av en {G} som lägger fram ett förslag.",
 ["antagit","redaktion"],[["godkänt","församling"],["förbjudit","kommitté"],["sålt","orkester"]],T2,F2,["v","s"],["kol","kol"],
 "Rätt svar är antagit och redaktion. En officiell sångbok har samfundet beslutat att använda, och godkänt fungerar också. Den som arbetar fram ett förslag till en ny bok är en grupp redaktörer, och kommitté fungerar också. Ett samfund förbjuder eller säljer inte sin officiella bok, och en församling eller orkester lägger inte fram förslag till psalmboken.")
two("utb","pop","Allmänbildning",f"Allmänbildning är bred kunskap om allmänna ämnen, till skillnad från {G}. Ibland omfattar begreppet också ett moget {G} och insikt om var ens egen kunskap tar slut.",
 ["fackkunskap","omdöme"],[["specialkunskap","utseende"],["nyfikenhet","förstånd"],["skostorlek","röstläge"]],T2,F2,["s","s"],["kon","kol"],
 "Rätt svar är fackkunskap och omdöme. Bred kunskap ställs mot djup kunskap i ett fack, och specialkunskap fungerar också. Mogen och medvetenhet om gränserna handlar om förmågan att bedöma, och förstånd fungerar också. Nyfikenhet och skostorlek är inte motsatser till bred kunskap, och utseende eller röstläge hör inte till bildning.")
two("eko","pop","Auktionshus",f"Ett auktionshus bedriver {G}, även om allt fler övergår till budgivning på nätet. Där arbetar bland annat värderingsexperter och intendenter, som ofta har särskilda {G} som måleri, smycken eller möbler.",
 ["slagauktioner","expertområden"],[["auktioner","semestrar"],["butiker","specialiteter"],["konserter","rabatter"]],T2,F2,["s","s"],["kol","def"],
 "Rätt svar är slagauktioner och expertområden. Ett auktionshus säljer genom auktion, och auktioner fungerar också. Måleri, smycken och möbler är områden som en expert kan, och specialiteter fungerar också. Butiker och konserter är inte auktioner, och semestrar eller rabatter är inget som måleri och smycken exemplifierar.")
two("eko","myn","Enskild näringsidkare",f"I en enskild firma är företaget och ägaren samma person, och ägaren är personligt {G} för alla skulder i verksamheten. Företagaren kan registrera ett firmanamn som {G} från det egna namnet.",
 ["ansvarig","avviker"],[["skyldig","vandrar"],["oskyldig","differerar"],["glad","hämtas"]],T2,F2,["a","utr"],["kol","kol"],
 "Rätt svar är ansvarig och avviker. När företaget och ägaren är samma person svarar ägaren själv för skulderna, och skyldig fungerar också. Ett firmanamn kan vara ett annat än det egna namnet, och differerar säger samma sak. Oskyldig och glad beskriver inte ansvaret för skulder, och ett namn vandrar eller hämtas inte från ett annat.")
two("jur","pop","Domare",f"En domare har till uppgift att {G} vid en domstol och lösa rättsliga tvister på ett slutgiltigt sätt. Domaren övervakar också att rättegången följer reglerna, för att säkerställa {G} och undvika godtycke.",
 ["döma","opartiskhet"],[["avgöra mål","partiskhet"],["vittna","neutralitet"],["åtala","popularitet"]],T2,F2,["v","s"],["def","kon"],
 "Rätt svar är döma och opartiskhet. Ordet domare kommer av att döma, och avgöra mål fungerar också. Att undvika godtycke kräver att domaren inte tar parti, och neutralitet säger samma sak. En domare vittnar eller åtalar inte, och partiskhet eller popularitet strider mot att godtycke ska undvikas.")
two("fil","pop","Pilgrim",f"En pilgrim reser till en {G} plats. Till skillnad från en turist väljer pilgrimen sitt mål i ett sökande efter Gud, och inte av {G} intresse för platsen.",
 ["helig","historiskt"],[["helgad","religiöst"],["avlägsen","kulturellt"],["ny","andligt"]],T2,F2,["a","a"],["kol","kon"],
 "Rätt svar är helig och historiskt. Ett sökande efter Gud leder till en plats som är helig, och helgad fungerar också. Turisten intresserar sig för platsens sevärdheter och förflutna, och kulturellt fungerar också. Avlägsen och ny säger inget om varför pilgrimen reser dit, och religiöst eller andligt intresse är just pilgrimens.")
two("mil","pop","Tundra",f"Tundran är ett trädlöst landskap med permafrost norr om taigan, och växtligheten där är låg och {G}. Alpin tundra finns i bergsområden ovanför {G}.",
 ["ömtålig","trädgränsen"],[["känslig","molnen"],["frodig","skogsgränsen"],["rik","havsytan"]],T2,F2,["a","s"],["kol","def"],
 "Rätt svar är ömtålig och trädgränsen. Låg växtlighet i ett kallt klimat tar lätt skada, och känslig fungerar också. Tundran är trädlös, alltså ligger den alpina tundran högre upp än träden växer, och skogsgränsen säger samma sak. Frodig och rik strider mot låg växtlighet, ovanför molnen beskriver inte var tundran börjar, och alla berg ligger ovanför havsytan.")
two("spr","pop","Tilltalsnamn",f"Tilltalsnamnet är det av en persons förnamn som används {G} tillsammans med efternamnet. Det är inte ovanligt att det är ett annat än det {G} förnamnet.",
 ["vid presentationer","första"],[["vid omnämnanden","mittersta"],["i sömnen","främsta"],["i hemlighet","längsta"]],T2,F2,["utr","a"],["def","kol"],
 "Rätt svar är vid presentationer och första. Ordet tilltalsnamn visar att det är namnet man kallas vid, alltså när man presenteras, och vid omnämnanden fungerar också. Det ovanliga i att tilltalsnamnet byter plats syftar på ordningen, och främsta fungerar också. I sömnen och i hemlighet är inte när ett tilltalsnamn används, och mittersta eller längsta förnamnet är inte det man väntar sig att tilltalsnamnet är.")
# ---------- tre luckor ----------
three("his","pop","Adelsprivilegier",f"Adelsprivilegier var gemensamma {G} och rättigheter för adeln, medan de enskilda släkternas adelskap reglerades av adelsbrev. Den äldsta regleringen är Alsnö stadga från 1280: den som gjorde krigstjänst till häst {G} att betala skatt för sina gårdar, och kunde därför ses som {G}.",
 ["förmåner","slapp","skattebefriad"],[["friheter","undgick","skattskyldig"],["plikter","befriades från","fri från skatt"],["bördor","tvingades","beskattad"]],T3,F3,["s","v","a"],["kol","kol","ors"],
 "Rätt svar är förmåner, slapp och skattebefriad. Privilegier är fördelar som en grupp får, och friheter fungerar också. Den som gjorde krigstjänst behövde inte betala skatt, och undgick eller befriades från fungerar också. Den som slipper skatt är befriad från den, och fri från skatt säger samma sak. Plikter och bördor är inte privilegier, den som tvingades betala hade inget privilegium, och skattskyldig eller beskattad strider mot att adeln slapp skatten.")
three("sam","myn","Nämnd",f"Ordet nämnd betecknar ofta en {G} inom stat eller kommun, men det kan också syfta på en grupp människor som tillsammans {G} eller utreder frågor på ett bestämt område. Kommunala nämnder ska {G} av kommunfullmäktige.",
 ["myndighet","beslutar","tillsättas"],[["förvaltning","avgör","avskaffas"],["festlighet","bestämmer","utses"],["butik","sover","säljas"]],T3,F3,["s","v","v"],["kol","kol","kol"],
 "Rätt svar är myndighet, beslutar och tillsättas. En statlig eller kommunal nämnd är ett organ som utövar offentlig makt, och förvaltning fungerar också. En grupp som utreder inom ett område fattar också beslut, och avgör eller bestämmer fungerar också. Fullmäktige utser nämndernas ledamöter, och utses säger samma sak. En nämnd är ingen festlighet eller butik, en grupp sover inte inom ett område, och fullmäktige avskaffar eller säljer inte nämnder när de ska tillsättas.")
three("lit","pop","Krönikespel",f"Ett historiskt drama skildrar en verklig händelse eller person och är {G} att spelas på en teaterscen. Genren har sitt {G} i antikens Grekland, och Aischylos drama Perserna, som skildrar grekernas seger över perserna, brukar ses som det {G} i genren.",
 ["avsett","upphov","första"],[["skrivet","avstamp","yngsta"],["olämpligt","fäste","tidigaste"],["omöjligt","slut","sämsta"]],T3,F3,["a","s","a"],["kol","kol","kol"],
 "Rätt svar är avsett, upphov och första. Ett drama är skrivet för att framföras, och skrivet fungerar också. Genren började i antikens Grekland, och avstamp eller fäste fungerar också. Ett drama som visar var genren började är det äldsta, och tidigaste säger samma sak. Ett drama är inte olämpligt eller omöjligt att spela för att det är historiskt, en genre har inte sitt slut där den börjar, och det yngsta eller sämsta dramat visar inte var genren började.")
three("utb","pop","Studentskiva",f"Gymnasieskolornas avslutning skiljer sig mellan skolor men har gemensamma drag. Firandet {G} i april med att studenterna sätter på sig mössan, och på avslutningsdagen sjunger de {G}. Skoldagen slutar med ett utspring, då studenterna {G} skolan.",
 ["inleds","sina sånger","lämnar"],[["startar","visor","stänger"],["avslutas","traditionella sånger","springer ut ur"],["ställs in","nationalsånger","städar"]],T3,F3,["v","s","v"],["kol","kol","def"],
 "Rätt svar är inleds, sina sånger och lämnar. Att mössan sätts på i april är början på firandet, och startar fungerar också. Studenterna sjunger de sånger som hör till dagen, och visor fungerar också. Ordet utspring visar att studenterna rusar ut ur skolan, och springer ut ur säger samma sak. Firandet avslutas eller ställs inte in i april, traditionella sånger kan vara vad som helst och nationalsånger är inte studenternas egna, och studenterna stänger eller städar inte skolan vid utspringet.")
three("eko","pop","Mynt",f"Ett mynt är ett {G} stycke metall som används som betalningsmedel. Ordet mynt går tillbaka på det latinska moneta, som från början var ett {G} till gudinnan Juno, och vid hennes tempel fanns ett myntverk. Det var ett av de {G} ord som svenskan lånade från lågtyskan.",
 ["präglat","binamn","tidigaste"],[["stämplat","tillnamn","senaste"],["smält","smeknamn","äldsta"],["sprucket","offer","dyraste"]],T3,F3,["a","s","a"],["kol","def","kol"],
 "Rätt svar är präglat, binamn och tidigaste. Ett mynt får sitt mönster genom att metallen präglas, och stämplat fungerar också. Moneta var ett namn som Juno också kallades, och tillnamn eller smeknamn fungerar också. Ett ord som kom in mycket tidigt hör till de äldsta lånorden, och äldsta säger samma sak. Smält och sprucket metall är inga mynt, ett offer är inget namn, och de senaste eller dyraste lånorden kom inte först.")
three("jur","pop","Försök till brott",f"Den som gör ett brottsförsök har {G} att utföra brottet men inte fullbordat det. Enligt brottsbalken kan den som har {G} ett brott dömas för försök, om det fanns {G} att handlingen skulle leda till att brottet fullbordades.",
 ["kommit nära","påbörjat","fara"],[["varit på väg","inlett","ursäkt"],["avstått","börjat","risk"],["struntat i","anmält","tur"]],T3,F3,["utr","v","s"],["def","kol","kol"],
 "Rätt svar är kommit nära, påbörjat och fara. Ett försök som inte fullbordas har nästan blivit av, och varit på väg fungerar också. Den som har börjat utföra brottet kan dömas för försöket, och inlett eller börjat fungerar också. Det som avgör är att handlingen kunde ha lett till brottet, och risk säger samma sak. Den som avstått eller struntat i det har inte försökt, den som anmält ett brott har inte begått det, och en ursäkt eller tur gör inte ett försök straffbart.")
three("fil","pop","Ödet",f"Ödet är summan av de händelser som en människa möter i livet, till lycka eller {G}. En människas öde bestäms av många inre och yttre {G}, bland annat hennes medfödda natur och de omständigheter hon lever under. Ödet kan också ses som ett {G} förlopp.",
 ["olycka","orsaker","förutbestämt"],[["missöde","faktorer","slumpmässigt"],["arbete","krafter","fastställt"],["helg","möbler","okänt"]],T3,F3,["s","s","a"],["kon","kol","def"],
 "Rätt svar är olycka, orsaker och förutbestämt. Till lycka eller ställer det goda mot det onda, och missöde fungerar också. Natur och omständigheter är sådant som påverkar livet, och faktorer eller krafter fungerar också. Ödet som något bestämt i förväg är den andra betydelsen, och fastställt säger samma sak. Arbete och helg står inte i motsats till lycka, möbler är inte inre orsaker, och slumpmässigt eller okänt är inte vad ett öde är.")
three("mil","pop","Torka",f"Torka är en period med {G} vattentillgång jämfört med det normala. Den kan uppstå i alla klimatzoner och pågå i månader eller år. Meteorologisk torka är perioder med {G} nederbörd än vanligt, men också temperatur, vind och {G} påverkar hur torkan uppstår.",
 ["minskad","knappare","luftfuktighet"],[["sänkt","lägre","solsken"],["ökad","sparsammare","markanvändning"],["normal","rikligare","fiskefångst"]],T3,F3,["a","a","s"],["def","def","upp"],
 "Rätt svar är minskad, knappare och luftfuktighet. Torka är att det finns mindre vatten än vanligt, och sänkt fungerar också. Meteorologisk torka är när det regnar mindre, och lägre eller sparsammare fungerar också. Luftens fukt påverkar hur mycket som avdunstar, och markanvändning nämns också som en faktor. Ökad och normal vattentillgång är ingen torka, rikligare nederbörd ger ingen torka, och solsken eller fiskefångst är inte det som nämns bredvid temperatur och vind.")
three("psy","pop","Operant betingning",f"Operant betingning är ett begrepp från behaviorismen och innebär att ett beteende kan {G} eller släckas ut beroende på vilka {G} det får. När man lär en hund att sitta väntar man tills den sätter sig och {G} den då med en godisbit.",
 ["förstärkas","utfall","belönar"],[["stärkas","orsaker","straffar"],["glömmas","efterverkningar","premierar"],["ärvas","namn","tvättar"]],T3,F3,["v","s","v"],["kon","kol","kol"],
 "Rätt svar är förstärkas, utfall och belönar. Eller släckas ut ställer det som blir starkare mot det som försvinner, och stärkas fungerar också. Det som kommer efter ett beteende avgör om det upprepas, och efterverkningar fungerar också. En godisbit är en belöning, och premierar fungerar också. Ett beteende glöms eller ärvs inte beroende på följderna, orsaker eller namn är inte det som kommer efter beteendet, och man straffar eller tvättar inte en hund med en godisbit.")
three("spr","pop","Sje-ljudet",f"Sje-ljudet är ett tonlöst {G} som används i svenska ord som sju, passion och dusch. Det finns i en bakre och en främre {G}, men båda varierar mycket, bland annat beroende på {G}.",
 ["fonem","variant","dialekt"],[["språkljud","form","stavning"],["ord","version","talare"],["tecken","bokstav","väder"]],T3,F3,["s","s","s"],["def","kol","kol"],
 "Rätt svar är fonem, variant och dialekt. Ett ljud som skiljer betydelser åt i språket är ett fonem, och språkljud fungerar också. Bakre och främre beskriver två sorter av samma ljud, och form eller version fungerar också. Variationen hänger ihop med var talaren kommer ifrån, och talare fungerar också. Ord och tecken är inga ljud, en bokstav kan inte vara bakre eller främre, och stavning eller väder avgör inte hur ljudet uttalas.")
write(31)
