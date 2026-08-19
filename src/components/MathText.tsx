import { useMemo } from "react";
import katex from "katex";

/**
 * Renderar text som kan innehålla LaTeX avgränsad med $…$ (inline) eller
 * $$…$$ (display). Text utan avgränsare lämnas som den är.
 *
 * Komponenten gissar medvetet inte. Den hade tidigare ett `autoDetect`-läge som
 * svepte in ett helt stycke i KaTeX när över hälften av tecknen "såg
 * matematiska ut" — en heuristik som slog olika på svarskortet (utan flaggan)
 * och på resultatsidan (med), så samma uppgift renderades på två sätt. Är
 * matematiken inte utmärkt i datan hör den inte hemma här.
 */
export function MathText({ children, className }: { children: string; className?: string }) {
  const html = useMemo(() => renderMixed(children ?? ""), [children]);
  return (
    <span
      className={className}
      // KaTeX ger sanerad HTML, och indata kommer ur vår egen databas.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderTex(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      output: "html",
    });
  } catch {
    return escapeHtml(displayMode ? `$$${tex}$$` : `$${tex}$`);
  }
}

function renderMixed(input: string): string {
  if (!input) return "";

  const parts: Array<{ type: "text" | "inline" | "display"; value: string }> = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: input.slice(last, m.index) });
    if (m[1] != null) parts.push({ type: "display", value: m[1] });
    else parts.push({ type: "inline", value: m[2] });
    last = re.lastIndex;
  }
  if (last < input.length) parts.push({ type: "text", value: input.slice(last) });

  return parts
    .map((p) => {
      if (p.type === "inline") return renderTex(p.value, false);
      if (p.type === "display") return renderTex(p.value, true);
      return escapeHtml(p.value);
    })
    .join("");
}
