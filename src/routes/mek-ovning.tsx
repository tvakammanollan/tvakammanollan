import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { pageMeta, pageLinks, breadcrumbScript } from "@/lib/page-meta";
import { MEK_ORIGINS } from "@/lib/question-origin";
import { TrainExperience } from "@/components/train/TrainExperience";

/**
 * MEK-övningen: träningsläget låst till MEK, med valet av källa (gamla prov
 * eller Tvåkommanollans egna) som första steg. Startsidans MEK-kort går hit.
 * `?kalla=tkn` förväljer källan.
 */
const searchSchema = z.object({
  kalla: z.enum(MEK_ORIGINS).optional().catch(undefined),
});

export const Route = createFileRoute("/mek-ovning")({
  component: MekOvningPage,
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: pageMeta({
      path: "/mek-ovning",
      title: "MEK-övning: meningskomplettering med facit",
      description:
        "Öva MEK inför högskoleprovet: uppgifter ur gamla prov och Tvåkommanollans egna, med facit och förklaring. Rösta fram de bästa frågorna.",
    }),
    links: pageLinks("/mek-ovning"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "MEK-övning", path: "/mek-ovning" },
      ]),
    ],
  }),
});

function MekOvningPage() {
  const search = Route.useSearch();
  return <TrainExperience mode="mek" kalla={search.kalla} />;
}
