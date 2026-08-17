import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Sidnumrering med ?sida=N.
 *
 * `rel=canonical` pekar på sidan själv (sätts i respektive rutt), aldrig på
 * sida 1 — det senare gömmer inläggen på sida 2 och framåt för Google.
 */
export function ForumPagination({ page, pageCount }: { page: number; pageCount: number }) {
  if (pageCount <= 1) return null;

  const pages = pageWindow(page, pageCount);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Sidor">
      <PageLink page={page - 1} disabled={page <= 1} aria-label="Föregående sida">
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </PageLink>

      {pages.map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-[var(--text-tertiary)]">
            …
          </span>
        ) : (
          <PageLink key={p} page={p} current={p === page}>
            {p}
          </PageLink>
        ),
      )}

      <PageLink page={page + 1} disabled={page >= pageCount} aria-label="Nästa sida">
        <ChevronRight className="h-4 w-4" aria-hidden />
      </PageLink>
    </nav>
  );
}

function PageLink({
  page,
  current,
  disabled,
  children,
  ...rest
}: {
  page: number;
  current?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm tabular-nums transition-colors";

  if (disabled) {
    return (
      <span
        className={`${base} border-white/8 text-[var(--text-tertiary)] opacity-40`}
        aria-hidden
        {...rest}
      >
        {children}
      </span>
    );
  }

  if (current) {
    return (
      <span
        className={`${base} border-[var(--amber)]/50 bg-[var(--amber)]/15 font-semibold text-[var(--amber)]`}
        aria-current="page"
        {...rest}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      to="."
      search={(prev: Record<string, unknown>) => ({
        ...prev,
        sida: page === 1 ? undefined : page,
      })}
      className={`${base} border-white/10 text-[var(--text-secondary)] hover:border-[var(--amber)]/50 hover:text-[var(--cream)]`}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, total: number): Array<number | null> {
  const out: Array<number | null> = [];
  const push = (n: number) => {
    if (n >= 1 && n <= total && !out.includes(n)) out.push(n);
  };

  push(1);
  if (page - 2 > 2) out.push(null);
  for (let n = page - 2; n <= page + 2; n++) push(n);
  if (page + 2 < total - 1) out.push(null);
  push(total);
  return out;
}
