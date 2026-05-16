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
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
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
  // CSP — permissive enough for our font + supabase + lovable analytics, strict elsewhere.
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.lovable.app https://*.r2.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
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
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  headers.set("X-Frame-Options", "DENY");

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
  const url =
    (env as Record<string, unknown>)?.VITE_SUPABASE_URL as string | undefined;
  let supabaseStatus: "ok" | "fail" | "unknown" = "unknown";
  if (url) {
    try {
      const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/health_check?select=status`, {
        headers: {
          apikey: ((env as Record<string, unknown>)?.SUPABASE_ANON_KEY as string) ?? "",
        },
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
  };
  return new Response(JSON.stringify(body), {
    status: supabaseStatus === "fail" ? 503 : 200,
    headers: { "content-type": "application/json" },
  });
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
      // eslint-disable-next-line no-console
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
