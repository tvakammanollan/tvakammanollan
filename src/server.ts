import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

/**
 * Security headers — added to every HTML response.
 * #20 — CSP, X-Content-Type-Options, Permissions-Policy.
 */
function withSecurityHeaders(response: Response): Response {
  const ct = response.headers.get("content-type") ?? "";
  // Only stamp HTML responses; static asset responses keep their own headers.
  if (!ct.includes("text/html")) return response;

  const headers = new Headers(response.headers);
  // CSP — supabase + lovable analytics tillåts, strikt i övrigt.
  // (Google Fonts-posterna borttagna 2026-07 — fonterna laddas inte längre.)
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.lovable.app https://*.r2.dev",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lovable.app",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ].join("; "),
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  headers.set("X-Frame-Options", "DENY");
  // HSTS — sajten är alltid HTTPS bakom Cloudflare; tvinga det i webbläsaren.
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Health endpoint (#18) — bypasses SSR, hits Supabase via HTTP.
 * Cheap pingback for uptime monitoring.
 */
async function healthCheck(env: unknown): Promise<Response> {
  // Minimal: report ok + timestamp + worker uptime hint.
  // Detailed DB probe requires Supabase credentials; do that server-side.
  //
  // Läs i första hand från process.env: nitro wrappar workern och skickar inte
  // vidare `env`-argumentet, så bindings landar bara i process.env. Att läsa
  // enbart `env` gjorde att sonden alltid svarade "unknown".
  const bindings = (env ?? {}) as Record<string, unknown>;
  const procEnv =
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const url = (procEnv.SUPABASE_URL ??
    procEnv.VITE_SUPABASE_URL ??
    bindings.SUPABASE_URL ??
    bindings.VITE_SUPABASE_URL) as string | undefined;
  const anonKey = (procEnv.SUPABASE_ANON_KEY ??
    procEnv.SUPABASE_PUBLISHABLE_KEY ??
    bindings.SUPABASE_ANON_KEY ??
    bindings.SUPABASE_PUBLISHABLE_KEY) as string | undefined;
  let supabaseStatus: "ok" | "fail" | "unknown" = "unknown";
  if (url) {
    try {
      const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/health_check?select=status`, {
        headers: { apikey: anonKey ?? "" },
        signal: AbortSignal.timeout(2000),
      });
      supabaseStatus = r.ok ? "ok" : "fail";
    } catch {
      supabaseStatus = "fail";
    }
  }
  const body = {
    status: supabaseStatus === "fail" ? "degraded" : "ok",
    supabase: supabaseStatus,
    checked_at: new Date().toISOString(),
    // Service role-nyckeln är det som gör att server functions kan läsa DB:t;
    // saknas den svarar sajten men all inloggad data blir tom. Rapportera bara
    // närvaro (aldrig värdet) så uptime-koll fångar felet direkt.
    service_role: Boolean(procEnv.SUPABASE_SERVICE_ROLE_KEY),
  };
  return new Response(JSON.stringify(body), {
    status: supabaseStatus === "fail" ? 503 : 200,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Fetches a definition from Swedish Wiktionary for a single word.
 * Uses the MediaWiki API (JSON, no JS rendering needed).
 */
async function fetchWiktionaryDefinition(word: string): Promise<string | null> {
  const url = `https://sv.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(word)}&prop=revisions&rvprop=content&format=json&formatversion=2`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "HPKampen-Bot/1.0 (educational project; hpkampen.se)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: { pages?: Array<{ missing?: boolean; revisions?: Array<{ content: string }> }> };
    };
    const page = data?.query?.pages?.[0];
    if (!page || page.missing) return null;
    const content = page.revisions?.[0]?.content ?? "";

    // Find the first definition line (starts with # but not #: or ##)
    const defMatch = content.match(/^#[^#:*].*$/m);
    if (!defMatch) return null;

    const raw = defMatch[0].replace(/^#\s*/, "");
    const clean = raw
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1") // [[länk|text]] → text
      .replace(/\{\{[^}]*\}\}/g, "") // ta bort {{mallar}}
      .replace(/'''?([^']+)'''?/g, "$1") // ta bort fet/kursiv
      .replace(/;$/, "")
      .trim();

    return clean.length > 5 ? clean : null;
  } catch {
    return null;
  }
}

/**
 * Admin endpoint — hämtar Wiktionary-definitioner för ORD-frågor och sparar i DB.
 * Skyddas av ADMIN_SECRET-miljövariabeln.
 * Anrop: GET /api/admin/fill-definitions?secret=TOKEN&batch=0&size=30
 */
async function fillDefinitions(request: Request, env: unknown): Promise<Response> {
  const e = env as Record<string, string | undefined>;
  const secret = e.hpadmin2026;
  const params = new URL(request.url).searchParams;

  if (!secret || params.get("secret") !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const supabaseUrl = (e.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  const serviceKey = e.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "missing supabase credentials" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const batch = parseInt(params.get("batch") ?? "0", 10);
  const size = Math.min(parseInt(params.get("size") ?? "30", 10), 50);
  const offset = batch * size;

  // Hämta nästa batch ORD-frågor utan definition
  const listRes = await fetch(
    `${supabaseUrl}/rest/v1/questions?select=id,question_text&category=eq.ORD&definition=is.null&order=question_text&limit=${size}&offset=${offset}`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  const questions = (await listRes.json()) as Array<{ id: string; question_text: string }>;

  if (!Array.isArray(questions) || questions.length === 0) {
    return new Response(JSON.stringify({ done: true, message: "Alla ord har definitioner!" }), {
      headers: { "content-type": "application/json" },
    });
  }

  const results: Array<{ word: string; found: boolean }> = [];

  for (const q of questions) {
    const word = q.question_text.trim().toLowerCase();
    const definition = await fetchWiktionaryDefinition(word);

    if (definition) {
      await fetch(`${supabaseUrl}/rest/v1/questions?id=eq.${q.id}`, {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ definition, definition_source: "sv.wiktionary.org" }),
      });
    }

    results.push({ word, found: !!definition });
    // Kort paus för att inte hamra Wiktionary
    await new Promise((r) => setTimeout(r, 300));
  }

  const found = results.filter((r) => r.found).length;
  return new Response(
    JSON.stringify({
      batch,
      processed: questions.length,
      found,
      missed: questions.length - found,
      next: `?secret=${params.get("secret")}&batch=${batch + 1}&size=${size}`,
      results,
    }),
    { headers: { "content-type": "application/json" } },
  );
}

/**
 * Telemetry sink (#16) — accepts batched events from the browser and emits
 * them as structured Worker logs. Cloudflare Logpush picks them up.
 */
async function telemetrySink(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const data = (await request.json()) as { events?: Array<Record<string, unknown>> };
    const events = Array.isArray(data?.events) ? data.events.slice(0, 50) : [];
    for (const e of events) {
      console.log(JSON.stringify({ ...e, source: "browser" }));
    }
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/api/health") {
      return healthCheck(env);
    }
    // Telemetry batch sink
    if (url.pathname === "/api/telemetry") {
      return telemetrySink(request);
    }
    // Admin: fyll ORD-definitioner från Wiktionary
    if (url.pathname === "/api/admin/fill-definitions") {
      return fillDefinitions(request, env);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return withSecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(brandedErrorResponse());
    }
  },
};
