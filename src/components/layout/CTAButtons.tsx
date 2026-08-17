import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type LinkProps = React.ComponentProps<typeof Link>;

type CommonProps = {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
};

type AsLink = CommonProps & {
  to: LinkProps["to"];
  params?: LinkProps["params"];
  search?: LinkProps["search"];
  href?: never;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type AsAnchor = CommonProps & {
  href: string;
  to?: never;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type AsButton = CommonProps & {
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  to?: never;
  href?: never;
};

type CTAProps = AsLink | AsAnchor | AsButton;

const primaryClass =
  "inline-flex h-[52px] items-center justify-center gap-2 rounded-md bg-[#ae2f26] px-7 text-[15px] font-semibold text-[#2e1e14] " +
  "shadow-[0_0_28px_rgba(174, 47, 38,0.28)] transition-all hover:bg-[#ae2f26]/90 hover:shadow-[0_0_36px_rgba(174, 47, 38,0.40)] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const secondaryClass =
  "inline-flex h-[52px] items-center justify-center gap-2 rounded-md border border-white/15 px-7 text-[15px] font-medium text-white/80 " +
  "transition-colors hover:border-white/30 hover:bg-white/[0.04] hover:text-white " +
  "disabled:cursor-not-allowed disabled:opacity-50";

function Inner({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <>
      <span>{children}</span>
      {icon}
    </>
  );
}

function renderCTA(baseClass: string, props: CTAProps) {
  const { children, className, icon } = props;
  const merged = cn(baseClass, className);

  if ("to" in props && props.to) {
    return (
      <Link to={props.to} params={props.params} search={props.search} className={merged}>
        <Inner icon={icon}>{children}</Inner>
      </Link>
    );
  }
  if ("href" in props && props.href) {
    return (
      <a href={props.href} className={merged}>
        <Inner icon={icon}>{children}</Inner>
      </a>
    );
  }
  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={merged}
    >
      <Inner icon={icon}>{children}</Inner>
    </button>
  );
}

export function PrimaryCTA(props: CTAProps) {
  return renderCTA(primaryClass, props);
}

export function SecondaryCTA(props: CTAProps) {
  return renderCTA(secondaryClass, props);
}
