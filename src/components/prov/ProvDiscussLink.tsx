import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import type { ProvThreadLink } from "@/lib/forum-prov.functions";

/** Länken från en uppgift till dess genomgångstråd i forumet. */
export function ProvDiscussLink({ thread }: { thread?: ProvThreadLink }) {
  if (!thread) return null;
  return (
    <Link
      to="/forum/$kategori/$trad"
      params={{ kategori: thread.kategori, trad: thread.trad }}
      className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[var(--teal)] underline decoration-[var(--teal)]/40 underline-offset-2 hover:decoration-[var(--teal)]"
    >
      <MessageSquare className="h-4 w-4" aria-hidden />
      Se lösningen och diskutera i forumet
    </Link>
  );
}
