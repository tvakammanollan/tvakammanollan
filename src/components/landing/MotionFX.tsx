/**
 * MotionFX — reusable motion primitives for the dream-like landing.
 * ------------------------------------------------------------------
 * Every primitive in this file is built on top of the shared smooth-scroll
 * signals from `useSmoothScroll`. They all gracefully degrade when the user
 * has `prefers-reduced-motion: reduce` set.
 *
 * Exports:
 *  • CustomCursor       — diff-blend dot, swells to amber over clickables
 *  • SplitText          — auto word-by-word slide-up (drop-in for h2/h3)
 *  • VelocitySkew       — wraps children, skews based on scroll velocity
 *  • VelocityMarquee    — endless ribbon whose speed/direction follow scroll
 *  • StickyNumber       — big serif number pinned bottom-right per section
 *  • FlipCard           — 3D rotateY/X entrance for cards
 *  • ClipReveal         — image with clip-path swipe from top
 *  • Parallax           — translateY layer driven by smooth scroll
 *  • MotionStageDots    — vertical progress dots for pinned scrollytelling
 *  • TiltLayer          — mouse-driven X/Y tilt for hero hero-titles
 *  • AmberMouseShadow   — soft amber radial that follows the cursor
 * ------------------------------------------------------------------
 */
import {
  m,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useInView,
  type MotionValue,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSmoothScroll, useVelocitySkew } from "@/hooks/useSmoothScroll";

/* ============================================================ */
/* ===  Helpers                                              === */
/* ============================================================ */

/** Detects coarse pointer / touch — used to hide the custom cursor. */
function useIsTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return touch;
}

/* ============================================================ */
/* ===  CustomCursor                                         === */
/* ============================================================ */

/**
 * Diff-blend dot follows the cursor; swells into a soft amber circle when
 * hovering anything that announces itself as "clickable" (`a`, `button`,
 * `[role=button]`, `[data-cursor=link]`).
 */
export function CustomCursor() {
  const reduce = useReducedMotion();
  const touch = useIsTouch();
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 380, damping: 30, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 380, damping: 30, mass: 0.4 });

  const scale = useMotionValue(1);
  const sScale = useSpring(scale, { stiffness: 240, damping: 22 });
  const hovered = useMotionValue(0); // 0 = idle, 1 = over link
  const sHover = useSpring(hovered, { stiffness: 200, damping: 22 });

  // Hook calls must be unconditional — derive these BEFORE any early return.
  const haloScale = useTransform(sHover, [0, 1], [0.5, 1.1]);
  const haloOpacity = useTransform(sHover, [0, 1], [0, 0.35]);

  useEffect(() => {
    if (reduce || touch) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const onDown = () => scale.set(0.7);
    const onUp = () => scale.set(1);

    const isInteractive = (el: EventTarget | null): boolean => {
      if (!(el instanceof Element)) return false;
      return !!el.closest(
        "a, button, [role='button'], [data-cursor='link'], input, textarea, select, label",
      );
    };

    const onOver = (e: MouseEvent) => {
      hovered.set(isInteractive(e.target) ? 1 : 0);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseover", onOver, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseover", onOver);
    };
  }, [x, y, scale, hovered, reduce, touch]);

  if (reduce || touch) return null;

  return (
    <>
      {/* Dot — small, white, diff-blend so it inverts on any background */}
      <m.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white md:block"
        style={{ x: sx, y: sy, scale: sScale, mixBlendMode: "difference" }}
      />
      {/* Amber halo — expands when hovering interactive elements */}
      <m.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[99] hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full md:block"
        style={{
          x: sx,
          y: sy,
          scale: haloScale,
          opacity: haloOpacity,
          background: "radial-gradient(circle, rgba(245,158,11,0.45) 0%, rgba(245,158,11,0) 75%)",
        }}
      />
    </>
  );
}

/* ============================================================ */
/* ===  SplitText                                            === */
/* ============================================================ */

/**
 * Splits a text string by words and slides each one up on first in-view.
 * Drop-in for `<h2>` / `<h3>` headlines.
 */
export function SplitText({
  children,
  as: Tag = "span",
  className,
  delay = 0,
  stagger = 0.06,
  amount = 0.4,
  italic,
}: {
  children: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  delay?: number;
  stagger?: number;
  amount?: number;
  italic?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount, margin: "200px 0px 200px 0px" });
  const words = useMemo(() => children.split(/(\s+)/), [children]);

  // Memoise the motion-wrapped tag — otherwise every parent re-render
  // recreates this component type and React remounts the whole SplitText,
  // re-running the entrance animation on each keystroke in a form upstream.
  const MotionTag = useMemo(() => m.create(Tag as React.ElementType), [Tag]);

  if (reduce) {
    return <MotionTag className={className}>{children}</MotionTag>;
  }

  return (
    <MotionTag ref={ref} className={className}>
      {words.map((w, i) => {
        if (/^\s+$/.test(w))
          return (
            <span key={i} style={{ whiteSpace: "pre" }}>
              {w}
            </span>
          );
        return (
          <span
            key={i}
            className="inline-block overflow-hidden align-baseline"
            style={{ verticalAlign: "baseline" }}
          >
            <m.span
              className={`inline-block ${italic ? "italic font-light" : ""}`}
              initial={{ y: "110%", opacity: 0, rotate: 3 }}
              animate={inView ? { y: "0%", opacity: 1, rotate: 0 } : undefined}
              transition={{
                duration: 0.9,
                delay: delay + i * stagger,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {w}
            </m.span>
          </span>
        );
      })}
    </MotionTag>
  );
}

/* ============================================================ */
/* ===  VelocitySkew                                         === */
/* ============================================================ */

/**
 * Wraps its children in a layer that skews horizontally based on the user's
 * current scroll velocity. Subtle by default — use for grids/frames/etc.
 */
export function VelocitySkew({
  children,
  maxDeg = 3,
  className,
}: {
  children: React.ReactNode;
  maxDeg?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const skew = useVelocitySkew(maxDeg);
  const sSkew = useSpring(skew, { stiffness: 200, damping: 25 });

  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <m.div className={className} style={{ skewY: sSkew, transformOrigin: "center center" }}>
      {children}
    </m.div>
  );
}

/* ============================================================ */
/* ===  VelocityMarquee                                      === */
/* ============================================================ */

/**
 * Endless horizontal ribbon. Auto-scrolls at `baseSpeed` px/frame, then
 * adds/subtracts scroll velocity so the bar physically reacts to the page.
 */
export function VelocityMarquee({
  items,
  baseSpeed = 0.6,
  className,
}: {
  items: React.ReactNode[];
  baseSpeed?: number;
  className?: string;
}) {
  const { scrollVelocity } = useSmoothScroll();
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const halfWidth = useRef<number>(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const node = trackRef.current;
      if (!node) return;
      halfWidth.current = node.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const tick = () => {
      const v = scrollVelocity.get();
      // Direction-aware: marquee speeds up when scrolling down, reverses on up.
      const next = x.get() - (baseSpeed + v * 0.6);
      const w = halfWidth.current || 0;
      // Wrap so the ribbon is endless without visible jumps.
      let wrapped = next;
      if (w > 0) {
        if (wrapped <= -w) wrapped += w;
        if (wrapped > 0) wrapped -= w;
      }
      x.set(wrapped);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollVelocity, x, baseSpeed, reduce]);

  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <m.div
        ref={trackRef}
        className="flex gap-12 whitespace-nowrap will-change-transform"
        style={{ x }}
      >
        {[...items, ...items].map((it, i) => (
          <span key={i} className="flex items-center gap-12">
            {it}
          </span>
        ))}
      </m.div>
    </div>
  );
}

/* ============================================================ */
/* ===  StickyNumber                                         === */
/* ============================================================ */

/**
 * Pins a giant serif section-index to the bottom-right of the viewport while
 * its parent <section> is in view. Slides up/down when the section changes.
 */
export function StickyNumber({ n }: { n: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-0">
      <m.div
        className="pointer-events-none fixed bottom-6 right-8 z-20 select-none text-[120px] leading-none text-[var(--cream)]/[0.04] mix-blend-multiply sm:text-[170px]"
        style={{
          opacity,
          y,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontStyle: "italic",
        }}
      >
        {n}
      </m.div>
    </div>
  );
}

/* ============================================================ */
/* ===  FlipCard                                             === */
/* ============================================================ */

/**
 * NOTE — never give an in-view wrapper a fractional `amount`.
 * IntersectionObserver's ratio is measured against the *element*, so it can
 * never exceed (viewport + rootMargin) / elementHeight. Wrap anything taller
 * than that — a 100-row leaderboard, a stats panel on a phone — and the
 * threshold is mathematically unreachable: `inView` stays false forever and
 * the content sits at opacity 0 with no error anywhere. It only looks
 * intermittent because a cold load renders a short skeleton first (observer
 * fires while the element is still small) while a warm react-query cache
 * renders the full-height table on mount. Use "some" (threshold 0).
 */

/**
 * 3D rotateY/X entrance card. Settles into place when scrolled into view.
 */
export function FlipCard({
  children,
  delay = 0,
  axis = "y",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  axis?: "y" | "x";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: "some", margin: "200px 0px 200px 0px" });

  const initial = reduce
    ? { opacity: 0 }
    : axis === "y"
      ? { opacity: 0, rotateY: -60, y: 30 }
      : { opacity: 0, rotateX: -60, y: 30 };
  const animate = inView ? { opacity: 1, rotateX: 0, rotateY: 0, y: 0 } : undefined;

  return (
    <m.div
      ref={ref}
      initial={initial}
      animate={animate}
      transition={{ duration: 1.05, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1200 }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/* ============================================================ */
/* ===  ClipReveal                                           === */
/* ============================================================ */

/**
 * Reveals its children via a clip-path swipe from the top, like a curtain
 * lifting. Designed for image-slot / frame components.
 */
export function ClipReveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: "some", margin: "200px 0px 200px 0px" });
  return (
    <m.div
      ref={ref}
      className={className}
      initial={reduce ? { opacity: 0 } : { clipPath: "inset(100% 0 0 0)", opacity: 0 }}
      animate={
        inView ? (reduce ? { opacity: 1 } : { clipPath: "inset(0% 0 0 0)", opacity: 1 }) : undefined
      }
      transition={{ duration: 1.2, delay, ease: [0.77, 0, 0.175, 1] }}
    >
      {children}
    </m.div>
  );
}

/* ============================================================ */
/* ===  Parallax                                             === */
/* ============================================================ */

/**
 * Translates its children on Y based on smooth scroll. Higher `speed`
 * = more displacement. Negative speed = moves opposite to scroll.
 */
export function Parallax({
  children,
  speed = 0.2,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { smoothScrollY } = useSmoothScroll();
  const y = useTransform(smoothScrollY, (v) => v * speed);

  if (reduce) return <div className={className}>{children}</div>;
  return (
    <m.div className={className} style={{ y }}>
      {children}
    </m.div>
  );
}

/* ============================================================ */
/* ===  MotionStageDots                                      === */
/* ============================================================ */

/**
 * Vertical progress dots used inside a pinned scrollytelling section.
 * Pass `progress` (a MotionValue 0..1) and `count` of stages.
 */
function StageDot({
  progress,
  index,
  count,
}: {
  progress: MotionValue<number>;
  index: number;
  count: number;
}) {
  const start = index / count;
  const end = (index + 1) / count;
  const scale = useTransform(progress, [start, (start + end) / 2, end], [0.6, 1.4, 0.6]);
  const opacity = useTransform(progress, [start, (start + end) / 2, end], [0.25, 1, 0.25]);
  return (
    <m.div
      style={{ scale, opacity }}
      className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.7)]"
    />
  );
}

export function MotionStageDots({
  progress,
  count,
  className,
}: {
  progress: MotionValue<number>;
  count: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className ?? ""}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <StageDot key={i} progress={progress} index={i} count={count} />
      ))}
    </div>
  );
}

/* ============================================================ */
/* ===  TiltLayer                                            === */
/* ============================================================ */

/**
 * Wraps children in a layer that tilts on mouse position within itself.
 */
export function TiltLayer({
  children,
  max = 6,
  className,
}: {
  children: React.ReactNode;
  max?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 80, damping: 18 });
  const sry = useSpring(ry, { stiffness: 80, damping: 18 });

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <m.div
      ref={ref}
      className={className}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1400 }}
      onMouseMove={(e) => {
        const el = ref.current!;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        ry.set(px * max);
        rx.set(-py * max);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
    </m.div>
  );
}

/* ============================================================ */
/* ===  AmberMouseShadow                                     === */
/* ============================================================ */

/**
 * Soft amber radial that follows the cursor inside a section.
 * Placed inside a relatively-positioned parent.
 */
export function AmberMouseShadow({ size = 600 }: { size?: number }) {
  const reduce = useReducedMotion();
  const touch = useIsTouch();
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 50, damping: 18 });
  const sy = useSpring(y, { stiffness: 50, damping: 18 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || touch) return;
    const onMove = (e: MouseEvent) => {
      const rect = ref.current?.parentElement?.getBoundingClientRect();
      if (!rect) return;
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y, reduce, touch]);

  if (reduce || touch) return null;
  return (
    <m.div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute z-0 rounded-full"
      style={{
        x: sx,
        y: sy,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        background:
          "radial-gradient(circle, rgba(245,158,11,0.30) 0%, rgba(245,158,11,0.08) 35%, transparent 70%)",
        mixBlendMode: "screen",
      }}
    />
  );
}

/* ============================================================ */
/* ===  PageHeader — consistent hero for non-landing pages   === */
/* ============================================================ */

/**
 * Drop-in page hero. Renders an eyebrow + an h1 with SplitText animation
 * + optional description, plus an optional right-side action slot.
 *
 *   <PageHeader
 *     eyebrow="Topplista"
 *     title="De bästa just nu."
 *     highlight="Verbal."
 *     description="..."
 *     actions={<Button>Foo</Button>}
 *   />
 */
export function PageHeader({
  eyebrow,
  title,
  highlight,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between ${className ?? ""}`}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <m.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow"
          >
            {eyebrow}
          </m.p>
        ) : null}
        <h1 className="display mt-3 text-balance text-[40px] leading-[1.02] text-[var(--cream)] sm:text-[56px] md:text-[68px]">
          <SplitText as="span" className="block">
            {title}
          </SplitText>
          {highlight ? (
            <span className="text-aurora-gradient">
              <SplitText as="span" delay={0.18} italic>
                {highlight}
              </SplitText>
            </span>
          ) : null}
        </h1>
        {description ? (
          <m.p
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.7,
              delay: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-5 max-w-xl text-[17px] leading-relaxed text-neutral-600"
          >
            {description}
          </m.p>
        ) : null}
      </div>
      {actions ? (
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex shrink-0 items-center gap-2"
        >
          {actions}
        </m.div>
      ) : null}
    </div>
  );
}

/* ============================================================ */
/* ===  Reveal — generic on-scroll fade-up wrapper           === */
/* ============================================================ */

/**
 * Lightweight in-view fade-up. Use anywhere you want a card / panel /
 * paragraph to animate in once. More forgiving than ClipReveal.
 *
 * `amount` defaults to "some" (threshold 0) on purpose — see the note above
 * `FlipCard`: a fractional threshold is unreachable for tall content and
 * leaves it stuck at opacity 0.
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  amount = "some",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  amount?: "some" | "all" | number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount, margin: "200px 0px 200px 0px" });
  return (
    <m.div
      ref={ref}
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(8px)" }}
      animate={
        inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }) : undefined
      }
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

/* ============================================================ */
/* ===  StaggerList — auto-stagger children on enter         === */
/* ============================================================ */

/**
 * Wraps a list/grid and staggers each direct child as it enters view.
 * Each child becomes a `motion.div` automatically — pass plain JSX.
 */
export function StaggerList({
  children,
  delayStep = 0.06,
  startDelay = 0,
  y = 20,
  amount = "some",
  className,
}: {
  children: React.ReactNode;
  delayStep?: number;
  startDelay?: number;
  y?: number;
  amount?: "some" | "all" | number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount, margin: "200px 0px 200px 0px" });
  const items = Array.isArray(children) ? children : [children];

  return (
    <div ref={ref} className={className}>
      {items.map((child, i) => (
        <m.div
          key={i}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
          animate={inView ? (reduce ? { opacity: 1 } : { opacity: 1, y: 0 }) : undefined}
          transition={{
            duration: 0.6,
            delay: startDelay + i * delayStep,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {child}
        </m.div>
      ))}
    </div>
  );
}
