import { describe, it, expect } from "vitest";
import { parseOAuthError, stripOAuthError } from "./oauth-error";

const BASE = "https://hpkampen.se/onboarding";

describe("parseOAuthError", () => {
  it("läser felet ur fragmentet (implicit flow)", () => {
    const err = parseOAuthError(
      `${BASE}#error=access_denied&error_code=access_denied&error_description=The+user+denied+the+request`,
    );
    expect(err?.code).toBe("access_denied");
    expect(err?.message).toBe("Du avbröt Google-inloggningen.");
  });

  it("läser felet ur query (pkce)", () => {
    const err = parseOAuthError(`${BASE}?error=server_error&error_description=Boom`);
    expect(err?.code).toBe("server_error");
    expect(err?.message).toBe("Boom");
  });

  it("säger till när providern är avslagen", () => {
    const err = parseOAuthError(`${BASE}#error=invalid_request&error_code=validation_failed`);
    expect(err?.message).toBe("Google-inloggning är inte påslagen för det här kontot ännu.");
  });

  it("faller tillbaka på en svensk mening när beskrivningen saknas", () => {
    expect(parseOAuthError(`${BASE}#error=server_error`)?.message).toBe(
      "Något gick snett med Google-inloggningen.",
    );
  });

  it("rör inte den lyckade returen", () => {
    // Fragmentet auth-js själv plockar upp — inget fel, ingen toast.
    expect(
      parseOAuthError(`${BASE}#access_token=abc&token_type=bearer&expires_in=3600`),
    ).toBeNull();
    expect(parseOAuthError(BASE)).toBeNull();
    expect(parseOAuthError("inte-en-url")).toBeNull();
  });
});

describe("stripOAuthError", () => {
  it("tar bort felparametrarna och lämnar resten", () => {
    expect(stripOAuthError(`${BASE}?ref=mail&error=access_denied&error_description=nope`)).toBe(
      `${BASE}?ref=mail`,
    );
  });

  it("tömmer fragmentet helt när bara felet låg där", () => {
    expect(stripOAuthError(`${BASE}#error=access_denied&error_code=access_denied`)).toBe(BASE);
  });
});
