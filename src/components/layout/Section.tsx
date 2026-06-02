import { cn } from "@/lib/utils";

type Size = "default" | "compact" | "tight";

const padding: Record<Size, string> = {
  default: "py-20 sm:py-24",
  compact: "py-12 sm:py-16",
  tight: "py-8 sm:py-10",
};

export function Section({
  children,
  size = "default",
  className,
  containerClassName,
  as: Tag = "section",
  id,
}: {
  children: React.ReactNode;
  size?: Size;
  className?: string;
  containerClassName?: string;
  as?: "section" | "div" | "article" | "main";
  id?: string;
}) {
  return (
    <Tag id={id} className={cn(padding[size], className)}>
      <div className={cn("mx-auto max-w-6xl px-4 sm:px-6", containerClassName)}>{children}</div>
    </Tag>
  );
}
