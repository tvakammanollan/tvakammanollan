import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Custom fetcher used by TanStack server function client RPC.
// Injects the Supabase access token so requireSupabaseAuth middleware sees it.
const serverFnFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  if (typeof window !== "undefined" && !headers.has("authorization")) {
    try {
      const { supabase } = await import("./integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) headers.set("authorization", `Bearer ${token}`);
    } catch {
      // ignore
    }
  }
  return fetch(input, { ...init, headers });
};

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
  serverFns: {
    fetch: serverFnFetch,
  },
}));
