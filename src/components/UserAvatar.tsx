import { avatarColor, initials } from "@/lib/elo";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, size = 40, className }: Props) {
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
        backgroundColor: avatarColor(name),
        fontSize: size * 0.4,
        fontFamily: "var(--font-display)",
      }}
    >
      {initials(name)}
    </span>
  );
}
