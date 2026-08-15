/**
 * Lightweight error & event telemetry.
 *
 * - In browser: forwards to /api/telemetry (Cloudflare Worker proxy) and console.
 * - In Worker: prints structured JSON which Cloudflare Logpush can stream to
 *   Sentry / Datadog / R2.
 *
 * Keep payload <2 kB; do NOT include PII (no emails, full DB rows).
 */

export interface TelemetryEvent {
  type: "error" | "warn" | "metric";
  message: string;
  context?: Record<string, unknown>;
  /** Best-effort user id — never email or username. */
  userId?: string;
  ts?: string;
}

const isBrowser = typeof window !== "undefined";

let pending: TelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    void flush();
  }, 2000);
}

async function flush() {
  flushTimer = null;
  if (pending.length === 0) return;
  const batch = pending;
  pending = [];
  if (!isBrowser) {
    // Worker: just emit structured logs
    for (const e of batch) {
      console.log(JSON.stringify({ ...e, ts: e.ts ?? new Date().toISOString() }));
    }
    return;
  }
  try {
    // Use sendBeacon if available — survives navigation
    const body = JSON.stringify({ events: batch });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/telemetry", blob);
      if (ok) return;
    }
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* swallow — never break user flow over telemetry */
  }
}

/**
 * Vidare till PostHog också.
 *
 * `track()` ligger redan utplacerad i flödena, så den här bryggan gör att både
 * nuvarande och framtida metrics dyker upp i PostHog utan att någon behöver
 * komma ihåg att lägga till ett andra anrop bredvid.
 *
 * - Bara `metric` skickas. Fel hör hemma i /api/telemetry, inte i produkt-
 *   analysen — de skulle dränka funnels och kosta events i onödan.
 * - `userId` skickas inte vidare: PostHog vet redan vem användaren är via
 *   identify() i <Analytics />.
 * - captureAnalytics är en no-op utan samtycke, så grinden håller även här.
 * - Importen är dynamisk för att inte dra in analytics.ts (och därmed en
 *   posthog-referens) i moduler som körs i Workern.
 */
function forwardMetricToAnalytics(event: TelemetryEvent) {
  if (!isBrowser || event.type !== "metric") return;
  void import("./analytics")
    .then((m) => m.captureAnalytics(event.message, event.context))
    .catch(() => undefined);
}

export function track(event: TelemetryEvent) {
  pending.push({ ...event, ts: event.ts ?? new Date().toISOString() });
  if (pending.length >= 10) {
    void flush();
  } else {
    scheduleFlush();
  }
  if (event.type === "error") {
    console.error("[telemetry]", event.message, event.context);
  }
  forwardMetricToAnalytics(event);
}

export function trackError(error: unknown, context: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : String(error);
  const stack =
    error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined;
  track({
    type: "error",
    message,
    context: { ...context, stack },
  });
}

/** Install global error listeners on the browser. */
export function installBrowserTelemetry() {
  if (!isBrowser) return;
  window.addEventListener("error", (ev) => {
    trackError(ev.error ?? ev.message, { from: "window.onerror", filename: ev.filename });
  });
  window.addEventListener("unhandledrejection", (ev) => {
    trackError(ev.reason, { from: "unhandledrejection" });
  });
}
