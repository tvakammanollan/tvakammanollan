/**
 * Ordförklaringar för ORD-delen: skriv ut ordboksförkortningarna och läs ut
 * strukturen ur `questions.definition`.
 *
 * Bakgrund: definitionerna kommer från svenska.se (SO/SAOL/SAOB), Wiktionary
 * och Wikipedia. Ordböckerna skriver för trångt papper — "el.", "särsk.",
 * "äv.", "anv.", "p.g.a." — och en förkortning mitt i en förklaring är precis
 * det som gör att den som pluggar tappar tråden. Punkten läses dessutom som
 * meningsslut, så "särsk. om häst" ser ut som en ny mening.
 *
 * Utskrivningen sker vid rendering och inte i databasen, av samma skäl som
 * resten av städningen i `ordDefinition()`: då blir även det skrapan hämtar i
 * framtiden rent utan att någon behöver köra en migration. Skrapan använder
 * ändå samma funktion, så det som ligger i databasen är redan utskrivet och
 * det här blir ett skyddsnät för äldre rader.
 */

/** En bunt böjda former för en förkortning som styrs av ett framförställt ord. */
type AgreeingForms = {
  /** Fri form: används när inget bestämmande ord står före (oftast adverbet). */
  free: string;
  /** Efter bestämd artikel/pronomen (den, det, de, denna, dessa) — alltid -a. */
  definite: string;
  /** Efter obestämd utrum (en, någon, ingen, viss). */
  common: string;
  /** Efter obestämd neutrum (ett, något, inget, föga, visst). */
  neuter: string;
};

const DEFINITE_DETERMINERS = new Set(["den", "det", "de", "denna", "detta", "dessa", "dom"]);
const COMMON_DETERMINERS = new Set(["en", "någon", "ingen", "sådan", "viss", "sin", "min", "din"]);
const NEUTER_DETERMINERS = new Set([
  "ett",
  "något",
  "inget",
  "sådant",
  "visst",
  "föga",
  "sitt",
  "mitt",
  "ditt",
]);

/**
 * Väljer form efter det bestämmande ordet till vänster. Tittar upp till tre
 * ord bakåt, eftersom räkneord och adjektiv får stå emellan: "de fyra s.k.
 * elementarandarna" styrs av "de", inte av "fyra".
 */
function agreeingForm(before: string, forms: AgreeingForms): string {
  const tokens = before
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
  for (const token of tokens.slice(-3).reverse()) {
    if (DEFINITE_DETERMINERS.has(token)) return forms.definite;
    if (NEUTER_DETERMINERS.has(token)) return forms.neuter;
    if (COMMON_DETERMINERS.has(token)) return forms.common;
  }
  return forms.free;
}

/**
 * Förkortningar i den ordning de ska bytas ut. Ordningen är inte kosmetisk:
 * de längre mönstren måste gå först, annars äter "el." upp "el. d." och
 * "t.ex." blir "till exempel" bara till hälften. Varje mönster kräver att
 * ingen bokstav står omedelbart före, så att "modell." och "brev." lämnas i
 * fred — därför fungerar det också att låta "l." (SAOB:s "eller") stå med.
 */
const ABBREVIATIONS: Array<[RegExp, string | ((before: string) => string)]> = [
  // Flerledade först.
  [/(?<!\p{L})p\.\s?g\.\s?a\./giu, "på grund av"],
  [/(?<!\p{L})d\.\s?v\.\s?s\./giu, "det vill säga"],
  [/(?<!\p{L})o\.\s?s\.\s?v\./giu, "och så vidare"],
  [/(?<!\p{L})t\.\s?o\.\s?m\./giu, "till och med"],
  [/(?<!\p{L})fr\.\s?o\.\s?m\./giu, "från och med"],
  [/(?<!\p{L})t\.\s?ex\./giu, "till exempel"],
  [/(?<!\p{L})bl\.\s?a\./giu, "bland annat"],
  [/(?<!\p{L})m\.\s?m\./giu, "med mera"],
  [/(?<!\p{L})m\.\s?fl\./giu, "med flera"],
  [/(?<!\p{L})f\.\s?d\./giu, "före detta"],
  [/(?<!\p{L})e\.\s?d\./giu, "eller dylikt"],
  [/(?<!\p{L})el\.\s?d\./giu, "eller dylikt"],
  [/(?<!\p{L})o\.\s?d\./giu, "och dylikt"],
  [/(?<!\p{L})i\s+sht(?!\p{L})/giu, "i synnerhet"],

  // Ord som böjs efter ett framförställt bestämmande ord.
  [
    /(?<!\p{L})s\.\s?k\./giu,
    (before) =>
      agreeingForm(before, {
        free: "så kallade",
        definite: "så kallade",
        common: "så kallad",
        neuter: "så kallat",
      }),
  ],
  [
    /(?<!\p{L})eg\./giu,
    (before) =>
      agreeingForm(before, {
        free: "egentligen",
        definite: "egentliga",
        common: "egentlig",
        neuter: "egentligt",
      }),
  ],
  [
    /(?<!\p{L})urspr\./giu,
    (before) =>
      agreeingForm(before, {
        free: "ursprungligen",
        definite: "ursprungliga",
        common: "ursprunglig",
        neuter: "ursprungligt",
      }),
  ],

  // Enkla ersättningar.
  [/(?<!\p{L})särsk\./giu, "särskilt"],
  [/(?<!\p{L})spec\./giu, "speciellt"],
  [/(?<!\p{L})äv\./giu, "även"],
  [/(?<!\p{L})anv\./giu, "används"],
  [/(?<!\p{L})ev\./giu, "eventuellt"],
  [/(?<!\p{L})dvs\./giu, "det vill säga"],
  [/(?<!\p{L})etc\./giu, "med mera"],
  [/(?<!\p{L})resp\./giu, "respektive"],
  [/(?<!\p{L})motsv\./giu, "motsvarande"],
  [/(?<!\p{L})omkr\./giu, "omkring"],
  [/(?<!\p{L})ung\./giu, "ungefär"],
  [/(?<!\p{L})bildl\./giu, "bildligt"],
  [/(?<!\p{L})högtidl\./giu, "högtidligt"],
  [/(?<!\p{L})vard\./giu, "vardagligt"],
  [/(?<!\p{L})nedsätt\./giu, "nedsättande"],
  [/(?<!\p{L})skämts\./giu, "skämtsamt"],
  [/(?<!\p{L})föråldr\./giu, "föråldrat"],
  [/(?<!\p{L})åld\./giu, "ålderdomligt"],
  [/(?<!\p{L})fackspr\./giu, "fackspråk"],
  [/(?<!\p{L})dyl\./giu, "dylikt"],
  [/(?<!\p{L})obest\./giu, "obestämd"],
  [/(?<!\p{L})best\./giu, "bestämd"],
  [/(?<!\p{L})subst\./giu, "substantiv"],
  [/(?<!\p{L})adj\./giu, "adjektiv"],
  [/(?<!\p{L})adv\./giu, "adverb"],
  [/(?<!\p{L})prep\./giu, "preposition"],
  [/(?<!\p{L})konj\./giu, "konjunktion"],
  [/(?<!\p{L})pron\./giu, "pronomen"],
  [/(?<!\p{L})ss\./giu, "såsom"],
  [/(?<!\p{L})jfr\.?(?!\p{L})/giu, "jämför"],

  [/(?<!\p{L})vanl\./giu, "vanligen"],
  [/(?<!\p{L})förh\./giu, "förhållanden"],

  // SAOB:s egna kortformer. "bl." är "blott", inte "bland".
  [/(?<!\p{L})bl\./giu, "blott"],
  [/(?<!\p{L})ä\./giu, "äldre"],
  [/(?<!\p{L})gg(?!\p{L})/giu, "gång"],

  // SAOB skriver "ngn l. ngt" och sätter † för utdött språkbruk.
  [/(?<!\p{L})ngns(?!\p{L})/giu, "någons"],
  [/(?<!\p{L})ngts(?!\p{L})/giu, "någots"],
  [/(?<!\p{L})ngn(?!\p{L})/giu, "någon"],
  [/(?<!\p{L})ngt(?!\p{L})/giu, "något"],
  [/(?<!\p{L})l\./giu, "eller"],

  // Sist, så att de längre formerna ("el. d.", "o. d.") hinner före.
  [/(?<!\p{L})el\./giu, "eller"],
  [/(?<!\p{L})o\./giu, "och"],
];

/**
 * Skriver ut ordboksförkortningarna i en förklaring.
 *
 *   "gul färg anv. särsk. i konst el. hantverk"
 *     → "gul färg används särskilt i konst eller hantverk"
 *
 * Versal i början av ersättningen bevaras, så att en förkortning som inleder
 * en mening inte plötsligt står med gemen.
 */
export function expandOrdAbbreviations(s: string): string {
  let t = s;
  for (const [pattern, replacement] of ABBREVIATIONS) {
    t = t.replace(pattern, (match, ...rest) => {
      const offset = rest[rest.length - 2] as number;
      const whole = rest[rest.length - 1] as string;
      const out =
        typeof replacement === "function" ? replacement(whole.slice(0, offset)) : replacement;
      // "El." i meningsbörjan ska bli "Eller", inte "eller".
      return /^\p{Lu}/u.test(match) ? out.charAt(0).toUpperCase() + out.slice(1) : out;
    });
  }
  // "(†)" betyder utdött bruk och säger ingenting till den som inte kan
  // ordbokstecknen.
  t = t.replace(/\(\s*†\s*\)/g, "(föråldrat)").replace(/(?<![\p{L}(])†\s*/gu, "föråldrat: ");
  return t.replace(/[ \t]{3,}/g, "  ").replace(/\s+([,;:.])/g, "$1");
}

/**
 * Om en definition har något att säga efter städning. Ett fåtal uppslag i
 * källorna består bara av skiljetecken (tete-a-tete gav "." och florstunn "—."),
 * och att bjuda in med "Vad betyder X?" för att sedan fälla ut en punkt är
 * sämre än att inte visa något alls.
 */
export function hasOrdDefinition(s: string | null | undefined): boolean {
  return ordDefinition(s).replace(/[^\p{L}\p{N}]/gu, "").length >= 2;
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Tar bort en ensam homografsiffra som blivit stående mitt i en definition.
 *
 * svenska.se numrerar likstavade uppslagsord, och när skrapan plockade ut
 * texten följde siffran med som ett eget "ord": "Ge ifrån sig 1 något
 * viktigt", "det att springa 1". Den läses som ett stavfel av alla som inte
 * kan ordbokskonventionen.
 *
 * Att bara stryka ensamma siffror går inte — definitionerna innehåller
 * riktiga tal: "med början 1 januari", "produkten av alla heltal mellan 1
 * och ett visst större heltal", "sedan Babels torn, enligt 1 Mos. 11:1–9".
 * Skillnaden är sällskapet: ett riktigt tal står efter en kvantifierare
 * eller före en enhet, en månad eller ett annat tal. En homografsiffra står
 * mellan två vanliga ord. Både listorna och undantagen är pinnade mot
 * verkliga rader i `ord-definition.test.ts`.
 */
const NUMERIC_BEFORE = new Set(
  (
    "mellan från till med per ca cirka omkring minst högst över under runt bara endast" +
    " år sida sidan nummer nr kapitel steg klass grad punkt del typ figur tabell rad"
  ).split(" "),
);
const NUMERIC_AFTER = new Set(
  (
    "och eller januari februari mars april maj juni juli augusti september oktober" +
    " november december procent promille miljon miljoner miljard miljarder tusen" +
    " hundra meter mil kilometer centimeter gram kilo liter timmar timme minuter" +
    " dygn dagar dag veckor vecka månader månad år sekel gånger gång styck kronor"
  ).split(" "),
);

function stripLooseHomographDigit(s: string): string {
  return s.replace(
    /(?<![\p{L}\d])(\p{L}+)(\s+)[1-9](?![\p{L}\d])([^\p{L}\d]*)(\p{L}*)/gu,
    (match, before: string, gap: string, between: string, after: string) => {
      // "...högskola  2. produkten av..." är betydelsenumreringen, inte en
      // homograf. Den måste överleva — det är den som delar upp betydelserna.
      if (between.startsWith(".")) return match;
      if (NUMERIC_BEFORE.has(before.toLowerCase())) return match;
      if (NUMERIC_AFTER.has(after.toLowerCase())) return match;
      // Versalt ord efter ("1 Mos. 11:1-9") är en hänvisning, inte en homograf.
      if (after && after[0] === after[0].toLocaleUpperCase("sv-SE")) return match;
      return `${before}${between || gap}${after}`;
    },
  );
}

/**
 * Normaliserar en ordförklaring/definition för visning: trimmar och ser
 * till att den börjar med versal (källorna blandar). Radbrytningar bevaras
 * (definitioner renderas med whitespace-pre-wrap).
 *
 * Städar också bort tre artefakter från svenska.se-skrapningen. Görs vid
 * rendering, inte i databasen, så att även det skrapan hämtar i framtiden
 * blir rent utan ny migration:
 *
 * 1. Homografsiffror som klistrats fast i uppslagsordet ("Det att 1ticka",
 *    "2smitta"). svenska.se numrerar likstavade ord, och siffran följde med.
 *    Bara siffror som sitter direkt före en bokstav tas bort — "10 000 m2"
 *    och betydelsenumreringen "1. ... 2. ..." måste överleva.
 * 2. Odekodade HTML-entiteter, inklusive hexvarianten (`&#x2020;`).
 * 3. Länkar som följt med in i brödtexten.
 * 4. Ordboksförkortningar, se expandOrdAbbreviations().
 */
export function ordDefinition(s: string | null | undefined): string {
  let t = (s ?? "").trim();
  if (!t) return t;

  t = t
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name: string) => HTML_ENTITIES[name.toLowerCase()] ?? m);

  // Siffra direkt före bokstav = homografmarkör. Kräver ord-gräns före siffran
  // så att "m2" och "10 000" lämnas i fred.
  t = t.replace(/\b(\d+)(?=\p{L})/gu, "");

  // Ensam siffra kvar på slutet ("ytterligt 1sträng 1"). Endast ett ensamt
  // ensiffrigt tal sist — årtal och mängder är flersiffriga och rörs inte.
  t = t.replace(/\s+[1-9]$/, "");

  // Samma markör mitt i texten ("Ge ifrån sig 1 något viktigt", "det att
  // putsa 1  2. tunt murbrukslager"). Här måste riktiga tal överleva, så
  // siffran plockas bort bara när varken ordet före eller ordet efter är
  // räknesammanhang — se stripLooseHomographDigit().
  t = stripLooseHomographDigit(t);

  // Ta med föregående blanksteg så att borttagningen inte lämnar dubbelt
  // mellanslag efter sig. Ingen generell kollaps av mellanslag: källorna
  // separerar betydelser med dubbelt mellanslag ("1. ...  2. ...").
  t = t.replace(/[ \t]*https?:\/\/\S+/g, "");

  // 4. Ordboksförkortningarna skrivs ut ("särsk." → "särskilt").
  t = expandOrdAbbreviations(t);

  t = t.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/* ------------------------------------------------------------------ *
 * Strukturen i `questions.definition`
 * ------------------------------------------------------------------ */

/**
 * Skrapan lägger det som inte är själva betydelsen på egna, märkta rader
 * sist i texten:
 *
 *   1. Ta sig upp i eller ombord på rigg respektive fartyg.
 *   2. Göra entré på en scen eller dylikt.
 *   Exempel: äntra stormasten | publiken jublade när artisten äntrade scenen
 *   Liknande ord: borda, entré
 *   Ordklass: verb
 *
 * Textfält i stället för egna kolumner, därför att formen fortfarande läses
 * rakt av den som slår upp ordet i databasen eller via MCP-verktyget — och
 * därför att en ny kolumn hade krävt en migration mot produktionsdatabasen
 * för något som är rent presentationsdata.
 */
export type OrdDefinitionParts = {
  /** Betydelserna, en per post. Numreringen "1." / "2." är avskalad. */
  senses: string[];
  /** Autentiska exempelmeningar ur ordboken. */
  examples: string[];
  /** Närliggande ord ur ordbokens JFR-hänvisningar. */
  related: string[];
  /** "substantiv", "verb", "adjektiv" … eller null. */
  wordClass: string | null;
};

const SECTION_LABELS = {
  examples: "Exempel",
  related: "Liknande ord",
  wordClass: "Ordklass",
} as const;

/** Bygger textformen ovan. Används av skrapan; parsern nedan läser den. */
export function formatOrdDefinition(parts: OrdDefinitionParts): string {
  const lines: string[] = [];
  const senses = parts.senses.map((s) => s.trim()).filter(Boolean);
  if (senses.length === 1) lines.push(senses[0]);
  else senses.forEach((s, i) => lines.push(`${i + 1}. ${s}`));

  const examples = parts.examples.map((e) => e.trim()).filter(Boolean);
  if (examples.length) lines.push(`${SECTION_LABELS.examples}: ${examples.join(" | ")}`);
  const related = parts.related.map((r) => r.trim()).filter(Boolean);
  if (related.length) lines.push(`${SECTION_LABELS.related}: ${related.join(", ")}`);
  if (parts.wordClass?.trim()) lines.push(`${SECTION_LABELS.wordClass}: ${parts.wordClass.trim()}`);
  return lines.join("\n");
}

/**
 * Läser texten ovan tillbaka till sina delar. Tål allt som redan ligger i
 * databasen: en rad utan märkta sektioner blir en enda betydelse, och den
 * äldre formen där betydelserna separerades med dubbla mellanslag
 * ("1. ...  2. ...") delas upp på samma sätt som en numrerad lista.
 */
export function parseOrdDefinition(raw: string): OrdDefinitionParts {
  const parts: OrdDefinitionParts = {
    senses: [],
    examples: [],
    related: [],
    wordClass: null,
  };
  const body: string[] = [];

  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*(Exempel|Liknande ord|Ordklass)\s*:\s*(.*)$/u);
    if (!m) {
      if (line.trim()) body.push(line.trim());
      continue;
    }
    const value = m[2].trim();
    if (!value) continue;
    if (m[1] === SECTION_LABELS.examples) {
      parts.examples = value
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (m[1] === SECTION_LABELS.related) {
      parts.related = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      parts.wordClass = value;
    }
  }

  // Betydelserna: numrerade poster oavsett om de står på egna rader eller
  // (äldre form) på en rad separerade med dubbla mellanslag.
  const joined = body.join("\n");
  if (/(?:^|[\n ])\d+\.\s/.test(joined)) {
    parts.senses = joined
      .split(/(?:^|[\n ]\s*)\d+\.\s+/u)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (joined.trim()) {
    parts.senses = [joined.trim()];
  }
  return parts;
}

/**
 * Städar och läser upp en rå definition ur databasen i ett svep — det här är
 * vad UI:t ska använda. Varje betydelse får versal för sig; `ordDefinition()`
 * kan bara versalisera textens allra första tecken, och i en numrerad lista
 * står nio av tio betydelser inte först.
 */
export function ordDefinitionParts(raw: string | null | undefined): OrdDefinitionParts {
  const parts = parseOrdDefinition(ordDefinition(raw));
  parts.senses = parts.senses.map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s));
  return parts;
}

/**
 * Källrad över förklaringen.
 *
 * Två kvalifikationer i källsträngen måste fram till läsaren och inte kapas
 * bort: `– om "X"` betyder att texten förklarar ett ANNAT ord (frasens
 * huvudord), och `rättstavat "X"` att uppslaget gjordes på en rättad
 * stavning. Utan dem ser en förklaring av "sälla" ut som en förklaring av
 * "sälla sig till", och läsaren har inget sätt att märka skillnaden.
 */
export function definitionSourceLabel(s?: string | null): string {
  if (!s) return "Förklaring";
  const about = s.match(/– om "([^"]+)"/)?.[1];
  const respelled = s.match(/rättstavat "([^"]+)"/)?.[1];
  const base = s.startsWith("SO idiom")
    ? "SO · idiom (svenska.se)"
    : s.startsWith("SO")
      ? "SO · Svensk ordbok (svenska.se)"
      : s.startsWith("SAOL")
        ? "SAOL (svenska.se)"
        : s.startsWith("SAOB")
          ? "SAOB (svenska.se)"
          : s.startsWith("Wikipedia")
            ? "Wikipedia"
            : s.startsWith("Wiktionary")
              ? "Wiktionary"
              : s.startsWith("HP-facit")
                ? "Synonym (HP-facit)"
                : "Förklaring";
  if (about) return `${base} · om "${about}"`;
  if (respelled) return `${base} · uppslag "${respelled}"`;
  return base;
}
