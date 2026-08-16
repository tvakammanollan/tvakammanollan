import { useCallback, useEffect, useState } from "react";
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
  const [active, setActive] = useState(false);
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

  const clear = useCallback(() => setRanges([]), []);
  const toggle = useCallback(() => setActive((v) => !v), []);

  return { active, toggle, ranges, add, erase, clear, hasAny: ranges.length > 0 };
}
