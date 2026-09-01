import BlurFade from "@/components/magicui/blur-fade";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import type { DATA } from "@/data/resume";

export function FeaturedProject({
  project,
  index,
  isOdd,
}: {
  project: (typeof DATA.projects)[number];
  index: number;
  isOdd: boolean;
}) {
  return (
    <BlurFade delay={BLUR_FADE_DELAY * (14 + index)}>
      <div
        className={`relative grid gap-4 md:grid-cols-12 md:gap-6 items-center ${
          isOdd ? "" : "md:text-right"
        }`}
      >
        {/* Project Image/Visual */}
        <div
          className={`md:col-span-7 relative group ${
            isOdd ? "md:col-start-1" : "md:col-start-6"
          } md:row-start-1`}
        >
          <div className="on-panel relative overflow-hidden rounded-lg bg-panel p-8 aspect-video flex items-center justify-center border border-brand-vivid/20">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="relative z-10 text-center">
              <div className="text-4xl font-bold text-brand-vivid/40 font-mono mb-2">
                {project.title.split(" ")[0]}
              </div>
              <div className="text-sm text-muted-foreground">{project.company}</div>
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Project Content */}
        <div
          className={`md:col-span-7 relative z-10 ${
            isOdd ? "md:col-start-6" : "md:col-start-1"
          } md:row-start-1`}
        >
          <p className="font-mono text-sm text-interactive mb-2">Featured Project</p>
          <h3 className="text-xl md:text-2xl font-bold mb-4 text-foreground">
            {project.title}
          </h3>
          <div className="bg-card p-6 rounded-lg shadow-xl border border-border mb-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {project.description}
            </p>
          </div>
          <ul
            className={`flex flex-wrap gap-2 font-mono text-xs text-muted-foreground ${
              isOdd ? "" : "md:justify-end"
            }`}
          >
            {project.technologies.map((tech) => (
              <li key={tech} className="tech-badge">
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </BlurFade>
  );
}
