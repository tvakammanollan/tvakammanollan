import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, Loader2, Pencil, SquareFunction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ForumBody } from "./ForumBody";
import {
  MAX_BODY_LENGTH,
  MIN_BODY_LENGTH,
  blockReasonMessage,
  type BlockReason,
} from "@/lib/forum";

/**
 * Skrivrutan. Samma komponent för nytt svar och redigering.
 *
 * Gästen får ingen textarea utan en tydlig ruta om att skapa konto — det är
 * sidans bästa konverteringspunkt, och samtidigt själva spamskyddet: anonym
 * inloggning är påslagen, så "inloggad" betyder inte "en människa".
 */
export function ForumComposer({
  value,
  onChange,
  onSubmit,
  submitting,
  canPost,
  blockReason,
  placeholder,
  submitLabel,
  onCancel,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  canPost: boolean;
  blockReason: BlockReason | null;
  placeholder?: string;
  submitLabel: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  if (!canPost) {
    return <SignUpPrompt reason={blockReason} />;
  }

  const trimmed = value.trim();
  const tooShort = trimmed.length < MIN_BODY_LENGTH;
  const tooLong = trimmed.length > MAX_BODY_LENGTH;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
          <SquareFunction className="h-3.5 w-3.5" aria-hidden />
          Matte skrivs mellan dollartecken: <code className="text-[var(--cream)]">$x^2$</code>
        </p>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-[var(--text-tertiary)] transition-colors hover:bg-white/[0.04] hover:text-[var(--cream)]"
        >
          {preview ? (
            <>
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Skriv
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Förhandsgranska
            </>
          )}
        </button>
      </div>

      {preview ? (
        <div className="min-h-[8rem] rounded-xl border border-white/10 bg-white/[0.02] p-3">
          {trimmed ? (
            <ForumBody body={value} />
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">Inget att visa än.</p>
          )}
        </div>
      ) : (
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Skriv ditt svar…"}
          rows={7}
          maxLength={MAX_BODY_LENGTH}
          className="min-h-[8rem] resize-y"
        />
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span
          className={
            tooLong
              ? "text-xs tabular-nums text-[var(--danger)]"
              : "text-xs tabular-nums text-[var(--text-tertiary)]"
          }
        >
          {trimmed.length} / {MAX_BODY_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Avbryt
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={submitting || tooShort || tooLong}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SignUpPrompt({ reason }: { reason: BlockReason | null }) {
  const message =
    blockReasonMessage(reason) ??
    "Skapa ett konto för att skriva — det tar 20 sekunder och du behåller din statistik.";
  const isAccountIssue = reason === "gast" || reason === "konto" || reason === null;

  return (
    <div className="rounded-2xl border border-[var(--amber)]/25 bg-[var(--amber)]/[0.06] p-5 text-center">
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{message}</p>
      {isAccountIssue && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button asChild size="sm">
            <Link to="/signup">Skapa konto</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/login">Logga in</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
