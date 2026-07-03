import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Plus, Swords, Users, BarChart3, BookOpen, Type, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  to: string;
  Icon: React.ReactNode;
};

const ALL_OPTIONS: Option[] = [
  { label: "Träna", to: "/train", Icon: <BookOpen className="h-4 w-4" /> },
  { label: "Hitta match", to: "/matchmaking", Icon: <Swords className="h-4 w-4" /> },
  { label: "Topplista", to: "/leaderboard", Icon: <Trophy className="h-4 w-4" /> },
  { label: "Vänner", to: "/friends", Icon: <Users className="h-4 w-4" /> },
  { label: "Statistik", to: "/stats", Icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Ord", to: "/ord", Icon: <Type className="h-4 w-4" /> },
];

export function FloatingActionMenu({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const ref = useRef<HTMLDivElement>(null);

  // Hide the option for the page we're on already
  const options = ALL_OPTIONS.filter((o) => o.to !== pathname);

  // Close on outside click + Escape
  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // Close when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div ref={ref} className={cn("fixed bottom-6 right-6 z-40", className)}>
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
            transition={{
              duration: 0.4,
              type: "spring",
              stiffness: 300,
              damping: 22,
            }}
            className="absolute bottom-14 right-0 mb-1 max-w-[calc(100vw-3rem)]"
          >
            <div className="flex flex-col items-end gap-2">
              {options.map((opt, i) => (
                <m.button
                  key={opt.to}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    navigate({ to: opt.to as any });
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="flex items-center gap-2 rounded-xl border border-white/12 bg-[rgba(15,8,3,0.92)] px-4 py-2 text-sm font-medium text-[#e8e4da] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:border-[#f2a65a]/50 hover:text-[#f2a65a]"
                >
                  {opt.Icon}
                  <span>{opt.label}</span>
                </m.button>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Stäng snabbmeny" : "Öppna snabbmeny"}
        aria-expanded={isOpen}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2a65a] text-[#1a0d04] shadow-[0_0_28px_rgba(242,166,90,0.45)] transition-all hover:bg-[#f2a65a]/90 hover:shadow-[0_0_36px_rgba(242,166,90,0.65)]"
      >
        <m.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
          className="flex"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </m.span>
      </button>
    </div>
  );
}
