"use client";

import Link from "next/link";
import BlurFade from "@/components/magicui/blur-fade";
import { Dock, DockIcon } from "@/components/magicui/dock";
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
 * Mobile-only floating social dock. Imports DATA itself for the same reason as
 * SocialRail: `social.icon` is a React component and cannot be passed from a
 * Server Component.
 */
export function MobileDock() {
  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <BlurFade delay={BLUR_FADE_DELAY * 8}>
        <TooltipProvider>
          <Dock className="glass border border-border/50 shadow-lg">
            {DATA.contact.social.map((social) => (
              <DockIcon key={social.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full w-full items-center justify-center rounded-full hover:bg-primary/10"
                    >
                      <social.icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{social.name}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            ))}
            <DockIcon>
              <ThemeToggle />
            </DockIcon>
          </Dock>
        </TooltipProvider>
      </BlurFade>
    </div>
  );
}
