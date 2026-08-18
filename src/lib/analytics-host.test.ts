import { afterEach, describe, expect, it, vi } from "vitest";

import {
  POSTHOG_ASSETS_HOST,
  POSTHOG_DEFAULT_HOST,
  posthogCspOrigins,
  posthogHost,
} from "./analytics-host";

/**
 * Poängen med hela modulen: klientens `api_host` och Workerns CSP läser samma
 * värde. Testerna pinnar att en egen proxyvärd verkligen når CSP:n — annars
 * blockerar webbläsaren varje händelse och ingenting syns någonstans.
 */

const PROXY = "https://lund.tvakommanollan.se";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("posthogHost", () => {
  it("faller tillbaka på PostHogs EU-ingång när inget är satt", () => {
    vi.stubEnv("VITE_PUBLIC_POSTHOG_HOST", "");
    expect(posthogHost()).toBe(POSTHOG_DEFAULT_HOST);
  });

  it("tar bort avslutande snedstreck — posthog-js lägger på sina egna sökvägar", () => {
    vi.stubEnv("VITE_PUBLIC_POSTHOG_HOST", `${PROXY}/`);
    expect(posthogHost()).toBe(PROXY);
  });
});

describe("posthogCspOrigins", () => {
  it("släpper igenom proxyn i både script-src och connect-src", () => {
    const { script, connect } = posthogCspOrigins(PROXY);
    expect(script).toContain(PROXY);
    expect(connect).toContain(PROXY);
    // PostHogs egna värdar står kvar, så en halvvägs utrullning inte släcker
    // analysen.
    expect(script).toContain(POSTHOG_ASSETS_HOST);
    expect(connect).toContain(POSTHOG_DEFAULT_HOST);
  });

  it("upprepar inte värden när ingen proxy används", () => {
    const { script, connect } = posthogCspOrigins(POSTHOG_DEFAULT_HOST);
    expect(script).toEqual([POSTHOG_ASSETS_HOST]);
    expect(connect).toEqual([POSTHOG_DEFAULT_HOST, POSTHOG_ASSETS_HOST]);
  });
});
