import BlurFade from "@/components/magicui/blur-fade";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";

export function Skills() {
  return (
        <BlurFade delay={BLUR_FADE_DELAY * 10}>
          <section id="skills" className="py-12">
            <h2 className="numbered-heading display-3 text-foreground">Skills & Technologies</h2>
            <div className="flex flex-wrap gap-3">
              {DATA.skills.map((skill, i) => (
                <BlurFade key={skill} delay={BLUR_FADE_DELAY * 11 + i * 0.02}>
                  <span className="tech-badge hover:scale-105 transition-transform cursor-default">
                    {skill}
                  </span>
                </BlurFade>
              ))}
            </div>
          </section>
        </BlurFade>
  );
}
