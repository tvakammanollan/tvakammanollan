const LABELS = ["Mycket låg", "Låg", "Medel", "Hög", "Mycket hög"];

/**
 * Chansen att ett ord står på nästa prov: talet stort, och fem steg under som
 * visar var ordet ligger i förhållande till resten av ordlistan. Stegen är
 * solida block, inga gradienter, och bandets namn står som text så att färgen
 * inte bär betydelsen ensam.
 */
export function ChanceMeter({
  text,
  ettPa,
  band,
  compact = false,
}: {
  text: string;
  ettPa: string;
  band: number;
  compact?: boolean;
}) {
  const level = Math.min(5, Math.max(1, Math.round(band)));
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div>
        <p
          className={`font-bold leading-none tabular-nums text-[var(--cream)] ${
            compact ? "text-2xl" : "text-[34px]"
          }`}
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          {text}
        </p>
        <p className="mt-1.5 text-sm text-white/60">ungefär {ettPa}</p>
      </div>
      <div className="min-w-[160px] flex-1" role="img" aria-label={`${LABELS[level - 1]} chans`}>
        <div className="grid grid-cols-5 gap-1">
          {LABELS.map((_, i) => (
            <div key={i} className={`h-2 rounded-sm ${i < level ? "bg-success" : "bg-white/10"}`} />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-white/55">
          <span>Låg</span>
          <span className="font-semibold text-[var(--cream)]">{LABELS[level - 1]}</span>
          <span>Hög</span>
        </div>
      </div>
    </div>
  );
}
