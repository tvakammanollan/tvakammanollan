import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from mekgen_lib import it, write, G
def one(a,g,t,txt,k,ds,dt,ok,lt,ex): it(a,g,t,txt,[k],[[d] for d in ds],dt,[[1],[1],[1]],[ok],[lt],ex)
two=it; three=it
F2=[[2],[1],[1,2]]; T2=[["de","fa"],["fa","de"],["fa","fa"]]
F3=[[3],[1],[1,2,3]]; T3=[["de","de","fa"],["fa","de","de"],["fa","fa","fa"]]
O=[["fa"],["fa"],["fa"]]
# ---------- en lucka ----------
one("med","myn","1177 Ont i örat",f"Innanför trumhinnan finns mellanörat, ett litet hålrum som i vanliga fall är fyllt med {G}.",
 "luft",["vätska","vax","blod"],O,"s","kon",
 "Rätt svar är luft. I vanliga fall visar att det gäller ett friskt öra, och då är mellanörat ett tomt utrymme med luft. Vätska samlas där vid en inflammation, vax sitter i hörselgången utanför trumhinnan, och blod hör inte hemma i ett friskt mellanöra.")
one("med","myn","1177 Bihåleinflammation",f"Bihålorna är luftfyllda hålrum i skallens ben. Tack vare dem väger skallen mindre, och de förstärker rösten som en {G}.",
 "resonanslåda",["mikrofon","stämgaffel","ljuddämpare"],O,"s","kol",
 "Rätt svar är resonanslåda. Hålrum med luft får ljudet att klinga, som lådan på en gitarr. En mikrofon och en stämgaffel är föremål och inte hålrum, och en ljuddämpare skulle göra rösten svagare.")
one("med","myn","1177 Körtelfeber",f"Barn som får körtelfeber brukar bara få {G} besvär som liknar en förkylning, medan tonåringar och vuxna ofta blir sjukare.",
 "lindriga",["svåra","långvariga","besvärliga"],O,"a","kon",
 "Rätt svar är lindriga. Medan ställer barnen mot de äldre som blir sjukare, och barnens besvär är alltså milda. Svåra, långvariga och besvärliga stämmer inte med att de vuxna blir sjukare.")
one("med","myn","1177 Näspolyper",f"Besvären av näspolyper brukar växa fram {G} under en följd av år, även om förloppet ibland är betydligt snabbare.",
 "successivt",["plötsligt","ensidigt","nattetid"],O,"adv","kon",
 "Rätt svar är successivt. Under flera år och men ibland fortare visar att besvären i regel kommer långsamt, steg för steg. Plötsligt strider mot det, och ensidigt och nattetid säger inget om hur fort besvären växer fram.")
one("med","myn","1177 Nedsatt luktsinne",f"Det vi upplever som smak {G} till största delen av luktsinnet, och därför blir ofta smaken sämre när luktsinnet blir sämre.",
 "uppfattas",["störs","bedövas","förvirras"],O,"v","ors",
 "Rätt svar är uppfattas. Om smaken blir sämre när luktsinnet blir sämre är det luktsinnet som tar in den. Ett sinne som stör, skyddar eller förvirrar smaken förklarar inte att båda blir sämre samtidigt.")
one("kul","pop","Midsommarafton",f"Midsommardagen är sedan 1953 en {G} helgdag, som alltid infaller på en lördag mellan den 20 och den 26 juni.",
 "rörlig",["dubbel","inofficiell","nyinstiftad"],O,"a","kol",
 "Rätt svar är rörlig. En helgdag som infaller på olika datum beroende på var lördagen hamnar flyttar sig mellan åren. Dubbel ger ingen mening här, midsommardagen är en officiell helgdag, och den fanns långt före 1953.")
one("kul","pop","Tomte",f"Tomten är i nordisk folktro ett litet väsen som vakar över gården och sköter om att djuren får foder och håller sig varma. Den kan dock också {G} folk som inte sköter sig.",
 "straffa",["belöna","hjälpa","föda"],O,"v","kon",
 "Rätt svar är straffa. Dock ställer det mot tomtens snälla sidor, och den som inte sköter sig får lida för det. Belöna och hjälpa är snälla handlingar, och en tomte föder inte folk.")
one("his","pop","Stadsport",f"Under medeltiden var stadsportarna de enda {G} till de städer som var omgivna av ringmurar.",
 "ingångarna",["gatorna","torgen","kyrkorna"],O,"s","kol",
 "Rätt svar är ingångarna. En stad med mur runt om kunde bara nås genom portarna. Gator, torg och kyrkor är inte vägar in genom muren.")
one("tek","pop","Banvakt",f"En banvakt hade ansvar för en bestämd del av järnvägen och skulle {G} den minst en gång om dagen, till fots eller med dressin.",
 "besiktiga",["flytta","asfaltera","stänga av"],O,"v","kol",
 "Rätt svar är besiktiga. Den som håller uppsikt över banan går igenom den för att se att allt är i ordning. Ingen bygger eller stänger av en järnväg varje dag, och järnvägar asfalteras inte.")
one("bio","pop","Lärkfalk",f"Lärkfalken är en snabb flygare som fångar stora insekter och småfåglar i luften. Den bygger sällan något eget bo utan {G} ofta ett kråkbo som har blivit övergivet.",
 "övertar",["river","bevakar","försvarar"],O,"v","kon",
 "Rätt svar är övertar. Utan ställer det mot att bygga eget bo, och falken flyttar alltså in i ett bo som någon annan har lämnat. Ett övergivet bo behöver inte rivas eller bevakas, och försvarar strider mot att den använder det.")
one("bio","pop","Sparvhök",f"Sparvhökens hane kan vara en fjärdedel mindre än honan, och det hör till fågelvärldens största {G} mellan könen.",
 "storleksskillnader",["likheter","färgskillnader","åldersskillnader"],O,"s","kol",
 "Rätt svar är storleksskillnader. Att hanen är en fjärdedel mindre handlar om hur stora de är. Likheter strider mot att de skiljer sig, och färg och ålder nämns inte.")
one("bio","pop","Ostron",f"Ostron lever av plankton som de {G} ur vattnet med hjälp av gälarna.",
 "silar",["jagar","odlar","utsöndrar"],O,"v","kol",
 "Rätt svar är silar. Ett djur som tar sin föda med gälarna låter vattnet passera och fångar det smådjur som finns i det. Ett ostron jagar inte och odlar inte plankton, och att utsöndra är att skicka ut och inte att äta.")
one("bio","pop","Fisktärna",f"Fisktärnan är en {G} som övervintrar vid kuster i tropikerna, långt från häckningsplatserna.",
 "långflyttare",["stannfågel","kortflyttare","nattfågel"],O,"s","def",
 "Rätt svar är långflyttare. En fågel som tillbringar vintern långt från platsen där den häckar flyttar långt. En stannfågel flyttar inte, en kortflyttare stannar närmare, och nattfågel säger inget om flytten.")
one("utb","pop","Skolbänk",f"Förr satt skolbänken och stolen ihop, men det ändrades eftersom många barn hade svårt att {G} fram till bänken.",
 "nå",["se","skriva","böja sig"],O,"v","ors",
 "Rätt svar är nå. När bänk och stol sitter ihop kan avståndet bli för stort för små barn. Barnen hade inte svårt att se, skriva eller böja sig fram till bänken för att stolen satt fast.")
one("tek","pop","Plugg",f"En plugg är en anordning som sätts i ett borrat hål för att en skruv ska få {G} i väggen.",
 "fäste",["glapp","spelrum","rost"],O,"s","kol",
 "Rätt svar är fäste. Pluggen ger skruven något att gripa tag i så att den sitter fast. Glapp och spelrum är motsatsen till att sitta fast, och ingen sätter i en plugg för att skruven ska rosta.")
one("eko","pop","Omsättning",f"Omsättningen är ett företags hela försäljning under en viss tid. Den är inte samma sak som vinsten, eftersom {G} inte räknas bort.",
 "kostnaderna",["intäkterna","inbetalningarna","försäljningen"],O,"s","ors",
 "Rätt svar är kostnaderna. Vinsten är det som blir kvar när utgifterna har dragits av från försäljningen. Intäkterna, inbetalningarna och försäljningen är själva omsättningen och dras inte av från den.")
one("mil","pop","Dimma",f"Dimma bildas när luften är så full av små vattendroppar att {G} blir kortare än en kilometer.",
 "sikten",["dagsljuset","horisonten","molnbasen"],O,"s","kol",
 "Rätt svar är sikten. Vattendroppar i luften gör att man inte kan se lika långt. Dagsljuset och molnbasen mäts inte i hur långa de är, och horisonten blir inte kortare.")
one("mil","pop","Insjö",f"En insjö är en sjö inne i landet som inte hör till något hav och inte heller till något {G}.",
 "vattendrag",["moln","snötäcke","isberg"],O,"s","par",
 "Rätt svar är vattendrag. Hav står bredvid, och det andra som en sjö skiljer sig från är vatten som rinner, som en å eller älv. Moln, snötäcke och isberg är inte samlingar av vatten på marken som en sjö kan förväxlas med.")
one("tek","pop","Borrmaskin",f"En borrmaskin är ett verktyg som {G} och oftast drivs med el.",
 "snurrar",["svetsar","böjer sig","läcker"],O,"v","def",
 "Rätt svar är snurrar. En borr gör hål genom att rotera. En borrmaskin svetsar inte, och ett verktyg som böjer sig eller läcker fungerar inte.")
one("rel","pop","Lättja",f"Lättja är en av kristendomens sju dödssynder och brukar förklaras som lathet eller likgiltighet. Dess motsats är {G}.",
 "flit",["ilska","girighet","ödmjukhet"],O,"s","kon",
 "Rätt svar är flit. Motsatsen till lathet är att arbeta hårt och ihärdigt. Ilska och girighet är andra synder och inte motsatser till lathet, och ödmjukhet är motsatsen till högmod.")
# ---------- två luckor ----------
two("med","myn","1177 Nästäppa och snuva",f"Vid en förkylning {G} slemhinnorna i näsan, så att det blir svårt att andas genom den. Snoret är först tunt och nästan {G}, men efter några dagar blir det tjockare och mer gult eller grönt.",
 ["svullnar","genomskinligt"],[["sväller","grumligt"],["bleknar","klart"],["blänker","kokande"]],T2,F2,["v","a"],["ors","kon"],
 "Rätt svar är svullnar och genomskinligt. Slemhinnor som gör det svårt att andas har blivit tjockare, och sväller fungerar också. Men ställer det tunna snoret mot det gula och gröna, alltså är det först utan färg, och klart fungerar också. Torra eller blänkande slemhinnor täpper inte till näsan, grumligt strider mot kontrasten mot gult och grönt, och snor är inte kokande.")
two("med","pop","Muskelvärk",f"Myalgi är den medicinska termen för smärta i musklerna, och den ska {G} från värk i lederna och i musklernas fästen. Myalgi kan bero på muskeln själv, men den kan också vara ett {G} på en annan sjukdom.",
 ["skiljas","symtom"],[["särskiljas","botemedel"],["utvinnas","tecken"],["sys","pris"]],T2,F2,["v","s"],["kol","kon"],
 "Rätt svar är skiljas och symtom. En term för muskelsmärta ska inte blandas ihop med smärta på andra ställen, och särskiljas fungerar också. Men också ställer muskeln själv mot en annan sjukdom som ger smärtan, och tecken fungerar också. Smärta utvinns eller sys inte ur något, och ett botemedel eller pris är inte vad en sjukdom ger.")
two("kul","pop","Säckpipa",f"Under medeltiden fanns säckpipan i alla delar av Europa. I Sverige {G} den längst i Västerdalarna och norra Värmland, men i början av 1900-talet hade den dött ut, och de svenska säckpipor som byggs har gjorts som {G} av gamla bevarade instrument.",
 ["levde kvar","rekonstruktioner"],[["fanns kvar","förfalskningar"],["uppfanns","kopior"],["simmade","skämt"]],T2,F2,["utr","s"],["kol","kol"],
 "Rätt svar är levde kvar och rekonstruktioner. Ett instrument som dog ut i början av 1900-talet fanns längst i vissa trakter, och fanns kvar fungerar också. Nya instrument som byggs efter gamla förlagor är återskapade, och kopior fungerar också. Säckpipan uppfanns inte i Värmland och simmade inte, och nya instrument är varken förfalskningar eller skämt.")
two("kul","pop","Spelmanslag",f"Ett spelmanslag är en grupp folkmusiker där fiolen oftast är det {G} instrumentet. Spelmanslagen spelar för det mesta låtar som är {G} för den egna landsändan.",
 ["ledande","typiska"],[["främsta","obekanta"],["tystaste","utmärkande"],["billigaste","olagliga"]],T2,F2,["a","a"],["kol","kol"],
 "Rätt svar är ledande och typiska. Det instrument som flest spelar och som bär musiken leder gruppen, och främsta fungerar också. Låtar från den egna trakten är sådana som hör hemma där, och utmärkande fungerar också. Fiolen är inte det tystaste eller billigaste instrumentet, och de egna låtarna är inte obekanta eller olagliga för trakten.")
two("his","pop","Bergsman",f"En bergsman var en bonde som utöver jordbruket också {G} bergsbruk. Han bröt malmen och förädlade den, och rätten att göra det {G} i ett privilegiebrev.",
 ["bedrev","fastställdes"],[["drev","drogs in"],["undvek","angavs"],["lackerade","tvättades"]],T2,F2,["v","v"],["def","kol"],
 "Rätt svar är bedrev och fastställdes. En bergsman var just den som höll på med bergsbruk, och drev fungerar också. Ett privilegiebrev ger en rätt, och angavs fungerar också. Undvek strider mot att han bröt malmen, en rätt upphävs inte i ett privilegiebrev, och bergsbruk lackeras inte och rättigheter tvättas inte.")
two("his","pop","Tjänstehjon",f"Pigor och drängar var tjänstefolk vars villkor bestämdes av en stadga som i praktiken gav dem en allmän {G} att skaffa sig en husbonde och ta tjänst hos honom. Tjänsten gällde ett år i taget, och den årliga {G} inföll i oktober.",
 ["skyldighet","flyttningsdagen"],[["förpliktelse","födelsedagen"],["rättighet","omflyttningen"],["längtan","semestern"]],T2,F2,["s","s"],["kol","kol"],
 "Rätt svar är skyldighet och flyttningsdagen. En stadga som tvingade tjänstefolket att hitta arbete ålade dem något, och förpliktelse fungerar också. När tjänsten gällde ett år bytte folket arbetsplats en gång om året, och omflyttningen fungerar också. Rättighet och längtan strider mot att stadgan tvingade dem, och tjänstefolket hade varken en gemensam födelsedag eller semester.")
two("sam","pop","Soppkök",f"Ett soppkök serverar enkel men {G} mat till behövande, och det drivs oftast av välgörenhetsorganisationer. Maten är inte alltid soppa, men soppor och grytor är lätta att laga i stora {G} och att hålla varma.",
 ["näringsrik","mängder"],[["nyttig","drag"],["onyttig","satser"],["frusen","trappor"]],T2,F2,["a","s"],["kon","kol"],
 "Rätt svar är näringsrik och mängder. Men ställer det enkla mot att maten ändå ger kroppen det den behöver, och nyttig fungerar också. Ett kök som lagar mat åt många lagar mycket på en gång, och satser fungerar också. Onyttig strider mot men, frusen mat serveras inte varm, och man lagar inte mat i stora drag eller trappor.")
two("sam","pop","Förtroendevald",f"Förtroendevald kallas den som har fått ett uppdrag genom {G} och förväntas sköta det efter sin egen övertygelse. Det skiljer sig från den som är {G} och förutsätts sköta sitt arbete utan att låta de egna åsikterna styra.",
 ["val","anställd"],[["omröstning","vald"],["arv","tjänsteman"],["dans","sjuk"]],T2,F2,["s","a"],["def","kon"],
 "Rätt svar är val och anställd. Ordet förtroendevald visar att uppdraget har getts genom att människor röstat, och omröstning fungerar också. Det skiljer sig ställer den förtroendevalde mot den som har fått en tjänst, och tjänsteman fungerar också. Vald strider mot att det ska vara en skillnad, ett uppdrag ärvs inte eller ges genom dans, och sjuk har inget med uppdraget att göra.")
two("sam","myn","Talman",f"En talman är den som {G} arbetet i en församling som fattar beslut, som ett parlament. Titeln används {G}, så både kvinnor och män kan vara talman.",
 ["leder","könsneutralt"],[["styr","sparsamt"],["stör","oavsett kön"],["hyr","viskande"]],T2,F2,["v","adv"],["def","ors"],
 "Rätt svar är leder och könsneutralt. En talman är ordförande för församlingen, och styr fungerar också. Att det finns talmän av båda könen visar att titeln gäller för alla, och oavsett kön säger samma sak. En talman stör eller hyr inte arbetet, och sparsamt eller viskande förklarar inte varför både kvinnor och män kallas talman.")
two("bio","pop","Mufflon",f"Mufflonfår är vilda {G} av fårarten, och de finns i västra Asien och Europa. En del är ursprungligen vilda, medan andra är tamfår som har {G}.",
 ["bestånd","förvildats"],[["populationer","tämjts"],["avelsdjur","blivit vilda"],["mönster","klippts"]],T2,F2,["s","v"],["def","kon"],
 "Rätt svar är bestånd och förvildats. Djur av en art som lever på olika platser bildar olika grupper, och populationer fungerar också. Medan ställer de ursprungligt vilda mot tamfår som har gått över till ett vilt liv, och blivit vilda säger samma sak. Avelsdjur och mönster är inte vilda grupper, och tamfår som tämjts eller klippts är inte vilda.")
two("kul","pop","Almanacka",f"En almanacka listar årets alla dagar, veckor och månader och anger bland annat {G} och namnsdagar. Förr innehöll den också {G} om väder, hälsa och krig.",
 ["helgdagar","förutsägelser"],[["högtider","kvitton"],["räntor","spådomar"],["löner","frimärken"]],T2,F2,["s","s"],["par","kol"],
 "Rätt svar är helgdagar och förutsägelser. Namnsdagar står bredvid, och det som också märks ut i en kalender är de lediga dagarna, vilket högtider också säger. Väder och krig i en gammal almanacka handlade om vad som skulle hända, och spådomar fungerar också. Räntor och löner står inte i en kalender, och kvitton och frimärken innehåller ingenting om väder.")
two("kul","pop","Debattartikel",f"En debattartikel liknar en insändare, men den brukar få mer {G} och placeras mer synligt i tidningen. Den som skriver måste alltid {G} med sitt namn.",
 ["spaltutrymme","träda fram"],[["uppmärksamhet","gömma sig"],["bannor","stå"],["mat","brottas"]],T2,F2,["s","utr"],["kon","kol"],
 "Rätt svar är spaltutrymme och träda fram. Men ställer debattartikeln mot insändaren, och den får mer plats i tidningen, vilket uppmärksamhet också fångar. Den som skriver måste alltid visa vem den är, och stå med sitt namn fungerar också. En artikel får inte bannor av tidningen, mat ger ingen mening, och den som gömmer sig eller brottas med sitt namn träder inte fram.")
two("lit","pop","Folkbok",f"Folkböcker är skrifter av olika slag som har getts ut i stora upplagor och som var {G} för breda folklager. Vanligast var Bibeln, psalmboken och almanackan, och begreppet {G} under det tidiga 1800-talet med tyskan som förebild.",
 ["avsedda","kom till"],[["tänkta","föll bort"],["olämpliga","uppstod"],["sydda","dansade"]],T2,F2,["a","utr"],["kol","kol"],
 "Rätt svar är avsedda och kom till. Böcker i stora upplagor var gjorda för att läsas av många, och tänkta fungerar också. Ett begrepp efter tysk förebild skapades vid en viss tid, och uppstod fungerar också. Olämpliga strider mot att folket läste dem, böcker sys inte för folklager, och ett begrepp som föll bort eller dansade har ingen förebild.")
two("lit","pop","Moralitet",f"En moralitet är ett religiöst skådespel på vers där {G} som dygder och laster uppträder som rollfigurer. Genren fanns främst i Frankrike och England, och i England levde den kvar tills Oliver Cromwell {G} den.",
 ["begrepp","förbjöd"],[["idéer","räddade"],["djur","stoppade"],["maträtter","beställde"]],T2,F2,["s","v"],["def","kol"],
 "Rätt svar är begrepp och förbjöd. Dygder och laster är saker man tänker och inte personer, och idéer fungerar också. En genre som levde kvar tills någon ingrep fick ett slut, och stoppade fungerar också. Djur och maträtter är inte dygder och laster, och den som räddade eller beställde genren gjorde inte slut på den.")
two("utb","pop","Studentbostad",f"I en korridorbostad har alla ett eget rum men {G} samma kök och andra utrymmen med de andra i korridoren. Studentettor har byggts med undantag från vissa regler och har därför ofta en {G} plats för matlagning än en vanlig lägenhet.",
 ["nyttjar","trängre"],[["använder","rymligare"],["äger","knappare"],["vattnar","fuktigare"]],T2,F2,["v","a"],["kon","ors"],
 "Rätt svar är nyttjar och trängre. Men ställer det egna rummet mot det som alla använder, och använder fungerar också. Undantag från reglerna ger mindre plats än vanligt, och knappare fungerar också. Den som hyr ett rum äger inte köket och vattnar det inte, och en rymligare eller fuktigare plats följer inte av undantagen.")
two("eko","pop","Bolagsstämma",f"Bolagsstämman är det organ i ett aktiebolag där {G} fattar de viktigaste besluten. Varje år måste det hållas minst en stämma, och dessutom kan styrelsen {G} extra stämmor när det behövs.",
 ["aktieägarna","kalla till"],[["delägarna","ställa in"],["styrelseledamöterna","sammankalla"],["revisorerna","avlysa"]],T2,F2,["s","utr"],["kol","kol"],
 "Rätt svar är aktieägarna och kalla till. På stämman bestämmer de som äger bolaget, och delägarna fungerar också. Extra stämmor när det behövs måste någon samla till, och sammankalla säger samma sak. Styrelsen och revisorerna fattar inte stämmans beslut, och man ställer inte in eller avlyser extra stämmor när de behövs.")
two("eko","pop","Livsmedelsbutik",f"En livsmedelsbutik säljer mat, och handlaren har ett {G} av matvaror i lager. I ett snabbköp {G} kunden själv ihop sina varor från hyllorna.",
 ["sortiment","plockar"],[["utbud","sorterar"],["underskott","samlar"],["raseri","sover"]],T2,F2,["s","v"],["def","kol"],
 "Rätt svar är sortiment och plockar. Det urval av varor som butiken har att sälja är dess sortiment, och utbud fungerar också. I ett snabbköp hämtar kunden varorna själv, och samlar ihop fungerar också. Ett underskott eller raseri har man inte i lager, och kunden sorterar eller sover inte ihop sina varor.")
two("jur","pop","Tvistemål",f"Ett tvistemål är ett mål där domstolen avgör frågor mellan {G} parter som inte har kunnat enas. Den part som har väckt talan kallas kärande och {G} kallas svarande.",
 ["privata","motparten"],[["två","domaren"],["statliga","den andra parten"],["sovande","vittnet"]],T2,F2,["a","s"],["def","kon"],
 "Rätt svar är privata och motparten. Ett tvistemål gäller enskilda personer eller företag, och två fungerar också. Kärande ställs mot den som talan väcks mot, och den andra parten säger samma sak. Statliga parter avgörs inte i ett tvistemål mellan enskilda, sovande parter ger ingen mening, och domaren och vittnet är inte parter i målet.")
two("kul","pop","Betänketid",f"Betänketid används i brädspel för två spelare, så att varje omgång blir {G} inom rimlig tid. Båda spelarna får lika mycket tid, vilket ger dem lika {G}.",
 ["avslutad","chanser"],[["färdigspelad","poäng"],["sen","möjligheter"],["glad","pjäser"]],T2,F2,["a","s"],["kol","kol"],
 "Rätt svar är avslutad och chanser. En klocka som begränsar tiden gör att partiet tar slut när det ska, och färdigspelad fungerar också. Lika mycket tid gör att ingen får en fördel, och möjligheter fungerar också. En klocka gör inte omgången sen eller glad, och lika tid ger inte lika poäng eller pjäser.")
two("psy","pop","Korttidsminne",f"Korttidsminnet håller informationen {G} medan en uppgift pågår, till exempel ett telefonnummer medan man slår det. Vill man minnas numret längre måste man {G} in det, och då lagras det i långtidsminnet.",
 ["tillgänglig","nöta"],[["åtkomlig","sudda"],["gömd","plugga"],["kantig","vissla"]],T2,F2,["a","v"],["kol","kon"],
 "Rätt svar är tillgänglig och nöta. Ett nummer som man slår måste finnas till hands just då, och åtkomlig fungerar också. Att minnas längre kräver att man upprepar numret tills det fastnar, och plugga in fungerar också. Gömd och kantig information går inte att använda, och den som suddar eller visslar in numret lär sig det inte.")
# ---------- tre luckor ----------
three("sam","pop","Kvinnorörelse",f"Kvinnorörelsen är ett samlande namn för den {G} rörelse som har kämpat för kvinnors rätt i samhället. Ordet feminist var från början ett {G} ord, men kvinnorörelsen tog över det i slutet av 1800-talet, och i Sverige {G} begreppet feminism 1903.",
 ["politiska","förklenande","introducerades"],[["samhälleliga","förlöjligande","ifrågasattes"],["kortlivade","nedlåtande","lanserades"],["militära","smickrande","hånades"]],T3,F3,["a","a","v"],["def","kon","kol"],
 "Rätt svar är politiska, förklenande och introducerades. En rörelse som kämpar för rättigheter i samhället arbetar med politik, och samhälleliga fungerar också. Men visar att ordet först användes för att kränka, och förlöjligande eller nedlåtande fungerar också. Ett begrepp som fick sin början ett visst år kom in i språket, och lanserades säger samma sak. Kortlivade strider mot en rörelse med lång historia, en militär rörelse kämpar inte för kvinnors rätt, smickrande strider mot men, och ett begrepp som ifrågasattes eller hånades fick inte sin början det året.")
three("rel","pop","Väckelserörelse",f"En väckelse är en tid med {G} religiös aktivitet, och i Sverige förknippas ordet främst med 1800-talets folkväckelse. Det främsta kännetecknet är att många upplever att de har blivit {G}, och väckelsen bygger på en rörelse bland vanligt folk och inte på något som {G} uppifrån.",
 ["ökad","frälsta","påbjuds"],[["intensiv","omvända","glöms bort"],["minskad","troende","bestäms"],["dämpad","bannlysta","spirar"]],T3,F3,["a","a","v"],["def","kol","kon"],
 "Rätt svar är ökad, frälsta och påbjuds. En väckelse innebär att intresset för religion blir större, och intensiv fungerar också. Det som utmärker en väckelse är att människor upplever att de har räddats och vänt sig till Gud, och omvända eller troende fungerar också. Inte något uppifrån ställer folkrörelsen mot det som ledare beordrar, och bestäms säger samma sak. Minskad och dämpad strider mot väckelse, bannlysta är inte vad de väckta upplever, och det som glöms bort eller spirar uppifrån är inte motsatsen till en folkrörelse.")
three("utb","pop","Bildning",f"Med bildning menas att personligheten utvecklas genom studier och läsning. Den står i motsats till utbildning, som har en {G} yrkeskunskap som mål, medan bildningen vill {G} hela människan och {G} en alltför snäv specialisering.",
 ["bestämd","forma","motverka"],[["avgränsad","utveckla","gynna"],["obestämd","omvandla","motarbeta"],["kortsiktig","försvaga","belöna"]],T3,F3,["a","v","v"],["kol","kon","kol"],
 "Rätt svar är bestämd, forma och motverka. Utbildning för ett yrke har ett tydligt mål, och avgränsad fungerar också. Medan ställer det mot bildningen som vill påverka hela människan, och utveckla eller omvandla fungerar också. Att specialiseringen kallas alltför snäv visar att bildningen vill hindra den, och motarbeta säger samma sak. Obestämd strider mot ett yrkesmål, kortsiktig säger inget om vad målet är, bildning vill inte försvaga människan, och man vill inte gynna eller belöna något som är alltför snävt.")
three("mil","pop","Återbruk",f"Vid återbruk tas en produkt som ses som {G} i bruk igen. Det är oftast det mest {G} sättet att ta vara på saker, eftersom produkten används igen utan att ändras, till skillnad från {G}, där produkten förstörs och bara materialet tas till vara.",
 ["förbrukad","miljövänliga","återvinning"],[["uttjänt","hållbara","reparation"],["oanvänd","skonsamma","smältning"],["nyinköpt","tidsödande","försäljning"]],T3,F3,["a","a","s"],["def","kol","kon"],
 "Rätt svar är förbrukad, miljövänliga och återvinning. Något som ska användas på nytt har redan gjort sin tjänst, och uttjänt fungerar också. En produkt som används igen utan ändringar sparar på jordens resurser, och hållbara eller skonsamma fungerar också. Till skillnad från ställer återbruk mot ett sätt där produkten förstörs, och smältning fungerar också. Oanvänd och nyinköpt strider mot på nytt, tidsödande säger inget om att ta vara på saker, och vid reparation eller försäljning förstörs inte produkten.")
three("jur","pop","Hets mot folkgrupp",f"Den som gör sig skyldig till hets mot folkgrupp har begått brottet att {G} sprida uttalanden som hotar eller uttrycker missaktning mot en grupp människor. I många länder {G} sådana lagar yttrandefriheten, medan USA har ett starkare {G} för den.",
 ["offentligt","inskränker","värn"],[["öppet","kringskär","hot"],["i smyg","beskär","försvar"],["omedvetet","befäster","tak"]],T3,F3,["adv","v","s"],["def","kol","kon"],
 "Rätt svar är offentligt, inskränker och värn. Brottet gäller uttalanden som sprids till många, och öppet fungerar också. En lag som förbjuder vissa uttalanden gör yttrandefriheten mindre, och kringskär eller beskär fungerar också. Medan ställer USA mot de länderna, och där skyddas yttrandefriheten mer, vilket försvar också säger. I smyg strider mot att sprida, ett brott begås inte omedvetet, en lag mot uttalanden befäster inte yttrandefriheten, och ett hot eller tak för den är inte motsatsen till att inskränka den.")
three("fil","pop","Visdom",f"Visdom innebär att veta vad som ska göras, varför och när, och att kunna {G} vad som händer när det är gjort. Stefan Einhorn beskriver visdom som förmågan att lösa {G} problem, och ordet används ofta {G} med vishet.",
 ["förutse","komplexa","synonymt"],[["förutsäga","invecklade","omväxlande"],["ignorera","svårlösta","liktydigt"],["missa","enkla","motsatt"]],T3,F3,["v","a","adv"],["def","kol","kol"],
 "Rätt svar är förutse, komplexa och synonymt. Den som vet vad som kommer att hända ser det i förväg, och förutsäga fungerar också. Visdom behövs för problem som inte är enkla, och invecklade eller svårlösta fungerar också. Visdom och vishet betyder samma sak, och liktydigt säger samma sak. Ignorera och missa strider mot att veta, enkla problem kräver ingen visdom, och ett ord används inte omväxlande eller motsatt med ett annat som betyder samma sak.")
three("fil","pop","Hermeneutik",f"Hermeneutik är läran om hur man {G} texter och förstår dem. Ordet kommer av ett grekiskt verb för att tolka och förkunna, och det har {G} med guden Hermes, som i mytologin var den {G} som förde gudarnas budskap till människorna.",
 ["tolkar","kopplats","budbärare"],[["uttyder","förbundits","härskare"],["binder in","associerats","sändebud"],["kopierar","förväxlats","rådgivare"]],T3,F3,["v","v","s"],["def","kol","def"],
 "Rätt svar är tolkar, kopplats och budbärare. Att förstå en text innebär att man läser ut vad den betyder, och uttyder fungerar också. Ordet har satts i samband med guden, och förbundits eller associerats fungerar också. Den som för budskap mellan gudar och människor är en budbärare, och sändebud fungerar också. Att binda in eller kopiera en text är inte att förstå den, ordet har inte förväxlats med guden utan fått namn efter honom, och en härskare eller rådgivare för inte fram budskap.")
three("mil","pop","Hagmark",f"Betesmark är jordbruksmark där djur som kor, får och hästar får {G}. Djuren bidrar samtidigt med naturlig {G} av marken, och odlingslandskapet med sina betesmarker är ett av Sveriges nationella {G}.",
 ["beta","gödsling","miljömål"],[["gå på bete","dränering","sporter"],["slaktas","gödning","mål för miljön"],["förvaras","försurning","sevärdheter"]],T3,F3,["v","s","s"],["def","kol","kol"],
 "Rätt svar är beta, gödsling och miljömål. På en betesmark äter djuren gräs, och gå på bete fungerar också. Djur som går på marken lämnar gödsel efter sig, och gödning fungerar också. Ett odlingslandskap som ska bevaras är ett av målen för miljön, och mål för miljön säger samma sak. Djur slaktas eller förvaras inte på betesmark, de dränerar eller försurar inte marken, och landskapet är varken en sport eller en sevärdhet bland Sveriges mål.")
three("spr","pop","Andraspråk",f"Ett andraspråk lär man sig efter sitt {G}, i ett land eller en omgivning där det språket används, till exempel efter en flytt. Ett språk som man lär sig någon annanstans räknas inte som andraspråk, oavsett hur bra man lär sig {G} det, och begreppen är alltså inget mått på {G}.",
 ["modersmål","behärska","färdighet"],[["förstaspråk","bemästra","härkomst"],["efternamn","kunna","kunskap"],["skolgång","överge","bosättning"]],T3,F3,["s","v","s"],["def","kol","kon"],
 "Rätt svar är modersmål, behärska och färdighet. Ett andra språk lärs efter det första, och förstaspråk fungerar också. Hur bra man lär sig ett språk handlar om hur väl man kan det, och bemästra eller kunna fungerar också. Oavsett hur bra man lär sig visar att begreppen inte säger något om hur skicklig man är, och kunskap fungerar också. Ett språk lärs inte efter ett efternamn eller en skolgång, man lär sig inte att överge ett språk, och härkomst eller bosättning är inte vad oavsett hur bra handlar om.")
three("spr","pop","Avledning",f"Avledning är ett sätt att bilda ord, där en del som inte kan {G} som ett eget ord läggs till ett befintligt ord. Delar som står före ordstammen kallas prefix och delar som står {G} kallas suffix, och prefixen ändrar ordets betydelse men inte dess {G}.",
 ["fungera","efter","ordklass"],[["användas","bakom","betydelse"],["uttalas","sist","kategori"],["skrivas","inuti","uttal"]],T3,F3,["v","adv","s"],["def","kon","kon"],
 "Rätt svar är fungera, efter och ordklass. En del som inte kan stå för sig själv kan inte användas som ett ord, och användas fungerar också. Före ställs mot ändelser som står sist i ordet, och bakom eller sist fungerar också. Men inte ställer betydelsen mot något annat hos ordet, och det är vilken sorts ord det är, vilket kategori också säger. Betydelse strider mot att prefixen ändrar den, delar som inte kan uttalas eller skrivas finns inte, inuti stammen står inga suffix, och ett prefix ändrar ordets uttal.")
write(37)
