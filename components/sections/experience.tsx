import BlurFade from "@/components/magicui/blur-fade";
import { ExperienceCard } from "@/components/sections/experience-card";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";

export function Experience() {
  return (
        <section id="experience" className="py-24">
          <BlurFade delay={BLUR_FADE_DELAY * 12}>
            <h2 className="numbered-heading display-3 text-foreground">Where I&apos;ve Worked</h2>
          </BlurFade>

          {/* Positioning summary: moved out of the retired About section (spec §5).
              It opens Experience with no heading of its own. */}
          <BlurFade delay={BLUR_FADE_DELAY * 12}>
            <div className="max-w-3xl space-y-4 mb-12">
              {DATA.summary.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed">
                  {paragraph.split("**").map((part, j) =>
                    j % 2 === 1 ? (
                      <span key={j} className="text-interactive font-medium">
                        {part}
                      </span>
                    ) : (
                      part
                    )
                  )}
                </p>
              ))}
            </div>
          </BlurFade>

          <div className="relative md:pl-8 md:border-l-2 md:border-border space-y-8">
            {DATA.work.map((job, i) => (
              <ExperienceCard
                key={job.company}
                job={job}
                delay={BLUR_FADE_DELAY * (13 + i)}
              />
            ))}
          </div>
        </section>
  );
}
