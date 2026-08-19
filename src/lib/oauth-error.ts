// Fel från OAuth-returen. Ren modul utan beroenden — hooken som visar toasten
// ligger i src/hooks/useOAuthErrorToast.ts.
//
// Supabase lägger felet i URL:ens fragment vid implicit flow
// (`#error=access_denied&error_code=...&error_description=...`) och i query
// vid pkce. Vi läser båda: användaren ska få ett meddelande oavsett vilken
// väg felet kom, och utan det ser ett avbrutet Google-flöde ut som att
// knappen inte gör någonting.

export interface OAuthReturnError {
  /** `error_code` om Supabase skickade ett, annars `error`. */
  code: string;
  /** Färdig svensk mening att visa för användaren. */
  message: string;
  /** Råtexten från Supabase. Hör hemma i konsolen, inte i en toast. */
  description: string | null;
}

const ERROR_PARAMS = ["error", "error_code", "error_description"] as const;

/**
 * Plockar ut ett OAuth-fel ur en full URL. Returnerar null när det inte finns
 * något fel — då ska ingenting visas och URL:en lämnas orörd (den lyckade
 * returen städas av auth-js `detectSessionInUrl`).
 */
export function parseOAuthError(href: string): OAuthReturnError | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  // Fragmentet är `#key=value&...`, samma format som en query utan `?`.
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const query = url.searchParams;
  const pick = (key: string) => hash.get(key) ?? query.get(key);

  const error = pick("error");
  if (!error) return null;

  const code = pick("error_code") ?? error;
  const description = pick("error_description");
  return { code, message: messageFor(code, description), description };
}

function messageFor(code: string, description: string | null): string {
  // Avbrutet flöde är inget fel att skylla på sajten — säg det rakt ut i
  // stället för att eka Googles engelska "The user denied the request".
  if (code === "access_denied") return "Du avbröt Google-inloggningen.";
  if (code === "validation_failed" || code === "provider_disabled")
    return "Google-inloggning är inte påslagen för det här kontot ännu.";

  const text = (description ?? "").trim();

  // Token-utbytet mellan Supabase och Google föll. Supabase klistrar in
  // Googles råa auktoriseringskod i meddelandet ("Unable to exchange external
  // code: 4/0A…"), vilket är obegripligt för en besökare och dessutom inget
  // som hör hemma på skärmen. Orsaken är i praktiken alltid fel client secret
  // i Supabase — ett driftfel, inget användaren kan åtgärda.
  if (/unable to exchange external code/i.test(text))
    return "Google-inloggningen kunde inte slutföras. Försök igen om en stund.";

  return text.length > 0 ? text : "Något gick snett med Google-inloggningen.";
}

/**
 * Samma URL med felparametrarna borttagna, så att en omladdning eller en
 * delad länk inte visar toasten igen. Övriga parametrar lämnas i fred.
 */
export function stripOAuthError(href: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }

  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  for (const key of ERROR_PARAMS) {
    url.searchParams.delete(key);
    hash.delete(key);
  }

  const rest = hash.toString();
  url.hash = rest.length > 0 ? `#${rest}` : "";
  return url.toString();
}
