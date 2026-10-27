/**
 * Sidor där inget får läggas ovanpå innehållet.
 *
 * Fram till 2026-10-27 hette den här regeln `isPromptablePath` och hörde till
 * de tre automatiska rutorna (coachningsnudgen, rabatten och
 * ordpåminnelsen). De är borta, men regeln är kvar eftersom samtyckesbannern
 * lyder under den: på telefon är bannern full bredd och tog ~40 % av
 * skärmen mitt i ett provpass, medan klockan tickade.
 *
 * Två sorter: sådant som pågår (en match, ett provpass) och sådant som redan
 * är en tratt (inloggning, kassan). `/train` och `/ord` ligger med fast de
 * har en startvy först. Själva passet byter aldrig URL, så det går inte att
 * skilja "har inte börjat" från "mitt i" härifrån.
 */
const BLOCKED_PREFIXES = [
  "/match",
  "/matchmaking",
  "/join",
  "/train",
  "/ord",
  "/login",
  "/signup",
  "/onboarding",
  "/coachning",
  "/pris",
  "/admin",
];

/** `/gamla-prov` och `/gamla-prov/2024ht` är bläddring. Tredje nivån är provet. */
const PROV_PASS = /^\/gamla-prov\/[^/]+\/[^/]+/;

export function isPromptablePath(path: string): boolean {
  if (BLOCKED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return false;
  return !PROV_PASS.test(path);
}
