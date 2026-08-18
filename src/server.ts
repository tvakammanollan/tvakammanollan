import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { CANONICAL_HOST, canonicalRedirect } from "./lib/canonical-host";
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
  //
  // PostHog (EU) står med här men laddas bara efter samtycke — CSP:n öppnar
  // dörren, consent.ts avgör om någon går igenom den. eu-assets serverar
  // arrayen med inspelningsskriptet, eu.i tar emot händelserna, och
  // session replay komprimerar i en worker som skapas från en blob-URL.
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.lovable.app https://*.r2.dev https://eu-assets.i.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.lovable.app https://eu.i.posthog.com https://eu-assets.i.posthog.com",
      // Calendly-iframen i coachningsmodalen. Bara ramen öppnas — deras
      // widget.js behövs inte, vi lyssnar själva på postMessage, så script-src
      // står kvar orörd.
      "frame-src https://calendly.com",
      "worker-src 'self' blob:",
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
      headers: { "User-Agent": "HPKampen-Bot/1.0 (educational project; tvakommanollan.se)" },
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
 * Stripe-webhook — bokför coachningsköp.
 *
 * Ligger här och inte som route-fil av samma skäl som /api/health: svaret är
 * JSON och behöver ingen React. Dessutom måste signaturen räknas på den råa
 * bodyn, byte för byte — allt som parsar och serialiserar om på vägen förstör
 * den.
 *
 * Webhooken är den som faktiskt bokför köpet. Tacksidan bekräftar också, men
 * bara som reserv: webbläsaren kan stängas i betalögonblicket, webhooken kommer
 * ändå.
 */
async function stripeWebhook(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const procEnv =
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const secret = procEnv.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET saknas — webhooken kan inte verifieras");
    return new Response(JSON.stringify({ error: "not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  const raw = await request.text();
  const { verifyStripeSignature } = await import("./lib/stripe.server");
  const valid = await verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret);
  if (!valid) {
    // 400 och inget mer: en obehörig ska inte få veta om det var tidsstämpeln,
    // hemligheten eller nyttolasten som var fel.
    console.error("[stripe] webhook med ogiltig signatur avvisad");
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let event: { id?: string; type?: string; data?: { object?: unknown } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "invalid payload" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const PAID_EVENTS = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
  ]);

  try {
    if (event.type && PAID_EVENTS.has(event.type)) {
      const { markCoachingPaid, sessionIsPaid, isCoachingSession } =
        await import("./lib/coaching.server");
      const session = event.data?.object as Parameters<typeof markCoachingPaid>[0];
      // completed kommer även för betalsätt som ännu inte gått igenom
      // (fakturor, direktbetalning) — då är payment_status "unpaid" och köpet
      // bokförs först vid async_payment_succeeded. isCoachingSession sållar bort
      // köp i kontot som inte kommer härifrån: endpointen lyssnar brett.
      if (session?.id && isCoachingSession(session) && sessionIsPaid(session)) {
        const result = await markCoachingPaid(session);
        console.log(
          JSON.stringify({
            type: "metric",
            message: "coaching_paid_webhook",
            context: {
              event: event.type,
              newly_paid: result.newlyPaid,
              amount_total: session.amount_total,
              currency: session.currency,
            },
          }),
        );
      }
    }
  } catch (e) {
    // 500 → Stripe försöker igen. Att svara 200 här hade tappat köpet tyst.
    console.error("[stripe] webhook-hantering misslyckades:", e);
    return new Response(JSON.stringify({ error: "handler failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
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
      console.log(JSON.stringify({ ...e, source: "browser" }));
    }
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}

/**
 * Sökvägar med rörliga segment (match-id, provtermin) skulle annars ge en ny
 * rad per besök och spränga tabellen. Mappa dem till sin routemall i stället.
 */
export function normalizePathForStats(pathname: string): string | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  // Bara HTML-sidor är intressanta — inte assets, API eller serverfunktioner.
  if (/\.[a-z0-9]{2,5}$/i.test(p)) return null;
  if (
    p.startsWith("/api/") ||
    p.startsWith("/_serverFn") ||
    p.startsWith("/assets/") ||
    p.startsWith("/.mcp") ||
    p.startsWith("/.well-known")
  ) {
    return null;
  }
  if (p.length > 200) return null;

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const seg = p.split("/");
  const mapped = seg.map((s, i) => {
    if (!s) return s;
    if (uuid.test(s)) return ":id";
    // /join/<rumskod> och /gamla-prov/<termin> har fria men uppräkneliga värden.
    if (i === 2 && (seg[1] === "join" || seg[1] === "match" || seg[1] === "result")) return ":id";
    return s;
  });
  return mapped.join("/") || "/";
}

/*
 * Sidvisningar buffras i isolatet och skrivs sällan.
 *
 * Ett skrivanrop per visning gick inte: nitro skickar inte vidare ctx, så
 * waitUntil saknas, och utan den avbryts pågående I/O i samma stund som svaret
 * returneras — räkningen hann aldrig iväg. Att i stället invänta skrivningen
 * fungerade, men tog TTFB från ~0,10 s till 0,44–0,89 s. Ingen sida ska bli
 * långsammare för att vi vill ha statistik.
 *
 * Nu räknas visningar i minnet (gratis) och töms samlat först när bufferten
 * blivit tillräckligt stor eller gammal. Bara den enstaka begäran som råkar
 * utlösa tömningen betalar väntan.
 *
 * Isolat är kortlivade, så en buffert kan gå förlorad vid nedstängning. För
 * besöksstatistik är det en acceptabel avvikelse — annars hade varje sidladdning
 * behövt betala för exakthet.
 */
const pendingViews = new Map<string, number>();
let lastFlush = Date.now();
const FLUSH_AFTER_MS = 30_000;
const FLUSH_AT_ENTRIES = 20;

async function flushPageViews(): Promise<void> {
  if (pendingViews.size === 0) return;
  const procEnv =
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const url = procEnv.SUPABASE_URL;
  const key = procEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const batch = Object.fromEntries(pendingViews);
  pendingViews.clear();
  lastFlush = Date.now();

  try {
    await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/record_page_views`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p: batch }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    /* statistik är aldrig värd ett trasigt svar */
  }
}

/**
 * Registrerar en sidvisning i bufferten. Aggregerat per dygn och sökväg —
 * ingen IP, ingen användare, ingen cookie, ingen session.
 *
 * Returnerar en promise bara när bufferten ska tömmas, annars null, så att
 * anropssidan vet om något behöver inväntas.
 */
function recordPageView(pathname: string): Promise<void> | null {
  const path = normalizePathForStats(pathname);
  if (!path) return null;
  pendingViews.set(path, (pendingViews.get(path) ?? 0) + 1);

  const due = pendingViews.size >= FLUSH_AT_ENTRIES || Date.now() - lastFlush >= FLUSH_AFTER_MS;
  return due ? flushPageViews() : null;
}

/*
 * Permanenta omdirigeringar för sidor som slagits ihop med andra.
 *
 * Ligger här och inte som route-stubbar därför att en 301 då kan skickas utan
 * att SSR:en startar — och därför att en kvarlämnad route fortsätter dyka upp i
 * routeTree, sitemap-genomgångar och RelatedGuides som om sidan fanns kvar.
 * Nyckeln är sökvägen utan avslutande snedstreck.
 */
const PERMANENT_REDIRECTS: Record<string, string> = {
  "/guider/tips-lasforstaelse": "/guider/las",
  "/guider/normering": "/hogskoleprovet-poang",
};

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    // Före allt annat: sajten får bara indexeras på ett värdnamn, och
    // sammanslagna sidor ska till sin efterträdare. Båda avgörs i samma steg
    // så att en gammal adress till en sammanslagen sida tar ett hopp och inte
    // två — en 301-kedja läcker länkkraft och Google följer bara ett fåtal.
    const mergedPath = PERMANENT_REDIRECTS[url.pathname.replace(/\/+$/, "") || "/"];
    const canonicalHost = canonicalRedirect(url) ? `https://${CANONICAL_HOST}` : "";
    if (mergedPath || canonicalHost) {
      return new Response(null, {
        status: 301,
        headers: { location: canonicalHost + (mergedPath ?? url.pathname) + url.search },
      });
    }

    // Health check
    if (url.pathname === "/api/health") {
      return healthCheck(env);
    }
    // Telemetry batch sink
    if (url.pathname === "/api/telemetry") {
      return telemetrySink(request);
    }
    // Stripe: bokför coachningsköp
    if (url.pathname === "/api/stripe/webhook") {
      return stripeWebhook(request);
    }
    // Admin: fyll ORD-definitioner från Wiktionary
    if (url.pathname === "/api/admin/fill-definitions") {
      return fillDefinitions(request, env);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      // Räkna först när sidan faktiskt levererades — 404 och fel ska inte
      // synas som besök.
      if (request.method === "GET" && normalized.status === 200) {
        const flushing = recordPageView(url.pathname);
        if (flushing) {
          const waitUntil = (ctx as { waitUntil?: (p: Promise<unknown>) => void })?.waitUntil;
          // Finns waitUntil slipper även den här begäran vänta. Saknas den
          // avbryts skrivningen när svaret går iväg, så då inväntas den —
          // vilket gäller ungefär var tjugonde sidladdning.
          if (typeof waitUntil === "function") waitUntil.call(ctx, flushing);
          else await flushing;
        }
      }
      return withSecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(brandedErrorResponse());
    }
  },
};
