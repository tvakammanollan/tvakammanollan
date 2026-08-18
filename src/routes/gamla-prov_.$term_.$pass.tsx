import { createFileRoute, notFound } from "@tanstack/react-router";
import { pageMeta, pageLinks, breadcrumbScript, jsonLdScript } from "@/lib/page-meta";
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
        title: `${data.label} provpass ${data.pass} (${delprov}) med facit · Tvåkommanollan`,
        description:
          `Skriv provpass ${data.pass} från högskoleprovet ${data.label}: ` +
          `${formatInt(data.questions.length)} uppgifter i ${delprov} på ${data.minutes} minuter, ` +
          `med facit och automatisk rättning. Gratis och utan inloggning.`,
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
          name: `${data.label} – provpass ${data.pass} (${passKindLabel(data.kind)})`,
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
