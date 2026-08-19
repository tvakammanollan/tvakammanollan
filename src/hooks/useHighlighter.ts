import { useCallback, useEffect, useRef, useState } from "react";
import {
  addRange,
  loadHighlights,
  removeAt,
  saveHighlights,
  type HighlightRange,
  type StorageKind,
} from "@/lib/highlights";

export interface Highlighter {
  /** Är pennan påslagen? När den är av markerar man text som vanligt. */
  active: boolean;
  toggle: () => void;
  ranges: HighlightRange[];
  add: (range: HighlightRange) => void;
  erase: (p: number, offset: number) => void;
  clear: () => void;
  hasAny: boolean;
}

/**
 * Nyckeln som pennans läge sparas under. Slår man på den på uppgift 11 ska den
 * fortfarande vara på när man kommer till uppgift 12 — och när man kommer
 * tillbaka efter en paus. Den låg tidigare bara i komponentens tillstånd, så
 * varje ny sida började med pennan avstängd och den fick letas upp igen.
 */
const PEN_KEY = "hp-highlighter-pen";

function loadPen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(PEN_KEY) === "on";
  } catch {
    return false;
  }
}

/**
 * Överstrykningspennan för en lästext.
 *
 * Pennan är avstängd från början med flit: är den alltid på går det inte att
 * markera text för att kopiera den, och varje gång man drar fingret över
 * skärmen på mobilen blir en rad gul. Man slår på den när man vill stryka.
 *
 * `scope` avgör vad markeringarna hör till (ett prov och en passage, en
 * träningsfråga). Byter scope läses markeringarna för den nya texten in.
 */
export function useHighlighter(scope: string, storage: StorageKind = "session"): Highlighter {
  // Servern har ingen lagring, så första renderingen måste börja avstängd för
  // att klienten ska hydrera likadant. Läget läses in strax efter.
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const [ranges, setRanges] = useState<HighlightRange[]>(() => loadHighlights(scope, storage));

  // Byte av passage: hämta den nya textens markeringar. Servern har ingen
  // lagring, så första klientrenderingen börjar tom och fylls här.
  useEffect(() => {
    setRanges(loadHighlights(scope, storage));
  }, [scope, storage]);

  useEffect(() => {
    saveHighlights(scope, storage, ranges);
  }, [scope, storage, ranges]);

  const add = useCallback((range: HighlightRange) => {
    setRanges((prev) => addRange(prev, range));
  }, []);

  const erase = useCallback((p: number, offset: number) => {
    setRanges((prev) => removeAt(prev, p, offset));
  }, []);

  useEffect(() => {
    const stored = loadPen();
    activeRef.current = stored;
    setActive(stored);
  }, []);

  const clear = useCallback(() => setRanges([]), []);

  const toggle = useCallback(() => {
    const next = !activeRef.current;
    activeRef.current = next;
    setActive(next);
    try {
      window.sessionStorage.setItem(PEN_KEY, next ? "on" : "off");
    } catch {
      /* lagringen kan vara avstängd — pennan ska fungera ändå */
    }
  }, []);

  return { active, toggle, ranges, add, erase, clear, hasAny: ranges.length > 0 };
}
