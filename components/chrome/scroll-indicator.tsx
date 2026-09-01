"use client";

import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";

/** Fixed to the viewport bottom, hidden on mobile. Client for the loop animation. */
export function ScrollIndicator() {
  return (
    <BlurFade delay={BLUR_FADE_DELAY * 8}>
      <div className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity cursor-pointer z-10">
        <span className="text-xs font-mono" style={{ writingMode: "vertical-rl" }}>scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowDown className="h-4 w-4 text-brand-vivid" />
        </motion.div>
      </div>
    </BlurFade>
  );
}
