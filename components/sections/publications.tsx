import Link from "next/link";
import { ExternalLink } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";

export function Publications() {
  return (
        <section id="publications" className="py-24">
          <BlurFade delay={BLUR_FADE_DELAY * 20}>
            <h2 className="numbered-heading display-3 text-foreground">Research & Publications</h2>
          </BlurFade>

          <div className="space-y-4">
            {DATA.publications.map((pub, i) => (
              <BlurFade key={pub.title} delay={BLUR_FADE_DELAY * (21 + i)}>
                <div className="card-hover bg-card rounded-lg border border-border p-6 hover:border-brand-vivid/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grow">
                      <h3 className="display-4 text-foreground mb-1">
                        {pub.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        {pub.authors}
                      </p>
                      <p className="text-sm text-interactive font-mono">{pub.journal}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-brand-vivid/50 text-interactive font-mono"
                    >
                      {pub.year}
                    </Badge>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>

          <BlurFade delay={BLUR_FADE_DELAY * 26}>
            <div className="text-center mt-8">
              <Link
                href={
                  DATA.contact.social.find((s) => s.name === "Google Scholar")?.url ||
                  "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-sm text-interactive hover:underline"
              >
                View all 30+ publications on Google Scholar
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </BlurFade>
        </section>
  );
}
