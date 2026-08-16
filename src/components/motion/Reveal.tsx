"use client";

import { m, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Reveal — Apple/Cluely-style scroll-triggered reveal with stagger support.
 * Wrap a section to fade + lift its children into view as you scroll.
 *
 *   <Reveal>
 *     <Reveal.Item><h2>…</h2></Reveal.Item>
 *     <Reveal.Item delay={0.1}>…</Reveal.Item>
 *   </Reveal>
 */
const containerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * `amount` is "some" (threshold 0) by default: a fractional threshold is
 * unreachable once the wrapped content is taller than the viewport, which
 * leaves it invisible for good. See the note in `landing/MotionFX.tsx`.
 */
export function Reveal({
  children,
  className,
  amount = "some",
  once = true,
}: {
  children: ReactNode;
  className?: string;
  amount?: "some" | "all" | number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
    >
      {children}
    </m.div>
  );
}

function RevealItem({
  children,
  className,
  delay = 0,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <As className={className}>{children}</As>;
  const Component = m[As as "div"] as typeof m.div;
  return (
    <Component
      className={className}
      variants={itemVariants}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </Component>
  );
}

Reveal.Item = RevealItem;

/** Drop-in fade-up on mount (no scroll trigger). */
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

/** Soft parallax on scroll — wrap a decorative element. */
export function Parallax({
  children,
  speed = 30,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      initial={{ y: 0 }}
      whileInView={{ y: -speed }}
      viewport={{ amount: 0 }}
      transition={{ duration: 1.2, ease: "linear" }}
    >
      {children}
    </m.div>
  );
}
