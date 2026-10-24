import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { fitTitle } from "@/lib/seo-text";
import { formatDecimal } from "@/lib/sv-format";
import { ArrowRight, GraduationCap, Info } from "lucide-react";

/* =====================================================================
   POÄNGGRÄNSER PER PROGRAM ("money pages" — se SEO-AUDIT.md)

   HP-poäng per lärosäte, en sida per program. All data är hämtad direkt ur
   UHR:s antagningsstatistik (uhr.se/studier-och-antagning/antagningsstatistik),
   urval 2, HT 2026 — inte gissad, inte skrapad från tredje part. Se
   `verifiedAt` per program.

   Siffrorna ändras varje antagningsomgång. Uppdatera genom att söka om på
   uhr.se (välj termin, sök på programmets namn) och byt `term`/`verifiedAt`
   samt raderna i `schools`. Hitta aldrig på ett tal — en TODO-rad slår ett
   påhittat antagningspoäng.
   ===================================================================== */

type StatRow = {
  /** Lärosäte, eller — för Handelshögskolans historik — ett årtal. */
  label: string;
  /** Studieort, eller en kompletterande rad (t.ex. antal sökande). */
  sub?: string;
  /** HP-poäng (urvalsgrupp Högskoleprov), 0–2. */
  hp: number;
  /** BI-poäng (gymnasiebetyg utan komplettering), om det är relevant att visa. */
  bi?: number;
  /**
   * HP-poängen ett år tidigare (`prevTerm`), samma anmälningsalternativ i
   * UHR:s statistik. "alla" = alla behöriga antogs (UHR skriver *). Saknas
   * när utbildningen inte hade någon gräns i HP-gruppen då.
   */
  prev?: number | "alla";
};

type ProgramConfig = {
  name: string;
  h1: string;
  intro: string;
  /** Extra kontext-stycke, t.ex. om ett alternativt urval (PIL). */
  note?: string;
  schools: StatRow[];
  /** Kolumnrubrik för `label`-kolumnen: "Lärosäte" eller "Antagningsomgång". */
  labelHeader: string;
  term: string;
  /** Antagningsomgången som `prev` gäller, t.ex. "HT 2025". */
  prevTerm?: string;
  sourceUrl: string;
  /** Vad länken kallas — UHR:s tabell för de flesta, lärosätets egen för Handelshögskolan. */
  sourceLabel: string;
  /** Organisationen bakom källan, för JSON-LD:ns creator-fält. */
  sourceOrg: string;
  verifiedAt: string;
  relatedPrograms: string[];
};

const PROGRAM: Record<string, ProgramConfig> = {
  lakarprogrammet: {
    name: "Läkarprogrammet",
    h1: "Läkarprogrammet · HP-poäng per lärosäte",
    intro:
      "Läkarprogrammet finns vid åtta lärosäten i Sverige och hör till de mest sökta utbildningarna i landet. Här är den senaste antagningspoängen i högskoleprovsgruppen (HP) för de största.",
    note: "Karolinska Institutet antar dessutom en del av sina platser genom PIL (prov- och intervjubaserat urval), ett separat spår med kognitivt test och intervjuer, där ett starkt högskoleprovsresultat är biljetten in till steg två. PIL ersätter inte HP-kvoten ovan, det är en tredje väg vid sidan av den.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 1.8, prev: 1.75 },
      { label: "Karolinska institutet", sub: "Solna", hp: 1.75, prev: 1.7 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.75, prev: 1.75 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.7, prev: 1.65 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.65, prev: 1.6 },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.65, prev: 1.6 },
      { label: "Umeå universitet", sub: "Umeå", hp: 1.6, prev: 1.55 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["tandlakarprogrammet", "psykologprogrammet", "biomedicinprogrammet"],
  },
  civilekonom: {
    name: "Civilekonomprogrammet, Handelshögskolan i Stockholm",
    h1: "Handelshögskolan · HP-poäng för Civilekonomprogrammet",
    intro:
      "Handelshögskolan i Stockholm (SSE) är en fristående högskola och en av de mest sökta ekonomutbildningarna i landet. Sedan 2025 antas de flesta platserna via gymnasiebetyg med meritpoäng, men en HP-kvot finns kvar, och kravet har stigit varje år.",
    note: "Från och med 2025 räknar Handelshögskolan in meritpoäng i betygsurvalet (max meritvärde höjt från 20,0 till 22,5), vilket är varför BI/BII-poängen ovan inte är direkt jämförbara mellan 2024 och 2025. HP-kravet påverkas inte av den ändringen.",
    labelHeader: "Antagningsomgång",
    schools: [
      { label: "2026", hp: 1.95, bi: 21.9 },
      { label: "2025", hp: 1.85, bi: 19.79 },
      { label: "2024", hp: 1.85, bi: 19.58 },
      { label: "2023", hp: 1.8, bi: 19.43 },
      { label: "2022", hp: 1.75, bi: 19.32 },
      { label: "2021", hp: 1.75, bi: 19.27 },
    ],
    term: "Hösten 2026 (senaste), historik sedan 2021",
    sourceUrl:
      "https://www.hhs.se/sv/utbildning/bsc/admission/swedish-proficiency/antagningsstatistik-for-betyg-hogskoleprov/",
    sourceLabel: "Handelshögskolans egen antagningsstatistik",
    sourceOrg: "Handelshögskolan i Stockholm",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["juristprogrammet"],
  },
  "teknisk-fysik": {
    name: "Civilingenjörsutbildning i teknisk fysik",
    h1: "Teknisk fysik · HP-poäng per lärosäte",
    intro:
      "Teknisk fysik är ett av de mest teoretiskt tunga civilingenjörsprogrammen. KTH och Lund ligger högst, med Chalmers och Uppsala strax efter.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Kungl. Tekniska högskolan (KTH)", sub: "Stockholm", hp: 1.8, prev: 1.75 },
      { label: "Lunds universitet", sub: "Lund (LTH)", hp: 1.8, prev: 1.8 },
      { label: "Chalmers tekniska högskola", sub: "Göteborg", hp: 1.75, prev: 1.7 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.75, prev: 1.65 },
      {
        label: "Linköpings universitet",
        sub: "Linköping (teknisk fysik och elektroteknik)",
        hp: 1.5,
        prev: 1.45,
      },
      { label: "Umeå universitet", sub: "Umeå", hp: 1.4, prev: 1.2 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 1.05, prev: "alla" },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["industriell-ekonomi", "datateknik", "medicinsk-teknik", "teknisk-matematik"],
  },
  psykologprogrammet: {
    name: "Psykologprogrammet",
    h1: "Psykologprogrammet · HP-poäng per lärosäte",
    intro:
      "Psykologprogrammet ges vid elva lärosäten i Sverige. Kravet i högskoleprovsgruppen varierar mer mellan orter än för de flesta andra program på den här listan: från 1,25 till 1,70.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 1.7, prev: 1.65 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.65, prev: 1.6 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.6, prev: 1.65 },
      { label: "Stockholms universitet", sub: "Stockholm", hp: 1.55, prev: 1.6 },
      { label: "Karolinska institutet", sub: "Solna", hp: 1.5, prev: 1.5 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.5, prev: 1.55 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 1.45, prev: 1.45 },
      { label: "Linnéuniversitetet", sub: "Växjö", hp: 1.45, prev: 1.45 },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.45, prev: 1.45 },
      { label: "Mittuniversitetet", sub: "Östersund", hp: 1.3, prev: 1.3 },
      { label: "Luleå tekniska universitet", sub: "Luleå", hp: 1.25, prev: 1.25 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["lakarprogrammet", "juristprogrammet", "logopedprogrammet"],
  },
  juristprogrammet: {
    name: "Juristprogrammet",
    h1: "Juristprogrammet · HP-poäng per lärosäte",
    intro:
      "Juristprogrammet är enligt UHR:s egen statistik det program som drar flest behöriga sökande i landet. Det ges vid sju lärosäten, med Lund som mest krävande i HP-kvoten.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 1.6, prev: 1.55 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.5, prev: 1.5 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.4, prev: 1.4 },
      { label: "Stockholms universitet", sub: "Stockholm", hp: 1.4, prev: 1.35 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 1.25, prev: 1.2 },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.25, prev: 1.2 },
      { label: "Umeå universitet", sub: "Umeå", hp: 1.25, prev: 1.2 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["civilekonom", "psykologprogrammet", "kriminologi"],
  },
  tandlakarprogrammet: {
    name: "Tandläkarprogrammet",
    h1: "Tandläkarprogrammet · HP-poäng per lärosäte",
    intro:
      "Tandläkarprogrammet ges vid tre lärosäten. Kraven ligger tätt ihop och strax under läkarprogrammets.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.45, prev: 1.4 },
      { label: "Karolinska institutet", sub: "Huddinge", hp: 1.45, prev: 1.4 },
      { label: "Malmö universitet", sub: "Malmö", hp: 1.4 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["lakarprogrammet", "tandhygienistprogrammet"],
  },
  sjukskoterskeprogrammet: {
    name: "Sjuksköterskeprogrammet",
    h1: "Sjuksköterskeprogrammet · HP-poäng, olika orter",
    intro:
      "Sjuksköterskeprogrammet ges på fler orter än något annat program på den här listan, inklusive decentraliserade platser. Kravet skiljer sig mycket mellan campus, betydligt mer än för de mer eftersökta programmen ovan.",
    labelHeader: "Lärosäte / studieort",
    schools: [
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.1, prev: 1.05 },
      { label: "Umeå universitet", sub: "Umeå", hp: 0.85, prev: 0.6 },
      { label: "Blekinge tekniska högskola", sub: "Karlskrona", hp: 0.5, prev: 0.4 },
      { label: "Uppsala universitet", sub: "Campus Gotland", hp: 0.65, prev: 0.45 },
      { label: "Umeå universitet", sub: "Decentraliserad, Skellefteå", hp: 0.45 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-08-22",
    relatedPrograms: ["lakarprogrammet", "biomedicinsk-analytiker"],
  },
  arkitektprogrammet: {
    name: "Arkitektprogrammet",
    h1: "Arkitektprogrammet · HP-poäng per lärosäte",
    intro:
      "Arkitektutbildningen på fem år ges vid fyra lärosäten. Chalmers kombinerade program i arkitektur och teknik, som leder till både civilingenjörs- och arkitektexamen, har det klart högsta kravet.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Chalmers, Arkitektur och teknik", sub: "Göteborg", hp: 1.7 },
      { label: "Lunds universitet", sub: "Lund", hp: 1.4, prev: 1.5 },
      { label: "Chalmers tekniska högskola", sub: "Göteborg", hp: 1.35, prev: 1.5 },
      { label: "Kungl. Tekniska högskolan (KTH)", sub: "Stockholm", hp: 1.35, prev: 1.4 },
      { label: "Umeå universitet", sub: "Umeå", hp: 0.95, prev: 1.05 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["teknisk-fysik", "industriell-ekonomi"],
  },
  "industriell-ekonomi": {
    name: "Civilingenjör i industriell ekonomi",
    h1: "Industriell ekonomi · HP-poäng per lärosäte",
    intro:
      "Civilingenjörsprogrammet i industriell ekonomi blandar teknik och ekonomi och hör till de mest sökta ingenjörsutbildningarna. Lund, KTH och Uppsala ligger högst.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund (LTH)", hp: 1.85, prev: 1.75 },
      { label: "Kungl. Tekniska högskolan (KTH)", sub: "Stockholm", hp: 1.8, prev: 1.7 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.8, prev: 1.75 },
      { label: "Chalmers tekniska högskola", sub: "Göteborg", hp: 1.75, prev: 1.7 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.65, prev: 1.6 },
      { label: "Umeå universitet", sub: "Umeå", hp: 1.5, prev: 1.4 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 1.35, prev: 1.3 },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.35, prev: 1.35 },
      { label: "Luleå tekniska universitet", sub: "Luleå", hp: 1.15 },
      { label: "Blekinge tekniska högskola", sub: "Karlskrona", hp: 1.0, prev: 0.75 },
      { label: "Mälardalens universitet", sub: "Eskilstuna", hp: 0.9, prev: 0.85 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["civilekonom", "datateknik"],
  },
  veterinarprogrammet: {
    name: "Veterinärprogrammet",
    h1: "Veterinärprogrammet · HP-poäng",
    intro:
      "Veterinärprogrammet ges bara vid Sveriges lantbruksuniversitet (SLU) i Uppsala, så det finns en enda gräns att slå.",
    labelHeader: "Lärosäte",
    schools: [{ label: "Sveriges lantbruksuniversitet (SLU)", sub: "Uppsala", hp: 1.5, prev: 1.5 }],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["lakarprogrammet", "apotekarprogrammet"],
  },
  fysioterapeutprogrammet: {
    name: "Fysioterapeutprogrammet",
    h1: "Fysioterapeutprogrammet · HP-poäng per lärosäte",
    intro:
      "Fysioterapeutprogrammet ges på många orter, och kravet i högskoleprovsgruppen skiljer sig mer än en halv poäng mellan det högsta och det lägsta.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.25, prev: 1.15 },
      { label: "Lunds universitet", sub: "Lund", hp: 1.2, prev: 1.2 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.1, prev: 1.15 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.05, prev: 0.95 },
      { label: "Karolinska institutet", sub: "Huddinge", hp: 1.0 },
      { label: "Umeå universitet", sub: "Umeå", hp: 0.9, prev: 0.65 },
      { label: "Mälardalens universitet", sub: "Västerås", hp: 0.8, prev: 0.75 },
      { label: "Mälardalens universitet", sub: "Karlshamn", hp: 0.75 },
      { label: "Luleå tekniska universitet", sub: "Luleå", hp: 0.55, prev: 0.35 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["sjukskoterskeprogrammet", "lakarprogrammet"],
  },
  apotekarprogrammet: {
    name: "Apotekarprogrammet",
    h1: "Apotekarprogrammet · HP-poäng per lärosäte",
    intro: "Apotekarprogrammet ges vid tre lärosäten, och kraven ligger tätt ihop.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Umeå universitet", sub: "Umeå", hp: 1.25, prev: 1.1 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.2, prev: 1.1 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.15, prev: 1.05 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["lakarprogrammet", "tandlakarprogrammet", "receptarieprogrammet"],
  },
  datateknik: {
    name: "Civilingenjör i datateknik",
    h1: "Datateknik · HP-poäng per lärosäte",
    intro:
      "Civilingenjörsprogrammet i datateknik finns på många lärosäten. KTH ligger högst, följt av Chalmers och Lund. På flera mindre lärosäten antogs alla behöriga i högskoleprovsgruppen, och de står därför inte i tabellen.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Kungl. Tekniska högskolan (KTH)", sub: "Stockholm", hp: 1.55, prev: 1.5 },
      { label: "Chalmers tekniska högskola", sub: "Göteborg", hp: 1.45, prev: 1.35 },
      { label: "Lunds universitet", sub: "Lund (LTH)", hp: 1.45, prev: 1.45 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.35, prev: 1.35 },
      { label: "Malmö universitet", sub: "Malmö", hp: 1.25 },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.0, prev: 0.9 },
      { label: "Högskolan i Halmstad", sub: "Halmstad", hp: 0.6, prev: 0.7 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 0.6, prev: "alla" },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["industriell-ekonomi", "maskinteknik", "elektroteknik"],
  },
  maskinteknik: {
    name: "Civilingenjör i maskinteknik",
    h1: "Maskinteknik · HP-poäng per lärosäte",
    intro:
      "Civilingenjörsprogrammet i maskinteknik ges vid de flesta tekniska högskolor. Lund har högst krav, och Chalmers, KTH och Linköping ligger på samma nivå strax under.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund (LTH)", hp: 1.65, prev: 1.6 },
      { label: "Chalmers tekniska högskola", sub: "Göteborg", hp: 1.55, prev: 1.5 },
      { label: "Kungl. Tekniska högskolan (KTH)", sub: "Stockholm", hp: 1.55, prev: 1.45 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.55, prev: 1.45 },
      { label: "Luleå tekniska universitet", sub: "Luleå", hp: 1.25 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 1.2, prev: 0.9 },
      { label: "Blekinge tekniska högskola", sub: "Karlskrona", hp: 0.9, prev: "alla" },
      { label: "Högskolan i Halmstad", sub: "Halmstad", hp: 0.85, prev: 1.05 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["datateknik", "teknisk-fysik", "samhallsbyggnad", "tekniskt-basar"],
  },
  socionomprogrammet: {
    name: "Socionomprogrammet",
    h1: "Socionomprogrammet · HP-poäng per lärosäte",
    intro:
      "Socionomprogrammet ges på många orter. Kravet i högskoleprovsgruppen var högst på Marie Cederschiöld högskola i Stockholm och i Uppsala.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Marie Cederschiöld högskola", sub: "Stockholm", hp: 1.4, prev: 1.1 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.2, prev: 1.05 },
      { label: "Lunds universitet", sub: "Lund", hp: 1.15, prev: 1 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.05 },
      { label: "Stockholms universitet", sub: "Stockholm", hp: 1.0, prev: 0.85 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 0.95, prev: 0.8 },
      { label: "Linköpings universitet", sub: "Norrköping", hp: 0.9, prev: 0.8 },
      { label: "Malmö universitet", sub: "Malmö", hp: 0.9, prev: 0.8 },
      { label: "Högskolan i Halmstad", sub: "Halmstad", hp: 0.9, prev: 0.75 },
      { label: "Örebro universitet", sub: "Örebro", hp: 0.85, prev: 0.8 },
      { label: "Södertörns högskola", sub: "Huddinge", hp: 0.85, prev: 0.85 },
      { label: "Mittuniversitetet", sub: "Sundsvall", hp: 0.7 },
      { label: "Högskolan Dalarna", sub: "Falun", hp: 0.6, prev: 0.4 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["psykologprogrammet", "juristprogrammet", "personalvetarprogrammet"],
  },
  ekonomprogrammet: {
    name: "Civilekonom- och ekonomprogrammet",
    h1: "Civilekonom och ekonom · HP-poäng per lärosäte",
    intro:
      "Ekonomie kandidatprogrammet i Lund och Göteborg och civilekonomprogrammet i Linköping har de högsta kraven bland universitetens ekonomutbildningar. Handelshögskolan i Stockholm har en egen sida.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet, Ekonomie kandidatprogram", sub: "Lund", hp: 1.5, prev: 1.5 },
      {
        label: "Göteborgs universitet, Ekonomie kandidatprogram",
        sub: "Göteborg",
        hp: 1.35,
        prev: 1.35,
      },
      {
        label: "Linköpings universitet, Civilekonomprogrammet",
        sub: "Linköping",
        hp: 1.35,
        prev: 1.3,
      },
      {
        label: "Linköpings universitet, Internationella civilekonomprogrammet",
        sub: "Linköping",
        hp: 1.2,
      },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.2, prev: 1.15 },
      { label: "Högskolan i Halmstad", sub: "Halmstad", hp: 1.15, prev: 1.15 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 1.1, prev: 1 },
      { label: "Umeå universitet", sub: "Umeå", hp: 1.05, prev: 1 },
      { label: "Högskolan i Borås", sub: "Borås", hp: 0.95, prev: 0.9 },
      { label: "Linnéuniversitetet", sub: "Växjö", hp: 0.95, prev: 0.95 },
      { label: "Mittuniversitetet", sub: "Sundsvall", hp: 0.95, prev: 0.85 },
      { label: "Luleå tekniska universitet", sub: "Luleå", hp: 0.65, prev: 0.7 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["civilekonom", "industriell-ekonomi", "politices-kandidat"],
  },
  arbetsterapeutprogrammet: {
    name: "Arbetsterapeutprogrammet",
    h1: "Arbetsterapeutprogrammet · HP-poäng per lärosäte",
    intro:
      "Arbetsterapeutprogrammet har lägre krav i högskoleprovsgruppen än de flesta vårdutbildningar. På flera orter antogs alla behöriga, och de står därför inte i tabellen.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 0.85 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 0.65, prev: 0.5 },
      { label: "Karolinska institutet", sub: "Huddinge", hp: 0.55, prev: 0.4 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 0.5, prev: 0.35 },
      { label: "Umeå universitet", sub: "Umeå", hp: 0.4, prev: "alla" },
      { label: "Linköpings universitet", sub: "Norrköping", hp: 0.35, prev: 0.2 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["fysioterapeutprogrammet", "sjukskoterskeprogrammet"],
  },
  rontgensjukskoterskeprogrammet: {
    name: "Röntgensjuksköterskeprogrammet",
    h1: "Röntgensjuksköterskeprogrammet · HP-poäng per lärosäte",
    intro:
      "Röntgensjuksköterskeprogrammet ges vid ett fåtal lärosäten. Uppsala hade högst krav i högskoleprovsgruppen.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.0, prev: 0.8 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 0.95, prev: 0.85 },
      { label: "Karolinska institutet", sub: "Huddinge", hp: 0.9, prev: 0.8 },
      { label: "Lunds universitet", sub: "Lund", hp: 0.9, prev: 0.65 },
      { label: "Örebro universitet", sub: "Örebro", hp: 0.55, prev: 0.4 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["sjukskoterskeprogrammet", "fysioterapeutprogrammet"],
  },
  systemvetenskap: {
    name: "Systemvetenskapliga programmet",
    h1: "Systemvetenskap · HP-poäng per lärosäte",
    intro:
      "Systemvetenskap ges som kandidatprogram vid de flesta universitet. Lund och Luleås distansvariant ligger högst.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 1.35, prev: 1.3 },
      { label: "Luleå tekniska universitet", sub: "Distans", hp: 1.35, prev: 1.5 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.25, prev: 1.3 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.2, prev: 1.25 },
      { label: "Stockholms universitet", sub: "Stockholm", hp: 1.15, prev: 1.1 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.1, prev: 1.1 },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.0, prev: 1 },
      { label: "Umeå universitet", sub: "Umeå", hp: 0.9, prev: 0.95 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 0.85 },
      { label: "Högskolan i Skövde", sub: "Skövde", hp: 0.8, prev: 0.9 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["datateknik", "ekonomprogrammet"],
  },
  logopedprogrammet: {
    name: "Logopedprogrammet",
    h1: "Logopedprogrammet · HP-poäng per lärosäte",
    intro:
      "Logopedprogrammet är fyra år och leder till legitimation. Tre lärosäten hade en poänggräns i högskoleprovsgruppen hösten 2026, och Lund låg klart högst.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 1.0, prev: 0.3 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 0.55, prev: 0.6 },
      { label: "Karolinska institutet", sub: "Huddinge", hp: 0.55, prev: 0.55 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["psykologprogrammet", "fysioterapeutprogrammet"],
  },
  biomedicinprogrammet: {
    name: "Biomedicinprogrammet",
    h1: "Biomedicinprogrammet · HP-poäng per lärosäte",
    intro:
      "Biomedicinprogrammet är ett kandidatprogram inom medicinsk forskning. Lund och Uppsala krävde mest i högskoleprovsgruppen hösten 2026.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 1.55, prev: 1.6 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.4, prev: 1.35 },
      { label: "Högskolan i Skövde", sub: "Skövde", hp: 1.15, prev: 0.7 },
      { label: "Umeå universitet", sub: "Umeå", hp: 0.9, prev: "alla" },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["lakarprogrammet", "biomedicinsk-analytiker"],
  },
  "biomedicinsk-analytiker": {
    name: "Biomedicinska analytikerprogrammet",
    h1: "Biomedicinsk analytiker · HP-poäng per lärosäte",
    intro:
      "Biomedicinska analytikerprogrammet leder till legitimation och arbete på sjukhusens laboratorier. Kravet i högskoleprovsgruppen skilde sig mycket mellan orterna hösten 2026.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.25, prev: 1.05 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.05, prev: 0.9 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.05, prev: 0.9 },
      { label: "Karolinska institutet", sub: "Huddinge, laboratoriemedicin", hp: 1.0, prev: 0.85 },
      { label: "Karolinska institutet", sub: "Huddinge, klinisk fysiologi", hp: 0.9, prev: 1 },
      { label: "Uppsala universitet", sub: "Sundsvall", hp: 0.8, prev: "alla" },
      { label: "Malmö universitet", sub: "Malmö", hp: 0.75, prev: 0.4 },
      { label: "Umeå universitet", sub: "Östersund och Sunderbyn, distans", hp: 0.7, prev: 0.6 },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 0.5, prev: 0.45 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["biomedicinprogrammet", "sjukskoterskeprogrammet"],
  },
  kriminologi: {
    name: "Kriminologiprogrammet",
    h1: "Kriminologi · HP-poäng per lärosäte",
    intro:
      "Kriminologi ges som kandidatprogram vid flera universitet. Stockholm och Lund krävde mest i högskoleprovsgruppen hösten 2026.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Stockholms universitet", sub: "Stockholm", hp: 1.2, prev: 1.2 },
      { label: "Lunds universitet", sub: "Lund", hp: 1.2, prev: 1.1 },
      { label: "Linnéuniversitetet", sub: "Växjö, polisiär verksamhet", hp: 1.05, prev: 1 },
      { label: "Malmö universitet", sub: "Malmö", hp: 1.0, prev: 1 },
      { label: "Örebro universitet", sub: "Örebro", hp: 1.0, prev: 1.05 },
      { label: "Högskolan i Gävle", sub: "Distans, utredningskriminologi", hp: 1.0 },
      { label: "Mittuniversitetet", sub: "Sundsvall", hp: 0.75, prev: 0.75 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["juristprogrammet", "socionomprogrammet"],
  },
  "medicinsk-teknik": {
    name: "Civilingenjör i medicinsk teknik",
    h1: "Civilingenjör medicinsk teknik · HP-poäng per lärosäte",
    intro:
      "Civilingenjörsprogrammen i medicinsk teknik kombinerar teknik och vård. Lunds program i medicin och teknik låg högst hösten 2026.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund, medicin och teknik", hp: 1.6, prev: 1.6 },
      { label: "Kungl. Tekniska högskolan (KTH)", sub: "Huddinge", hp: 1.45, prev: 1.35 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.45, prev: 1.45 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["teknisk-fysik", "elektroteknik"],
  },
  elektroteknik: {
    name: "Civilingenjör i elektroteknik",
    h1: "Civilingenjör elektroteknik · HP-poäng per lärosäte",
    intro:
      "Elektroteknik ges som civilingenjörsprogram vid de stora tekniska högskolorna. KTH krävde mest i högskoleprovsgruppen hösten 2026.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Kungl. Tekniska högskolan (KTH)", sub: "Stockholm", hp: 1.6, prev: 1.45 },
      { label: "Chalmers tekniska högskola", sub: "Göteborg", hp: 1.55, prev: 1.45 },
      { label: "Lunds universitet", sub: "Lund", hp: 1.55, prev: 1.55 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.55, prev: 1.45 },
      {
        label: "Linköpings universitet",
        sub: "Linköping, teknisk fysik och elektroteknik",
        hp: 1.5,
        prev: 1.45,
      },
      {
        label: "Linköpings universitet",
        sub: "Norrköping, elektronik och systemdesign",
        hp: 1.25,
        prev: 1.2,
      },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["datateknik", "teknisk-fysik"],
  },
  samhallsbyggnad: {
    name: "Civilingenjör i samhällsbyggnad",
    h1: "Civilingenjör samhällsbyggnad · HP-poäng per lärosäte",
    intro:
      "Samhällsbyggnad, väg och vatten och byggteknik är civilingenjörsprogrammen för den som vill bygga städer, vägar och broar. Kravet hösten 2026 låg mellan 0,70 och 1,40.",
    labelHeader: "Lärosäte",
    schools: [
      {
        label: "Chalmers tekniska högskola",
        sub: "Göteborg, samhällsbyggnadsteknik",
        hp: 1.4,
        prev: 1.35,
      },
      { label: "Lunds universitet", sub: "Lund, väg- och vattenbyggnad", hp: 1.4, prev: 1.35 },
      { label: "Kungl. Tekniska högskolan (KTH)", sub: "Stockholm", hp: 1.35, prev: 1.3 },
      {
        label: "Linköpings universitet",
        sub: "Norrköping, samhällsbyggnad och logistik",
        hp: 1.25,
      },
      { label: "Linnéuniversitetet", sub: "Växjö, byggteknik", hp: 0.7 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["maskinteknik", "arkitektprogrammet"],
  },
  personalvetarprogrammet: {
    name: "Personalvetarprogrammet",
    h1: "Personalvetarprogrammet · HP-poäng per lärosäte",
    intro:
      "Personalvetarprogrammet leder till arbete med HR, rekrytering och arbetsmiljö. Göteborg krävde mest i högskoleprovsgruppen hösten 2026.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.1, prev: 1.15 },
      { label: "Mälardalens universitet", sub: "Distans", hp: 1.05 },
      { label: "Örebro universitet", sub: "Örebro", hp: 0.9, prev: 0.95 },
      { label: "Södertörns högskola", sub: "Huddinge, psykologi", hp: 0.9, prev: 1 },
      { label: "Södertörns högskola", sub: "Huddinge, sociologi", hp: 0.9, prev: 0.9 },
      { label: "Mälardalens universitet", sub: "Västerås", hp: 0.6 },
      { label: "Umeå universitet", sub: "Umeå", hp: 0.6, prev: 0.65 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["socionomprogrammet", "psykologprogrammet"],
  },
  "politices-kandidat": {
    name: "Politices kandidatprogrammet",
    h1: "Politices kandidat · HP-poäng per lärosäte",
    intro:
      "Politices kandidat kombinerar statsvetenskap med nationalekonomi eller andra samhällsämnen. Lund krävde mest i högskoleprovsgruppen hösten 2026.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Lunds universitet", sub: "Lund", hp: 1.45, prev: 1.35 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.35, prev: 1.4 },
      {
        label: "Stockholms universitet",
        sub: "Stockholm, nationalekonomi och statsvetenskap",
        hp: 1.2,
        prev: 1,
      },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.2, prev: 1.1 },
      { label: "Umeå universitet", sub: "Umeå", hp: 1.0, prev: 0.9 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["ekonomprogrammet", "juristprogrammet"],
  },
  receptarieprogrammet: {
    name: "Receptarieprogrammet",
    h1: "Receptarieprogrammet · HP-poäng per lärosäte",
    intro:
      "Receptarieprogrammet är tre år och leder till legitimation som receptarie, med arbete på apotek. Kravet i högskoleprovsgruppen låg mellan 0,65 och 0,80 hösten 2026.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Uppsala universitet", sub: "Uppsala", hp: 0.8, prev: "alla" },
      { label: "Umeå universitet", sub: "Distans", hp: 0.7, prev: 0.5 },
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 0.65, prev: "alla" },
      { label: "Malmö universitet", sub: "Malmö", hp: 0.65, prev: 0.45 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["apotekarprogrammet", "biomedicinsk-analytiker"],
  },
  tandhygienistprogrammet: {
    name: "Tandhygienistprogrammet",
    h1: "Tandhygienistprogrammet · HP-poäng per lärosäte",
    intro:
      "Tandhygienistprogrammet är tre år och leder till legitimation. Göteborg och Malmö krävde mest i högskoleprovsgruppen hösten 2026.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 0.85 },
      { label: "Malmö universitet", sub: "Malmö", hp: 0.85 },
      { label: "Karolinska institutet", sub: "Huddinge", hp: 0.75, prev: 0.7 },
      { label: "Karlstads universitet", sub: "Distans", hp: 0.6, prev: 0.3 },
      { label: "Högskolan Kristianstad", sub: "Kristianstad", hp: 0.55, prev: 0.4 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["tandlakarprogrammet", "sjukskoterskeprogrammet"],
  },
  "teknisk-matematik": {
    name: "Civilingenjör i teknisk matematik",
    h1: "Civilingenjör teknisk matematik · HP-poäng per lärosäte",
    intro:
      "Teknisk matematik hör till de civilingenjörsprogram som krävt mest på högskoleprovet. KTH låg högst hösten 2026, med Lund och Uppsala strax efter.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Kungl. Tekniska högskolan (KTH)", sub: "Stockholm", hp: 1.8, prev: 1.7 },
      { label: "Lunds universitet", sub: "Lund", hp: 1.75, prev: 1.75 },
      { label: "Uppsala universitet", sub: "Uppsala", hp: 1.75 },
      { label: "Chalmers tekniska högskola", sub: "Göteborg", hp: 1.7, prev: 1.7 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.6, prev: 1.55 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["teknisk-fysik", "datateknik"],
  },
  "tekniskt-basar": {
    name: "Tekniskt basår",
    h1: "Tekniskt basår · HP-poäng per lärosäte",
    intro:
      "Tekniskt basår ger behörighet till ingenjörsutbildningar för den som saknar rätt gymnasiekurser. Basåret leder inte till examen, men många läser vidare till civilingenjör. Kravet hösten 2026 skilde sig mycket mellan lärosätena.",
    labelHeader: "Lärosäte",
    schools: [
      {
        label: "Lunds universitet",
        sub: "Helsingborg, naturvetenskaplig inriktning",
        hp: 1.45,
        prev: 1.35,
      },
      { label: "Chalmers tekniska högskola", sub: "Göteborg", hp: 1.3, prev: 1.2 },
      { label: "Chalmers tekniska högskola", sub: "Distans", hp: 1.25, prev: 1.15 },
      { label: "Linköpings universitet", sub: "Linköping", hp: 1.2, prev: 1.1 },
      { label: "Lunds universitet", sub: "Helsingborg, teknisk inriktning", hp: 1.2, prev: 1.1 },
      {
        label: "Uppsala universitet",
        sub: "Uppsala, med plats på ämneslärarprogrammet",
        hp: 1.2,
        prev: 1,
      },
      { label: "Linköpings universitet", sub: "Norrköping", hp: 0.95, prev: 0.65 },
      { label: "Linköpings universitet", sub: "Nyköping", hp: 0.9 },
      { label: "Umeå universitet", sub: "Umeå", hp: 0.85, prev: "alla" },
      { label: "Linköpings universitet", sub: "Motala", hp: 0.7 },
      { label: "Högskolan Väst", sub: "Trollhättan", hp: 0.5, prev: "alla" },
      { label: "Karlstads universitet", sub: "Karlstad", hp: 0.45, prev: "alla" },
      { label: "Luleå tekniska universitet", sub: "Luleå", hp: 0.3, prev: "alla" },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["teknisk-fysik", "maskinteknik"],
  },
  journalistprogrammet: {
    name: "Journalistprogrammet",
    h1: "Journalistprogrammet · HP-poäng per lärosäte",
    intro:
      "Journalistprogrammet är ett kandidatprogram. Två lärosäten hade en poänggräns i högskoleprovsgruppen hösten 2026, och Göteborg låg klart högst.",
    labelHeader: "Lärosäte",
    schools: [
      { label: "Göteborgs universitet", sub: "Göteborg", hp: 1.15, prev: 1.2 },
      { label: "Umeå universitet", sub: "Umeå", hp: 0.75, prev: 0.6 },
    ],
    term: "HT 2026",
    prevTerm: "HT 2025",
    sourceUrl: "https://www.uhr.se/studier-och-antagning/antagningsstatistik/",
    sourceLabel: "UHR:s antagningsstatistik",
    sourceOrg: "Universitets- och högskolerådet (UHR)",
    verifiedAt: "2026-10-24",
    relatedPrograms: ["politices-kandidat", "socionomprogrammet"],
  },
};

export const PROGRAM_SLUGS = Object.keys(PROGRAM);
export const PROGRAM_LIST = Object.entries(PROGRAM).map(([slug, cfg]) => ({
  slug,
  name: cfg.name,
}));

export const Route = createFileRoute("/hogskoleprovet-poang_/$program")({
  loader: ({ params }) => {
    const cfg = PROGRAM[params.program];
    if (!cfg) throw notFound();
    return cfg;
  },
  head: ({ params }) => {
    const cfg = PROGRAM[params.program];
    if (!cfg) return {};
    const path = `/hogskoleprovet-poang/${params.program}`;
    const top = [...cfg.schools].sort((a, b) => b.hp - a.hp)[0];
    return {
      meta: pageMeta({
        path,
        title: fitTitle(`${cfg.name}: HP-poäng ${cfg.term}`),
        description:
          `Antagningspoäng i högskoleprovsgruppen för ${cfg.name} (${cfg.term}), lärosäte för lärosäte. ` +
          `Källa: ${cfg.sourceLabel}. Uppdaterat ${cfg.verifiedAt}.`,
        ogTitle: `${cfg.name}: vad krävs på högskoleprovet?`,
        ogDescription: `HP-poäng ${cfg.term} för ${cfg.name}, lärosäte för lärosäte. Källa: ${cfg.sourceLabel}.`,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Poäng & antagning", path: "/hogskoleprovet-poang" },
          { name: cfg.name, path },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `Antagningspoäng (HP) för ${cfg.name}, ${cfg.term}`,
          description: `${cfg.labelHeader} och lägsta antagningspoäng i högskoleprovsgruppen, ${cfg.term}.`,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          creator: { "@type": "Organization", name: cfg.sourceOrg },
          distribution: {
            "@type": "DataDownload",
            encodingFormat: "text/html",
            contentUrl: cfg.sourceUrl,
          },
          variableMeasured: top
            ? `Lägst HP-poäng: ${formatDecimal(top.hp, 2)} (${top.label})`
            : undefined,
          isPartOf: { "@id": "https://tvakommanollan.se/#website" },
        }),
      ],
    };
  },
  component: ProgramPage,
});

/** Hur många rader som steg, sjönk eller låg still mot förra årets gräns. */
function jämförMedFöregående(schools: StatRow[], prevTerm?: string) {
  if (!prevTerm) return null;
  let upp = 0;
  let ned = 0;
  let lika = 0;
  let alla = 0;
  for (const r of schools) {
    if (r.prev == null) continue;
    if (r.prev === "alla") alla++;
    else if (r.hp > r.prev + 1e-9) upp++;
    else if (r.hp < r.prev - 1e-9) ned++;
    else lika++;
  }
  const antal = upp + ned + lika;
  return antal > 0 ? { upp, ned, lika, alla, antal } : null;
}

function ProgramPage() {
  const cfg = Route.useLoaderData();
  const rows = [...cfg.schools].sort((a, b) => b.hp - a.hp);
  const trend = jämförMedFöregående(cfg.schools, cfg.prevTerm);
  const related = cfg.relatedPrograms
    .map((slug) => PROGRAM[slug])
    .filter((p): p is ProgramConfig => !!p);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <nav className="text-xs text-white/45" aria-label="Brödsmulor">
        <Link to="/" className="hover:text-white/70">
          Hem
        </Link>
        <span className="px-1.5">/</span>
        <Link to="/hogskoleprovet-poang" className="hover:text-white/70">
          Poäng &amp; antagning
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-white/70">{cfg.name}</span>
      </nav>

      <header className="mt-4">
        <h1
          className="text-[26px] font-bold leading-tight text-[var(--cream)] sm:text-[36px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          {cfg.h1}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">{cfg.intro}</p>
      </header>

      <section className="mt-8">
        <h2
          className="flex items-center gap-2 text-[18px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <GraduationCap className="h-5 w-5 text-primary" />
          HP-poäng, {cfg.term}
        </h2>
        <ul className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
          {rows.map((r) => (
            <li
              key={`${r.label}-${r.sub ?? ""}`}
              className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-3.5 last:border-b-0"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium text-[var(--cream)]">
                  {r.label}
                </span>
                {r.sub && <span className="block text-xs text-white/45">{r.sub}</span>}
              </span>
              <span className="flex shrink-0 items-baseline gap-3">
                {r.bi != null && (
                  <span className="text-xs text-white/40">BI {formatDecimal(r.bi, 2)}</span>
                )}
                {cfg.prevTerm && r.prev != null && (
                  <span className="text-xs tabular-nums text-white/45">
                    {cfg.prevTerm}: {r.prev === "alla" ? "alla antogs" : formatDecimal(r.prev, 2)}
                  </span>
                )}
                <span
                  className="text-[20px] font-bold tabular-nums text-primary"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {formatDecimal(r.hp, 2)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-white/40">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Lägsta HP-poäng som togs in i urval 2, {cfg.term}
          {cfg.prevTerm ? ` (och ${cfg.prevTerm} för jämförelse)` : ""}. Källa:{" "}
          <a
            href={cfg.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            {cfg.sourceLabel}
          </a>
          , kontrollerad {cfg.verifiedAt}. Gränserna sätts om varje antagningsomgång och kan både
          stiga och sjunka. Använd talen som en fingervisning, inte ett facit för nästa termin.
        </p>
        {trend && (
          <p className="mt-4 text-[14px] leading-relaxed text-white/60">
            Jämfört med {cfg.prevTerm} steg kravet på {trend.upp} av {trend.antal}{" "}
            {trend.antal === 1 ? "utbildning" : "utbildningar"} i tabellen, sjönk på {trend.ned} och
            låg kvar på {trend.lika}.
            {trend.alla > 0 &&
              ` På ${trend.alla} ${trend.alla === 1 ? "utbildning" : "utbildningar"} antogs alla behöriga sökande ${cfg.prevTerm}, så där finns ingen gräns att jämföra med.`}
          </p>
        )}
        {cfg.note && <p className="mt-4 text-[14px] leading-relaxed text-white/55">{cfg.note}</p>}
      </section>

      <section className="mt-10 rounded-2xl border border-primary/25 bg-primary/[0.06] p-6 sm:p-8">
        <h2
          className="text-[20px] font-bold text-[var(--cream)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Öva upp din HP-poäng
        </h2>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/60">
          Aktivt övande på riktiga HP-frågor är det mest effektiva sättet att höja resultatet. Räkna
          ut var du ligger i dag, öva sedan på riktiga uppgifter från gamla prov.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/hogskoleprovet-poangraknare"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            Räkna ut din poäng
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/gamla-prov"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-[var(--cream)] transition hover:border-primary/50"
          >
            Öva på gamla prov
          </Link>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-10 border-t border-white/8 pt-8">
          <h2
            className="text-[16px] font-bold text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Andra program
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((p) => {
              const slug = Object.keys(PROGRAM).find((k) => PROGRAM[k] === p)!;
              return (
                <Link
                  key={slug}
                  to="/hogskoleprovet-poang/$program"
                  params={{ program: slug }}
                  className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/70 transition hover:border-primary/50 hover:text-[var(--cream)]"
                >
                  {p.name}
                </Link>
              );
            })}
            <Link
              to="/hogskoleprovet-poang"
              className="rounded-full border border-white/12 px-3.5 py-1.5 text-sm text-white/70 transition hover:border-primary/50 hover:text-[var(--cream)]"
            >
              Alla program
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
