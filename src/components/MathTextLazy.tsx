import { lazy, Suspense } from "react";

/**
 * Lazy wrapper for MathText. Defers loading of `katex` (~260 kB gz) until
 * a math expression actually needs to render, so the initial bundle stays slim.
 *
 * Falls back to plain text while katex chunk loads.
 */
const MathTextInner = lazy(() => import("./MathText").then((m) => ({ default: m.MathText })));

export function MathText({
  children,
  autoDetect,
  className,
}: {
  children: string;
  autoDetect?: boolean;
  className?: string;
}) {
  return (
    <Suspense fallback={<span className={className}>{children}</span>}>
      <MathTextInner autoDetect={autoDetect} className={className}>
        {children}
      </MathTextInner>
    </Suspense>
  );
}
