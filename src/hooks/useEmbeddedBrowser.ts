import { useEffect, useState } from "react";
import { isEmbeddedBrowser } from "@/lib/in-app-browser";

/**
 * true i en apps inbyggda webbläsare (Instagram, TikTok …), där Google
 * vägrar logga in. Läses efter monteringen: servern vet inte vilken
 * webbläsare det är, och SSR:en ska rendera samma sak för alla.
 */
export function useEmbeddedBrowser(): boolean {
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    setEmbedded(isEmbeddedBrowser(navigator.userAgent));
  }, []);
  return embedded;
}
