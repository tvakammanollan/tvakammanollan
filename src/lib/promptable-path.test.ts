import { describe, expect, it } from "vitest";
import { isPromptablePath } from "./promptable-path";

describe("isPromptablePath", () => {
  it("släpper fram bläddring och resultatsidan", () => {
    for (const path of [
      "/",
      "/leaderboard",
      "/guider",
      "/guider/ord",
      "/forum",
      "/stats",
      "/result/abc-123",
      "/gamla-prov",
      "/gamla-prov/2024ht",
      "/ova/xyz",
    ]) {
      expect(isPromptablePath(path), path).toBe(true);
    }
  });

  it("håller sig borta från pågående pass och tratt-sidor", () => {
    for (const path of [
      "/match/abc-123",
      "/matchmaking",
      "/join/ABCD",
      "/train",
      "/ord",
      "/login",
      "/signup",
      "/onboarding",
      "/coachning/tack",
      "/pris",
      "/admin",
      "/gamla-prov/2024ht/3",
    ]) {
      expect(isPromptablePath(path), path).toBe(false);
    }
  });
});
