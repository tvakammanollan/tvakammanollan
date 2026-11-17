import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { OrdPurchaseCard } from "@/components/OrdPurchaseCard";
import { zonText, zonYta, type Produktzon } from "@/lib/produktzon";

/**
 * Det köparen ser när Stripe skickat tillbaka den till /kassa?kop=klart.
 *
 * Kassans rubrik och ingress ("Välj hur länge du vill ha tillgång …") står
 * INTE här: de beskriver ett val som redan är gjort, och stod tidigare kvar
 * ovanför tackrutan. Sidan säger i stället vad som just blev öppet och
 * leder vidare till de tre ytorna, var och en i sin zonfärg.
 */

const START: {
  zon: Produktzon;
  to: "/gamla-prov" | "/ord" | "/mek-ovning";
  rubrik: string;
  text: string;
}[] = [
  {
    zon: "prov",
    to: "/gamla-prov",
    rubrik: "Gamla prov",
    text: "Skriv ett helt provpass på tid och få rättning och poäng direkt.",
  },
  {
    zon: "ord",
    to: "/ord",
    rubrik: "Ordlistan",
    text: "Över 10 000 ord i träningsläget. Ord du missar kommer tillbaka.",
  },
  {
    zon: "mek",
    to: "/mek-ovning",
    rubrik: "MEK",
    text: "Alla MEK-uppgifter, både arkivets och våra egna.",
  },
];

/** Dämpad text på zonytan: Graphite på de ljusa, cream wash på Plum. */
const ZON_UNDERTEXT: Record<Produktzon, string> = {
  prov: "var(--cream-3)",
  ord: "var(--cream-3)",
  duell: "var(--cream-3)",
  mek: "var(--cream-wash)",
};

export function PremiumWelcome({
  state,
  needsUsername,
}: {
  state: "pending" | "ok" | "failed";
  needsUsername: boolean;
}) {
  if (state === "pending") {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center text-center"
        aria-busy="true"
      >
        <Loader2 className="h-7 w-7 animate-spin text-white/55" aria-hidden />
        <p className="mt-4 text-[15px] text-white/65">Bekräftar betalningen</p>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center sm:py-24">
        <h1 className="text-[28px] leading-tight tracking-[-0.035em] sm:text-[36px]">
          Vi kunde inte bekräfta köpet ännu
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-white/70">
          Har du betalat brukar det synas inom någon minut. Ladda om sidan, eller mejla{" "}
          <a href="mailto:info@tvakommanollan.se" className="underline underline-offset-2">
            info@tvakommanollan.se
          </a>{" "}
          om det dröjer. Har pengarna dragits gäller köpet oavsett vad som står här.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pt-4 sm:pt-10">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
        <h1 className="mt-5 text-[32px] leading-[1.1] tracking-[-0.035em] sm:text-[48px]">
          Välkommen till Premium
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-white/70 sm:text-[17px]">
          Betalningen är klar och allt är öppet för dig. Kvittot kommer på mejlen från Stripe.
        </p>
      </div>

      <h2 className="mt-12 text-[20px] font-semibold tracking-[-0.02em] sm:mt-14">
        Var vill du börja?
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
        {START.map((s) => (
          <li key={s.to}>
            <Link
              to={s.to}
              className="flex h-full min-h-[148px] flex-col rounded-2xl p-5 transition duration-150 hover:brightness-[0.96] sm:min-h-[184px] sm:p-6"
              style={{ background: zonYta[s.zon], color: zonText[s.zon] }}
            >
              <span className="text-[20px] font-semibold tracking-[-0.02em]">{s.rubrik}</span>
              <span
                className="mt-2 text-[14px] leading-relaxed"
                style={{ color: ZON_UNDERTEXT[s.zon] }}
              >
                {s.text}
              </span>
              <span className="mt-auto pt-4 text-[14px] font-semibold underline underline-offset-4">
                Börja öva
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Vad köpet är och när det förnyas, med uppsägningen nära till hands.
          Kortet renderar ingenting förrän köpet lästs. */}
      <OrdPurchaseCard className="mt-8" manageLink />

      {needsUsername ? (
        <p className="mt-6 text-center text-[14px] text-white/65">
          Du har inget användarnamn än.{" "}
          <Link to="/onboarding" className="font-semibold underline underline-offset-2">
            Välj användarnamn
          </Link>
        </p>
      ) : null}
    </div>
  );
}
