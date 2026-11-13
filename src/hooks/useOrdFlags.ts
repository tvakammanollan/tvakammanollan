import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_FLAGS,
  FLAG_ENABLED_KEY,
  FLAG_STORAGE_KEY,
  parseOrdFlags,
  type OrdFlags,
} from "@/lib/ord-flags";

const EVENT = "tkn:ord-flags-changed";

function read(): { enabled: boolean; state: OrdFlags } {
  try {
    return {
      enabled: localStorage.getItem(FLAG_ENABLED_KEY) === "1",
      state: parseOrdFlags(localStorage.getItem(FLAG_STORAGE_KEY)),
    };
  } catch {
    return { enabled: false, state: EMPTY_FLAGS };
  }
}

/**
 * Besökarens ordflaggor. Av och tomt fram till första effekten, av samma skäl
 * som `useProvResults`: servern vet inte vad som ligger i lagringen.
 */
export function useOrdFlags() {
  const [enabled, setEnabledState] = useState(false);
  const [state, setState] = useState<OrdFlags>(EMPTY_FLAGS);

  useEffect(() => {
    const sync = () => {
      const r = read();
      setEnabledState(r.enabled);
      setState(r.state);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try {
      localStorage.setItem(FLAG_ENABLED_KEY, v ? "1" : "0");
    } catch {
      /* lagringen kan vara blockerad */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  /** Tar en ren funktion (toggleFlag, renameFlag) och sparar resultatet. */
  const update = useCallback((fn: (s: OrdFlags) => OrdFlags) => {
    const next = fn(read().state);
    setState(next);
    try {
      localStorage.setItem(FLAG_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* se ovan */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { enabled, setEnabled, state, update };
}
