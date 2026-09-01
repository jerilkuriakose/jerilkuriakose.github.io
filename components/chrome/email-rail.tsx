import Link from "next/link";
import BlurFade from "@/components/magicui/blur-fade";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";

/** Fixed right rail. Server: no icons, no state, no motion. */
export function EmailRail() {
  return (
      <div className="hidden lg:flex fixed right-6 xl:right-10 bottom-0 flex-col items-center gap-6 after:content-[''] after:w-px after:h-24 after:bg-muted-foreground/30">
        <BlurFade delay={BLUR_FADE_DELAY * 12}>
          <Link
            href={`mailto:${DATA.contact.email}`}
            className="font-mono text-xs text-muted-foreground hover:text-interactive transition-colors tracking-widest"
            style={{ writingMode: "vertical-rl" }}
          >
            {DATA.contact.email}
          </Link>
        </BlurFade>
      </div>
  );
}
