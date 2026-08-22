import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
import { describeWithin, fitTitle } from "@/lib/seo-text";
import { ProvRunner } from "@/components/prov/ProvRunner";
import { findExam, loadPass } from "@/lib/prov-data";
import { formatInt } from "@/lib/sv-format";
import { delprovFull, passKindLabel } from "@/types/gamla-prov";

/* =====================================================================
   Ett provpass att skriva: 40 uppgifter, originaltid och rättning.
   Passet laddas i loadern (egen chunk per provpass) så att serverrenderingen
   får med innehållet och klienten bara hämtar det pass som öppnas.
   ===================================================================== */

export const Route = createFileRoute("/gamla-prov_/$term_/$pass")({
  loader: async ({ params }) => {
    const passNumber = Number(params.pass);
    if (!Number.isInteger(passNumber)) throw notFound();
    const data = await loadPass(params.term, passNumber);
    if (!data) throw notFound();
    const exam = findExam(params.term);
    const next = exam?.passes.find((p) => p.pass > passNumber)?.pass;
    return { data, nextPass: next };
  },
  head: ({ loaderData }) => {
    const data = loaderData?.data;
    if (!data) return {};
    const path = `/gamla-prov/${data.term}/${data.pass}`;
    const delprov = data.sections.map((s) => s.code).join(", ");
    return {
      meta: pageMeta({
        path,
        // Titeln var 83 tecken och kapades i träfflistan. Varumärket är den
        // svans som tål att falla bort — Google skriver ofta dit sajtnamnet
        // ändå, härlett ur og:site_name.
        title: fitTitle(`${data.label} provpass ${data.pass} · ${delprov}`, "med facit"),
        // Två meningar, inte en: `data.label` bär redan ordet provet ("Skriv
        // provpass 1 från högskoleprovet Höstprovet 2025" stammade), och en
        // enda lång mening kan bara kapas mitt i — den andra meningen kan
        // falla bort hel när terminsnamnet är långt ("Vårprovet 2021
        // (13 mars)"), vilket är vad describeWithin gör.
        description: describeWithin(
          `Skriv provpass ${data.pass} från ${data.label} på originaltid: ` +
            `${formatInt(data.questions.length)} uppgifter i ${delprov} på ${data.minutes} minuter. ` +
            `Facit och automatisk rättning direkt.`,
          "Gratis och utan inloggning.",
        ),
        ogTitle: `${data.label} · provpass ${data.pass}`,
        ogDescription: `${formatInt(data.questions.length)} uppgifter i ${delprov} med facit.`,
      }),
      links: pageLinks(path),
      scripts: [
        breadcrumbScript([
          { name: "Hem", path: "/" },
          { name: "Gamla prov", path: "/gamla-prov" },
          { name: data.label, path: `/gamla-prov/${data.term}` },
          { name: `Provpass ${data.pass}`, path },
        ]),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: `${data.label} · provpass ${data.pass} (${passKindLabel(data.kind)})`,
          url: `https://tvakommanollan.se${path}`,
          inLanguage: "sv-SE",
          isAccessibleForFree: true,
          educationalLevel: "Högskoleförberedande",
          educationalUse: "Test preparation",
          timeRequired: `PT${data.minutes}M`,
          numberOfQuestions: data.questions.length,
          about: data.sections.map((s) => ({ "@type": "Thing", name: delprovFull(s.code) })),
          isPartOf: { "@id": "https://tvakommanollan.se/#website" },
        }),
      ],
    };
  },
  component: ProvPassPage,
});

function ProvPassPage() {
  const { data, nextPass } = Route.useLoaderData();
  return <ProvRunner key={`${data.term}-${data.pass}`} data={data} nextPass={nextPass} />;
}
