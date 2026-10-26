import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from mekgen_lib import it, write, G
def one(a,g,t,txt,k,ds,dt,ok,lt,ex): it(a,g,t,txt,[k],[[d] for d in ds],dt,[[1],[1],[1]],[ok],[lt],ex)
two=it; three=it
F2=[[2],[1],[1,2]]; T2=[["de","fa"],["fa","de"],["fa","fa"]]
F3=[[3],[1],[1,2,3]]; T3=[["de","de","fa"],["fa","de","de"],["fa","fa","fa"]]
O=[["fa"],["fa"],["fa"]]
# ---------- en lucka ----------
one("med","myn","1177 Blindtarmsinflammation",f"Vid blindtarmsinflammation får man ont långt ned till höger i magen. Det gör mer ont när man rör sig, hostar eller {G}, och efter något dygn kommer ofta lätt feber.",
 "nyser",["sitter still","läser","drömmer"],O,"v","par",
 "Rätt svar är nyser. Uppräkningen handlar om häftiga rörelser i kroppen, och en nysning skakar magen som en hostning. Att sitta still, läsa eller drömma rör inte magen.")
one("med","myn","1177 Spolmask",f"Spolmasken liknar en daggmask och blir ofta 10 till 30 centimeter lång. Den smittar inte mellan människor, och vid en lindrig infektion märks den sällan utan {G} oftast först i avföringen.",
 "upptäcks",["förökar sig","dör","bildas"],O,"v","kon",
 "Rätt svar är upptäcks. Utan ställer att masken inte märks mot det ställe där man ändå får syn på den. Att masken förökar sig, dör eller bildas i avföringen säger inget om att den inte märks.")
one("psy","pop","Hypokondri",f"Hypokondri är en {G} övertygelse om att man har eller ska få en svår sjukdom, trots att det saknas skäl för den.",
 "ogrundad",["kollektiv","delad","religiös"],O,"a","def",
 "Rätt svar är ogrundad. Trots att det saknas skäl förklarar ordet, alltså vilar övertygelsen inte på något. Kollektiv, delad och religiös säger inget om att det saknas skäl.")
one("kul","pop","Jojk",f"Jojken är en mycket gammal samisk sångform, och en jojk behöver inte innehålla några ord. Ofta förmedlar melodin budskap och känslor enbart med hjälp av {G}.",
 "ljud",["bilder","dans","färger"],O,"s","kon",
 "Rätt svar är ljud. En sång utan ord måste bära sitt budskap med rösten. Bilder, dans och färger är inte en del av en sång.")
one("kul","pop","Koral",f"Ordet koral kommer av latinets ord för körsång och betecknar {G} till en kyrkosång, som i Sverige ibland kallas psalmmelodi.",
 "melodin",["texten","ackompanjemanget","rytmen"],O,"s","def",
 "Rätt svar är melodin. Det svenska namnet psalmmelodi visar vad ordet betecknar. Texten, ackompanjemanget och rytmen är inte en melodi.")
one("kul","pop","Namnsdag",f"Förr användes namnsdagarna som {G} för när saker skulle göras under året, till exempel när potatisen skulle sättas eller rågen skördas.",
 "hållpunkter",["ursäkter","belöningar","undantag"],O,"s","kol",
 "Rätt svar är hållpunkter. Dagar som visar när arbetet ska göras är fasta punkter i kalendern. Ursäkter, belöningar och undantag säger inte när något ska göras.")
one("kul","pop","Husvagn",f"En husvagn är en släpvagn som dras av en bil och har {G} med sängar, matplats, kök och ibland toalett.",
 "inredning",["motor","last","takräcke"],O,"s","kol",
 "Rätt svar är inredning. Sängar, matplats och kök är det som finns inne i vagnen. En släpvagn har ingen motor, och last eller takräcke består inte av sängar och kök.")
one("his","pop","Klockare",f"Klockaren hade från början uppgiften att vårda kyrkan och ringa i klockorna. På 1600-talet fick han dessutom {G} ungdomen att läsa och skriva.",
 "lära",["hindra","straffa","kalla"],O,"v","kol",
 "Rätt svar är lära. Att läsa och skriva är något man undervisas i. Kyrkan ville inte hindra ungdomen att läsa, och straffa eller kalla ungdomen att läsa ger ingen mening.")
one("his","pop","Kyrkvärd",f"En kyrkvärd är en {G}, alltså någon utan prästvigning, som hjälper till vid gudstjänsten genom att till exempel hälsa välkommen, läsa texter och ta upp kollekt.",
 "lekman",["präst","biskop","kantor"],O,"s","def",
 "Rätt svar är lekman. Någon utan prästvigning är en lekman, och alltså förklarar ordet. En präst och en biskop är prästvigda, och en kantor leder sången och tar inte upp kollekten.")
one("sam","pop","Vandrarhem",f"Vandrarhemmen var från början avsedda för ungdomar som vandrade eller cyklade, och de utmärks av att gästerna har {G}, alltså lagar sin egen mat.",
 "självhushåll",["restaurang","bastu","reception"],O,"s","kol",
 "Rätt svar är självhushåll. Alltså förklarar ordet, och att laga sin egen mat är vad självhushåll innebär. I en restaurang lagar personalen maten, och bastu eller reception har inget med mat att göra.")
one("bio","pop","Fiskgjuse",f"Fiskgjusen är en hökfågel som lever {G} av fisk, som den tar vid vattenytan.",
 "endast",["tidvis","ibland","knappast"],O,"adv","def",
 "Rätt svar är endast. Namnet fiskgjuse och att den tar fisk vid vattenytan visar att fisk är dess föda. Tidvis, ibland och knappast strider mot att fågeln har fått namn efter fisken.")
one("bio","pop","Nötväcka",f"Nötväckan söker insekter på trädstammar, och om hösten lägger den frön och nötter på {G} inför vintern.",
 "lager",["hög","rad","linje"],O,"s","kol",
 "Rätt svar är lager. Att lägga på lager är ett fast uttryck för att spara till senare, och inför vintern visar att det är det som sker. Hög, rad och linje bildar inget sådant uttryck.")
one("lit","pop","Handskrift",f"Innan tryckkonsten uppfanns måste all litteratur {G} för hand, och medeltida handskrifter försågs ofta med färgade initialer och små bilder.",
 "kopieras",["läsas","gömmas","censureras"],O,"v","ors",
 "Rätt svar är kopieras. Innan tryckkonsten fanns måste nya exemplar av en bok göras av någon som skrev av den. Läsa, gömma och censurera gör man inte för hand.")
one("utb","pop","Kritor",f"Kritor är stavar av färgat vax, kol, kalk eller andra {G} material, och de används för att rita och skriva.",
 "mjuka",["gasformiga","genomskinliga","giftiga"],O,"a","par",
 "Rätt svar är mjuka. Vax, kol och kalk är material som nöts av mot ett underlag, och därför går det att rita med dem. Gasformiga, genomskinliga och giftiga stämmer inte med vax och kalk.")
one("eko","pop","Amortering",f"Amortering är en {G} på en skuld. Ett amorteringsfritt lån betalas däremot tillbaka i sin helhet när löptiden är slut.",
 "avbetalning",["påminnelse","avi","garanti"],O,"s","kon",
 "Rätt svar är avbetalning. Däremot ställer ett lån som betalas tillbaka på en gång mot ett som betalas i omgångar. En påminnelse, avi eller garanti betalar inte av skulden.")
one("jur","pop","Dagsböter",f"Vid dagsböter beror antalet böter på hur grovt brottet är, medan storleken på varje dagsbot beror på den dömdes {G}.",
 "inkomst",["hårfärg","bostad","utbildning"],O,"s","kon",
 "Rätt svar är inkomst. En bots storlek är ett belopp, och det ska stå i proportion till vad den dömde kan betala. Hårfärg, bostad och utbildning säger inget om hur mycket någon har råd att betala.")
one("fil","pop","Katharsis",f"Katarsis är grekiska och betyder rening. Aristoteles använde begreppet när han hävdade att tragedin {G} oss.",
 "befriar",["underhåller","skrämmer","fördummar"],O,"v","def",
 "Rätt svar är befriar. En rening gör att något tungt släpper, och det är vad katarsis innebär. Underhålla, skrämma och fördumma är inte en rening.")
one("mil","pop","Hagel",f"Hagel bildas när regn fryser till is i molnet, och kornen {G} när de förs upp och ned av luftströmmarna tills de blir för tunga och faller.",
 "växer",["avdunstar","spricker","mörknar"],O,"v","ors",
 "Rätt svar är växer. Tills de blir för tunga visar att kornen blir större för varje tur i molnet. Korn som avdunstar eller spricker blir inte tyngre, och korn som mörknar blir inte heller det.")
one("psy","pop","Spindelfobi",f"Spindelfobi är en överdriven och {G} rädsla för spindlar, trots att de flesta spindlar är ofarliga.",
 "irrationell",["berättigad","dold","ömsesidig"],O,"a","kon",
 "Rätt svar är irrationell. Trots att spindlarna är ofarliga visar att rädslan inte har något förnuftigt skäl. Berättigad strider mot trots, och dold eller ömsesidig säger inget om skälen.")
one("tek","pop","Fyr",f"En fyr är ett sjömärke som nattetid sprider ljus för att {G} sjöfarare om grund och visa dem var de befinner sig.",
 "varna",["underhålla","fråga","berätta"],O,"v","kol",
 "Rätt svar är varna. Ljus vid ett grund ska få sjöfarare att undvika faran, och varna om är ett fast uttryck. Ett ljus underhåller eller frågar inte, och berätta om grund säger man inte om ett sjömärke.")
# ---------- två luckor ----------
two("med","myn","1177 Ljumskbråck",f"Ljumskbråck går inte över av sig självt utan behöver {G}. Ett bråck uppstår när bukhinnan och en del av bukens innehåll {G} ut genom muskellagret i bukväggen.",
 ["opereras","pressas"],[["behandlas","rinner"],["läka","tränger"],["ignoreras","spolas"]],T2,F2,["v","v"],["kon","kol"],
 "Rätt svar är opereras och pressas. Utan ställer att bråcket inte läker själv mot att det måste åtgärdas, och behandlas fungerar också. Innehåll som kommer ut genom ett muskellager trycks ut, och tränger säger samma sak. Läka strider mot att bråcket inte går över av sig självt, ignoreras strider mot utan, och bukens innehåll rinner eller spolas inte ut.")
two("med","myn","1177 Halsbränna",f"Halsbränna känns som en {G} känsla bakom bröstbenet, och ibland kommer det upp surt maginnehåll i munnen. Besvären är ofta {G} och brukar ge med sig utan behandling.",
 ["brännande","lindriga"],[["svidande","allvarliga"],["kylande","milda"],["kittlande","kroniska"]],T2,F2,["a","a"],["def","kol"],
 "Rätt svar är brännande och lindriga. Ordet halsbränna förklarar känslan, och svidande fungerar också. Besvär som ger med sig utan behandling är inte svåra, och milda säger samma sak. Kylande och kittlande är inte en bränna, och allvarliga eller kroniska besvär ger inte med sig utan behandling.")
two("med","myn","1177 Magsår",f"Vid magsår har man ont i maggropen, ofta i {G}: några veckor med smärta kan följas av en tid helt utan symtom. Smärtan kan ibland upplevas som {G}.",
 ["perioder","hungersug"],[["omgångar","lättnad"],["sömnen","hunger"],["solsken","klåda"]],T2,F2,["s","s"],["def","kol"],
 "Rätt svar är perioder och hungersug. Kolonet förklarar att smärtan kommer och går, och omgångar fungerar också. Ont i maggropen kan likna känslan av att vara hungrig, och hunger fungerar också. Sömnen och solsken förklarar inte kolonet, och smärta upplevs inte som lättnad eller klåda.")
two("med","myn","1177 Kikhosta",f"Kikhosta börjar ofta som en vanlig förkylning, men efter en till två veckor {G} hostan i attacker. Små barn smittas nästan alltid av vuxna som inte själva vet att de är {G}.",
 ["övergår","sjuka"],[["slår om","friska"],["klingar av","smittade"],["bedarrar","vaccinerade"]],T2,F2,["v","a"],["kon","ors"],
 "Rätt svar är övergår och sjuka. Men ställer förkylningen mot något värre, alltså blir hostan till attacker, och slår om fungerar också. Den som smittar andra bär på sjukdomen, och smittade säger samma sak. En hosta som klingar av eller bedarrar blir inga attacker, och friska eller vaccinerade smittar inte.")
two("kul","pop","Bröllop",f"Ordet bröllop kommer av fornsvenskans brudlopp, som syftade på det {G} som förde bruden från hennes hem till det nya. Bröllopet {G} ibland av en förlovning.",
 ["följe","föregås"],[["sällskap","avslutas"],["avtal","inleds"],["regn","ersätts"]],T2,F2,["s","v"],["kol","kol"],
 "Rätt svar är följe och föregås. Ett lopp som för bruden till hennes nya hem är en grupp människor som går med henne, och sällskap fungerar också. En förlovning kommer före bröllopet, och inleds fungerar också. Ett avtal eller regn för inte bruden till sitt hem, och bröllopet avslutas eller ersätts inte av en förlovning.")
two("his","pop","Badort",f"På en typisk badort är turismen en viktig {G} för dem som bor där. På sommaren kan befolkningen {G} och sedan krympa igen när säsongen är över.",
 ["inkomstkälla","mångdubblas"],[["intäkt","halveras"],["sjukdom","tiodubblas"],["plåga","utvandra"]],T2,F2,["s","v"],["kol","kon"],
 "Rätt svar är inkomstkälla och mångdubblas. Turister ger pengar åt de bofasta, och intäkt fungerar också. När turisterna kommer på sommaren blir det många fler människor, och tiodubblas fungerar också. Turismen är ingen sjukdom eller plåga för dem som lever på den, och en befolkning som halveras eller utvandrar på sommaren stämmer inte med turismen.")
two("kul","pop","Kantor",f"Kantorn har fått sitt namn av latinets ord för sångare. Hen leder församlingens gemensamma {G} i gudstjänsten, medan prästen leder {G}.",
 ["sång","mässan"],[["psalmsång","kören"],["bokföring","gudstjänsten"],["måltid","orkestern"]],T2,F2,["s","s"],["def","kon"],
 "Rätt svar är sång och mässan. Ordet kantor betyder sångare, och psalmsång fungerar också. Medan ställer prästen mot kantorn, och prästen leder själva gudstjänsten, och gudstjänsten fungerar också. En kantor leder inte bokföringen eller måltiden, och prästen leder varken kören eller orkestern.")
two("sam","pop","Invandring",f"Invandring är att en person som är född i ett annat land flyttar in och {G} sig i landet. I statistiken räknas ofta även de som är födda i landet och {G} efter att ha bott länge utomlands.",
 ["bosätter","återvänder"],[["etablerar","emigrerar"],["roar","flyttar hem"],["skiljer","semestrar"]],T2,F2,["v","v"],["kol","kol"],
 "Rätt svar är bosätter och återvänder. Invandring är att stanna och bo i landet, och etablerar fungerar också. Den som är född i landet och kommer tillbaka efter en tid utomlands flyttar hem, och flyttar hem säger samma sak. Roar och skiljer sig i landet är inte invandring, och den som emigrerar eller semestrar flyttar inte in.")
two("sam","pop","Hotell",f"På ett hotell hyr man alltid ett helt rum och aldrig bara {G}, till skillnad från på ett vandrarhem. Självhushåll är som regel inte möjligt, och maten {G} därför på annat vis, till exempel i en restaurang på hotellet.",
 ["sängar","ordnas"],[["bäddar","slängs"],["dörrar","fixas"],["badrum","bannlyses"]],T2,F2,["s","v"],["kon","ors"],
 "Rätt svar är sängar och ordnas. Till skillnad från vandrarhemmet hyr man inte en plats i ett delat rum, och bäddar fungerar också. Om man inte kan laga mat själv måste den lösas på annat sätt, och fixas fungerar också. Dörrar och badrum hyrs inte ut för sig, och mat slängs eller bannlyses inte för att självhushåll saknas.")
two("bio","pop","Groda",f"Grodor skiljer sig från paddor genom att huden är {G} och fuktigare och att de {G} fram i stället för att krypa.",
 ["slätare","hoppar"],[["mjukare","kryper"],["vårtigare","skuttar"],["torrare","flyger"]],T2,F2,["a","v"],["par","kon"],
 "Rätt svar är slätare och hoppar. Huden beskrivs bredvid fuktigare som något som skiljer grodan från den vårtiga paddan, och mjukare fungerar också. I stället för att krypa visar att grodan tar sig fram på annat sätt, och skuttar säger samma sak. Vårtigare och torrare strider mot fuktigare, och kryper eller flyger stämmer inte med i stället för att krypa.")
two("bio","pop","Torsk",f"Torsken är en av de viktigaste {G} och har stor ekonomisk betydelse. Den säljs färsk eller fryst men också {G} och saltad som klippfisk.",
 ["matfiskarna","torkad"],[["konsumtionsfiskarna","kokt"],["rovfåglarna","lufttorkad"],["prydnadsfiskarna","målad"]],T2,F2,["s","a"],["kol","kol"],
 "Rätt svar är matfiskarna och torkad. En fisk som säljs och har ekonomisk betydelse äts, och konsumtionsfiskarna fungerar också. Klippfisk är fisk som har fått torka, och lufttorkad fungerar också. Torsken är ingen rovfågel eller prydnadsfisk, och kokt eller målad fisk är inte klippfisk.")
two("lit","pop","Trubadur",f"En trubadur är en sångare som oftast uppträder {G} med visor och ballader. Ordet kommer från de medeltida trubadurerna vid hoven i södra Frankrike, och på deras språk betydde det ungefär en som {G}.",
 ["ensam","hittar på"],[["solo","stjäl"],["i kör","diktar"],["tyst","tiger"]],T2,F2,["adv","utr"],["kol","kol"],
 "Rätt svar är ensam och hittar på. En trubadur står själv med sina visor, och solo fungerar också. En sångare som skriver egna visor skapar dem, och diktar fungerar också. I kör och tyst stämmer inte med en sångare som uppträder med visor, och ordet för en diktare betyder inte en som stjäl eller tiger.")
two("lit","pop","Uppslagsverk",f"Ett uppslagsverk vill {G} all kunskap, eller all kunskap inom ett visst ämne. Det liknar ordboken och är vanligen ordnat {G}.",
 ["sammanfatta","alfabetiskt"],[["samla","slumpvis"],["förneka","i bokstavsordning"],["censurera","kronologiskt"]],T2,F2,["v","adv"],["kol","kol"],
 "Rätt svar är sammanfatta och alfabetiskt. Ett verk med artiklar om alla ämnen försöker ge en översikt över kunskapen, och samla fungerar också. Liksom ordboken är det ordnat efter bokstäverna, och i bokstavsordning säger samma sak. Ett uppslagsverk förnekar eller censurerar inte vetande, och slumpvis eller kronologiskt är inte ordboksordning.")
two("utb","pop","Kandidatexamen",f"I Finland är kandidatexamen numera en lägre examen, och efter den {G} de flesta vidare till magister, även om examen är tänkt att kunna stå {G}.",
 ["läser","för sig själv"],[["studerar","i vägen"],["vilar","fritt"],["skriver","stilla"]],T2,F2,["v","utr"],["kol","kon"],
 "Rätt svar är läser och för sig själv. Den som fortsätter till en högre examen studerar vidare, och studerar fungerar också. Även om ställer att de flesta fortsätter mot att examen ska räcka ensam, och fritt fungerar också. Man vilar eller skriver inte vidare till magister, och en examen som står i vägen eller stilla är inte tänkt att räcka själv.")
two("utb","pop","Didaktik",f"Didaktik är vetenskapen om allt som påverkar undervisningen och dess innehåll, med fokus på hur {G} organiseras. Den är en del av {G} och delas in i allmän didaktik och ämnesdidaktik.",
 ["lärande","pedagogiken"],[["inlärning","juridiken"],["städning","utbildningsvetenskapen"],["semestern","medicinen"]],T2,F2,["s","s"],["kol","kol"],
 "Rätt svar är lärande och pedagogiken. Undervisning syftar till att elever lär sig, och inlärning fungerar också. En vetenskap om undervisning hör till läran om uppfostran och utbildning, och utbildningsvetenskapen fungerar också. Städning och semestern har inget med undervisning att göra, och didaktik är ingen del av juridiken eller medicinen.")
two("eko","pop","Grossist",f"Partihandel är handel med varor i stora {G}, framför allt mellan industrin och detaljhandeln. Den riktar sig inte till {G} konsumenter.",
 ["volymer","enskilda"],[["partier","alla"],["butiker","individuella"],["hamnar","avlägsna"]],T2,F2,["s","a"],["kol","kon"],
 "Rätt svar är volymer och enskilda. Ordet partihandel visar att varorna säljs i stora mängder, och partier fungerar också. Handel mellan industri och detaljhandel når inte den vanliga kunden, och individuella fungerar också. Butiker och hamnar är inte mängder av varor, och handeln riktar sig inte till alla eller avlägsna konsumenter.")
two("jur","pop","Rättshjälp",f"Med rättshjälp {G} samhället hela eller en del av en persons kostnader i en rättslig fråga. Den täcker bara de egna kostnaderna, så den som förlorar ett tvistemål får ändå betala {G} kostnader.",
 ["står för","motpartens"],[["betalar","domstolens"],["höjer","den andra sidans"],["granskar","statens"]],T2,F2,["utr","s"],["kol","kon"],
 "Rätt svar är står för och motpartens. Hjälp med kostnader är att någon annan betalar dem, och betalar fungerar också. Bara de egna ställs mot den andra partens kostnader, och den andra sidans säger samma sak. Det allmänna höjer eller granskar inte kostnaderna som hjälp, och den som förlorar betalar inte domstolens eller statens kostnader i stället för motpartens.")
two("mil","pop","Myr",f"En myr är en våtmark där marken innehåller så lite {G} att döda växter inte förmultnar utan samlas och blir till torv. Många svenska myrar har bildats när mark har {G} och blivit blöt.",
 ["syre","försumpats"],[["luft","torkat"],["salt","översvämmats"],["kalk","plogats"]],T2,F2,["s","v"],["ors","kol"],
 "Rätt svar är syre och försumpats. Växter förmultnar inte när det saknas syre i marken, och luft fungerar också. Mark som blir blöt blir sumpig, och översvämmats fungerar också. Salt och kalk förklarar inte att växterna inte förmultnar, och mark som torkar eller plogas blir inte blöt.")
two("psy","pop","Utbrändhet",f"Utbrändhet är ett tillstånd som hänger ihop med långvarig {G} i arbetslivet. Typiska tecken är cynism, utmattning och en känsla av att {G} för sina uppgifter.",
 ["stress","inte räcka till"],[["press","vara överkvalificerad"],["avkoppling","vara otillräcklig"],["fritid","trivas"]],T2,F2,["s","utr"],["kol","par"],
 "Rätt svar är stress och inte räcka till. Ett tillstånd som slutar i utmattning kommer av långvarig belastning, och press fungerar också. Cynism och utmattning hör ihop med en känsla av att inte klara jobbet, och vara otillräcklig säger samma sak. Avkoppling och fritid leder inte till utmattning, och den som är överkvalificerad eller trivs klarar sina uppgifter.")
two("spr","pop","Särskrivning",f"Vid särskrivning delas ett uttryck upp i två eller fler ord, och {G} är sammanskrivning. Felaktig särskrivning är ett vanligt skrivfel och kan göra att {G} blir en helt annan.",
 ["motpolen","betydelsen"],[["kontrasten","stavningen"],["synonymen","innebörden"],["förkortningen","uttalet"]],T2,F2,["s","s"],["kon","kol"],
 "Rätt svar är motpolen och betydelsen. Att skriva ihop är det motsatta mot att skriva isär, och kontrasten fungerar också. Ett felaktigt mellanrum kan få orden att säga något annat, och innebörden säger samma sak. En synonym eller förkortning är inte det motsatta mot särskrivning, och det är inte stavningen eller uttalet som blir en helt annan.")
# ---------- tre luckor ----------
three("kul","pop","Konfirmation",f"Konfirmation är en kyrklig akt som {G} dopet. I den katolska kyrkan räknas den som ett av de sju {G}, och den åtföljs av smörjelse med {G} olja.",
 ["stadfäster","sakramenten","invigd"],[["befäster","heliga handlingarna","otillåten"],["upphäver","mysterierna","välsignad"],["ersätter","budorden","bränd"]],T3,F3,["v","s","a"],["kol","kol","kol"],
 "Rätt svar är stadfäster, sakramenten och invigd. Konfirmation betyder bekräftelse, och en akt som bekräftar dopet gör det fast, och befäster fungerar också. De sju är kyrkans heliga handlingar, och heliga handlingarna eller mysterierna fungerar också. Olja som används i en helig handling är helgad, och välsignad fungerar också. En bekräftelse upphäver eller ersätter inte dopet, budorden är tio och inga handlingar, och olja i en kyrklig akt är varken otillåten eller bränd.")
three("sam","myn","Riksdagsval",f"Vid allmänna val {G} väljarna representanter till en beslutande församling, som ett parlament eller ett fullmäktige. Man röstar i en vallokal, som ofta ordnas {G} i en skola eller annan offentlig byggnad, och i Sverige räcker väljaren över valsedeln till en {G} som lägger den i urnan.",
 ["utser","tillfälligt","valfunktionär"],[["väljer","permanent","granne"],["avsätter","provisoriskt","valförrättare"],["bannlyser","hemligt","präst"]],T3,F3,["v","adv","s"],["kol","kol","kol"],
 "Rätt svar är utser, tillfälligt och valfunktionär. Väljare bestämmer vem som ska företräda dem, och väljer fungerar också. En vallokal i en offentlig lokal finns bara under valet, och provisoriskt fungerar också. Den som tar emot valsedlar i vallokalen arbetar med valet, och valförrättare säger samma sak. Ett val avsätter eller bannlyser inte representanter, en vallokal är inte permanent eller hemlig, och man lämnar inte sin valsedel till en granne eller präst.")
three("sam","pop","Idrottsförening",f"En idrottsförening finns för att medlemmarna ska kunna {G} en idrott och ofta tävla i den. Sveriges äldsta allmänna idrottsklubb är ett simsällskap i Uppsala som {G} 1796, och många fler föreningar har {G} sedan slutet av 1800-talet.",
 ["bedriva","grundades","bildats"],[["träna","stängdes","upplösts"],["förakta","instiftades","startats"],["bevaka","bannlystes","rivits"]],T3,F3,["v","v","v"],["kol","kol","kol"],
 "Rätt svar är bedriva, grundades och bildats. Den som tävlar i en idrott håller också på med den, och träna fungerar också. Den äldsta klubben kom till detta år, och instiftades fungerar också. Många fler föreningar har kommit till sedan dess, och startats säger samma sak. En idrottsförening föraktar eller bevakar inte sin idrott, den äldsta klubben kan inte ha stängts eller bannlysts det år den kom till, och föreningar som upplösts eller rivits finns inte.")
three("lit","pop","Hjältesaga",f"Hjältesagan är en genre i den muntliga berättartraditionen, och den ligger egentligen närmare {G} än folksagan. Berättelserna kretsar ofta kring {G} händelser och verkliga personer som kungar och krigare, men de kan också handla om legender som man vid den tiden trodde var {G}.",
 ["sägnen","historiska","sanna"],[["legenden","betydelsefulla","påhittade"],["romanen","faktiska","äkta"],["dramat","triviala","roliga"]],T3,F3,["s","a","a"],["kon","kol","kon"],
 "Rätt svar är sägnen, historiska och sanna. Egentligen närmare än folksagan visar att genren ligger nära en annan muntlig berättelse om verkliga händelser, och legenden fungerar också. Verkliga personer som kungar hör ihop med händelser som har inträffat, och faktiska fungerar också. Men ställer legenderna mot de verkliga händelserna, och de troddes ändå vara verkliga, och äkta fungerar också. Romanen och dramat är inte muntlig tradition, triviala händelser kretsar inte kring kungar, och legender som man trodde var påhittade eller roliga ställs inte mot de verkliga.")
three("utb","pop","Gymnasium",f"Ordet gymnasium kommer av grekiskans ord för naken, och i antikens Grekland var ett gymnasium en anläggning för {G} träning. I flera språk betecknar ordet i stället en {G} utbildning som förbereder för universitetet, och i Sverige {G} gymnasierna 1970 av gymnasieskolan.",
 ["kroppslig","avancerad","ersattes"],[["fysisk","lägre","kompletterades"],["andlig","kvalificerad","avlöstes"],["militär","praktisk","utökades"]],T3,F3,["a","a","v"],["ors","kol","kol"],
 "Rätt svar är kroppslig, avancerad och ersattes. Ordet gymnastik och grekiskans ord för naken visar att träningen gällde kroppen, och fysisk fungerar också. En utbildning som förbereder för universitetet ligger högt i utbildningssystemet, och kvalificerad fungerar också. Gymnasieskolan tog de gamla gymnasiernas plats, och avlöstes säger samma sak. Andlig och militär träning har inget med naken att göra, en lägre eller praktisk utbildning förbereder inte för universitetet, och gymnasierna kompletterades eller utökades inte av gymnasieskolan utan försvann.")
three("eko","pop","Skatteflykt",f"Skatteflykt är åtgärder som vidtas {G} för att slippa betala skatt. Begreppet kan också gälla den som {G} till ett annat land för att betala mindre, och gränsen mellan tillåten och otillåten skatteflykt är {G}.",
 ["enbart","flyttar","flytande"],[["endast","emigrerar","skarp"],["ibland","utvandrar","diffus"],["motvilligt","skriver","tydlig"]],T3,F3,["adv","v","a"],["def","kol","kon"],
 "Rätt svar är enbart, flyttar och flytande. Skatteflykt är åtgärder som inte har något annat syfte än att undvika skatt, och endast fungerar också. Den som byter land för att betala mindre lämnar sitt land, och emigrerar eller utvandrar fungerar också. Tillåten och otillåten skatteflykt är svåra att skilja åt, och diffus säger samma sak. Ibland och motvilligt strider mot att syftet är att slippa skatt, man skriver inte till ett annat land för att betala mindre, och skarp eller tydlig strider mot att gränsen är svår att dra.")
three("eko","pop","Arvsskatt",f"Arvsskatten är oftast {G}, så att skattesatsen stiger med arvets storlek, och nära släktingar beskattas {G} än avlägsna. Under 1900-talet sågs arvsskatten som ett viktigt verktyg för att {G} skillnaderna i förmögenhet.",
 ["progressiv","mildare","utjämna"],[["stigande","hårdare","förstärka"],["platt","lindrigare","minska"],["symbolisk","kostsammare","befästa"]],T3,F3,["a","a","v"],["def","kol","kol"],
 "Rätt svar är progressiv, mildare och utjämna. En skatt vars sats stiger med beloppet är progressiv, och stigande fungerar också. Nära släktingar gynnas jämfört med avlägsna, och lindrigare fungerar också. En skatt som tar mer av de största arven gör skillnaderna mindre, och minska säger samma sak. En platt eller symbolisk skatt stiger inte med arvet, hårdare eller kostsammare skatt för nära släktingar strider mot att de gynnas, och en skatt som tar mest av de rika förstärker eller befäster inte skillnaderna.")
three("jur","pop","Husrannsakan",f"Husrannsakan är ett {G} som innebär att en myndighet går igenom någon annans egendom, även om ägaren inte går med på det. Till skillnad från en kroppsvisitation gäller den en sak eller en {G}, och syftet kan vara att {G} bevisning.",
 ["tvångsmedel","plats","tillvarata"],[["maktmedel","lokal","manipulera"],["belöningssystem","byggnad","spara"],["nöje","person","gömma"]],T3,F3,["s","s","v"],["kol","kon","kol"],
 "Rätt svar är tvångsmedel, plats och tillvarata. En undersökning som kan göras utan medgivande tvingas fram, och maktmedel fungerar också. Till skillnad från en kroppsvisitation, som gäller en person, gäller husrannsakan ett ställe, och lokal eller byggnad fungerar också. Myndigheten undersöker för att få tag på bevis, och spara fungerar också. En undersökning utan medgivande är varken ett belöningssystem eller ett nöje, person är just kroppsvisitationen, och en myndighet manipulerar eller gömmer inte bevisning.")
three("fil","pop","Teodicéproblemet",f"Teodicéproblemet gäller hur en gud kan vara både fullkomligt {G} och allsmäktig i en värld där det också finns ondska och lidande. För att problemet ska uppstå måste både Gud och det onda {G}, och tas det ena bort {G} problemet.",
 ["god","existera","faller bort"],[["rättvis","finnas","fördjupas"],["ond","förutsättas","löses upp"],["frånvarande","glömmas","skärps"]],T3,F3,["a","v","v"],["kon","kol","ors"],
 "Rätt svar är god, existera och faller bort. Problemet uppstår när ondskan ställs mot en gud som vill väl, och rättvis fungerar också. Både Gud och det onda måste finnas för att det ska bli en motsägelse, och förutsättas fungerar också. Utan den ena delen finns ingen motsägelse kvar, och löses upp säger samma sak. En ond eller frånvarande gud ger ingen motsägelse med ondskan, det onda måste inte glömmas, och problemet fördjupas eller skärps inte när den ena delen tas bort.")
three("spr","pop","Kraftuttryck",f"Kraftuttryck är {G} ord eller fraser som man tar till för att ge utlopp åt en stark känsla, ofta som en reaktion på något. De flesta har med {G} att göra och är former av svordomar, men många är {G} svordomar som inte ska uppfattas som sådana.",
 ["häftiga","ilska","mildrade"],[["starka","lycka","skärpta"],["sansade","vrede","försvagade"],["tekniska","sömn","lånade"]],T3,F3,["a","s","a"],["kol","kol","kon"],
 "Rätt svar är häftiga, ilska och mildrade. Ord för stark känsla är kraftiga ord, och starka fungerar också. Svordomar hör ihop med att vara arg, och vrede säger samma sak. Men ställer svordomar mot ord som inte ska uppfattas som svordomar, alltså är de dämpade, och försvagade fungerar också. Sansade och tekniska ord uttrycker ingen stark känsla, lycka och sömn har inget med svordomar att göra, och skärpta eller lånade svordomar är fortfarande svordomar.")
write(30)
