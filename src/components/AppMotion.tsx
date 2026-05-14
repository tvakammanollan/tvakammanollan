/**
 * AppMotion
 * ----------------------------------------------------------------------
 * Global motion shell mounted from __root.tsx. Provides:
 *
 *  1. The shared smooth-scroll Lerp loop so any page can subscribe via
 *     useSmoothScroll() and get free silky scroll values.
 *  2. The diff-blend CustomCursor (skipped automatically on touch devices
 *     or when prefers-reduced-motion is set).
 *  3. A top-of-page scroll-progress bar rendered as a fixed aurora line.
 *
 * Keep this thin — it is mounted on every route, including the in-match
 * game page, so no per-route assumptions allowed.
 * ----------------------------------------------------------------------
 */
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { CustomCursor } from "@/components/landing/MotionFX";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export function AppMotion() {
  const reduce = useReducedMotion();
  // Boot the shared rAF loop — every motion primitive subscribes to this.
  useSmoothScroll();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <>
      {/* Aurora-gradient scroll progress, top of viewport */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 right-0 top-0 z-[90] h-[2px] origin-left bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400"
        style={{ scaleX }}
      />
      {!reduce && <CustomCursor />}
    </>
  );
}
