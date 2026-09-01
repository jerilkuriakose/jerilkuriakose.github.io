import BlurFade from "@/components/magicui/blur-fade";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";

export function SiteFooter() {
  return (
      <footer className="py-6 text-center">
        <BlurFade delay={BLUR_FADE_DELAY * 40}>
          <p className="font-mono text-xs text-muted-foreground">
            Designed & Built by {DATA.name}
          </p>
        </BlurFade>
      </footer>
  );
}
