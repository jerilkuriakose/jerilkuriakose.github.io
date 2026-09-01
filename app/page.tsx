import { Hero } from "@/components/sections/hero";
import { Experience } from "@/components/sections/experience";
import { SelectedWork } from "@/components/sections/selected-work";
import { Skills } from "@/components/sections/skills";
import { Publications } from "@/components/sections/publications";
import { EducationAwards } from "@/components/sections/education-awards";
import { Contact } from "@/components/sections/contact";
import { EmailRail } from "@/components/chrome/email-rail";
import { MobileDock } from "@/components/chrome/mobile-dock";
import { ScrollIndicator } from "@/components/chrome/scroll-indicator";
import { SiteFooter } from "@/components/chrome/site-footer";
import { SocialRail } from "@/components/chrome/social-rail";

/**
 * Server Component. Composition only - no state, no handlers, no directive.
 *
 * Order is spec §5: proof before inventory. Experience and Selected work come
 * before Skills, so a recruiter meets evidence of impact before a list of
 * technologies. There is no "About" section: the positioning summary opens
 * Experience, and the hero keeps the short positioning copy.
 */
export default function Home() {
  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-screen">
      {/* The hero is the page's banner region, so it gets a <header> landmark. */}
      <header>
        <Hero />
      </header>

      <ScrollIndicator />

      <SocialRail />

      <EmailRail />

      {/* Main Content */}
      <div className="relative z-10 px-6 md:px-12 lg:px-20 xl:px-24 max-w-6xl mx-auto pb-24">
        <Experience />

        <SelectedWork />

        <Skills />

        <Publications />

        <EducationAwards />

        <Contact />
      </div>

      <MobileDock />

      <SiteFooter />
    </main>
  );
}
