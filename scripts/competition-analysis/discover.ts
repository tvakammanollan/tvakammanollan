import type { Competitor } from "./types.ts";
import { getProviderMode, discoverViaApi, loadPrefilledAnalysis } from "./provider.ts";

// Seed-lista används i API-läge som fallback om Claude API misslyckas
const SEED_COMPETITORS: Competitor[] = [
  { name: "HP-guiden", url: "https://www.hpguiden.se", description: "Övningsprov och guider för HP" },
  { name: "Hogskoleprovet.nu", url: "https://hogskoleprovet.nu", description: "Gamla HP-prov och material" },
  { name: "Meritpoäng.nu", url: "https://meritpoang.nu", description: "Meritpoäng och HP-info" },
  { name: "HP Taktik", url: "https://www.hptaktik.se", description: "HP-strategier och övningar" },
  { name: "Antagen.se", url: "https://www.antagen.se", description: "Antagningsinfo och HP-förberedelse" },
];

export async function discoverCompetitors(): Promise<Competitor[]> {
  const mode = getProviderMode();
  console.log(`[discover] Läge: ${mode}`);

  if (mode === "prefilled") {
    // I pre-filled läge läser vi listan ur analysis-data.json som jag skrivit
    const data = loadPrefilledAnalysis();
    return data.competitors.map((c) => ({
      name: c.name,
      url: c.url,
      description: c.description,
    }));
  }

  // API-läge: fråga Claude
  try {
    const competitors = await discoverViaApi();
    console.log(`[discover] Claude hittade ${competitors.length} konkurrenter`);
    return competitors;
  } catch (err) {
    console.warn("[discover] Claude API misslyckades, använder seed-lista:", err);
    return SEED_COMPETITORS;
  }
}
