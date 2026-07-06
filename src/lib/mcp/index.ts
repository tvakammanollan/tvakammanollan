import { defineMcp } from "@lovable.dev/mcp-js";
import getHpDates from "./tools/get-hp-dates";
import getLeaderboard from "./tools/get-leaderboard";
import lookupWord from "./tools/lookup-word";

export default defineMcp({
  name: "hpkampen-mcp",
  title: "HP Kampen",
  version: "0.1.0",
  instructions:
    "Verktyg för HP Kampen — svensk träningsapp för Högskoleprovet. Använd `get_hp_dates` för kommande provdatum, `get_leaderboard` för topplistan (verbal eller matematisk del), och `lookup_word` för att slå upp ord från ORD-delen.",
  tools: [getHpDates, getLeaderboard, lookupWord],
});
