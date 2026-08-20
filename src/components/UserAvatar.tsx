import { avatarColor, initials } from "@/lib/elo";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  /**
   * Vad färgen räknas ur, när den ska vara stabil per konto och inte per
   * namn — typiskt användarens id. Bokstäverna kommer alltid ur `name`:
   * resultatsidan skickade in id:t som namn för att få en stabil färg, och
   * brickan visade då **CD** ur `cd3c30d2-…` i stället för personens namn.
   */
  seed?: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, seed, size = 40, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-[#fff8f5] shadow-sm",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColor(seed || name),
        fontSize: size * 0.4,
        fontFamily: "var(--font-display)",
      }}
    >
      {initials(name)}
    </span>
  );
}
