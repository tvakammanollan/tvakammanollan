// Patch global fetch (browser) to attach Supabase access token to server function
// requests so requireSupabaseAuth middleware can read the bearer token.
import { supabase } from "./client";

let installed = false;

export function installSupabaseFetchAuth() {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  const origFetch = window.fetch.bind(window);

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string;
    if (typeof input === "string") url = input;
    else if (input instanceof URL) url = input.toString();
    else url = input.url;

    const isServerFn =
      url.includes("/_serverFn/") || url.includes("/_server/");

    if (!isServerFn) return origFetch(input, init);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return origFetch(input, init);

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return origFetch(input, { ...init, headers });
  }) as typeof window.fetch;
}
