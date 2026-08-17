/**
 * En liten, medvetet begränsad markdown-delmängd för foruminlägg.
 *
 * Parsern producerar ett träd av noder som `<ForumBody>` renderar till
 * React-element. Användarinnehåll går ALDRIG genom dangerouslySetInnerHTML —
 * det är hela poängen med att parsa själv i stället för att dra in en
 * HTML-producerande markdown-motor.
 *
 * Stöd: **fet**, *kursiv*, `kod`, ```kodblock```, > citat, punkt- och
 * nummerlistor, $matte$ (KaTeX) och autolänkade URL:er.
 *
 * Matte är inte valfritt här: halva forumet kommer handla om KVA och XYZ, och
 * ett HP-forum där man inte kan skriva ett bråk är inte användbart.
 */

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold"; children: Inline[] }
  | { kind: "italic"; children: Inline[] }
  | { kind: "code"; text: string }
  | { kind: "math"; text: string }
  | { kind: "link"; href: string; text: string };

export type Block =
  | { kind: "paragraph"; children: Inline[] }
  | { kind: "quote"; children: Block[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "code"; text: string };

/* ------------------------------------------------------------------ *
 * Inline
 * ------------------------------------------------------------------ */

// Ordningen betyder allt: kod och matte först (deras innehåll är literalt),
// därefter *** före ** före *, och autolänkar sist.
//
// Fetstilens innehåll är "tecken som inte är stjärna, eller en ensam stjärna" —
// inte `.+?`. Med lazy matchning äter `**fet *och kursiv* slut**` bara fram till
// den första `**`, och den inre kursiven blir kvar som råa stjärnor.
const INLINE_RE =
  /(`[^`\n]+`)|(\$[^$\n]{1,200}\$)|(\*\*\*[^*\n]+\*\*\*)|(\*\*(?:[^*\n]|\*(?!\*))+\*\*)|(\*[^*\n]+\*)|((?:https?:\/\/|www\.)[^\s<>[\]()]+)/g;

/** Skiljetecken som nästan alltid hör till meningen, inte till URL:en. */
function trimUrlTail(url: string): { url: string; tail: string } {
  const m = /[.,;:!?»"']+$/.exec(url);
  if (!m) return { url, tail: "" };
  return { url: url.slice(0, m.index), tail: m[0] };
}

function pushText(out: Inline[], text: string) {
  if (!text) return;
  const last = out[out.length - 1];
  if (last && last.kind === "text") last.text += text;
  else out.push({ kind: "text", text });
}

export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;

  // matchAll klonar regexen. Det är inte en detalj: parseInline anropar sig
  // själv för innehållet i **fet**, och med exec() på ett delat /g-objekt
  // nollställer det inre anropet lastIndex — den yttre loopen börjar då om
  // från noll och snurrar tills minnet tar slut.
  for (const m of source.matchAll(INLINE_RE)) {
    pushText(out, source.slice(last, m.index));
    last = m.index + m[0].length;

    if (m[1]) {
      out.push({ kind: "code", text: m[1].slice(1, -1) });
    } else if (m[2]) {
      const text = m[2].slice(1, -1).trim();
      if (text) out.push({ kind: "math", text });
      else pushText(out, m[2]);
    } else if (m[3]) {
      // ***både och*** — vanligt nog att förtjäna ett eget fall.
      out.push({
        kind: "bold",
        children: [{ kind: "italic", children: parseInline(m[3].slice(3, -3)) }],
      });
    } else if (m[4]) {
      out.push({ kind: "bold", children: parseInline(m[4].slice(2, -2)) });
    } else if (m[5]) {
      out.push({ kind: "italic", children: parseInline(m[5].slice(1, -1)) });
    } else if (m[6]) {
      const { url, tail } = trimUrlTail(m[6]);
      if (url) {
        out.push({
          kind: "link",
          href: url.startsWith("www.") ? `https://${url}` : url,
          text: url,
        });
      }
      pushText(out, tail);
    }
  }

  pushText(out, source.slice(last));
  return out;
}

/* ------------------------------------------------------------------ *
 * Block
 * ------------------------------------------------------------------ */

const FENCE = /^\s*```/;
const QUOTE = /^\s*>\s?(.*)$/;
const BULLET = /^\s*[-*]\s+(.+)$/;
const ORDERED = /^\s*\d{1,3}[.)]\s+(.+)$/;

/** Djupare nästling än så här är alltid en citatkedja som ingen orkar läsa. */
const MAX_QUOTE_DEPTH = 3;

export function parseBlocks(source: string, depth = 0): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const flushParagraph = (buf: string[]) => {
    const text = buf.join("\n").trim();
    if (text) blocks.push({ kind: "paragraph", children: parseInline(text) });
    buf.length = 0;
  };

  const paragraph: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    // Kodblock — innehållet lämnas orört.
    if (FENCE.test(line)) {
      flushParagraph(paragraph);
      const body: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      i++; // hoppa över den avslutande fencen (saknas den tar vi resten)
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }

    // Citat — samla ihop hela blocket och parsa innehållet rekursivt.
    if (QUOTE.test(line)) {
      flushParagraph(paragraph);
      const inner: string[] = [];
      while (i < lines.length) {
        const q = QUOTE.exec(lines[i]);
        if (!q) break;
        inner.push(q[1]);
        i++;
      }
      const children =
        depth + 1 >= MAX_QUOTE_DEPTH
          ? [{ kind: "paragraph" as const, children: parseInline(inner.join(" ")) }]
          : parseBlocks(inner.join("\n"), depth + 1);
      blocks.push({ kind: "quote", children });
      continue;
    }

    // Listor.
    const bullet = BULLET.exec(line);
    const ordered = !bullet ? ORDERED.exec(line) : null;
    if (bullet || ordered) {
      flushParagraph(paragraph);
      const isOrdered = !!ordered;
      const items: Inline[][] = [];
      while (i < lines.length) {
        const b = isOrdered ? ORDERED.exec(lines[i]) : BULLET.exec(lines[i]);
        if (!b) break;
        items.push(parseInline(b[1]));
        i++;
      }
      blocks.push({ kind: "list", ordered: isOrdered, items });
      continue;
    }

    if (line.trim() === "") {
      flushParagraph(paragraph);
      i++;
      continue;
    }

    paragraph.push(line);
    i++;
  }

  flushParagraph(paragraph);
  return blocks;
}

/** Innehåller texten matte? Avgör om KaTeX-chunken behöver laddas alls. */
export function hasMath(source: string): boolean {
  return /\$[^$\n]{1,200}\$/.test(source);
}
