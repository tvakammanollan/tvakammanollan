import { Check, X } from "lucide-react";
import { cropStyle, optionCrop } from "@/lib/option-crop";
import { useImageSize } from "@/hooks/useImageSize";
import { MathText } from "@/components/MathTextLazy";

/* =====================================================================
   VAD DU SVARADE, OCH VAD SOM VAR RÄTT — i klartext, inte som en bokstav.

   Rättningen kunde bara säga "rätt svar: C". En bokstav lär ingen någonting,
   och på mattedelen är det extra illa: uppgiften ligger som ett utsnitt ur
   provhäftet där alternativen står i BILDEN, så det fanns ingenting alls att
   läsa vid sidan av bokstaven.

   Alternativen bär däremot redan sina egna koordinater i bilden
   (`{id:"A", crop:[x0,y0,x1,y1]}`). Rutan nedan klipper ut just de två
   raderna ur samma bild som redan laddats — ditt svar och det rätta — och
   ställer dem mot varandra. Ingen extra hämtning, ingen ny data.

   Finns varken utsnitt eller alternativtext återstår bokstaven, och då sägs
   det rakt ut att alternativen står i bilden ovanför i stället för att visa
   en tom ruta.
   ===================================================================== */

export interface AnswerOption {
  id: string;
  text?: string | null;
  /** Sätts av datan för bilduppgifter. Typas löst: kommer ur jsonb. */
  crop?: unknown;
}

function Rad({
  etikett,
  option,
  imageUrl,
  rätt,
  math,
}: {
  etikett: string;
  option: AnswerOption | undefined;
  imageUrl: string | null;
  rätt: boolean;
  math: boolean;
}) {
  const crop = imageUrl ? optionCrop(option) : null;
  // Måtten avgör rutans höjd. Hooken ligger före den tidiga returen nedan
  // eftersom hooks inte får hamna bakom ett villkor.
  const size = useImageSize(crop ? imageUrl : null);
  const text = option?.text?.trim();
  // Alternativtexten är meningsfull bara när den inte är sin egen bokstav.
  const harText = !!text && text !== option?.id;
  const färg = rätt ? "var(--success)" : "var(--danger)";

  return (
    <div className="flex items-start gap-2.5">
      <span
        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
        style={{
          background: färg,
          color: rätt ? "var(--success-ink)" : "var(--danger-ink)",
        }}
      >
        {option?.id ?? "–"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: färg }}>
          {etikett}
          {rätt ? (
            <Check className="ml-1 inline h-3 w-3" aria-hidden />
          ) : (
            <X className="ml-1 inline h-3 w-3" aria-hidden />
          )}
        </p>
        {crop && imageUrl ? (
          // Utsnittet sätts efter HÖJD och inte efter bredd. Koordinaterna i
          // datan är generöst tilltagna — alternativ "3" ligger i vänsterkanten
          // av en ruta som spänner över halva sidbredden — så en fullbredds-
          // ruta blir en textrad högst upp i ett stort tomt fält. Med en höjd
          // som motsvarar ett par textrader läser raden som en rad.
          <span
            role="img"
            aria-label={`Alternativ ${option?.id} ur provhäftet`}
            className="mt-1 block rounded border border-border bg-white"
            style={{
              height: "2.75rem",
              maxWidth: "100%",
              ...cropStyle(imageUrl, crop, size),
              // Utan mått vet vi inte formen; ta full bredd tills de landat.
              ...(size ? {} : { width: "100%" }),
            }}
          />
        ) : harText ? (
          <p className="mt-0.5 text-sm leading-relaxed text-foreground">
            {math ? <MathText>{text!}</MathText> : text}
          </p>
        ) : (
          // Varken utsnitt eller egen text. Hänvisa till bilden BARA om det
          // finns en — annars pekar texten på något som inte är där.
          <p className="mt-0.5 text-sm text-muted-foreground">
            {imageUrl
              ? "Alternativen står i bilden ovanför."
              : "Alternativet finns bara i provhäftet."}
          </p>
        )}
      </div>
    </div>
  );
}

export function AnswerContext({
  options,
  selected,
  correct,
  imageUrl,
  math = false,
}: {
  options: AnswerOption[];
  /** Bokstaven användaren valde, eller null för obesvarad. */
  selected: string | null | undefined;
  correct: string;
  imageUrl: string | null;
  math?: boolean;
}) {
  const rättOpt = options.find((o) => o.id === correct);
  const valdOpt = selected ? options.find((o) => o.id === selected) : undefined;
  const prickade = !!selected && selected === correct;

  return (
    <div className="mt-3 space-y-3 rounded-lg border-l-4 border-bark bg-secondary p-3">
      {!prickade && (
        <Rad
          etikett={selected ? "Ditt svar" : "Du svarade inte"}
          option={valdOpt}
          imageUrl={imageUrl}
          rätt={false}
          math={math}
        />
      )}
      <Rad
        etikett={prickade ? "Ditt svar (rätt)" : "Rätt svar"}
        option={rättOpt}
        imageUrl={imageUrl}
        rätt
        math={math}
      />
    </div>
  );
}
