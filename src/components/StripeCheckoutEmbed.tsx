import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { trackError } from "@/lib/telemetry";

/* =====================================================================
   Stripes kassa, renderad INNE i sidan.

   Stripe kör kassan i en iframe från js.stripe.com — inga kortuppgifter
   passerar vår kod, precis som med den hostade kassan. Skillnaden är att
   köparen aldrig lämnar sidan, vilket är hela skälet till att tidsvalet
   åter kan ligga före betalningen: det som gjorde den ordningen dyr var
   att en bokad tid blev kvar när någon stängde fliken hos Stripe.

   Scriptet laddas här och inte som en dependency (`@stripe/stripe-js`).
   Stripe kräver att v3 hämtas från deras domän vid varje körning — ett
   npm-paket hade ändå bara varit ett omslag runt samma script-tagg, till
   priset av att både package-lock.json och bun.lock måste hållas i synk
   (CI:n installerar med bun och dör på en lockfil som glidit isär).

   CSP:n måste släppa fram js.stripe.com i script-src och frame-src, samt
   api.stripe.com i connect-src. Se `src/server.ts` — utan det renderas
   ingenting och webbläsaren säger det bara i konsolen.
   ===================================================================== */

interface EmbeddedCheckoutInstance {
  mount(el: HTMLElement | string): void;
  unmount(): void;
  destroy(): void;
}

/**
 * Två generationer av samma API.
 *
 * `createEmbeddedCheckoutPage` är det nuvarande namnet och tar en funktion som
 * hämtar client secret; `initEmbeddedCheckout` är föregångaren och tar värdet
 * direkt. Båda deklareras här därför att scriptet laddas från Stripes domän
 * vid körning — vilket av dem som finns avgörs alltså inte av något vi kan
 * kompilera mot, och den som saknas är `undefined`, inte ett fel.
 */
interface StripeClient {
  createEmbeddedCheckoutPage?(options: {
    fetchClientSecret: () => Promise<string>;
  }): Promise<EmbeddedCheckoutInstance>;
  initEmbeddedCheckout?(options: { clientSecret: string }): Promise<EmbeddedCheckoutInstance>;
}

type StripeFactory = (key: string) => StripeClient;

/**
 * Stripes nuvarande script-URL. `/v3/` är föregångaren och fungerar än, men
 * saknar `createEmbeddedCheckoutPage`. Adressen får inte speglas eller buntas
 * — Stripe kräver att den hämtas från deras domän, och PCI-efterlevnaden
 * hänger på det.
 */
const SCRIPT_URL = "https://js.stripe.com/dahlia/stripe.js";

/**
 * En laddning per sidladdning, delad mellan alla som frågar.
 *
 * Utan modulcachen hade en modal som öppnas, stängs och öppnas igen lagt en ny
 * script-tagg varje gång — och Stripe varnar högljutt om v3 laddas två gånger.
 */
let scriptPromise: Promise<StripeFactory> | null = null;

function loadStripeScript(): Promise<StripeFactory> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Stripe kan bara laddas i webbläsaren"));
  }
  const redan = (window as { Stripe?: StripeFactory }).Stripe;
  if (redan) return Promise.resolve(redan);
  scriptPromise ??= new Promise<StripeFactory>((resolve, reject) => {
    // Taggen kan redan ligga där från en tidigare öppning som ännu inte
    // hunnit ladda klart — då ska vi hänga på den, inte lägga en till.
    const befintlig = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    const script = befintlig ?? document.createElement("script");
    const klar = () => {
      const factory = (window as { Stripe?: StripeFactory }).Stripe;
      if (factory) resolve(factory);
      else reject(new Error("Stripe laddade men exponerade ingen klient"));
    };
    script.addEventListener("load", klar);
    script.addEventListener("error", () => reject(new Error("Stripes script gick inte att ladda")));
    if (!befintlig) {
      script.src = SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((e) => {
    // Släpp cachen vid fel, annars är kassan trasig resten av sidladdningen
    // för att nätet hackade i just den sekunden.
    scriptPromise = null;
    throw e;
  });
  return scriptPromise;
}

export function StripeCheckoutEmbed({
  clientSecret,
  publishableKey,
  onError,
}: {
  clientSecret: string;
  publishableKey: string;
  /** Kassan gick inte att rita. Anropas en gång; anroparen får visa reservvägen. */
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [laddar, setLaddar] = useState(true);
  /** onError får aldrig återskapa effekten — då rivs kassan mitt i en betalning. */
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let avbruten = false;
    let instans: EmbeddedCheckoutInstance | null = null;

    void (async () => {
      try {
        const Stripe = await loadStripeScript();
        if (avbruten) return;
        const client = Stripe(publishableKey);
        const checkout = client.createEmbeddedCheckoutPage
          ? await client.createEmbeddedCheckoutPage({
              // Hämtningen är redan gjord — servern skapade sessionen när tiden
              // bokades. Funktionen finns för dem som skapar den först här.
              fetchClientSecret: () => Promise.resolve(clientSecret),
            })
          : client.initEmbeddedCheckout
            ? await client.initEmbeddedCheckout({ clientSecret })
            : null;
        if (!checkout) throw new Error("Stripe saknar båda API:erna för inbäddad kassa");
        // Effekten kan ha städats medan Stripe svarade (React 19 kör effekter
        // två gånger i utvecklingsläge). Montera aldrig något som redan är
        // övergivet — då ligger en död kassa kvar i DOM:en.
        if (avbruten || !containerRef.current) {
          checkout.destroy();
          return;
        }
        instans = checkout;
        checkout.mount(containerRef.current);
        setLaddar(false);
      } catch (e) {
        if (avbruten) return;
        trackError("stripe: inbäddad kassa kunde inte renderas", {
          message: e instanceof Error ? e.message : String(e),
        });
        onErrorRef.current("Betalningen kunde inte visas här.");
      }
    })();

    return () => {
      avbruten = true;
      // destroy() river både iframen och Stripes lyssnare. Utan den lever
      // kassan vidare osynligt och nästa öppning monterar en andra.
      try {
        instans?.destroy();
      } catch {
        /* redan riven */
      }
    };
  }, [clientSecret, publishableKey]);

  return (
    <div className="relative">
      {laddar && (
        <div className="py-12 text-center" aria-busy="true">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
          <p className="mt-4 text-sm text-white/60">Öppnar kassan…</p>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
