import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { verifyEmail, type VerifyResult } from "@/lib/email-verification.functions";
import { pageMeta } from "@/lib/page-meta";
import { Button } from "@/components/ui/button";

/* =====================================================================
   Landningssidan för länken i verifieringsmejlet.

   Kräver ingen inloggning med flit: mejlet öppnas ofta i en annan
   webbläsare (telefonens mejlapp) än den man registrerade sig i, och att
   kräva session hade gjort ungefär halva länkarna verkningslösa. Token är
   32 byte slump och räcker som bärare.
   ===================================================================== */

const search = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/verifiera-epost")({
  validateSearch: (s) => search.parse(s),
  component: VerifyPage,
  head: () => ({
    meta: pageMeta({
      path: "/verifiera-epost",
      title: "Bekräfta din e-postadress",
      description: "Bekräftar e-postadressen till ditt konto på Tvåkommanollan.",
      noindex: true,
    }),
  }),
});

const FEL: Record<NonNullable<VerifyResult["reason"]>, string> = {
  okand:
    "Länken känns inte igen. Den kan höra till en adress som sedan bytts ut. Begär ett nytt mejl inifrån appen.",
  utgangen: "Länken har gått ut. Den gäller i ett dygn, så begär ett nytt mejl inifrån appen.",
  anvand: "Den här länken är redan använd. Din adress är alltså bekräftad sedan tidigare.",
};

function VerifyPage() {
  const { token } = Route.useSearch();
  const verify = useServerFn(verifyEmail);
  const [state, setState] = useState<"laddar" | "klar" | "fel">(token ? "laddar" : "fel");
  const [reason, setReason] = useState<string>(
    token ? "" : "Länken saknar sin nyckel. Öppna adressen från mejlet igen.",
  );
  // React 19 i utvecklingsläge monterar effekter två gånger. Utan spärren
  // löses samma token in två gånger och andra svaret blir "redan använd".
  const ranRef = useRef(false);

  useEffect(() => {
    if (!token || ranRef.current) return;
    ranRef.current = true;
    (async () => {
      try {
        const res = (await verify({ data: { token } })) as VerifyResult;
        if (res.ok) {
          setState("klar");
          return;
        }
        setState(res.reason === "anvand" ? "klar" : "fel");
        if (res.reason && res.reason !== "anvand") setReason(FEL[res.reason]);
      } catch {
        setState("fel");
        setReason("Något gick fel. Försök igen om en stund.");
      }
    })();
  }, [token, verify]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      {state === "laddar" && (
        <>
          <Loader2 className="h-9 w-9 animate-spin text-[#ae2f26]" aria-hidden />
          <p className="text-sm text-muted-foreground">Bekräftar din adress…</p>
        </>
      )}

      {state === "klar" && (
        <>
          <CheckCircle2 className="h-12 w-12 text-[var(--success)]" aria-hidden />
          <h1
            className="text-[28px] font-bold leading-tight text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Adressen är bekräftad.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tack! Nu kan du också skriva i forumet. Ditt konto har fungerat hela tiden. Det här var
            bara sista pusselbiten.
          </p>
          <Button asChild>
            <Link to="/">Till startsidan</Link>
          </Button>
        </>
      )}

      {state === "fel" && (
        <>
          <MailWarning className="h-12 w-12 text-[var(--danger)]" aria-hidden />
          <h1
            className="text-[28px] font-bold leading-tight text-[var(--cream)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Länken gick inte att använda
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{reason}</p>
          <Button asChild>
            <Link to="/">Till startsidan</Link>
          </Button>
        </>
      )}
    </div>
  );
}
