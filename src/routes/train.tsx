import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { MEK_ORIGINS } from "@/lib/question-origin";
import { TrainExperience } from "@/components/train/TrainExperience";

/**
 * `?delprov=MEK` förväljer ett delprov, så att en länk (startsidans
 * MEK-kort) kan gå rakt till ett färdigt val. `kalla` väljer var
 * MEK-uppgifterna kommer ifrån. Okända värden ignoreras i stället för att
 * fälla sidan.
 */
const trainSearchSchema = z.object({
  delprov: z
    .enum(["ORD", "MEK", "LAS", "ELF", "XYZ", "KVA", "NOG", "DTK"])
    .optional()
    .catch(undefined),
  kalla: z.enum(MEK_ORIGINS).optional().catch(undefined),
});

export const Route = createFileRoute("/train")({
  component: TrainPage,
  validateSearch: (search) => trainSearchSchema.parse(search),
  head: () => ({
    meta: pageMeta({
      path: "/train",
      title: "Öva högskoleprovet · alla 8 delprov",
      description:
        "Träna inför Högskoleprovet i lugn takt. Välj delprov (ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK), svårighet och antal frågor. Gratis.",
      ogTitle: "Tvåkommanollan | Träna HP utan tidspress",
      ogDescription:
        "Solo-träning för Högskoleprovet. Välj delprov, svårighet och antal frågor. Ingen klocka, gratis.",
    }),
    links: pageLinks("/train"),
    scripts: [
      breadcrumbScript([
        { name: "Hem", path: "/" },
        { name: "Träna HP", path: "/train" },
      ]),
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "Course",
        name: "Träna Högskoleprovet · alla 8 delprov",
        description:
          "Gratis solo-träning inför Högskoleprovet med riktiga frågor i alla åtta delprov: ORD, MEK, LÄS, ELF, XYZ, KVA, NOG och DTK.",
        url: "https://tvakommanollan.se/train",
        inLanguage: "sv-SE",
        isAccessibleForFree: true,
        educationalLevel: "Gymnasium / högskolesökande",
        teaches: [
          "Ordkunskap (ORD)",
          "Meningskomplettering (MEK)",
          "Läsförståelse (LÄS)",
          "Engelsk läsförståelse (ELF)",
          "Matematisk problemlösning (XYZ)",
          "Kvantitativa jämförelser (KVA)",
          "Kvantitativa resonemang (NOG)",
          "Diagram, tabeller och kartor (DTK)",
        ],
        provider: {
          "@type": "Organization",
          name: "Tvåkommanollan",
          url: "https://tvakommanollan.se",
        },
        offers: { "@type": "Offer", price: "0", priceCurrency: "SEK", category: "Free" },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "Online",
          courseWorkload: "PT15M",
        },
      }),
    ],
  }),
});

function TrainPage() {
  const search = Route.useSearch();
  return <TrainExperience förval={search.delprov} kalla={search.kalla} />;
}
