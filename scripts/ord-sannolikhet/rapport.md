# Ordsannolikheten: backtest

Genererad av `modell.ts`. 56 prov 1997vt–2026vt, 8761 ord i banken.

## Provlikheten

Tränad på provord före 2020 mot övriga bankord. Prövad på de 219 bankord som stod på ett prov för första gången 2020–, mot 7320 som aldrig gjort det.

AUC 0.676 (0,5 är slump).

| Särdrag | Odds |
| --- | --- |
| betyg2 | 0,91 |
| betyg3 | 1,35 |
| betyg4 | 2,75 |
| betyg5 | 6,06 |
| lätt | 0,87 |
| svår | 1,13 |
| fras | 1,32 |
| affix | 0,38 |
| verb | 0,90 |
| adjektiv | 0,61 |

Odds mot ett ord med betyg 1, medelsvårt, substantiv, enstaka ord.

Bland redan testade ord går provlikheten inte att pröva: de 28 som kommit tillbaka var kända när betygen sattes. Att den får styra där (exponent 0,5) är ett antagande, inte ett mätresultat.

## Återkomst efter ålder

Mätt på de 14 proven 2020ht–2026vt.

| Sedan senaste prov | Ord-prov-par | Återkom | Per ord och prov |
| --- | --- | --- | --- |
| under 10 år | 5477 | 0 | 0,009 % |
| 10–16 år | 5536 | 6 | 0,108 % |
| över 16 år | 9347 | 17 | 0,182 % |

## Aldrig testade ord

10 prov är rena (2020ht, 2021ht, 2022ht, 2023vt, 2023ht, 2024vt, 2024ht, 2025vt, 2025ht, 2026vt). På dem stod 8 lektionsord, alltså 0,80 per prov.

## Utfall utanför träningsdatan

Modellen tränad på 2020ht–2022ht, prövad på 2023vt–2026vt (7 prov).

| | Väntat | Faktiskt |
| --- | --- | --- |
| Testade ord som återkom | 12,7 | 10 |
| Aldrig testade ord som kom (rena prov) | 3,5 | 7 |

| Modellens topp | Träffar | Slumpen hade gett |
| --- | --- | --- |
| 100 | 0 | 0,2 |
| 500 | 5 | 1,0 |
| 1000 | 10 | 2,0 |

| Sannolikhet | Ord-prov-par | Väntade träffar | Faktiska |
| --- | --- | --- | --- |
| 0,00 % till 0,01 % | 39956 | 1,9 | 3 |
| 0,01 % till 0,05 % | 13852 | 2,1 | 4 |
| 0,05 % till 0,15 % | 3029 | 3,6 | 2 |
| 0,15 % till  | 4015 | 8,6 | 8 |

## Inför nästa prov

Summan över banken är 2,56 väntade ord av provets 20. Resten väntas ligga utanför banken.

| Band | Sannolikhet per prov | Antal ord |
| --- | --- | --- |
| 5 | minst 0,150 % | 530 |
| 4 | 0,050 % till 0,150 % | 556 |
| 3 | 0,015 % till 0,050 % | 1601 |
| 2 | 0,005 % till 0,015 % | 5088 |
| 1 | 0,000 % till 0,005 % | 985 |

De 25 högsta: gå-i-bräschen-för (0,33 %), inte-ha-något-till-övers-för (0,33 %), komma-till-korta (0,33 %), ligga-i-sin-linda (0,33 %), ligga-i-träda (0,33 %), låta-påskina (0,33 %), stick-i-stäv (0,33 %), stryka-medhårs (0,33 %), ta-bladet-från-munnen (0,33 %), vara-i-faggorna (0,33 %), vara-i-ropet (0,33 %), vara-på-upphällningen (0,33 %), föresätta-sig (0,31 %), förkovra-sig (0,31 %), vinnlägga-sig (0,31 %), gått-i-stå (0,31 %), helt-sonika (0,31 %), inte-oäven (0,31 %), pocka-på (0,31 %), utan-omsvep (0,31 %), hemfalla-åt (0,29 %), borgenär (0,29 %), diskrepans (0,29 %), diskretion (0,29 %), förehavanden (0,29 %).
