import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

export function CyclingTitle({
  words,
  intervalMs = 2200,
  className,
}: {
  words: string[];
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setIndex((i) => (i === words.length - 1 ? 0 : i + 1));
    }, intervalMs);
    return () => clearTimeout(id);
  }, [index, intervalMs, words.length]);

  return (
    <span
      className={cn(
        "relative inline-flex w-full justify-center overflow-hidden text-center md:pb-3",
        className,
      )}
    >
      &nbsp;
      {words.map((word, i) => (
        <m.span
          key={i}
          className="absolute font-semibold text-[#ae2f26]"
          initial={{ opacity: 0, y: -100 }}
          transition={{ type: "spring", stiffness: 50 }}
          animate={index === i ? { y: 0, opacity: 1 } : { y: index > i ? -150 : 150, opacity: 0 }}
        >
          {word}
        </m.span>
      ))}
    </span>
  );
}
