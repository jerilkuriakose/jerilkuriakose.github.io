import { Terminal } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { FeaturedProject } from "@/components/sections/featured-project";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";

export function SelectedWork() {
  return (
        <section id="selected-work" className="py-24">
          <BlurFade delay={BLUR_FADE_DELAY * 14}>
            <h2 className="numbered-heading display-3 text-foreground">Things I&apos;ve Built</h2>
          </BlurFade>

          <div className="space-y-24">
            {DATA.projects.slice(0, 4).map((project, i) => (
              <FeaturedProject
                key={project.title}
                project={project}
                index={i}
                isOdd={i % 2 === 0}
              />
            ))}
          </div>

          {/* Other Projects Grid */}
          {DATA.projects.length > 4 && (
            <div className="mt-24">
              <BlurFade delay={BLUR_FADE_DELAY * 18}>
                <h3 className="display-4 text-center mb-8 text-foreground">
                  Other Noteworthy Projects
                </h3>
              </BlurFade>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {DATA.projects.slice(4).map((project) => (
                  <div
                    key={project.title}
                    className="on-panel card-hover bg-panel rounded-lg border border-border p-6 h-full flex flex-col hover:border-brand-vivid/50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Terminal className="h-10 w-10 text-brand-vivid" />
                      <span className="text-xs font-mono text-muted-foreground">
                        {project.company}
                      </span>
                    </div>
                    <h4 className="display-4 text-foreground mb-2">
                      {project.title}
                    </h4>
                    <p className="text-sm text-muted-foreground grow mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 font-mono text-xs text-muted-foreground">
                      {project.technologies.slice(0, 4).map((tech) => (
                        <span key={tech}>{tech}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
  );
}
