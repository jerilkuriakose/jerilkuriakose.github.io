"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowDown } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";

/** Fixed to the viewport bottom, hidden on mobile. Client for the loop animation. */
export function ScrollIndicator() {
  const shouldReduce = useReducedMotion();

  return (
    <BlurFade delay={BLUR_FADE_DELAY * 8}>
      <div className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity cursor-pointer z-10">
        <span className="text-xs font-mono" style={{ writingMode: "vertical-rl" }}>scroll</span>
        {/* An infinite loop is the single most disruptive motion on the page for a
            vestibular-sensitive visitor, so reduced motion renders it static -
            no animate, no transition, not merely a faster loop. */}
        <motion.div
          animate={shouldReduce ? undefined : { y: [0, 8, 0] }}
          transition={shouldReduce ? undefined : { duration: 1.5, repeat: Infinity }}
        >
          <ArrowDown className="h-4 w-4 text-brand-vivid" />
        </motion.div>
      </div>
    </BlurFade>
  );
}
