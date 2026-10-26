import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from mekgen_lib import it, write, G
def one(a,g,t,txt,k,ds,dt,ok,lt,ex): it(a,g,t,txt,[k],[[d] for d in ds],dt,[[1],[1],[1]],[ok],[lt],ex)
two=it; three=it
F2=[[2],[1],[1,2]]; T2=[["de","fa"],["fa","de"],["fa","fa"]]
F3=[[3],[1],[1,2,3]]; T3=[["de","de","fa"],["fa","de","de"],["fa","fa","fa"]]
O=[["fa"],["fa"],["fa"]]
# ---------- en lucka ----------
one("med","myn","1177 Hälsporre",f"Hälsporre kommer av att senan i hålfoten har överbelastats, ofta av promenader eller löpning i skor som inte passar för det. Värken sitter under hälen och brukar {G} när man har gått en stund.",
 "ge med sig",["blossa upp","sprida sig","flytta upp"],O,"utr","kol",
 "Rätt svar är ge med sig. Värk som ändras efter en stunds gång blir oftast bättre när foten har värmts upp, och det är det texten säger. Blossa upp, sprida sig och flytta upp beskriver värk som blir värre eller byter plats.")
one("med","myn","1177 Hammartå",f"Den som har hammartå har en eller flera krökta tår, oftast den som sitter närmast stortån. Skorna kan då trycka på tåns ovansida, och av trycket bildas ofta en {G} som ömmar.",
 "förhårdnad",["leverfläck","finne","spricka"],O,"s","ors",
 "Rätt svar är förhårdnad. Huden som utsätts för tryck gång på gång blir hård och tjock. En leverfläck, finne eller spricka kommer inte av sig själv av långvarigt tryck på samma sätt.")
one("med","pop","Visdomständer",f"Visdomstanden är den {G} kindtanden i varje käkhalva, alltså tand nummer åtta räknat från mitten av käken. De flesta får sina fyra visdomständer i åldern 18 till 26 år.",
 "bakersta",["främsta","minsta","vassaste"],O,"a","def",
 "Rätt svar är bakersta. Tand nummer åtta från mitten är den som sitter längst in, och alltså visar att det förklarar ordet. Den främsta tanden sitter närmast mitten, och minsta eller vassaste säger inget om var tanden sitter.")
one("kul","pop","Lingonsylt",f"Lingonsylt görs av lingon och socker och kallas på vissa sydsvenska {G} krösamos. Den äts till gröt men också till köttbullar, blodpudding och raggmunk.",
 "dialekter",["recept","restauranger","marknader"],O,"s","kol",
 "Rätt svar är dialekter. Krösamos är ett annat ord för samma sak, och det som skiljer sig mellan trakter är hur man säger. Recept, restauranger och marknader ger inte maten ett annat namn.")
one("kul","pop","Menuett",f"Menuetten är en dans i lugn tretakt. Namnet kommer av ett franskt ord för liten och syftar troligen på dansens korta {G}.",
 "steg",["toner","stycken","dansare"],O,"s","kol",
 "Rätt svar är steg. Det lilla i en dans är rörelserna, och korta steg är något man tar när man dansar. Toner och stycken hör till musiken och inte till själva dansen, och dansare blir inte korta av en dans.")
one("kul","pop","Tenn",f"Tenn är en silvervit och smidig metall som inte oxiderar i luft, och därför används den som {G} på andra metaller, så att de inte korroderar.",
 "beläggning",["bränsle","smörjmedel","verktyg"],O,"s","ors",
 "Rätt svar är beläggning. En metall som inte rostar skyddar en annan om den läggs utanpå den. Bränsle, smörjmedel och verktyg skyddar inte mot korrosion.")
one("his","pop","Lots",f"En lots är en vägvisare till sjöss som större fartyg {G} när de ska in i hamn eller ta sig igenom särskilt svåra farvatten.",
 "anlitar",["avskedar","bogserar","förföljer"],O,"v","kol",
 "Rätt svar är anlitar. En vägvisare tar man hjälp av när man inte hittar själv. Fartyg avskedar, bogserar eller förföljer inte sin vägvisare.")
one("sam","pop","Apotek",f"Ett apotek är en butik där läkemedel {G} och säljs. Ordet kommer av grekiskans ord för förråd.",
 "bereds",["testas","kasseras","odlas"],O,"v","kol",
 "Rätt svar är bereds. Ett apotek gör i ordning och lämnar ut läkemedel. Läkemedel testas inte på apoteket, kasseras inte där, och de odlas inte.")
one("sam","pop","Gågata",f"På en gågata är trafiken med motorfordon starkt {G}, men det kan finnas tillstånd för exempelvis lastning, taxi och utryckningsfordon.",
 "inskränkt",["prioriterad","subventionerad","omdirigerad"],O,"a","kon",
 "Rätt svar är inskränkt. Men det kan finnas tillstånd visar att fordonen i princip inte får köra där. Prioriterad och subventionerad trafik får fritt fram, och omdirigerad trafik behöver inga tillstånd.")
one("bio","pop","Storskrake",f"Storskraken är en stor and som lever i klara och djupa sjöar och vattendrag, där den {G} dyker efter fisk.",
 "skickligt",["motvilligt","sparsamt","ensamt"],O,"adv","kol",
 "Rätt svar är skickligt. Klara och djupa vatten där en and dyker efter fisk kräver förmåga, och skickligt beskriver hur väl den gör det. Motvilligt, sparsamt och ensamt beskriver inte en duktig fiskare.")
one("bio","pop","Stare",f"Staren kan för en ovan betraktare {G} koltrasten, eftersom båda är mörka fåglar med gul näbb som ofta syns på gräsmattor i städerna.",
 "misstas för",["skrämma bort","jaga bort","para sig med"],O,"utr","ors",
 "Rätt svar är misstas för. Eftersom de liknar varandra är det lätt att ta den ena för den andra, särskilt för den som är ovan. Att fåglarna ser lika ut förklarar inte att den ena skrämmer eller jagar bort den andra, och stare och koltrast parar sig inte med varandra.")
one("bio","pop","Rörhöna",f"Rörhönan liknar sothönan med sin mest svarta fjäderdräkt, men den har rött på näbben och pannskölden. Den lever i våtmarker och vassiga dammar, där den oftast håller sig {G}.",
 "dold",["synlig","högljudd","i flock"],O,"a","kol",
 "Rätt svar är dold. En fågel som lever i vass kan gömma sig där. Synlig strider mot vassen, och högljudd eller i flock säger inget om att den håller sig undan.")
one("lit","pop","Pergament",f"Pergament är tunn djurhud som har {G} från hår och köttrester men inte garvats. Det har använts som skrivmaterial och till bokband.",
 "rensats",["färgats","torkats","sytts"],O,"v","kol",
 "Rätt svar är rensats. Hud som ska bli skrivmaterial görs fri från hår och kött. Att färga, torka eller sy hud tar inte bort hår och köttrester.")
one("lit","pop","Punktskrift",f"Punktskrift används av blinda och synskadade och bygger på celler med sex punkter i två kolumner. En cell är så liten att den kan {G} med en fingertopp.",
 "täckas",["skrivas","höras","ritas"],O,"v","kol",
 "Rätt svar är täckas. Punktskrift läses med fingrarna, och en cell som får plats under en fingertopp täcks av den. En cell skrivs, hörs eller ritas inte med en fingertopp.")
one("utb","pop","Campus",f"Ett campus är det område där ett universitet eller en högskola har samlat sin verksamhet. Där finns traditionellt föreläsningssalar, bibliotek, studentbostäder och gröna ytor med {G}.",
 "parkmark",["fabriker","flygfält","hamnar"],O,"s","par",
 "Rätt svar är parkmark. Gröna ytor på ett universitetsområde är parker. Fabriker, flygfält och hamnar är inte gröna ytor och hör inte till ett campus.")
one("eko","myn","Övertid",f"Övertid är arbetstid som {G} den fulla arbetstiden, och för deltidsanställda kallas en sådan utökad arbetstid mertid.",
 "överstiger",["avlöser","förkortar","delar"],O,"v","def",
 "Rätt svar är överstiger. Ordet övertid visar att det rör sig om tid utöver det vanliga. Arbetstid som avlöser, förkortar eller delar den fulla tiden är inte övertid.")
one("psy","pop","Mörkerrädsla",f"Mörkerrädsla är en överdriven rädsla för mörker, fast personen förstår att det saknas skäl till rädsla. Hos barn som ännu inte nått puberteten ses den som en {G} del av utvecklingen.",
 "naturlig",["sjuklig","farlig","onödig"],O,"a","kon",
 "Rätt svar är naturlig. Rädslan är vanlig hos barn, och att den ses som en del av utvecklingen betyder att den hör till att växa upp. Sjuklig, farlig och onödig strider mot att den hör till utvecklingen.")
one("mil","pop","Gnejs",f"Gnejs är en bergart som har bildats av en annan bergart under högt tryck och hög temperatur. Den har en tydlig {G} struktur, och det skiljer den från graniten.",
 "parallell",["kornig","porös","rund"],O,"a","kol",
 "Rätt svar är parallell. Det som skiljer gnejsen från graniten är att mineralen ligger i skikt. Kornig är just graniten, och porös eller rund struktur stämmer inte med en bergart som pressats under högt tryck.")
one("spr","myn","Mellannamn",f"Ett mellannamn är ett namn som har tillhört en {G}, ofta en förälder, och som står mellan personens förnamn och efternamn.",
 "anhörig",["granne","lärare","kändis"],O,"s","def",
 "Rätt svar är anhörig. Ofta en förälder visar att namnet kommer från familjen, och en förälder är en anhörig. En granne, lärare eller kändis är inte en förälder.")
one("tek","pop","Hammare",f"En hammare har ett huvud på ett skaft och används av många yrkesgrupper, från guldsmeder till murare. De tyngre hamrarna kallas {G}.",
 "släggor",["mejslar","tänger","filar"],O,"s","def",
 "Rätt svar är släggor. En tung hammare har ett eget namn, och det är slägga. Mejslar, tänger och filar är andra verktyg och inte hammare.")
# ---------- två luckor ----------
two("med","myn","1177 Benhinneinflammation",f"Benhinneinflammation är egentligen ingen inflammation, utan en skada som kommer av att muskler och senor har {G}. Värken sitter på underbenets insida eller framsida, och det är bra att {G} besvären så snart som möjligt.",
 ["överbelastats","ta itu med"],[["överansträngts","strunta i"],["vilats","åtgärda"],["smorts","skämta om"]],T2,F2,["v","utr"],["kon","kol"],
 "Rätt svar är överbelastats och ta itu med. En skada i muskler och senor kommer av att de har fått bära för mycket, och överansträngts fungerar också. Att göra något åt besvären tidigt förhindrar att de blir långvariga, och åtgärda säger samma sak. Muskler som vilats eller smorts skadas inte, och den som struntar i eller skämtar om besvären gör inget åt dem.")
two("med","myn","1177 Hallux valgus",f"Vid hallux valgus kan stortåns led tryckas ut, så att det ser ut som en knöl på insidan av foten. Besvären börjar ofta med att fotvalvet blir {G}, och följden blir att stortån {G} mot de andra tårna.",
 ["plattare","vinklas"],[["flackare","böjs bort från"],["brantare","lutar"],["mjukare","fastnar"]],T2,F2,["a","v"],["kol","kol"],
 "Rätt svar är plattare och vinklas. Ett fotvalv som sjunker ihop blir lägre, och flackare fungerar också. En stortå som pekar mot de andra tårna har vridits, och lutar fungerar också. Ett brantare eller mjukare valv ger ingen knöl, och en tå som böjs bort från de andra eller fastnar är inte en sned stortå.")
two("med","myn","1177 Schlatters sjukdom",f"Schlatters sjukdom är vanlig hos barn och unga mellan åtta och femton år och kan komma om barnet växer fort och samtidigt {G} knäna. Det gör ont vid idrott, särskilt sådan som innehåller {G}.",
 ["överanstränger","hopp"],[["sliter på","simning"],["skonar","språng"],["kyler","schack"]],T2,F2,["v","s"],["kol","kol"],
 "Rätt svar är överanstränger och hopp. Det är de som idrottar som får sjukdomen, alltså belastas knäna för mycket, och sliter på fungerar också. Idrott som är särskilt hård mot knät innehåller hopp, och språng fungerar också. Den som skonar eller kyler knäna överbelastar dem inte, och simning eller schack belastar inte knäna.")
two("med","myn","1177 Restless legs",f"Restless legs är en sjukdom i nervsystemet, och orsaken är inte {G}. I sin första form är den ofta ärftlig, medan den andra formen kommer senare i livet och kan bero på till exempel {G} eller diabetes.",
 ["klarlagd","järnbrist"],[["utredd","lycka"],["smittsam","näringsbrist"],["vacker","solsken"]],T2,F2,["a","s"],["kol","par"],
 "Rätt svar är klarlagd och järnbrist. En sjukdom vars orsak ingen säkert vet har en orsak som inte är utredd, och utredd fungerar också. Diabetes står i samma uppräkning av sjukdomar och tillstånd som kan ligga bakom, och näringsbrist fungerar också. En orsak är inte smittsam eller vacker, och lycka eller solsken ger ingen sjukdom.")
two("kul","pop","Advent",f"Advent kommer av latinets ord för ankomst och är den {G} perioden i kyrkoåret, en tid av förberedelse inför julen. Tiden räknas som fastetid och har sina historiska {G} i julfastan.",
 ["inledande","förebilder"],[["tidigaste","grenar"],["avslutande","anor"],["varmaste","konkurrenter"]],T2,F2,["a","s"],["kol","kol"],
 "Rätt svar är inledande och förebilder. Kyrkoåret börjar med advent, och tidigaste fungerar också. Seden har vuxit fram ur julfastan, och anor fungerar också. Avslutande strider mot förberedelse inför julen, varmaste beskriver ingen kyrklig period, och grenar eller konkurrenter är inte vad en sed har i det förflutna.")
two("his","pop","Stångjärn",f"Stångjärn är förädlat tackjärn. Syftet var att {G} kolhalten från drygt fyra procent till mindre än två, så att järnet blev {G}, och under 1600-talet blev stångjärnet Sveriges viktigaste exportvara.",
 ["pressa ned","smidbart"],[["minska","sprött"],["fördubbla","formbart"],["väga","giftigt"]],T2,F2,["v","a"],["def","ors"],
 "Rätt svar är pressa ned och smidbart. Från över fyra till under två procent är en minskning, och minska fungerar också. Järn med mindre kol går att smida, och formbart fungerar också. Att fördubbla eller väga kolhalten stämmer inte med att den gick ned, och sprött eller giftigt järn exporteras inte som förädlad vara.")
two("sam","myn","Kustbevakning",f"En kustbevakning patrullerar landets vatten för att {G} olyckor och brott. Den kan bland annat sköta sjöräddning och gränskontroll, och i krig kan den få ansvar för att {G} hamnarna.",
 ["stävja","värna"],[["motverka","hyra ut"],["uppmuntra","bevaka"],["fira","måla"]],T2,F2,["v","v"],["kol","kol"],
 "Rätt svar är stävja och värna. Patrullering till sjöss ska hindra att olyckor och brott sker, och motverka fungerar också. I krig ska hamnarna hållas säkra, och bevaka säger samma sak. Ingen myndighet uppmuntrar eller firar brott, och en kustbevakning säljer eller målar inte hamnar.")
two("jur","pop","Tingsplats",f"Ett tingsställe är den {G} plats där en tingsrätt sammanträder, och i stora domsagor kan det finnas flera. Rätten kan också samlas på andra platser, till exempel vid en {G}, då den besöker en plats för att se den med egna ögon.",
 ["ordinarie","syn"],[["bestämda","fest"],["kringresande","besiktning"],["gungande","avrättning"]],T2,F2,["a","s"],["kon","def"],
 "Rätt svar är ordinarie och syn. Också på andra platser visar att tingsstället är den bestämda platsen, och bestämda fungerar också. Att besöka en plats för att se den är en syn, och besiktning fungerar också. Ett tingsställe är varken hemligt eller gungande, och rätten samlas inte vid en fest eller avrättning för att se på en plats.")
two("sam","pop","Bibliotekarie",f"En bibliotekarie organiserar tryckta och elektroniska medier, söker information och {G} olika källor. Många arbetar också med att {G} läsning, på folkbibliotek, skolbibliotek eller sjukhusbibliotek.",
 ["värderar","främja"],[["bedömer","hämma"],["trycker","uppmuntra"],["bränner","försvåra"]],T2,F2,["v","v"],["par","kol"],
 "Rätt svar är värderar och främja. Att söka information hör ihop med att avgöra hur pålitliga källorna är, och bedömer fungerar också. Ett bibliotek vill få fler att läsa, och uppmuntra säger samma sak. En bibliotekarie trycker eller bränner inte källor, och hämma eller försvåra läsning är motsatsen till bibliotekets uppgift.")
two("mil","myn","Nationalpark",f"En nationalpark är ett naturområde som staten har {G} för att bevara naturen som en allmän sevärdhet och för att väcka intresset för den. Även kulturlandskap kan vara skälet till att en nationalpark grundas, för att {G} dem.",
 ["skyddat","värna"],[["fridlyst","exploatera"],["sålt","vårda"],["asfalterat","riva"]],T2,F2,["v","v"],["kol","par"],
 "Rätt svar är skyddat och värna. Ett område som bevaras av staten har fått ett skydd, och fridlyst fungerar också. Kulturlandskap grundar man parker för att ta hand om, och vårda fungerar också. Staten säljer eller asfalterar inte mark den vill vårda, och exploatera eller riva strider mot att parken ska vårda.")
two("eko","myn","Arbetslöshetskassa",f"En arbetslöshetskassa, eller a-kassa, finns främst för att {G} och betala ut ersättning till den som har blivit arbetslös. Verksamheten {G} i lag och i kassornas egna stadgar.",
 ["administrera","regleras"],[["handlägga","tappas bort"],["förvägra","styrs"],["sjunga","bannlyses"]],T2,F2,["v","v"],["kol","kol"],
 "Rätt svar är administrera och regleras. En kassa som betalar ut ersättning sköter också allt kring den, och handlägga fungerar också. Lagar och stadgar bestämmer hur kassan ska arbeta, och styrs säger samma sak. En kassa förvägrar inte den ersättning den är till för, sjunga är ingen uppgift, och en verksamhet tappas bort eller bannlyses inte i lag.")
two("bio","pop","Råka",f"Råkan är en kråkfågel som känns igen på sin långa och spetsiga näbb, som är svagt {G}, så att spetsen pekar en aning mot marken, och på den ljusa nakna huden vid näbbens bas. Fjäderdräkten är svart och {G}.",
 ["nedåtböjd","metalliskt glänsande"],[["krökt","matt"],["uppåtböjd","blanksvart"],["knubbig","rutig"]],T2,F2,["a","utr"],["kol","kol"],
 "Rätt svar är nedåtböjd och metalliskt glänsande. En spetsig kråknäbb som är svagt böjd pekar nedåt, och krökt fungerar också. En svart dräkt hos en kråkfågel kan blänka, och blanksvart fungerar också. Uppåtböjd och knubbig stämmer inte med en lång spetsig näbb, och en svart fjäderdräkt är varken matt i det här fallet eller rutig.")
two("bio","pop","Skogshare",f"Skogsharen lever främst i barrskogsområden och är brungrå om sommaren men {G} om vintern, och öronspetsarna är svarta {G}.",
 ["vit","året om"],[["snövit","emellanåt"],["grön","hela året"],["randig","bara på sommaren"]],T2,F2,["a","adv"],["kon","kon"],
 "Rätt svar är vit och året om. Men ställer sommarens bruna päls mot vinterns, som byts till en färg som syns dåligt i snön, och snövit fungerar också. Öronspetsarna beskrivs som det som inte ändras, och hela året säger samma sak. En grön eller randig hare finns inte, och emellanåt eller bara på sommaren strider mot att spetsarna är det som består.")
two("lit","pop","Innehållsförteckning",f"En innehållsförteckning ger en {G} över innehållet i en publikation och står i regel i början. Rubrikerna listas i den ordning de kommer, med {G} till sidan där avsnittet finns.",
 ["översikt","hänvisning"],[["överblick","ursäkt"],["recension","referens"],["dikt","sång"]],T2,F2,["s","s"],["def","kol"],
 "Rätt svar är översikt och hänvisning. En lista över allt i boken låter läsaren se helheten, och överblick fungerar också. Sidnumret pekar läsaren vidare till rätt ställe, och referens säger samma sak. En förteckning ger ingen recension eller dikt, och ett sidnummer är ingen ursäkt eller sång.")
two("lit","pop","Frakturstil",f"Frakturstil är ett typsnitt som togs fram i Tyskland på det tidiga 1500-talet och snart blev den {G} tryckstilen i norra och mellersta Europa. I Sverige {G} frakturen böckerna fram till mitten av 1800-talet.",
 ["mest använda","härskade över"],[["populäraste","förföljde"],["sämsta","präglade"],["tystaste","åt upp"]],T2,F2,["a","v"],["kol","kol"],
 "Rätt svar är mest använda och härskade över. Ett typsnitt som snart ersatte de andra blev det som användes mest, och populäraste fungerar också. Att frakturen var den stil böckerna trycktes med visar att den härskade, och präglade fungerar också. Sämsta och tystaste beskriver ingen tryckstil, och ett typsnitt förföljer eller äter inte upp böcker.")
two("utb","pop","Lektor",f"Ordet lektor kommer av latinets ord för föreläsare, och i antikens Rom var en lektor en slav som läste {G} för sin herre. Numera är en lektor oftast en lärare med en {G} titel än adjunkt, och de flesta har doktorsexamen.",
 ["högt","förnämare"],[["upp","enklare"],["baklänges","finare"],["fel","kortare"]],T2,F2,["adv","a"],["def","kon"],
 "Rätt svar är högt och förnämare. En slav som läser för sin herre läser så att han hör, och läste upp fungerar också. Doktorsexamen visar att lektorn står över adjunkten, och finare fungerar delvis också. Baklänges läsning och felläsning hör ingen på, och en enklare eller kortare titel stämmer inte med doktorsexamen.")
two("eko","pop","Produktivitet",f"Produktivitet är inom ekonomin måttet på hur mycket som {G} per enhet av det man sätter in. Den kan också mätas som produktionen per {G} timme, och kallas då arbetsproduktivitet.",
 ["produceras","arbetad"],[["tillverkas","ledig"],["konsumeras","utförd"],["slarvas bort","sovande"]],T2,F2,["v","a"],["def","kol"],
 "Rätt svar är produceras och arbetad. Produktivitet handlar om hur mycket som blir gjort, och tillverkas fungerar också. Arbetsproduktivitet räknas på tiden man arbetar, och utförd fungerar också. Det som konsumeras eller slarvas bort är ingen produktion, och lediga eller sovande timmar räknas inte som arbetstid.")
two("jur","pop","Bevisbörda",f"Bevisbörda är en parts {G} att lägga fram bevis för sitt påstående i en konflikt. Den som har bevisbördan måste visa att en omständighet är {G}, alltså nå upp till beviskravet.",
 ["skyldighet","styrkt"],[["uppgift","påhittad"],["rättighet","visad"],["önskan","rolig"]],T2,F2,["s","a"],["kol","kol"],
 "Rätt svar är skyldighet och styrkt. En börda är något man är tvungen att bära, och uppgift fungerar också. Att nå upp till beviskravet är att visa att något är sant, och visad fungerar också. En rättighet eller önskan är ingen börda, och den som har bevisbördan ska inte visa att något är påhittat eller roligt.")
two("mil","pop","Grotta",f"En grotta är ett naturligt {G} som en människa kan krypa in i, och grottor är oftast mest vågräta. Vissa menar att den måste ha en del dit {G} aldrig når för att kallas grotta.",
 ["hålrum","dagsljuset"],[["utrymme","grundvattnet"],["torn","solljuset"],["landskap","fåglarna"]],T2,F2,["s","s"],["def","kol"],
 "Rätt svar är hålrum och dagsljuset. Något man kan krypa in i är ett tomt rum i berget, och utrymme fungerar också. En mörkerzon är en del som ljuset inte når, och solljuset fungerar också. Ett torn eller landskap är inget man kryper in i, och grundvattnet eller fåglarna avgör inte om det är mörkt.")
two("spr","pop","Öknamn",f"Ett öknamn är ett {G} tillnamn, och en dysfemism är en omskrivning som är mer nedsättande än det vanliga ordet, alltså {G} till en eufemism. Ett exempel är dumburk för tv.",
 ["förolämpande","kontrasten"],[["kränkande","föregångaren"],["vänligt","motpolen"],["juridiskt","svaret"]],T2,F2,["a","s"],["def","kon"],
 "Rätt svar är förolämpande och kontrasten. Ett nedsättande tillnamn är menat att såra, och kränkande fungerar också. En eufemism förskönar och en dysfemism gör tvärtom, och motpolen säger samma sak. Vänligt strider mot nedsättande, juridiskt beskriver inget tillnamn, och en dysfemism är varken föregångaren eller svaret till en eufemism.")
# ---------- tre luckor ----------
three("utb","pop","Yrkesutbildning",f"En yrkesutbildning ska leda till ett yrke som i regel är {G}. Länge hade Sverige särskilda yrkesskolor, men de {G} 1971 i gymnasieskolan, och senare förlängdes utbildningarna till tre år så att de också skulle ge {G} till högre studier.",
 ["praktiskt","inlemmades","tillträde"],[["handfast","infogades","spärr"],["teoretiskt","fördes in","rätt"],["brottsligt","stängdes","omväg"]],T3,F3,["adv","v","s"],["kol","kol","kol"],
 "Rätt svar är praktiskt, inlemmades och tillträde. En utbildning för ett yrke är inriktad på det man gör med händerna, och handfast fungerar också. En egen skolform som blev en del av gymnasieskolan togs in i den, och infogades eller fördes in fungerar också. För att få läsa vidare behöver man formell rätt till det, och rätt fungerar också. Teoretiskt strider mot yrkesinriktningen, olagliga yrken utbildar ingen till, skolor som stängdes blev ingen del av gymnasiet, och spärr eller omväg ger ingen väg till högre studier.")
three("utb","pop","Läroplansteori",f"Läroplansteori är ett {G} inom pedagogiken som ställer frågor till läroplanen, till exempel vilket innehåll och vilken undervisning eleverna ska {G} under sin utbildning. Läroplanen kan på så sätt ses som skolans {G} med samhället.",
 ["forskningsfält","möta","kontrakt"],[["forskningsområde","få","konflikt"],["skolämne","stöta på","överenskommelse"],["sjukdom","slänga","fiendskap"]],T3,F3,["s","v","s"],["kol","kol","kol"],
 "Rätt svar är forskningsfält, möta och kontrakt. Teori inom pedagogiken är ett område för forskning, och forskningsområde fungerar också. Innehåll och undervisning är något eleverna får del av, och få eller stöta på fungerar också. Läroplanen beskriver vad samhället och skolan har kommit överens om, och överenskommelse säger samma sak. Ett skolämne ställer inga frågor till läroplanen, en teori är ingen sjukdom, eleverna ska inte slänga undervisningen, och en konflikt eller fiendskap är inte vad läroplanen uttrycker.")
three("eko","pop","Börsintroduktion",f"Vid en börsintroduktion görs aktierna i ett bolag {G} för handel på en börs. Det kan ske genom att de befintliga ägarna säljer aktier eller genom en nyemission, och nästan alltid blir ägandet då mer {G}. Inför introduktionen måste mycket information om bolaget tas fram och {G}.",
 ["öppna","spritt","offentliggöras"],[["åtkomliga","utspritt","hemlighållas"],["spärrade","fördelat","publiceras"],["dolda","samlat","makuleras"]],T3,F3,["a","a","v"],["def","kol","kol"],
 "Rätt svar är öppna, spritt och offentliggöras. Aktier som kan handlas på börsen kan köpas av vem som helst, och åtkomliga fungerar också. När fler köper aktier får bolaget fler ägare, och utspritt eller fördelat fungerar också. Information inför en börsnotering ska göras känd för alla, och publiceras säger samma sak. Spärrade och dolda aktier går inte att handla, samlat strider mot att fler blir ägare, och information hemlighålls eller makuleras inte inför en notering.")
three("eko","pop","Affärsplan",f"En affärsplan beskriver hur en affärsidé kan {G} i konkreta mål, bedömer om det går att {G} och visar hur målen ska nås. När ett nytt företag startas är planen ett centralt dokument för att få {G} från intressenter och finansiärer.",
 ["omsättas","genomföra","uppbackning"],[["översättas","förverkliga","misstänksamhet"],["bannlysas","fullfölja","hjälp"],["målas","skratta åt","applåder"]],T3,F3,["v","v","s"],["kol","kol","kol"],
 "Rätt svar är omsättas, genomföra och uppbackning. En idé som blir till mål får en konkret form, och översättas fungerar också. En bedömning av om planen går att göra verklighet gäller genomförbarheten, och förverkliga eller fullfölja fungerar också. Finansiärer bidrar med pengar och hjälp, och hjälp säger samma sak. En affärsidé förbjuds eller målas inte i mål, ingen bedömer om man kan skratta åt den, och misstänksamhet eller applåder är inte vad planen ska ge.")
three("jur","pop","Oskyldighetspresumtion",f"Oskyldighetspresumtionen är en grundläggande {G} som innebär att den som misstänks för brott har rätt att betraktas som oskyldig tills {G} har bevisats. Principen väger så tungt att den står {G} i lag eller grundlag i många demokratier.",
 ["rättsprincip","skulden","uttryckligen"],[["grundprincip","oskulden","underförstått"],["straffsats","motsatsen","tydligt"],["artighetsregel","alibit","dolt"]],T3,F3,["s","s","adv"],["def","kon","kol"],
 "Rätt svar är rättsprincip, skulden och uttryckligen. En grundsats i rättegången är en grundprincip, och grundprincip fungerar också. Tills ställer oskulden mot det som måste bevisas, alltså att personen är skyldig, och motsatsen fungerar också. Så viktig att den står i lag visar att den är klart utskriven, och tydligt fungerar också. En straffsats eller artighetsregel ger ingen rätt att ses som oskyldig, oskulden ska inte bevisas och ett alibi är inget man bevisar mot den misstänkte, och underförstått eller dolt strider mot att den står i lag.")
three("jur","pop","Äktenskapsskillnad",f"En äktenskapsskillnad är att ett äktenskap {G} därför att en av makarna eller båda vill det, medan båda lever. Ett {G} upplösande kallas upplösning av äktenskap, och i vissa länder kan parterna vara {G} från att begära skilsmässa.",
 ["tar slut","påtvingat","förhindrade"],[["bryts","självvalt","fria"],["firas","framtvingat","spärrade"],["ingås","glädjande","tvungna"]],T3,F3,["v","a","a"],["def","kon","kol"],
 "Rätt svar är tar slut, påtvingat och förhindrade. En skilsmässa gör slut på äktenskapet, och bryts fungerar också. På initiativ av makarna ställs mot ett upplösande som ingen av dem valt, och framtvingat fungerar också. Lagar i vissa länder kan hindra makarna, och spärrade säger samma sak. Ett äktenskap firas eller ingås inte genom en skilsmässa, självvalt och glädjande strider mot ett upplösande ingen valt, och fria eller tvungna att begära skilsmässa är inte det lagarna gör.")
three("fil","pop","Jämlikhet",f"Jämlikhet innebär att individer och grupper {G} och får samma möjligheter, och den bygger ofta på tanken att alla människor har samma {G}. Politiskt märks den i att alla har samma rösträtt, och ekonomiskt kan den gälla {G} av resurser.",
 ["likabehandlas","värde","fördelning"],[["jämställs","förstånd","slöseri"],["umgås","värdighet","spridning"],["sjunger","kroppsvikt","tillverkning"]],T3,F3,["v","s","s"],["kol","kol","kol"],
 "Rätt svar är likabehandlas, värde och fördelning. Att likabehandlas är att bemötas på samma sätt, och jämställs fungerar också. Alla människors lika värde är ett fast uttryck, och värdighet fungerar också. Ekonomisk jämlikhet gäller hur resurserna delas, och spridning fungerar också. Människor umgås eller sjunger inte lika för att vara jämlika, förstånd och kroppsvikt är inte lika hos alla, och slöseri eller tillverkning av resurser gäller inte jämlikheten.")
three("fil","pop","Frihet",f"Frihet handlar om människors, gruppers och staters {G}. Tanken utgår från att människan själv kan välja och förutsätter att det saknas yttre {G}. Men i praktiken {G} frihetens innebörd av normer, lagar och historiska sammanhang.",
 ["självbestämmande","tvång","begränsas"],[["självständighet","munterhet","utvidgas"],["lydnad","press","påverkas"],["egendom","musik","målas"]],T3,F3,["s","s","v"],["def","kon","kol"],
 "Rätt svar är självbestämmande, tvång och begränsas. Frihet är att själv få bestämma, och självständighet fungerar också. Fri vilja förutsätter att ingen utifrån tvingar en, och press fungerar också. Normer och lagar sätter gränser för vad friheten kan vara, och påverkas fungerar också. Lydnad strider mot frihet, egendom är ingen form av självbestämmande, munterhet och musik är inget som måste saknas, och lagar utvidgar eller målar inte frihetens innebörd i praktiken.")
three("mil","pop","Strandförskjutning",f"Strandförskjutning är att vattenlinjen vid en strand {G} med tiden. Den kallas ofta landhöjning i vardagligt tal och är i huvudsak {G} av två fenomen: att jordskorpan rör sig i höjdled och att {G} i världshaven ändras.",
 ["rör sig","summan","havsnivån"],[["flyttar sig","resultatet","saltet"],["kristalliseras","följden","vattennivån"],["färgas","motsatsen","temperaturen"]],T3,F3,["v","s","s"],["def","def","kol"],
 "Rätt svar är rör sig, summan och havsnivån. Ordet förskjutning visar att strandlinjen hamnar på ett nytt ställe, och flyttar sig fungerar också. Två fenomen som tillsammans ger strandförskjutningen läggs ihop, och resultatet eller följden fungerar också. Det som rör sig i världshaven och påverkar stranden är hur högt vattnet står, och vattennivån säger samma sak. En strandlinje kristalliseras eller färgas inte med tiden, motsatsen till två fenomen ger ingen mening, och saltet eller temperaturen flyttar inte stranden.")
three("psy","pop","Bestraffning",f"Ett straff är en negativ {G} mot den som har brutit mot en regel. Exempel är de påföljder som en domstol {G} efter ett brott, den nackdel en idrottare får efter en förseelse och den bot som en religion kräver efter en {G}.",
 ["åtgärd","dömer ut","synd"],[["insats","utdelar","seger"],["premie","ålägger","överträdelse"],["fest","förlåter","bön"]],T3,F3,["s","v","s"],["def","kol","kol"],
 "Rätt svar är åtgärd, dömer ut och synd. Ett straff är något som görs mot den som bröt mot regeln, och insats fungerar delvis också. Domstolar bestämmer påföljder, och utdelar eller ålägger fungerar också. Bot krävs efter något som strider mot religionens regler, och överträdelse säger samma sak. En premie eller fest är inte negativ, en domstol förlåter inte påföljder, och en seger eller bön kräver ingen bot.")
write(33)
