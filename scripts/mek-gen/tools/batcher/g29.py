import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from mekgen_lib import it, write, G
def one(a,g,t,txt,k,ds,dt,ok,lt,ex): it(a,g,t,txt,[k],[[d] for d in ds],dt,[[1],[1],[1]],[ok],[lt],ex)
two=it; three=it
F2=[[2],[1],[1,2]]; T2=[["de","fa"],["fa","de"],["fa","fa"]]
F3=[[3],[1],[1,2,3]]; T3=[["de","de","fa"],["fa","de","de"],["fa","fa","fa"]]
O=[["fa"],["fa"],["fa"]]
# ---------- en lucka ----------
one("med","myn","1177 Nacksparr",f"Vid nackspärr är musklerna i nacken spända, och det är svårt att vrida på huvudet. Många tror att kroppen läker bäst i vila, men rörelse ökar {G} och får läkningen att gå fortare.",
 "blodcirkulationen",["smärtan","stelheten","trycket"],O,"s","ors",
 "Rätt svar är blodcirkulationen. Något som rörelse ökar och som får läkningen att gå fortare måste vara bra för kroppen. Mer smärta, stelhet eller tryck gör inte att nacken läker snabbare.")
one("med","myn","1177 Gikt",f"Vid gikt har det samlats kristaller av urinsyra i en led. Kristallerna liknar små vassa nålar, och de ger {G} och inflammation i leden.",
 "smärta",["hosta","torrhet","klåda"],O,"s","par",
 "Rätt svar är smärta. Vassa nålar i en led gör ont, och smärta står bredvid inflammation. Hosta, torrhet och klåda är inte vad vassa kristaller i en led ger.")
one("psy","pop","Sömngång",f"Den som går i sömnen gör sådant som man annars bara gör i vaket tillstånd. Det sker oftast under nattens första tredjedel, när sömnen är som {G}.",
 "djupast",["oroligast","kortast","ljusast"],O,"a","kol",
 "Rätt svar är djupast. Sömnen beskrivs som djup eller lätt, och det är i den djupa sömnen som sömngången sker. Oroligast, kortast och ljusast är inte ord för hur djupt man sover.")
one("kul","pop","Snaps",f"En snaps är en liten mängd brännvin, ungefär en munfull, som dricks i ett {G}. Den hör traditionellt till umgänge och måltider och följs ofta av särskilda visor.",
 "svep",["slag","led","varv"],O,"s","kol",
 "Rätt svar är svep. En munfull dricks på en gång, och i ett svep är ett fast uttryck för det. I ett slag, led eller varv säger man inte om att dricka.")
one("kul","pop","Hardingfela",f"Hardingfelan är en rikt utsmyckad norsk fiol med extra resonanssträngar som {G} med när man spelar, och sedan nationalromantiken räknas den som Norges inofficiella nationalinstrument.",
 "klingar",["stäms","brister","slits"],O,"v","kol",
 "Rätt svar är klingar. Resonanssträngar är strängar som ljuder med de andra utan att man spelar på dem. Strängar stäms före spelet, och att de brister eller slits är inget de är till för.")
one("kul","pop","Orgel",f"Orgeln är ett blåsinstrument med pipor och mekanisk lufttillförsel, men eftersom den spelas från en eller flera klaviaturer är den också ett {G}.",
 "tangentinstrument",["stränginstrument","slagverk","rytminstrument"],O,"s","ors",
 "Rätt svar är tangentinstrument. En klaviatur består av tangenter, och eftersom visar att det är den som avgör ordet. En klaviatur gör inte orgeln till ett stränginstrument, slagverk eller rytminstrument.")
one("his","pop","Kopparberget",f"Brytningen vid Kopparberget i Falun nämns i skrift första gången 1288, men den hade då redan {G} åtminstone sedan 1000-talet.",
 "pågått",["stannat av","planerats","utretts"],O,"v","kon",
 "Rätt svar är pågått. Men redan visar att brytningen hade hållit på länge innan den skrevs ned. Stannat av strider mot att gruvan bröts vidare, och en brytning som bara planerats eller utretts sedan 1000-talet ger ingen mening.")
one("his","pop","Kurort",f"På en kurort får man behandling och vila. Den kan ligga vid en badplats eller i en trakt med ett {G} klimat för vård, och förr ingick ofta brunnsdrickning i vistelsen.",
 "gynnsamt",["skiftande","fuktigt","stormigt"],O,"a","kol",
 "Rätt svar är gynnsamt. Ett klimat för vård ska vara bra för de sjuka. Skiftande, fuktigt och stormigt klimat hjälper inte vården.")
one("kul","pop","Pensionat",f"Ett pensionat är ett enkelt hotell. Skillnaden mot andra hotell ligger främst i {G}: på pensionatet ingår ofta logi, städning, måltider och aktiviteter.",
 "serviceutbudet",["läget","priset","storleken"],O,"s","def",
 "Rätt svar är serviceutbudet. Kolonet räknar upp det som ingår, och det är tjänster. Läget, priset och storleken räknas inte upp efter kolonet.")
one("sam","pop","Trångboddhet",f"Trångboddhet innebär att ett hushåll har för lite {G} i sin bostad, och gränsen för vad som räknas som trångbott har skiftat mellan länder och tider.",
 "utrymme",["ljus","isolering","inredning"],O,"s","def",
 "Rätt svar är utrymme. Att bo trångt är att ha för lite plats. Ljus, isolering och inredning har inget med trängsel att göra.")
one("bio","pop","Domherre",f"Domherren lever främst i barrskog, och de flesta är stannfåglar. De nordligaste populationerna {G} dock söderut om vintern.",
 "flyttar",["häckar","sjunger","ruggar"],O,"v","kon",
 "Rätt svar är flyttar. Dock ställer de nordligaste fåglarna mot stannfåglarna, och söderut om vintern visar att de lämnar sina områden. Fåglar häckar, sjunger eller ruggar inte söderut.")
one("bio","pop","Sidensvans",f"Sidensvansen häckar längst upp i norr, men om vintern kan man se den i stora {G} längre söderut.",
 "flockar",["bon","träd","dräkter"],O,"s","kol",
 "Rätt svar är flockar. Fåglar som syns i stort antal på vintern rör sig i grupp. Bon bygger fåglarna när de häckar, och träd eller dräkter är inget fåglar syns i söderut.")
one("his","pop","Runsten",f"En runsten är en sten med inhuggna runor, och numera avser ordet oftast en sten som ska stå {G}. Fasta block och berghällar med runor kallas i stället runblock och runhällar.",
 "upprest",["skyddad","målad","ensam"],O,"a","kon",
 "Rätt svar är upprest. I stället ställer de fasta blocken och hällarna mot stenen, alltså är runstenen rest på sin plats. Skyddad, målad och ensam skiljer inte en runsten från ett fast block.")
one("utb","pop","Repetition",f"Inför en teaterföreställning eller en konsert repeterar deltagarna oftast utan {G}, för att lära in hur framträdandet bäst ska göras offentligt.",
 "publik",["biljetter","paus","ackompanjemang"],O,"s","kon",
 "Rätt svar är publik. Offentligt ställs mot övningen före, när ingen ser på. Biljetter, paus och ackompanjemang har inget med skillnaden mellan övning och offentligt framträdande att göra.")
one("eko","pop","Bankomat",f"Bankomaterna är uttagsautomater som har skapats i ett {G} mellan flera banker, och de flesta automaterna i Sverige tillhör samma bolag.",
 "samarbete",["uppror","lopp","gräl"],O,"s","kol",
 "Rätt svar är samarbete. Banker som har ett gemensamt bolag arbetar tillsammans. Ett uppror, lopp eller gräl skapar inga gemensamma automater.")
one("eko","pop","Sedel",f"De äldsta sedlarna kom från Kina under Songdynastin, och där höll staten inflationen i schack genom att inte {G} för många sedlar.",
 "trycka",["samla in","förfalska","bränna"],O,"v","ors",
 "Rätt svar är trycka. Inflation uppstår när det kommer ut för mycket pengar, och sedlar kommer ut genom att tryckas. Att samla in eller bränna sedlar höjer inte inflationen, och staten förfalskar inte sina egna sedlar.")
one("jur","pop","Rättskapacitet",f"Rättskapacitet är förmågan att vara bärare av rättigheter, och i modern rätt har alla människor den redan genom att de {G}.",
 "existerar",["röstar","arbetar","äger"],O,"v","kol",
 "Rätt svar är existerar. Redan genom att visar att det inte krävs något särskilt, alltså räcker det att finnas till. Att rösta, arbeta eller äga något är krav som inte alla människor uppfyller.")
one("fil","pop","Deism",f"Enligt deismen har Gud skapat världen men {G} inte längre i dess gång, och efter skapelsen fungerar världen helt enligt naturlagarna.",
 "ingriper",["vilar","bor","tvivlar"],O,"v","kon",
 "Rätt svar är ingriper. Om världen sköter sig själv enligt naturlagarna gör Gud inget i den. Vilar, bor och tvivlar i världens gång ger ingen mening.")
one("mil","pop","Lavin",f"En lavin uppstår ofta när ett svagt snölager inte längre orkar {G} snön ovanför och kollapsar.",
 "bära",["smälta","täcka","fånga"],O,"v","kol",
 "Rätt svar är bära. Ett svagt lager som kollapsar har inte orkat hålla upp tyngden. Att smälta, täcka eller fånga snön ovanför är inget ett lager orkar eller inte orkar.")
one("spr","pop","Diftong",f"En diftong är en vokal med två klangfärger, alltså en {G} mellan två vokalljud i samma stavelse, som i ordet paus.",
 "glidning",["avbrott","upprepning","förkortning"],O,"s","def",
 "Rätt svar är glidning. Två klangfärger i samma vokal betyder att ljudet rör sig från det ena till det andra. Ett avbrott, en upprepning eller förkortning ger inte två klangfärger.")
# ---------- två luckor ----------
two("med","myn","1177 Skolios",f"Vid skolios är ryggraden {G} i sidled, och ena skulderbladet kan sticka ut. Det kan bero på att ryggen växer {G} när barnet växer på längden.",
 ["krökt","ojämnt"],[["böjd","hastigt"],["rak","snett"],["bruten","sent"]],T2,F2,["a","adv"],["kol","ors"],
 "Rätt svar är krökt och ojämnt. En rygg som syns genom ett skulderblad som sticker ut är böjd åt sidan, och böjd fungerar också. Om ryggen böjs när barnet växer har den inte vuxit likadant på båda sidor, och snett fungerar också. En rak rygg ger ingen skolios, ryggen är inte bruten, och hastig eller sen växt förklarar inte en krökning.")
two("med","myn","1177 Löparknä",f"Löparknä kan komma om man börjar träna mer än kroppen är {G} vid. Smärtan sitter på utsidan av knät och {G} under träningspasset.",
 ["van","tilltar"],[["anpassad","lägger sig"],["ovan","stegras"],["trött","slocknar"]],T2,F2,["a","v"],["kol","kol"],
 "Rätt svar är van och tilltar. Att träna mer än kroppen är van vid betyder att belastningen är ny, och anpassad fungerar också. Smärta från för hård träning blir värre ju längre passet pågår, och stegras säger samma sak. Ovan och trött går inte ihop med vid, och smärta som lägger sig eller slocknar under passet är inget problem.")
two("med","myn","1177 Hälseneinflammation",f"Hälseneinflammation är egentligen ingen inflammation, utan beror på upprepade små {G} på senan. Man kan få besvären om man har tränat hårdare än vanligt eller använt skor som är för {G}.",
 ["skador","hårda"],[["bristningar","mjuka"],["infektioner","trånga"],["fläckar","billiga"]],T2,F2,["s","a"],["kon","kol"],
 "Rätt svar är skador och hårda. Utan ställer inflammation mot något annat som hänt i senan, och hård träning sliter, och bristningar fungerar också. Skor som belastar senan sitter illa, och trånga fungerar också. Infektioner är just inflammationer, fläckar på senan ger inga besvär, och mjuka eller billiga skor är inte det som skadar.")
two("med","myn","1177 Plattfot",f"Normalt har foten en båge på insidan mellan häl och framfot. Vid plattfot är bågen {G} än den ska, och foten ligger nästan {G} mot underlaget.",
 ["lägre","plant"],[["flackare","upprätt"],["brantare","flat"],["längre","snett"]],T2,F2,["a","adv"],["kol","kol"],
 "Rätt svar är lägre och plant. Ordet plattfot visar att bågen har sjunkit, och flackare fungerar också. En fot utan båge ligger mot marken i hela sin längd, och flat fungerar också. En brantare eller längre båge ger ingen plattfot, och en fot ligger inte upprätt eller snett mot underlaget för att bågen är låg.")
two("kul","pop","Kulning",f"Lockrop är vallmusik med ursprung i fäboddriften, där ropen användes för att {G} på boskapen och för att kommunicera mellan fäbodarna. Formen är {G}, alltså skapad i stunden.",
 ["locka","improvisatorisk"],[["kalla","noterad"],["skrämma","spontan"],["skjuta","inövad"]],T2,F2,["v","a"],["def","def"],
 "Rätt svar är locka och improvisatorisk. Ordet lockrop och boskapen visar att ropen fick djuren att komma, och kalla fungerar också. Alltså skapad i stunden förklarar ordet, och spontan säger samma sak. Ingen ropar för att skrämma eller skjuta på sin boskap, och noterad eller inövad musik är inte skapad i stunden.")
two("kul","pop","Brudkrona",f"Brudkronan uppstod i den katolska kyrkan, där bruden {G} vid jungfru Maria. Därför lånade man under medeltiden ut kronor från kyrkans Mariastatyer, och kronan fick bara bäras vid {G} brudars första äktenskap.",
 ["liknades","kyska"],[["jämfördes","rika"],["bannlystes","oskuldsfulla"],["beskattades","gifta"]],T2,F2,["v","a"],["kol","ors"],
 "Rätt svar är liknades och kyska. Att bruden fick bära Marias krona visar att hon ställdes bredvid henne, och jämfördes fungerar också. Maria var jungfru, så kronan gällde brudar som var som hon, och oskuldsfulla säger samma sak. Bruden bannlystes eller beskattades inte vid Maria, kronan berodde inte på rikedom, och en brud som redan är gift gifter sig inte för första gången.")
two("his","pop","Brunnsort",f"På en brunnsort finns en {G}, och där dricker man vattnet för hälsans skull. Kurerna var som mest {G} under slutet av 1800-talet och minskade sedan under 1900-talet.",
 ["hälsokälla","populära"],[["källa","impopulära"],["fabrik","omtyckta"],["skola","bortglömda"]],T2,F2,["s","a"],["kol","kon"],
 "Rätt svar är hälsokälla och populära. Vatten som dricks för hälsans skull kommer ur en källa, och källa fungerar också. Som mest och sedan minskade visar att kurerna var som störst då, och omtyckta säger samma sak. En fabrik eller skola ger inget hälsovatten, och impopulära eller bortglömda strider mot att de minskade först sedan.")
two("sam","myn","Ålderdomshem",f"Ett äldreboende är till för äldre som inte {G} att bo på egen hand. Många har på grund av sjukdom svårt att själva sköta {G} sysslor som städning och matlagning.",
 ["klarar","dagliga"],[["orkar","årliga"],["tillåts","vardagliga"],["vågar","akademiska"]],T2,F2,["v","a"],["kol","kol"],
 "Rätt svar är klarar och dagliga. Svårt att själva sköta sysslorna visar att de inte förmår bo ensamma, och orkar fungerar också. Städning och matlagning gör man varje dag, och vardagliga säger samma sak. Äldre tillåts eller vågar inte bo hemma av det skälet, och städning är varken en årlig eller akademisk syssla.")
two("sam","myn","Socialbidrag",f"Socialbidrag ges till den som annars inte skulle nå en {G} levnadsstandard. I Sverige är det ekonomiska biståndet samhällets {G} skyddsnät, och det är kommunerna som sköter handläggningen.",
 ["skälig","yttersta"],[["rimlig","första"],["lyxig","sista"],["kunglig","finaste"]],T2,F2,["a","a"],["kol","kol"],
 "Rätt svar är skälig och yttersta. Ett bidrag till den som saknar pengar ska räcka till en godtagbar nivå, och rimlig fungerar också. Den som inte får hjälp på något annat sätt får till sist bidraget, och sista fungerar också. Ett bidrag ger ingen lyxig eller kunglig standard, och ett skyddsnät är inte det första eller finaste.")
two("sam","pop","Scouting",f"Scouting är en världsomfattande ungdomsrörelse som vill stödja ungas fysiska, mentala och andliga {G}, med stort fokus på {G} och kunskaper i att överleva i naturen.",
 ["utveckling","friluftsliv"],[["mognad","datorspel"],["försämring","naturliv"],["ekonomi","shopping"]],T2,F2,["s","s"],["kol","par"],
 "Rätt svar är utveckling och friluftsliv. En rörelse som vill stödja unga vill att de växer, och mognad fungerar också. Att överleva i naturen hör ihop med att vara ute, och naturliv fungerar också. Ingen rörelse stöder ungas försämring, ekonomi är inte fysisk eller andlig, och datorspel eller shopping hör inte ihop med naturen.")
two("bio","pop","Ejder",f"Ejdern är en stor och tung {G} som häckar i norra Europa. Hanen i praktdräkt är kontrastrik i svart och vitt, medan honan är {G} året runt.",
 ["dykand","brunvattrad"],[["havsand","färgsprakande"],["rovfågel","brunspräcklig"],["vadare","vit"]],T2,F2,["s","a"],["kol","kon"],
 "Rätt svar är dykand och brunvattrad. Hane och hona med olika dräkt och en tung kropp passar en and, och havsand fungerar också. Medan ställer honan mot den kontrastrika hanen, alltså är hon mer dämpad, och brunspräcklig säger samma sak. En rovfågel eller vadare är ingen and, och färgsprakande eller vit står inte i motsats till en svartvit hane.")
two("bio","pop","Kronhjort",f"Kronhjorten är ett stort hjortdjur och landskapsdjur i Skåne. En vuxen hane väger omkring 200 kilo, medan honan har en betydligt {G} kropp och i Norden sällan {G} 170 kilo.",
 ["spensligare","överstiger"],[["slankare","understiger"],["grövre","passerar"],["ljusare","bär"]],T2,F2,["a","v"],["kon","kol"],
 "Rätt svar är spensligare och överstiger. Medan ställer honan mot den tunga hanen, och slankare fungerar också. Sällan visar att 170 kilo är en övre gräns som hon nästan aldrig når, och passerar fungerar också. Grövre strider mot medan, ljusare handlar inte om vikt, och en hona som sällan understiger 170 kilo vore inte mindre än hanen.")
two("lit","pop","Skaldediktning",f"Skaldediktningen är fornnordisk poesi från Island och Norge. Versmåttet är ofta {G}, och dikterna framfördes av skalder vid kungars och hövdingars hov, där de hade hög {G}.",
 ["komplicerat","rang"],[["invecklat","ålder"],["enkelt","prestige"],["rimfritt","feber"]],T2,F2,["a","s"],["kol","kol"],
 "Rätt svar är komplicerat och rang. Ett versmått för utsmyckad hovdiktning är svårt, och invecklat fungerar också. Den som diktade vid en kungs hov var en betydande person, och prestige fungerar också. Enkelt passar inte en konstfull hovpoesi, och hög ålder eller feber är inget man har vid ett hov.")
two("utb","pop","Skrivtavla",f"En skrivtavla används för {G} texter och anteckningar i undervisning eller vid planering. På de tidigaste skrivtavlorna skrev man i sand eller i {G} lera.",
 ["flyktiga","fuktig"],[["temporära","torr"],["eviga","mjuk"],["juridiska","bränd"]],T2,F2,["a","a"],["kol","kol"],
 "Rätt svar är flyktiga och fuktig. En tavla som man suddar på bär text som inte ska stå kvar, och temporära fungerar också. Man kan bara skriva i lera som är mjuk, och mjuk fungerar också. Eviga och juridiska texter skriver man inte på en tavla, och torr eller bränd lera går inte att skriva i.")
two("utb","pop","Examensarbete",f"Ett examensarbete är ett eget arbete som avslutar många utbildningar på universitetet. Det redovisas ofta med en rapport och en muntlig {G}, och vid konstnärliga utbildningar ofta med en egen konsert eller {G}.",
 ["presentation","föreställning"],[["redovisning","ledighet"],["viskning","utställning"],["semla","tentamen"]],T2,F2,["s","s"],["kol","par"],
 "Rätt svar är presentation och föreställning. En muntlig del av redovisningen är en presentation, och redovisning fungerar också. En konsert står bredvid andra framträdanden, och utställning fungerar också. En muntlig viskning eller semla ger ingen mening, och en ledighet eller tentamen är inget eget konstnärligt arbete.")
two("eko","pop","Varuhus",f"Ett varuhus är en stor butik med ett brett {G}, där varorna säljs på olika avdelningar under samma tak. Under 1800-talet blev varuhusen en viktig {G} för borgerskapets kvinnor.",
 ["sortiment","samlingsplats"],[["utbud","kyrka"],["tak","mötesplats"],["djup","fiende"]],T2,F2,["s","s"],["kol","kol"],
 "Rätt svar är sortiment och samlingsplats. Olika avdelningar visar att butiken har många slags varor, och utbud fungerar också. Kvinnor som träffades i varuhusen hade där en plats att mötas, och mötesplats säger samma sak. Ett brett tak eller djup beskriver inte varorna, och ett varuhus är ingen kyrka eller fiende.")
two("jur","pop","Hyresavtal",f"Genom ett hyresavtal {G} någon mot betalning rätten att använda ett hus eller en del av det. Hyr man direkt av ägaren till fastigheten har man ett förstahandskontrakt, medan den som hyr av någon som själv är hyresgäst har ett {G}.",
 ["upplåter","andrahandskontrakt"],[["överlåter","förstahandskontrakt"],["köper","hyreskontrakt"],["vägrar","köpekontrakt"]],T2,F2,["v","s"],["kol","kon"],
 "Rätt svar är upplåter och andrahandskontrakt. Den som hyr ut låter någon annan använda sitt hus, och överlåter fungerar också. Medan ställer den som hyr av en hyresgäst mot den som hyr direkt, och hyreskontrakt fungerar också. Hyresvärden köper eller vägrar inte rätten att använda huset, och den som hyr av en hyresgäst har inte ett förstahandskontrakt eller köpekontrakt.")
two("fil","pop","Humanism",f"Humanismen är en idéströmning som sätter den enskilda människans {G} i centrum, liksom bildningens betydelse. Den brukar anses ha {G} under renässansen.",
 ["värde","uppstått"],[["värdighet","dött ut"],["synd","vuxit fram"],["pris","avvecklats"]],T2,F2,["s","v"],["kol","kol"],
 "Rätt svar är värde och uppstått. En strömning som sätter människan i centrum bygger på att hon är värdefull, och värdighet fungerar också. Att strömningen har en början i en viss tid visar att den kom till då, och vuxit fram säger samma sak. Synd och pris är inte vad humanismen bygger på, och en strömning som dog ut eller avvecklades under renässansen hade inte haft samma betydelse.")
two("mil","pop","Skärgård",f"En skärgård är en kustnära ögrupp med omgivande vatten och är oftast bildad i {G} bergarter som granit och gnejs. Skärgårdar finns främst där inlandsisen har legat och där landet fortfarande {G}.",
 ["hårda","höjer sig"],[["fasta","sänker sig"],["mjuka","reser sig"],["lösa","eroderar"]],T2,F2,["a","utr"],["kol","kol"],
 "Rätt svar är hårda och höjer sig. Granit och gnejs är bergarter som står emot, och fasta fungerar också. Där isen har legat stiger landet långsamt sedan tyngden försvann, och reser sig fungerar också. Granit är varken mjuk eller lös, och ett land som sänker sig eller eroderar ger inga nya skär.")
two("psy","pop","Fördom",f"En fördom är en {G} åsikt om en person eller grupp, som inte bygger på verklig erfarenhet. Den bottnar ofta i omedvetna reaktioner och kan bidra till diskriminering när den {G} i handling.",
 ["förutfattad","omsätts"],[["förhastad","stoppas"],["genomtänkt","tar sig uttryck"],["vetenskaplig","slocknar"]],T2,F2,["a","v"],["def","kol"],
 "Rätt svar är förutfattad och omsätts. En åsikt som inte bygger på erfarenhet har man bildat i förväg, och förhastad fungerar också. Diskriminering uppstår när åsikten blir till handling, och tar sig uttryck säger samma sak. Genomtänkt och vetenskaplig strider mot att åsikten inte bygger på erfarenhet, och en fördom som stoppas eller slocknar leder inte till diskriminering.")
# ---------- tre luckor ----------
three("sam","pop","Avfolkning",f"Avfolkning är att en befolkning {G}, och i svenskan syftar ordet ofta på bygder som töms i takt med {G}. Från antiken till industrialiseringen växte världens befolkning mycket {G}, med ungefär fyra hundradels procent om året.",
 ["krymper","urbaniseringen","långsamt"],[["minskar","flykten till städerna","raskt"],["expanderar","inflyttningen till städerna","sakta"],["åldras","skördarna","explosivt"]],T3,F3,["v","s","adv"],["def","kol","kol"],
 "Rätt svar är krymper, urbaniseringen och långsamt. Avfolkning är att folk blir färre, och minskar fungerar också. Bygder töms när folk flyttar till städerna, och flykten eller inflyttningen till städerna säger samma sak. Fyra hundradels procent om året är en mycket liten ökning, och sakta fungerar också. En befolkning som expanderar avfolkas inte, att den åldras är inte avfolkning, skördar tömmer inga bygder, och raskt eller explosivt strider mot den lilla ökningen.")
three("sam","pop","Föreningsliv",f"En förening är en {G} av medlemmar som tillsammans driver en bestämd verksamhet. Det finns ideella och {G} föreningar, och en del föreningar räknas som juridiska {G}.",
 ["organiserad grupp","ekonomiska","personer"],[["sammanslutning","kommersiella","rivaler"],["slump","lönsamma","subjekt"],["ruin","sjuka","problem"]],T3,F3,["utr","a","s"],["def","kon","kol"],
 "Rätt svar är organiserad grupp, ekonomiska och personer. Medlemmar som tillsammans ägnar sig åt något bildar en grupp med ordning, och sammanslutning fungerar också. Ideella ställs mot föreningar som bedriver affärsverksamhet, och kommersiella eller lönsamma fungerar också. En förening kan ha rättigheter som en person, och juridiska personer är ett fast uttryck, och subjekt fungerar också. En förening är ingen slump eller ruin, sjuka föreningar finns inte, och juridiska rivaler eller problem är inget en förening räknas som.")
three("lit","pop","Bokhandel",f"Bokhandeln delas grovt in i grossist- och detaljhandel, och butikerna är i allt högre grad {G} i rikstäckande kedjor. Under 1900-talet tillkom nya {G} för böcker i form av bokklubbar och handel på internet, och biblioteken är stora {G} av böcker.",
 ["samordnade","spridningsvägar","köpare"],[["grupperade","kanaler","läsare"],["isolerade","försäljningsvägar","inköpare"],["stängda","avgifter","tillverkare"]],T3,F3,["a","s","s"],["kol","kol","kol"],
 "Rätt svar är samordnade, spridningsvägar och köpare. Butiker som ingår i kedjor är ordnade tillsammans, och grupperade fungerar också. Bokklubbar och internet är nya sätt för böckerna att nå läsarna, och kanaler eller försäljningsvägar fungerar också. Bibliotek skaffar böcker till sina samlingar, och inköpare säger samma sak. Isolerade och stängda butiker ingår inte i kedjor, bokklubbar är inga avgifter, och bibliotek tillverkar inte böcker och är inga läsare.")
three("lit","pop","Tidskrift",f"En tidskrift kommer ut mer {G} än en dagstidning och förmedlar vanligen inte allmänna dagsnyheter, utan är i regel {G} på ett visst ämnesområde. Den finansieras oftast av annonser, {G} och lösnummerförsäljning.",
 ["sällan","inriktad","prenumerationer"],[["sporadiskt","specialiserad","donationer"],["ofta","fokuserad","abonnemang"],["högljutt","bannlyst","skatter"]],T3,F3,["adv","a","s"],["kon","kon","par"],
 "Rätt svar är sällan, inriktad och prenumerationer. Dagstidningen kommer ut varje dag, och en tidskrift som inte bär dagsnyheter kommer ut med längre mellanrum, och sporadiskt fungerar också. Utan ställer de allmänna nyheterna mot ett eget ämne, och specialiserad eller fokuserad fungerar också. Annonser och lösnummer är intäkter från läsare och företag, och abonnemang säger samma sak. Ofta strider mot jämförelsen med dagstidningen, en tidning kommer inte ut högljutt, den är inte bannlyst på ett ämne, och donationer eller skatter finansierar inte tidskrifter.")
three("utb","pop","Katedralskola",f"Katedralskolorna uppkom under medeltiden och användes främst för att {G} präster och längre fram även lekmän. Skolorna hörde till {G} i biskopsstäderna och utvecklades med tiden till {G}.",
 ["utbilda","domkyrkorna","gymnasieskolan"],[["undervisa","katedralerna","förskolan"],["avsätta","stiftens kyrkor","läroverken"],["bestraffa","marknaderna","fängelserna"]],T3,F3,["v","s","s"],["kol","def","kol"],
 "Rätt svar är utbilda, domkyrkorna och gymnasieskolan. En skola för präster lär upp präster, och undervisa fungerar också. En katedral är en domkyrka, och biskopsstäderna har sina domkyrkor, och katedralerna eller stiftens kyrkor fungerar också. En skola för präster och lekmän blev med tiden en högre skola, och läroverken fungerar också. En skola avsätter eller bestraffar inte präster, den var inte knuten till marknader, och förskolan eller fängelserna är inte vad en skola för präster blev.")
three("eko","pop","Smuggling",f"Smuggling är att föra in eller ut varor eller personer över en gräns {G} statens lagar. Oftast är skälen {G}, som när narkotika smugglas för att den kan säljas dyrare i mottagarlandet, och när personer smugglas hänger det ofta ihop med {G}.",
 ["i strid med","finansiella","människohandel"],[["i strid mot","monetära","turism"],["i enlighet med","vinstdrivna","trafficking"],["till förmån för","religiösa","adoption"]],T3,F3,["utr","a","s"],["def","def","kol"],
 "Rätt svar är i strid med, finansiella och människohandel. Smuggling är ett brott, alltså sker den mot lagarna, och i strid mot fungerar också. Exemplet med det högre priset visar att det handlar om pengar, och monetära eller vinstdrivna fungerar också. Människor som smugglas för att utnyttjas är offer för handel med människor, och trafficking säger samma sak. Smuggling sker inte i enlighet med eller till förmån för lagarna, religiösa skäl stämmer inte med exemplet, och turism eller adoption är inte brott som hör ihop med smuggling av människor.")
three("jur","pop","Resning",f"Resning är ett {G} rättsmedel som gör att man kan få en dom ändrad trots att den har vunnit laga kraft. En sådan dom går inte längre att {G}, och för att resning ska beviljas krävs därför {G} omständigheter.",
 ["extraordinärt","överklaga","speciella"],[["särskilt","bestrida","triviala"],["vardagligt","överpröva","särskilda"],["olagligt","verkställa","helt obefintliga"]],T3,F3,["a","v","a"],["kol","kol","ors"],
 "Rätt svar är extraordinärt, överklaga och speciella. Ett rättsmedel som gäller domar som inte längre kan ändras på vanligt sätt är ett undantag, och särskilt fungerar också. En dom som har vunnit laga kraft kan inte längre angripas hos högre rätt, och bestrida eller överpröva fungerar också. Därför visar att det krävs något utöver det vanliga, och särskilda säger samma sak. Ett rättsmedel är inte vardagligt eller olagligt, en dom med laga kraft går tvärtom att verkställa, och triviala eller obefintliga omständigheter strider mot därför.")
three("psy","pop","Panikattack",f"Vid panikångest kommer panikattackerna {G}, oberoende av situationen. Det skiljer dem från fobier, som {G} av vissa saker eller situationer. För diagnosen krävs minst tre attacker {G} en period av tre veckor.",
 ["oförutsett","utlöses","under"],[["oväntat","framkallas","långt efter"],["planerat","väcks","inom"],["regelbundet","lindras","före"]],T3,F3,["adv","v","fu"],["def","kon","kol"],
 "Rätt svar är oförutsett, utlöses och under. Oberoende av situationen visar att attackerna inte går att förutse, och oväntat fungerar också. Det skiljer dem från fobier, som alltså startas av något bestämt, och framkallas eller väcks fungerar också. Tre attacker räknas under en period, och inom fungerar också. Planerat och regelbundet strider mot oberoende av situationen, fobier lindras inte av saker, och långt efter eller före en period ger ingen mening.")
three("spr","pop","Rotvälska",f"Rotvälska är ett {G} ord för obegripligt språk, känt i svenskan sedan 1700-talet. I tyskan och danskan betydde det snarare tjuvspråk, och efterledet går tillbaka på ett germanskt ord som en gång betecknade allt {G}. Det germanska ordet {G} även i valnöt och i Wales.",
 ["gammalt","utländskt","återkommer"],[["ålderdomligt","icke-germanskt","saknas"],["nyskapat","annorlunda","lever kvar"],["tekniskt","heligt","stryks"]],T3,F3,["a","a","v"],["kol","kol","kol"],
 "Rätt svar är gammalt, utländskt och återkommer. Ett ord som funnits sedan 1700-talet har gamla anor, och ålderdomligt fungerar också. Valnöt och Wales syftar på sådant som inte var germanskt, och icke-germanskt eller annorlunda fungerar också. Att samma led finns i valnöt visar att ordet dyker upp även där, och lever kvar fungerar också. Nyskapat och tekniskt strider mot 1700-talet, heligt hör inte till valnöt, och ett ord som saknas eller stryks i valnöt finns inte där.")
three("tek","pop","Dynamo",f"En generator, även kallad dynamo, {G} rörelseenergi till elektrisk energi. Rör sig en elektrisk ledning och ett {G} mot varandra skapas en spänning i ledningen. Innan man hade {G} hur elektricitet kan skapas ur rörelse användes elektrostatiska generatorer.",
 ["omvandlar","magnetfält","upptäckt"],[["förvandlar","kraftfält","missförstått"],["förbrukar","magnetiskt fält","påvisat"],["lagrar","vattenfall","förbjudit"]],T3,F3,["v","s","v"],["kol","kol","kon"],
 "Rätt svar är omvandlar, magnetfält och upptäckt. En maskin som gör el av rörelse ändrar en energi till en annan, och förvandlar fungerar också. En spänning uppstår när ledningen och ett magnetiskt fält rör sig mot varandra, och kraftfält eller magnetiskt fält fungerar också. Innan visar att man inte kände till sambandet än, och påvisat fungerar också. En generator förbrukar eller lagrar inte rörelseenergi, ett vattenfall ger ingen spänning i en ledning, och något som missförståtts eller förbjudits förklarar inte de äldre generatorerna.")
write(29)
