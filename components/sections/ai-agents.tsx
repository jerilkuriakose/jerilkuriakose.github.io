import BlurFade from "@/components/magicui/blur-fade";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";

/**
 * "How I build with AI agents" - the site mirror of the CV's
 * "AI-Augmented Engineering" section. Placed immediately after Experience, which
 * matches the CV's section order (s2 Experience -> s3 AI-Augmented Engineering,
 * see ../jk-cv/src/template.js) and the "after Experience, before Education"
 * brief.
 *
 * Header treatment, `py-24` rhythm and BlurFade entrance mirror the neighbouring
 * Experience section. The intro renders as a lede exactly like Experience's
 * positioning summary, and the bullet lead-ins reuse the SAME split("**")
 * emphasis parser used in experience.tsx (line 19) and experience-card.tsx
 * (line 96): the odd segment between a `**...**` pair becomes a
 * `.text-interactive font-medium` accent span, so no literal `**` reaches the
 * DOM. Duplicated inline rather than extracted because that is the existing
 * convention in both of those files.
 */
export function AiAgents() {
  return (
    <section id="ai-agents" aria-labelledby="ai-agents-heading" className="py-24">
      <BlurFade delay={BLUR_FADE_DELAY * 13}>
        <h2 id="ai-agents-heading" className="numbered-heading display-3 text-foreground">
          How I build with AI agents
        </h2>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 13}>
        <div className="max-w-3xl space-y-4 mb-8">
          <p className="text-muted-foreground leading-relaxed">
            {DATA.aiAgents.intro.split("**").map((part, j) =>
              j % 2 === 1 ? (
                <span key={j} className="text-interactive font-medium">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 14}>
        <div className="max-w-3xl card-hover bg-card rounded-lg border border-border p-6 hover:border-brand-vivid/50">
          <ul className="space-y-3">
            {DATA.aiAgents.bullets.map((bullet, i) => (
              <li
                key={i}
                className="text-muted-foreground leading-relaxed pl-4 relative before:content-['▹'] before:absolute before:left-0 before:text-brand-vivid"
              >
                {bullet.split("**").map((part, k) =>
                  k % 2 === 1 ? (
                    <span key={k} className="text-interactive font-medium">
                      {part}
                    </span>
                  ) : (
                    part
                  )
                )}
              </li>
            ))}
          </ul>
        </div>
      </BlurFade>
    </section>
  );
}
