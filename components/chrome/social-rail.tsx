"use client";

import Link from "next/link";
import BlurFade from "@/components/magicui/blur-fade";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";

/**
 * Fixed left rail of social links, plus the theme toggle.
 *
 * Imports DATA itself rather than receiving it as a prop: each entry's `icon`
 * is a React component (`Icons.gitHub`), and components cannot cross the
 * server->client boundary as props.
 */
export function SocialRail() {
  return (
    <div className="hidden lg:flex fixed left-6 xl:left-10 bottom-0 flex-col items-center gap-6 after:content-[''] after:w-px after:h-24 after:bg-muted-foreground/30">
      {/* One reveal for the whole rail. Per-link reveals were uniform decoration
          (spec §7) - five icons staging in one at a time. */}
      <BlurFade delay={BLUR_FADE_DELAY * 10} className="flex flex-col items-center gap-6">
      <TooltipProvider>
        {DATA.contact.social.map((social) => (
          <Tooltip key={social.name}>
            <TooltipTrigger asChild>
              <Link
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-interactive hover:-translate-y-1 transition-all duration-200"
              >
                <social.icon className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{social.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-muted-foreground hover:text-interactive hover:-translate-y-1 transition-all duration-200">
              <ThemeToggle />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Toggle theme</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      </BlurFade>
    </div>
  );
}
