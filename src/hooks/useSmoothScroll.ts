/**
 * useSmoothScroll
 * ------------------------------------------------------------------
 * A lightweight Lerp-smoothed scroll system that exposes:
 *
 *   • smoothScrollY   — eased scrollY (px), great for parallax/translates
 *   • scrollVelocity  — signed px/frame velocity, great for skew/marquee
 *   • scrollDirection — 1 (down) or -1 (up)
 *
 * We don't lock native scroll — the page still scrolls normally so links,
 * a11y and SEO behave. We just publish a *smoothed* mirror of window.scrollY
 * for motion code to subscribe to.
 *
 * Respects prefers-reduced-motion (locks all signals to current scroll).
 * ------------------------------------------------------------------
 */
import { useEffect } from "react";
import {
  motionValue,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";

/* Shared module-level motion values so every consumer sees the same state. */
const sharedSmoothY = motionValue(0);
const sharedVelocity = motionValue(0);
const sharedDirection = motionValue<1 | -1>(1);

let rafId = 0;
let listenerCount = 0;

function startLoop(reduce: boolean) {
  const tick = () => {
    const target = window.scrollY;
    const current = sharedSmoothY.get();
    const delta = target - current;

    if (reduce) {
      sharedSmoothY.set(target);
      sharedVelocity.set(0);
    } else {
      // Lerp factor — lower = smoother/laggier. 0.1 is the Apple sweet spot.
      const next = current + delta * 0.1;
      sharedSmoothY.set(next);

      // Decay velocity towards (target - prev) for marquee/skew driven motion.
      const v = (target - current) * 0.1;
      sharedVelocity.set(v);
      if (Math.abs(delta) > 0.1) sharedDirection.set(delta > 0 ? 1 : -1);
    }

    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function stopLoop() {
  cancelAnimationFrame(rafId);
  rafId = 0;
}

/**
 * Subscribe to the shared smooth-scroll signals. The first caller starts the
 * rAF loop; the last one unsubscribing stops it.
 */
export function useSmoothScroll(): {
  smoothScrollY: MotionValue<number>;
  scrollVelocity: MotionValue<number>;
  scrollDirection: MotionValue<1 | -1>;
} {
  const reduce = useReducedMotion();

  useEffect(() => {
    listenerCount += 1;
    if (listenerCount === 1) startLoop(!!reduce);
    return () => {
      listenerCount -= 1;
      if (listenerCount === 0) stopLoop();
    };
  }, [reduce]);

  return {
    smoothScrollY: sharedSmoothY,
    scrollVelocity: sharedVelocity,
    scrollDirection: sharedDirection,
  };
}

/**
 * Helper: returns a motion value that maps absolute scroll velocity to a skew
 * value (degrees), clamped to avoid extreme jank during fast wheel flicks.
 */
export function useVelocitySkew(maxDeg = 4): MotionValue<number> {
  const { scrollVelocity } = useSmoothScroll();
  // velocity is px/frame post-Lerp; ~60px is a hard scroll-flick.
  return useTransform(scrollVelocity, [-60, 0, 60], [maxDeg, 0, -maxDeg], {
    clamp: true,
  });
}

/**
 * Helper: stable Y motion-value useful for parallax that should feel "weighted".
 * Reads off the smooth scroll signal so movement is silky.
 */
export function useParallaxY(factor = 0.2, baseRef?: React.RefObject<HTMLElement | null>) {
  const { smoothScrollY } = useSmoothScroll();
  const localY = useMotionValue(0);

  useEffect(() => {
    const unsub = smoothScrollY.on("change", (v) => {
      const base = baseRef?.current
        ? baseRef.current.getBoundingClientRect().top + window.scrollY
        : 0;
      localY.set((v - base) * factor);
    });
    return () => unsub();
  }, [smoothScrollY, localY, factor, baseRef]);

  return localY;
}
