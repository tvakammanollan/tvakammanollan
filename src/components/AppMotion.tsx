/**
 * AppMotion
 * ----------------------------------------------------------------------
 * Global motion shell mounted from __root.tsx. Provides:
 *
 *  1. The shared smooth-scroll Lerp loop so any page can subscribe via
 *     useSmoothScroll() and get free silky scroll values.
 *  2. A top-of-page scroll-progress bar (amber).
 *
 * Custom mouse-follower cursor borttagen — kändes som vibe-coding och
 * Niklas vill inte ha en grej som följer efter musen.
 * ----------------------------------------------------------------------
 */
import { m, useScroll, useSpring } from "framer-motion";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export function AppMotion() {
  // Boot the shared rAF loop — every motion primitive subscribes to this.
  useSmoothScroll();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <m.div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0 z-[90] h-[2px] origin-left"
      style={{ scaleX, background: "#f2a65a" }}
    />
  );
}
