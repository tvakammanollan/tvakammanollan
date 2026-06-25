import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  ctaOnClick,
}: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#DAD4C5] text-4xl">
        <span aria-hidden>{icon}</span>
      </div>
      <h3
        className="text-lg font-bold text-foreground"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {title}
      </h3>
      <p
        className="mt-2 text-sm text-muted-foreground"
        style={{ lineHeight: 1.6 }}
      >
        {subtitle}
      </p>
      {ctaLabel && (ctaHref || ctaOnClick) && (
        <div className="mt-5">
          {ctaHref ? (
            <Button
              asChild
              variant="outline"
              className="border-[#f2a65a] text-[#f2a65a] hover:bg-[#f2a65a]/10"
            >
              <Link to={ctaHref}>{ctaLabel}</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={ctaOnClick}
              className="border-[#f2a65a] text-[#f2a65a] hover:bg-[#f2a65a]/10"
            >
              {ctaLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
