import { Sparkles } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";

/**
 * Education and Awards combined into ONE section (spec §5).
 *
 * One numbered <h2> for the section; the two former headings become plain <h3>
 * group labels WITHOUT `numbered-heading`, because section numbering is
 * positional (counter-increment) and two numbers inside one section would
 * double-count every later heading.
 *
 * The school anchor's onClick={(e) => e.stopPropagation()} was deleted during
 * extraction: a Server Component cannot emit an event handler, and there is no
 * clickable ancestor for it to suppress.
 */
export function EducationAwards() {
  return (
    <section id="education-awards" className="py-24">
      <BlurFade delay={BLUR_FADE_DELAY * 27}>
        <h2 className="numbered-heading font-bold text-foreground">Education &amp; Awards</h2>
      </BlurFade>

      <div className="space-y-16">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-6">Education</h3>

          <div className="space-y-6">
            {DATA.education.map((edu, i) => (
              <BlurFade key={edu.school} delay={BLUR_FADE_DELAY * (28 + i)}>
                <div className="card-hover bg-card rounded-lg border border-border p-6 hover:border-brand-vivid/50">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{edu.degree}</h3>
                      <p className="text-muted-foreground">
                        <a
                          href={edu.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-interactive transition-colors"
                        >
                          {edu.school}
                        </a>
                      </p>
                      {edu.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {edu.description}
                        </p>
                      )}
                      {edu.gpa && (
                        <Badge className="mt-2 bg-primary/10 text-interactive border-brand-vivid/30">
                          {edu.gpa.includes("%") ? `Grade: ${edu.gpa}` : `CGPA: ${edu.gpa}`}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground font-mono">
                      <p>{edu.start ? `${edu.start} — ${edu.end}` : edu.end}</p>
                      <p>{edu.location}</p>
                    </div>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-6">Awards & Recognition</h3>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {DATA.awards.map((award, i) => (
              <BlurFade key={award.title} delay={BLUR_FADE_DELAY * (32 + i)}>
                <div className="card-hover bg-card rounded-lg border border-border p-6 hover:border-brand-vivid/50">
                  <Sparkles className="h-8 w-8 text-brand-vivid mb-3" />
                  <h3 className="font-semibold text-foreground">{award.title}</h3>
                  <p className="text-sm text-interactive">{award.organization}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {award.date}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
