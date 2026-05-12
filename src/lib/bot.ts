// Client-safe bot helpers (pure functions, no server imports).

export function getBotName(botElo: number): string {
  if (botElo >= 1600) return "HP-Bot Elite";
  if (botElo >= 1400) return "HP-Bot Mästare";
  if (botElo >= 1200) return "HP-Bot Aspirant";
  if (botElo >= 1000) return "HP-Bot Utmanare";
  if (botElo >= 800) return "HP-Bot Nybörjare";
  return "HP-Bot Junior";
}
