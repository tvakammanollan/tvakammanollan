/**
 * Ordlistan — serverdelen.
 *
 * ORD-beståndet är 8 761 uppslag som fram till nu bara gick att nå genom att
 * öva: de låg i databasen och renderades en och en i /ord. Det är sajtens
 * största textmängd och den var osökbar. Ordlistan ger varje uppslag en egen
 * adress med sin förklaring, sin faktiska HP-uppgift och länkar vidare till
 * närliggande ord.
 *
 * Server-only: importerar `supabaseAdmin` och får aldrig nå en klientbundle.
 *
 * **Registret cachas per isolat.** Uppslagningen sker på slug, och slugen står
 * inte i databasen — den räknas ur `question_text`. Ett `ilike`-mönster hade
 * nästan fungerat (bindestreck i slugen matchar ett tecken i ordet), men sju
 * uppslag tappar tecken i slugen (`crêpe`, `garçon`, `di-,diko-` …) och för dem
 * matchar mönstret ingenting. Ett register i minnet är exakt i stället för
 * nästan, och behövs ändå för bokstavssidorna och sitemapen.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ordSlug, ordLetter, ordCollator, ORD_LETTERS, ORD_LETTER_OTHER } from "./ord-slug";
import { ordDefinitionParts, definitionSourceLabel } from "./ord-definition";
import { trimToWord } from "./seo-text";
import { ordText } from "./sv-format";
import { CANONICAL_HOST } from "./canonical-host";

const ORIGIN = `https://${CANONICAL_HOST}`;

/** PostgREST returnerar max ~1000 rader per anrop. */
const PAGE_SIZE = 1000;

/**
 * Hur länge registret får vara gammalt.
 *
 * Beståndet ändras när någon kör om skrapan, alltså ett fåtal gånger om året.
 * En timme är därför generöst tilltaget och gör att ett varmt isolat aldrig
 * betalar för de nio anropen som bygger registret.
 */
const INDEX_TTL_MS = 60 * 60 * 1000;

export type OrdIndex = {
  builtAt: number;
  /** slug → uppslagsordet så som det står i databasen. */
  bySlug: Map<string, string>;
  /** bokstav → sluggar, sorterade som en svensk ordlista. */
  byLetter: Map<string, string[]>;
  /** Alla sluggar i alfabetisk ordning — bär grann-länkarna och sitemapen. */
  ordered: string[];
  count: number;
};

let cached: OrdIndex | null = null;
let building: Promise<OrdIndex> | null = null;

async function buildIndex(): Promise<OrdIndex> {
  const words: string[] = [];
  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabaseAdmin
      .from("questions")
      .select("question_text")
      .eq("category", "ORD")
      .not("question_text", "is", null)
      .order("question_text")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const row of data) {
      const w = (row.question_text ?? "").trim();
      if (w) words.push(w);
    }
    if (data.length < PAGE_SIZE) break;
  }

  const bySlug = new Map<string, string>();
  for (const w of words) {
    const slug = ordSlug(w);
    if (!slug) continue;
    // Två uppslag ger samma slug ("crème de la crème" / "crème-de-la-crème").
    // Kortaste vinner, och vid lika längd den som kommer först alfabetiskt —
    // vilket som helst duger, men valet måste vara deterministiskt: annars
    // pekar sitemapen på en sida och länkarna på en annan, beroende på i
    // vilken ordning raderna kom tillbaka.
    const held = bySlug.get(slug);
    if (held === undefined || w.length < held.length || (w.length === held.length && w < held)) {
      bySlug.set(slug, w);
    }
  }

  const ordered = [...bySlug.keys()].sort((a, b) =>
    ordCollator.compare(bySlug.get(a) ?? a, bySlug.get(b) ?? b),
  );

  const byLetter = new Map<string, string[]>();
  for (const letter of [...ORD_LETTERS, ORD_LETTER_OTHER]) byLetter.set(letter, []);
  for (const slug of ordered) {
    byLetter.get(ordLetter(bySlug.get(slug) ?? slug))?.push(slug);
  }

  return { builtAt: Date.now(), bySlug, byLetter, ordered, count: bySlug.size };
}

/**
 * Registret, byggt eller återanvänt.
 *
 * `building` finns för att en kall isolat som träffas av flera crawlerbegäran
 * samtidigt annars startar nio databasanrop per begäran i stället för nio
 * totalt.
 */
export async function getOrdIndex(): Promise<OrdIndex> {
  if (cached && Date.now() - cached.builtAt < INDEX_TTL_MS) return cached;
  if (!building) {
    building = buildIndex()
      .then((idx) => {
        cached = idx;
        return idx;
      })
      .finally(() => {
        building = null;
      });
  }
  return building;
}

/**
 * Så lång den citerade betydelsen får bli.
 *
 * Nog för att svara på "vad betyder ordet", för kort för att ersätta ett
 * uppslag i ordboken. Se kommentaren på `OrdlistaEntry.sense`.
 */
const SENSE_MAX = 180;

/**
 * Adress till uppslaget hos källan.
 *
 * Att hänvisa vidare är både hyggligt mot den som äger texten och nyttigt
 * för läsaren, som ofta vill ha hela artikeln. svenska.se slår upp alla tre
 * ordböckerna på samma sökadress.
 */
function sourceUrl(source: string | null, word: string): string | null {
  if (!source) return null;
  const q = encodeURIComponent(word.trim().toLowerCase());
  if (/^(SO|SAOL|SAOB)/.test(source)) return `https://svenska.se/tre/?sok=${q}`;
  if (source.startsWith("Wiktionary")) return `https://sv.wiktionary.org/wiki/${q}`;
  if (source.startsWith("Wikipedia")) return `https://sv.wikipedia.org/wiki/${q}`;
  return null;
}

export type OrdlistaEntry = {
  slug: string;
  /**
   * Uppslagsordet i visningsform.
   *
   * 953 rader står versalt i databasen ("VAKANT", "VALÖR") — ett arv från
   * de gamla provhäftenas sättning. Resten av appen renderar ORD genom
   * `ordText()` av precis det skälet, och en rubrik som skriker är det
   * första en läsare tar för ett fel.
   */
  word: string;
  /**
   * EN betydelse, kortad — inte ordbokens fulla artikel.
   *
   * Beståndets förklaringar kommer till 91 % ur SO (svenska.se). Att visa
   * dem i övningsläget, ett ord i taget för den som pluggar, är en sak. Att
   * publicera hela artikeln — alla betydelser och ordbokens egna
   * exempelmeningar — på 8 760 indexerbara sidor är en annan: det är en
   * systematisk återgivning av en väsentlig del av ordboken, vilket
   * katalogskyddet i 49 § URL träffar oavsett om den enskilda definitionen
   * har verkshöjd. Citaträtten bär inte heller, eftersom citaten då är
   * själva produkten.
   *
   * Sidan leder därför med det vi äger: uppgiften ordet kom ur och dess
   * facit — som i ORD *är* en synonym till ordet, hämtad ur UHR:s öppna
   * material. Ordboken bidrar med en kort, källhänvisad rad.
   *
   * Övningsläget (/ord) rör detta inte.
   */
  sense: string;
  /** JFR-orden ur ordboken, med slug för dem som har en egen sida. */
  related: { word: string; slug: string | null }[];
  wordClass: string | null;
  sourceLabel: string;
  /** Uppslaget hos källan, när den har en publik adress att hänvisa till. */
  sourceUrl: string | null;
  /** Uppgiften som ordet faktiskt kom ur — sajtens eget, unika innehåll. */
  question: {
    /**
     * Alternativen, med slug för dem som själva är uppslag i ordlistan.
     *
     * Att kunna klicka vidare på en distraktor är sidans egen idé: den som
     * läser vill veta vad de fyra fel svaren betydde också, och det är
     * dessutom den tätaste länkvägen mellan uppslagen som finns —
     * ordbokens JFR-ord räcker bara till var sjätte sida.
     */
    options: { id: string; text: string; slug: string | null }[];
    correctAnswer: string;
    correctText: string | null;
  } | null;
  /** Hela beståndets storlek — sidan skriver ut den, och den ändras. */
  total: number;
  /** Grannarna i bokstavsordning, så varje sida ligger i en kedja. */
  prev: { slug: string; word: string } | null;
  next: { slug: string; word: string } | null;
  letter: string;
};

/** Ett uppslag, eller null när slugen inte finns. */
export async function fetchOrdEntry(slugInput: string): Promise<OrdlistaEntry | null> {
  const slug = ordSlug(slugInput);
  if (!slug) return null;
  const index = await getOrdIndex();
  const word = index.bySlug.get(slug);
  if (!word) return null;

  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("question_text,options,correct_answer,definition,definition_source")
    .eq("category", "ORD")
    .eq("question_text", word)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[ordlista] entry:", error.message);
    return null;
  }
  if (!data) return null;

  const parts = ordDefinitionParts(data.definition);
  const options = Array.isArray(data.options)
    ? (data.options as { id: string; text: string }[]).filter((o) => o?.id && o?.text)
    : [];
  const correctText = options.find((o) => o.id === data.correct_answer)?.text ?? null;
  const linkSlug = (text: string): string | null => {
    const s = ordSlug(text);
    return s && s !== slug && index.bySlug.has(s) ? s : null;
  };

  const pos = index.ordered.indexOf(slug);
  const neighbour = (i: number) => {
    const s = index.ordered[i];
    return s ? { slug: s, word: ordText(index.bySlug.get(s) ?? s) } : null;
  };

  return {
    slug,
    word: ordText(word),
    // Bara första betydelsen, och kortad. Se kommentaren på `sense`.
    sense: trimToWord(parts.senses[0] ?? "", SENSE_MAX),
    // Bara ord som har en egen sida blir länkar. Ett JFR-ord som inte finns i
    // beståndet ska stå kvar som text — det är fortfarande upplysande — men
    // aldrig som en länk till en 404:a.
    related: parts.related.map((r) => ({ word: r, slug: linkSlug(r) })),
    wordClass: parts.wordClass,
    sourceLabel: definitionSourceLabel(data.definition_source),
    sourceUrl: sourceUrl(data.definition_source, word),
    question:
      options.length >= 2
        ? {
            options: options.map((o) => ({ ...o, text: ordText(o.text), slug: linkSlug(o.text) })),
            correctAnswer: data.correct_answer,
            correctText,
          }
        : null,
    total: index.count,
    prev: pos > 0 ? neighbour(pos - 1) : null,
    next: pos >= 0 && pos < index.ordered.length - 1 ? neighbour(pos + 1) : null,
    letter: ordLetter(word),
  };
}

export type OrdLetterPage = {
  letter: string;
  words: { slug: string; word: string }[];
  count: number;
  /** Grannbokstäverna med minst ett ord, så registret ligger i en kedja precis som uppslagen. */
  prev: { letter: string; count: number } | null;
  next: { letter: string; count: number } | null;
};

/** Ett bokstavsregister. */
export async function fetchOrdLetter(letter: string): Promise<OrdLetterPage | null> {
  const index = await getOrdIndex();
  const slugs = index.byLetter.get(letter);
  if (!slugs) return null;

  const letters = [...index.byLetter.entries()]
    .map(([l, s]) => ({ letter: l, count: s.length }))
    .filter((l) => l.count > 0);
  const pos = letters.findIndex((l) => l.letter === letter);

  return {
    letter,
    words: slugs.map((s) => ({ slug: s, word: ordText(index.bySlug.get(s) ?? s) })),
    count: slugs.length,
    prev: pos > 0 ? letters[pos - 1] : null,
    next: pos >= 0 && pos < letters.length - 1 ? letters[pos + 1] : null,
  };
}

/** Navet: hur många ord varje bokstav rymmer. */
export async function fetchOrdlistaOverview(): Promise<{
  total: number;
  letters: { letter: string; count: number }[];
}> {
  const index = await getOrdIndex();
  return {
    total: index.count,
    letters: [...index.byLetter.entries()]
      .map(([letter, slugs]) => ({ letter, count: slugs.length }))
      .filter((l) => l.count > 0),
  };
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Ordlistans sitemap.
 *
 * Ligger i en egen fil och inte i public/sitemap.xml: den handskrivna filen
 * kan inte bära nio tusen adresser, och ordlistan ändras när beståndet gör det.
 */
export async function buildOrdlistaSitemap(): Promise<string> {
  const index = await getOrdIndex();
  const urls: string[] = [
    `${ORIGIN}/ordlista`,
    ...[...index.byLetter.entries()]
      .filter(([, slugs]) => slugs.length > 0)
      .map(([letter]) => `${ORIGIN}/ordlista/bokstav/${letter}`),
    // encodeURI och inte encodeURIComponent: sluggen kan innehålla å, ä, ö och
    // accenter som måste procentkodas, men aldrig ett "/" som skulle kodas fel.
    ...index.ordered.map((slug) => `${ORIGIN}/ordlista/${encodeURIComponent(slug)}`),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${xmlEscape(u)}</loc>\n    <changefreq>monthly</changefreq>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
