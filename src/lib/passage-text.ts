/**
 * Städning av lästexterna (LÄS och ELF) innan de renderas.
 *
 * Texterna är extraherade ur UHR:s PDF:er och bär med sig fyra fel från
 * sättningen, som alla ser likadana ut för den som läser: texten bryts mitt i.
 *
 *  1. **Ligaturer.** Provhäftena sätts med fi/fl/ff-ligaturer. Glyfen har ingen
 *     motsvarighet i teckenströmmen, så extraktionen lämnar ett mellanslag i
 *     stället: "de fl esta småfåglar fi nns". 135 sådana i arkivet.
 *  2. **Spalt- och sidbrytningar.** Importskriptet bygger ett stycke per
 *     textblock (`Block.paragraphs()`), och en spalt är ett eget block. Ett
 *     stycke som fortsätter i nästa spalt blir därför två stycken med luft
 *     emellan — mitt i en mening, ibland mitt i ett ord: "på 22 trädgårds-" /
 *     "sångare, alla yngre än ett kalenderår". 409 sådana.
 *  3. **Lösa bokstäver.** I några årgångar lästes kerningen som ordmellanrum,
 *     så att mellanslag hamnade inne i orden: "elever b ehöver u tveckla".
 *  4. **Sidfot.** "– 11 –", "PROVET ÄR SLUT. FINNS TID ÖVER," och
 *     InDesign-raden "Verbaldel ELF16A V1.indd 12" hamnade i lästextzonen och
 *     står nu mitt i löptexten, ofta rakt igenom en mening.
 *
 * Rättningen sker vid rendering och inte i datafilerna, eftersom matchen och
 * träningen läser sina lästexter ur Supabase (`questions.passage_text`) och
 * inte ur `src/data/prov/`. En normalisering här täcker alla tre vyerna med
 * samma regler, och gäller även om importskriptet körs om.
 */

/* -------------------------------------------------------------------------
   1. Sidfot
   ---------------------------------------------------------------------- */

/** Rader ur sidfoten som följde med lästexten. Testas bara mot korta stycken. */
const FURNITURE = [
  /^[–—-]\s*\d{1,3}\s*[–—-]/, // "– 11 –", och dubblerat "– 12 – – 12 –"
  /^PROVET ÄR SLUT/i,
  /\.indd\b/i, // "Verbaldel ELF16A V1.indd 12"
  /^\d{4}-\d{2}-\d{2}\s+\d{1,2}[:.]\d{2}/, // tidsstämpeln bredvid .indd-raden
];

/**
 * En riktig mening får aldrig falla bort. Sidfotsraderna är alla under 40
 * tecken; gränsen ligger med marginal över dem och långt under ett stycke.
 */
const FURNITURE_MAX_LENGTH = 80;

function isFurniture(text: string): boolean {
  return text.length <= FURNITURE_MAX_LENGTH && FURNITURE.some((re) => re.test(text));
}

/* -------------------------------------------------------------------------
   2. Ligaturer
   ---------------------------------------------------------------------- */

const LIGATURE = /([A-Za-zÀ-ÖØ-öø-ÿ]*(?:ffl|ffi|ff|fi|fl))[ \u00a0]([a-zà-öø-ÿ]+)/g;

/**
 * Vanliga ord på båda språken. Står ett av dem efter mellanslaget är
 * mellanslaget äkta — "picked off the shelf", "en biografi om Selma".
 */
const COMMON_WORDS = new Set([
  // svenska
  "och",
  "att",
  "som",
  "är",
  "var",
  "för",
  "till",
  "av",
  "på",
  "i",
  "med",
  "den",
  "det",
  "de",
  "en",
  "ett",
  "om",
  "men",
  "eller",
  "inte",
  "har",
  "hade",
  "kan",
  "ska",
  "skulle",
  "vid",
  "från",
  "under",
  "över",
  "efter",
  "före",
  "mellan",
  "genom",
  "mot",
  "utan",
  "hos",
  "än",
  "så",
  "där",
  "här",
  "när",
  "vad",
  "vem",
  "vilken",
  "vilket",
  "vilka",
  "sin",
  "sitt",
  "sina",
  "hans",
  "hennes",
  "deras",
  "vår",
  "ni",
  "jag",
  "du",
  "han",
  "hon",
  "vi",
  "man",
  "alla",
  "andra",
  "samma",
  "egen",
  "eget",
  "egna",
  "mycket",
  "många",
  "någon",
  "något",
  "några",
  "ingen",
  "inget",
  "inga",
  "hela",
  "hel",
  "bara",
  "även",
  "redan",
  "ännu",
  "aldrig",
  "alltid",
  "ofta",
  "ibland",
  "åt",
  "samt",
  "både",
  "sedan",
  "därför",
  "eftersom",
  // engelska
  "the",
  "a",
  "an",
  "of",
  "to",
  "in",
  "on",
  "at",
  "from",
  "with",
  "for",
  "by",
  "as",
  "is",
  "was",
  "are",
  "were",
  "be",
  "been",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "his",
  "her",
  "their",
  "our",
  "your",
  "my",
  "you",
  "he",
  "she",
  "they",
  "we",
  "not",
  "no",
  "if",
  "so",
  "than",
  "then",
  "but",
  "or",
  "and",
  "all",
  "any",
  "more",
  "most",
  "new",
  "up",
  "down",
  "out",
  "over",
  "under",
  "between",
  "amid",
  "about",
  "after",
  "before",
  "when",
  "while",
  "where",
  "who",
  "which",
  "what",
  "how",
  "some",
  "such",
  "other",
  "own",
  "off",
  "only",
  "just",
  "also",
  "very",
  "can",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "do",
  "does",
  "did",
  "has",
  "have",
  "had",
  "get",
  "getting",
  "got",
  "make",
  "made",
  "into",
  "through",
  "during",
  "against",
  "without",
  "within",
  "upon",
  "per",
  "via",
  "each",
  "both",
  "either",
  "one",
  "two",
  "three",
  "many",
  "much",
  "few",
  "less",
  "best",
  "better",
  "worse",
  "worst",
  "there",
  "here",
  "now",
  "still",
  "even",
  "again",
]);

/**
 * Ord som faktiskt slutar på ff eller fi. Efter ett sådant är mellanslaget
 * äkta även när nästa ord är ovanligt — "Poor staff planning", "blow off
 * steam". Listan behövs bara för de fallen; är nästa ord vanligt fångas de
 * redan av COMMON_WORDS.
 *
 * `topografi` och `geografi` står medvetet inte här: i arkivet förekommer de
 * bara som avbrutna ord ("topografi n" → topografin, "geografi ska" →
 * geografiska), och ett vanligt ord efter dem fångas av listan ovan.
 */
const WORDS_ENDING_IN_F = new Set([
  "off",
  "staff",
  "stuff",
  "straff",
  "dödsstraff",
  "fängelsestraff",
  "plaintiff",
  "sheriff",
  "tariff",
  "runoff",
  "playoff",
  "sniff",
  "gruff",
  "piff",
  "whiff",
  "bluff",
  "tuff",
  "biff",
  "monsterbiff",
  "giraff",
  "falstaff",
  "khadaffi",
  "biografi",
  "scenografi",
  "demografi",
  "ikonografi",
  "filosofi",
  "koreografi",
  "fotografi",
  "kalligrafi",
]);

/**
 * En ensam bokstav före ligaturen betyder förkortning, inte brutet ord:
 * "lärare m fl inom skolan" är "med flera" och inget att slå ihop.
 */
const ABBREVIATION_BEFORE = /(?:^|\s)[a-zà-öø-ÿ]\s$/;

/** Ska "left␣right" skrivas ihop till ett ord? */
function isBrokenLigature(left: string, right: string): boolean {
  // Inget svenskt eller engelskt ord slutar på -fl, så där är brytningen given.
  if (left.toLowerCase().endsWith("fl")) return true;
  if (COMMON_WORDS.has(right)) return false;
  return !WORDS_ENDING_IN_F.has(left.toLowerCase());
}

function repairLigatures(text: string): string {
  return text.replace(LIGATURE, (whole, left: string, right: string, offset: number) => {
    if (ABBREVIATION_BEFORE.test(text.slice(0, offset))) return whole;
    return isBrokenLigature(left, right) ? left + right : whole;
  });
}

/* -------------------------------------------------------------------------
   3. Lösa bokstäver mitt i ord
   ---------------------------------------------------------------------- */

/**
 * I ett par årgångar (värst 2022ht-5, 2022ht-2, 2019vt-1, 2023ht-3) läste
 * extraktionen kerningen som ordmellanrum och strödde in mellanslag inne i
 * orden: "elever b ehöver u tveckla", "minskar deras m otivation".
 *
 * Regeln fogar ihop en ensam gemen bokstav med ordet efter, men bara när
 * bokstaven omöjligt kan stå för sig själv:
 *
 *  - konsonanter samt e, u, y, ä — inget av dem är ord på svenska eller
 *    engelska. `i`, `å`, `ö`, `a` och `o` står utanför; de är riktiga ord.
 *  - minst två bokstäver före mellanslaget, så att "5 m höjd" och en bokstav
 *    som redan hör till en annan lös bokstav lämnas i fred.
 *  - minst tre bokstäver efter, vilket lämnar förkortningarna ("t ex", "m fl",
 *    "d v s") och variabler ("x är") orörda.
 *  - nästa ord får inte vara ett vanligt ord — "då d etta" fogas ihop, men
 *    inte något som redan läser rätt.
 */
const STRAY_LETTER = /([a-zà-öø-ÿ]{2}\s)([bcdfghjklmnpqrstvwxzeuyä])\s([a-zà-öø-ÿ]{3,})/g;

function joinStrayLetters(text: string): string {
  // Två lösa bokstäver i rad ("elever b ehöver u tveckla") ryms inte i en
  // enda genomgång, eftersom matchningen äter tecknen före nästa träff.
  for (let pass = 0; pass < 4; pass++) {
    const next = text.replace(
      STRAY_LETTER,
      (whole, before: string, letter: string, word: string) =>
        COMMON_WORDS.has(word) ? whole : before + letter + word,
    );
    if (next === text) break;
    text = next;
  }
  return text;
}

/* -------------------------------------------------------------------------
   4. Spalt- och sidbrytningar
   ---------------------------------------------------------------------- */

/** Slutet på en mening. Kommatecken räknas inte — där fortsätter texten. */
const SENTENCE_END = /[.!?:;…»”"'’)\]]$/;

/** Nästa stycke fortsätter meningen: liten bokstav, eventuellt efter citattecken. */
const CONTINUATION = /^[”„»"'’(«]?[a-zà-öø-ÿ]/;

/**
 * Bindestrecket vid spaltbrytningen är avstavning och ska bort — men inte när
 * nästa led är en konjunktion. Då är det ett riktigt bindestreck som hör ihop
 * med ett utelämnat efterled: "mark- och vattenanvändning".
 */
const CONJUNCTION = /^(och|eller|samt|and|or)\b/;

/* -------------------------------------------------------------------------
   Normalisering
   ---------------------------------------------------------------------- */

function tidy(text: string): string {
  return text.replace(/[ \t\u00a0]{2,}/g, " ").trim();
}

/**
 * Städar en lästexts stycken: sidfot bort, ligaturer ihop, och stycken som
 * bara är en spaltbrytning sammanslagna till det stycke de hör till.
 */
export function normalizeParagraphs(paragraphs: readonly string[]): string[] {
  const cleaned: string[] = [];
  for (const raw of paragraphs) {
    const text = tidy(raw);
    if (!text || isFurniture(text)) continue;
    cleaned.push(joinStrayLetters(repairLigatures(text)));
  }

  const out: string[] = [];
  for (const para of cleaned) {
    const prev = out[out.length - 1];
    if (prev === undefined) {
      out.push(para);
    } else if (prev.endsWith("-") && CONTINUATION.test(para) && !CONJUNCTION.test(para)) {
      out[out.length - 1] = prev.slice(0, -1) + para; // "trädgårds-" + "sångare"
    } else if (!SENTENCE_END.test(prev) && CONTINUATION.test(para)) {
      out[out.length - 1] = prev + " " + para;
    } else {
      out.push(para);
    }
  }
  return out;
}

/**
 * Samma städning för lästexter som kommer som ett enda fält
 * (`questions.passage_text` i Supabase).
 *
 * Här delas texten på *varje* radbrytning, inte bara på blankrad. Vyerna satte
 * tidigare `whitespace-pre-wrap` och lät enkla radbrytningar stå kvar, vilket
 * gör en hårdbruten text till en trappa av korta rader mitt i meningarna.
 * Regeln ovan skiljer redan de två fallen åt: en rad som slutar mitt i en
 * mening fogas ihop igen, ett nytt stycke får stå för sig självt.
 */
export function normalizePassageText(text: string | null | undefined): string[] {
  if (!text) return [];
  return normalizeParagraphs(text.split(/\n+/));
}

/**
 * Ligaturlagningen ensam, för uppgiftstext och svarsalternativ.
 *
 * Samma brutna ord står i frågorna som i lästexterna — "fi nfördela",
 * ”infl ationsteorin”, "krass defi nition", "the fi rst paragraph" — 33 stycken
 * i arkivet, spridda över ORD, LÄS, MEK och ELF.
 *
 * Regeln för lösa bokstäver körs medvetet **inte** här. Uppgiftstexten omfattar
 * även XYZ, KVA och NOG, där ensamma bokstäver är variabler: "heltalet x
 * divideras med 8", "Funktionen g ges av g(x)". Att foga ihop dem hade gjort
 * matematikuppgifterna obegripliga. Alla 115 lösa bokstäver i uppgiftstexten
 * ligger i just de tre delproven; i de verbala finns ingen enda.
 */
export function repairBrokenWords(text: string): string {
  return repairLigatures(tidy(text));
}
