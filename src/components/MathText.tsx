import { useMemo } from "react";
import katex from "katex";

/**
 * Renders text that may contain LaTeX delimited by $...$ (inline) or $$...$$ (display).
 * Falls back to plain text when no math is detected.
 *
 * Also auto-detects common bare-math patterns in math questions where the source
 * data has no $ delimiters (e.g. "x^2 - 2x - 15", "(x+3)(x-5)", "x²", "1/2").
 */
export function MathText({
  children,
  autoDetect = false,
  className,
}: {
  children: string;
  /** When true, wrap obvious math fragments in inline math even without $ delimiters. */
  autoDetect?: boolean;
  className?: string;
}) {
  const html = useMemo(() => renderMixed(children ?? "", autoDetect), [children, autoDetect]);
  return (
    <span
      className={className}
      // KaTeX outputs sanitized HTML; input comes from our own DB.
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

/**
 * Convert common ASCII-math conventions found in HP questions to LaTeX.
 * Examples:
 *   x2 → x^2     (superscripts written without ^)
 *   x²  → x^2
 *   3*5 → 3 \cdot 5
 *   sqrt(...) → \sqrt{...}
 */
function asciiToLatex(s: string): string {
  return s
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/([a-zA-Z\)])(\\d)(?!\\d)/g, "$1^{$2}")
    .replace(/\bsqrt\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/\*/g, "\\cdot ");
}

/**
 * Heuristic: looks like math expression if it contains math operators/letters
 * combined with numbers and isn't just plain prose.
 */
function looksLikeMath(s: string): boolean {
  // contains at least one of: variable+number, ^, /, =, *, sqrt, parenthesis with operator
  return (
    /[a-zA-Z]\d/.test(s) ||
    /[²³]/.test(s) ||
    /\^/.test(s) ||
    /\bsqrt\(/.test(s) ||
    /\d\s*[+\-·×÷*/=]\s*\d/.test(s) ||
    /\([^)]*[+\-*/^][^)]*\)/.test(s)
  );
}

function renderMixed(input: string, autoDetect: boolean): string {
  if (!input) return "";

  // 1. Split on $$...$$ and $...$ first.
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
      // text — optionally auto-detect bare math
      if (autoDetect && looksLikeMath(p.value)) {
        // Try to wrap the whole chunk as inline math if it looks math-heavy
        // but keep prose as text. Simple approach: if >=60% of non-space chars are math-like, wrap.
        const compact = p.value.replace(/\s+/g, "");
        const mathChars = (compact.match(/[0-9+\-*/^()=²³xyzXYZabc·]/g) || []).length;
        if (compact.length > 0 && mathChars / compact.length > 0.5) {
          return renderTex(asciiToLatex(p.value.trim()), false);
        }
      }
      return escapeHtml(p.value);
    })
    .join("");
}
