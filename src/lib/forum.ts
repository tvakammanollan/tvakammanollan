/**
 * Ren forumlogik — slugar, URL:er, utdrag och felöversättningar.
 *
 * Inget här rör databasen eller React, så allt går att testa direkt
 * (`src/lib/forum.test.ts`). Renderingen av inläggstext ligger i
 * ./forum-markdown.ts, som också är ren.
 */

/** Inlägg per sida i en tråd. Ändras detta ändras även paginerade URL:er. */
export const POSTS_PER_PAGE = 30;
/** Trådar per sida i en kategori. */
export const THREADS_PER_PAGE = 30;

/** Längsta tillåtna inlägg — samma gräns som CHECK-villkoret i databasen. */
export const MAX_BODY_LENGTH = 10000;
export const MIN_BODY_LENGTH = 2;
export const MAX_TITLE_LENGTH = 140;
export const MIN_TITLE_LENGTH = 5;

/** Så länge ett vanligt konto får redigera sitt inlägg (speglar forum_edit_post). */
export const EDIT_WINDOW_MINUTES = 30;

export type CategoryKind = "discussion" | "qa";
export type ForumStatus = "visible" | "pending" | "hidden" | "deleted";

/** Namn att visa för en användare vars konto raderats (GDPR-anonymisering). */
export const DELETED_USER_NAME = "Borttagen användare";

export function displayAuthor(username: string | null | undefined): string {
  const name = (username ?? "").trim();
  return name.length > 0 ? name : DELETED_USER_NAME;
}

/* ------------------------------------------------------------------ *
 * Slug och URL
 * ------------------------------------------------------------------ */

const TRANSLITERATE: Record<string, string> = {
  å: "a",
  ä: "a",
  ö: "o",
  é: "e",
  è: "e",
  ü: "u",
  á: "a",
  à: "a",
  ø: "o",
  æ: "ae",
  ß: "ss",
};

/**
 * Rubrik → slug. Svenska tecken translittereras (å/ä → a, ö → o) i stället för
 * att strippas, annars blir "Hur löser man KVA?" till "hur-l-ser-man-kva".
 */
export function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[åäöéèüáàøæß]/g, (c) => TRANSLITERATE[c] ?? c)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug.length > 0 ? slug : "trad";
}

/**
 * Tråd-URL: id före slug. Uppslag sker på id, så en ändrad rubrik gör aldrig
 * en gammal länk trasig — fel slug 301:as till rätt.
 */
export function threadPath(categorySlug: string, id: number, slug: string): string {
  return `/forum/${categorySlug}/${id}-${slug}`;
}

/** Plocka ut id ur "482-hur-loser-man-kva". Returnerar null om det inte finns. */
export function parseThreadParam(param: string): { id: number; slug: string } | null {
  const m = /^(\d+)(?:-(.*))?$/.exec(param);
  if (!m) return null;
  const id = Number(m[1]);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return { id, slug: m[2] ?? "" };
}

/** Sidnummer ur ?sida= — alltid minst 1. */
export function parsePage(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), 10000);
}

export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

/** Vilken sida ett inlägg hamnar på, givet dess nollbaserade index i tråden. */
export function pageForIndex(index: number, perPage = POSTS_PER_PAGE): number {
  return Math.floor(index / perPage) + 1;
}

/* ------------------------------------------------------------------ *
 * Text
 * ------------------------------------------------------------------ */

/**
 * Rå inläggstext → en rad ren text. Används till meta-beskrivningar och
 * trådlistans förhandsvisning, där markdown-tecken bara är brus.
 */
export function stripMarkup(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^\s*>+\s?/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Förkortat utdrag som bryts på ordgräns. */
export function excerpt(body: string, max = 155): string {
  const text = stripMarkup(body);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/** Bygg citatblocket som klistras in i skrivrutan när man citerar ett inlägg. */
export function buildQuote(author: string, body: string): string {
  const quoted = stripMarkup(body).slice(0, 600);
  return `> **${displayAuthor(author)}:** ${quoted}${quoted.length >= 600 ? "…" : ""}\n\n`;
}

/* ------------------------------------------------------------------ *
 * Fel från databasen → svensk text
 * ------------------------------------------------------------------ */

const ERROR_MESSAGES: Record<string, string> = {
  FORUM_NOT_ALLOWED: "Du behöver ett bekräftat konto för att skriva i forumet.",
  FORUM_NO_CATEGORY: "Kategorin finns inte.",
  FORUM_NO_THREAD: "Tråden finns inte längre.",
  FORUM_NO_POST: "Inlägget finns inte längre.",
  FORUM_NOT_OWNER: "Du kan bara redigera dina egna inlägg.",
  FORUM_LOCKED: "Tråden är låst och går inte att svara i.",
  FORUM_EDIT_WINDOW: `Redigeringsfönstret på ${EDIT_WINDOW_MINUTES} minuter har gått ut.`,
  FORUM_RATE_THREADS: "Du har startat många trådar den senaste timmen — vänta en stund.",
  FORUM_RATE_POSTS: "Du har skrivit många inlägg den senaste timmen — vänta en stund.",
  FORUM_RATE_EDITS: "Du har redigerat väldigt mycket den senaste timmen — vänta en stund.",
  FORUM_RATE_NEWUSER: "Nya konton får skriva ett inlägg varannan minut. Vänta lite.",
  FORUM_RATE_REPORTS: "Du har rapporterat många inlägg — vänta en stund.",
  FORUM_ANSWER_IS_QUESTION: "Frågan kan inte vara sitt eget bästa svar.",
};

/**
 * Plocka ut vår felkod ur ett Postgres-fel och översätt. Okända fel blir
 * generiska: databastext ska aldrig nå klienten.
 */
export function forumErrorMessage(raw: string | null | undefined): string {
  const code = Object.keys(ERROR_MESSAGES).find((k) => (raw ?? "").includes(k));
  return code ? ERROR_MESSAGES[code] : "Något gick fel — försök igen om en stund.";
}

/** Varför en inloggad användare inte får skriva (från forum_post_block_reason). */
export type BlockReason =
  | "konto"
  | "gast"
  | "ej_bekraftad"
  | "for_nytt"
  | "anvandarnamn"
  | "avstangd";

export function blockReasonMessage(reason: BlockReason | null): string | null {
  switch (reason) {
    case null:
      return null;
    case "gast":
    case "konto":
      return "Skapa ett konto för att skriva — det tar 20 sekunder och du behåller din statistik.";
    case "ej_bekraftad":
      return "Bekräfta din mejladress för att kunna skriva i forumet. Kolla inkorgen (och skräpposten).";
    case "for_nytt":
      return "Ditt konto är alldeles nyss skapat. Vänta tio minuter, så öppnas skrivrutan.";
    case "anvandarnamn":
      return "Välj ett användarnamn innan du skriver i forumet.";
    case "avstangd":
      return "Ditt konto är avstängt från forumet.";
    default:
      return "Du kan inte skriva i forumet just nu.";
  }
}

/** "2026vt" → "VT 2026" */
export function provTermLabel(term: string): string {
  const m = /^(\d{4})(vt|ht)$/.exec(term);
  if (!m) return term;
  return `${m[2].toUpperCase()} ${m[1]}`;
}

export const REPORT_REASONS = [
  { value: "spam", label: "Spam eller reklam" },
  { value: "trakasseri", label: "Trakasseri eller påhopp" },
  { value: "olagligt", label: "Olagligt innehåll" },
  { value: "upphovsratt", label: "Upphovsrättsintrång (t.ex. inklistrad provtext)" },
  { value: "annat", label: "Annat" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];
