"use client";

import { AnimatePresence, motion, useInView, useReducedMotion, Variants } from "motion/react";
import { useRef } from "react";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: {
    hidden: { y: number };
    visible: { y: number };
  };
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: string;
  /**
   * @deprecated Phase 4 removed the filter animation entirely - spec §7 permits
   * animating transform and opacity only, and this animated `filter` on ~90
   * elements including whole sections. Kept in the interface so no call site
   * breaks; deliberately not consumed.
   */
  blur?: string;
}

const BlurFade = ({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  // Defaults to true so entrances are observer-driven. Previously false, which
  // made `isInView` permanently true and fired every reveal on load.
  inView = true,
  /**
   * No negative margin in any direction.
   *
   * Two dead zones were found empirically. The original "-50px" shrinks ALL FOUR
   * root edges, so an element wholly inside the first 50px of the document can
   * never intersect while scrolling down. Changing it to bottom-only
   * ("0px 0px -50px 0px") fixed that but created the mirror image: the footer,
   * which lives in the last ~64px of the document, can never be 50px above the
   * viewport bottom either, so it stayed at opacity 0 permanently.
   *
   * A negative margin only buys a slightly later reveal. A region of the document
   * that can never reveal is a correctness bug. Correctness wins.
   */
  inViewMargin = "0px",
}: BlurFadeProps) => {
  const ref = useRef(null);
  const inViewResult = useInView(ref, {
    once: true,
    margin: inViewMargin as `${number}px`,
  });
  const isInView = !inView || inViewResult;
  const shouldReduce = useReducedMotion();

  /**
   * Call sites author `delay` as document-order staggering (BLUR_FADE_DELAY * N),
   * which was coherent while every reveal fired at load: position in the document
   * WAS position in time.
   *
   * Observer-driven reveals break that assumption. Measured after switching:
   * contact carries a 1.44s delay and the footer 1.6s, so content sat blank for
   * ~2s AFTER being scrolled to - it reads as broken, not as staging.
   *
   * The cap is 0.24s because that is the largest delay authored for content
   * visible at load (the hero's 6-step cascade). So the hero stages exactly as
   * before, while everything below the fold reveals responsively.
   */
  const effectiveDelay = Math.min(delay, 0.24);

  /**
   * Transform and opacity only - no `filter`.
   *
   * `visible.y` is 0, not -yOffset. The old value left every wrapped element
   * settled six pixels ABOVE its natural position; measured on production as
   * `matrix(1, 0, 0, 1, 0, -6)` on 92 elements.
   */
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  const combinedVariants = variant || defaultVariants;

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        // `motion-reveal` is the stable hook for the reduced-motion CSS override
        // in globals.css and for tests/visual/motion-contract.spec.ts.
        className={className ? `motion-reveal ${className}` : "motion-reveal"}
        // initial/animate are IDENTICAL on server and client. Gating them on
        // useReducedMotion() would render the SSR HTML hidden - the hook returns
        // null on the server but true immediately on a reduced-motion client -
        // producing a hydration mismatch and a visible flash. The never-hidden
        // guarantee lives in CSS instead, which applies before any JS runs.
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        exit="hidden"
        variants={combinedVariants}
        transition={
          shouldReduce
            ? { duration: 0 }
            : { delay: 0.04 + effectiveDelay, duration, ease: "easeOut" }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default BlurFade;
