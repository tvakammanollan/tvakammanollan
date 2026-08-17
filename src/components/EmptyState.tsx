import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
}

/**
 * Standardtomläge. Ikonbrickan var tidigare en solid `#5e4632`-cirkel med en
 * emoji i — en ljus fläck mitt i den mörka ytan. Nu samma tonade amber-bricka
 * som ikonerna på dashboarden.
 */
export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  ctaOnClick,
}: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ae2f26]/25 bg-[#ae2f26]/10">
        <Icon className="h-6 w-6 text-[#ae2f26]" aria-hidden />
      </div>
      <h3
        className="text-lg font-bold text-foreground"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground" style={{ lineHeight: 1.6 }}>
        {subtitle}
      </p>
      {ctaLabel && (ctaHref || ctaOnClick) && (
        <div className="mt-5">
          {ctaHref ? (
            <Button asChild variant="outline">
              <Link to={ctaHref}>{ctaLabel}</Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={ctaOnClick}>
              {ctaLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
