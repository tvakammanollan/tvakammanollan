import { useEffect } from "react";
import { toast } from "sonner";
import { parseOAuthError, stripOAuthError } from "@/lib/oauth-error";

/**
 * Visar ett fel från OAuth-returen och städar bort det ur URL:en.
 *
 * Anropas en gång i RootComponent — vilken route Supabase landar på beror på
 * `redirectTo` och på Site URL i dashboarden, så det finns ingen enskild
 * callback-sida att hänga den på.
 */
export function useOAuthErrorToast() {
  useEffect(() => {
    const err = parseOAuthError(window.location.href);
    if (!err) return;

    // Råtexten försvinner ur URL:en två rader ner, och toasten visar en
    // svensk mening. Utan det här spåret finns felet ingenstans när något
    // faktiskt är trasigt i providerkonfigurationen.
    console.warn(`[oauth] ${err.code}: ${err.description ?? "(ingen beskrivning)"}`);
    toast.error(err.message);
    window.history.replaceState({}, "", stripOAuthError(window.location.href));
  }, []);
}
