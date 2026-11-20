# Ordsannolikheten: backtest

Genererad av `modell.ts`. 57 prov 1997vt–2026ht, 8761 ord i banken.

## Provlikheten

Tränad på provord före 2020 mot övriga bankord. Prövad på de 233 bankord som stod på ett prov för första gången 2020–, mot 7306 som aldrig gjort det.

AUC 0.680 (0,5 är slump).

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

Mätt på de 15 proven 2020ht–2026ht.

| Sedan senaste prov | Ord-prov-par | Återkom | Per ord och prov |
| --- | --- | --- | --- |
| under 10 år | 5877 | 0 | 0,009 % |
| 10–16 år | 5794 | 6 | 0,104 % |
| över 16 år | 10280 | 17 | 0,165 % |

## Aldrig testade ord

10 prov är rena (2020ht, 2021ht, 2022ht, 2023vt, 2023ht, 2024vt, 2024ht, 2025vt, 2025ht, 2026vt). På dem stod 8 lektionsord, alltså 0,80 per prov.

## Utfall utanför träningsdatan

Modellen tränad på 2020ht–2022ht, prövad på 2023vt–2026ht (8 prov).

| | Väntat | Faktiskt |
| --- | --- | --- |
| Testade ord som återkom | 14,6 | 10 |
| Aldrig testade ord som kom (rena prov) | 3,5 | 7 |

| Modellens topp | Träffar | Slumpen hade gett |
| --- | --- | --- |
| 100 | 0 | 0,2 |
| 500 | 5 | 1,0 |
| 1000 | 10 | 2,0 |

| Sannolikhet | Ord-prov-par | Väntade träffar | Faktiska |
| --- | --- | --- | --- |
| 0,00 % till 0,01 % | 39956 | 1,9 | 3 |
| 0,01 % till 0,05 % | 14213 | 2,2 | 4 |
| 0,05 % till 0,15 % | 3499 | 4,1 | 2 |
| 0,15 % till  | 4625 | 9,9 | 8 |

## Inför nästa prov

Summan över banken är 2,50 väntade ord av provets 20. Resten väntas ligga utanför banken.

| Band | Sannolikhet per prov | Antal ord |
| --- | --- | --- |
| 5 | minst 0,150 % | 524 |
| 4 | 0,050 % till 0,150 % | 601 |
| 3 | 0,015 % till 0,050 % | 1591 |
| 2 | 0,005 % till 0,015 % | 5038 |
| 1 | 0,000 % till 0,005 % | 1006 |

De 25 högsta: gå-i-bräschen-för (0,31 %), inte-ha-något-till-övers-för (0,31 %), komma-på-obestånd (0,31 %), komma-till-korta (0,31 %), ligga-i-sin-linda (0,31 %), ligga-i-träda (0,31 %), låta-påskina (0,31 %), stick-i-stäv (0,31 %), stryka-medhårs (0,31 %), ta-bladet-från-munnen (0,31 %), vara-i-faggorna (0,31 %), vara-i-ropet (0,31 %), vara-på-upphällningen (0,31 %), föresätta-sig (0,29 %), förkovra-sig (0,29 %), tillskansa-sig (0,29 %), urskulda-sig (0,29 %), vinnlägga-sig (0,29 %), gått-i-stå (0,29 %), helt-sonika (0,29 %), inte-oäven (0,29 %), pocka-på (0,29 %), så-split (0,29 %), utan-omsvep (0,29 %), borga-för (0,27 %).
