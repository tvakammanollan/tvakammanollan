import { Sparkles } from "lucide-react";
import { questionOrigin } from "@/lib/question-origin";

interface Props {
  tags: readonly string[] | null | undefined;
  source: string | null | undefined;
}

/**
 * Etiketten och källraden under en av Tvåkommanollans egna uppgifter.
 * Renderar ingenting för arkivuppgifter och skrapade rader.
 */
export function QuestionOriginNote({ tags, source }: Props) {
  const origin = questionOrigin(tags, source);
  if (!origin) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      <span className="font-medium text-foreground">{origin.label}</span>
      {origin.sourceUrl && (
        <span>
          <span aria-hidden>· </span>Fakta ur Wikipedia:{" "}
          <a
            href={origin.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {origin.sourceTitle}
          </a>{" "}
          ({origin.license}).
        </span>
      )}
    </p>
  );
}
