import { useCallback, useEffect, useState } from "react";

/**
 * Om sannolikheten att ett ord står på nästa prov ska visas. Per besökare,
 * i localStorage. Förvalet är "visa", och första renderingen är alltid det:
 * sidorna serverrenderas och servern vet inte vad besökaren valt, så läser vi
 * lagringen redan där blir det en hydreringsmiss.
 */
export const SHOW_CHANCE_KEY = "tkn:ord-visa-chans";

export function useShowChance(): [boolean, (v: boolean) => void] {
  const [show, setShow] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(SHOW_CHANCE_KEY) === "0") setShow(false);
    } catch {
      /* lagringen kan vara blockerad */
    }
    const onChange = () => {
      try {
        setShow(localStorage.getItem(SHOW_CHANCE_KEY) !== "0");
      } catch {
        /* se ovan */
      }
    };
    window.addEventListener("tkn:chance-changed", onChange);
    return () => window.removeEventListener("tkn:chance-changed", onChange);
  }, []);
  const set = useCallback((v: boolean) => {
    setShow(v);
    try {
      localStorage.setItem(SHOW_CHANCE_KEY, v ? "1" : "0");
    } catch {
      /* se ovan */
    }
    window.dispatchEvent(new Event("tkn:chance-changed"));
  }, []);
  return [show, set];
}
