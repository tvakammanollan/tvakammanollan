import { Component, type ReactNode } from "react";
import { trackError } from "@/lib/telemetry";

/**
 * Liten felgräns: om ett icke-kritiskt widget kraschar i render ska det
 * INTE ta ner hela sidan (t.ex. navbaren → "Något gick snett" på alla sidor).
 * Renderar `fallback` (default: ingenting) istället och loggar felet.
 */
export class SafeBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; label?: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    try {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        boundary: this.props.label ?? "unknown",
      });
    } catch {
      /* aldrig låta loggning kasta vidare */
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
