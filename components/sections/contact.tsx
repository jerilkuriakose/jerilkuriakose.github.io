import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";
import { CONTACT_PHOTO, fallbackFor, srcSetFor } from "@/data/media";

/** Band spans max-w-4xl (896px) at desktop, the content column below that. */
const CONTACT_SIZES = "(min-width: 1024px) 896px, calc(100vw - 3rem)";

const CONTACT_FALLBACK = fallbackFor(CONTACT_PHOTO);

/**
 * The hardcoded `05. What's Next?` eyebrow was deleted: section numbers come
 * from `.numbered-heading`'s positional counter, and this literal was already
 * wrong before the resequence.
 *
 * Phase 5 adds the second (and final) photographic region. The photo is a
 * BOUNDED band, not a section background, and the content sits on a glass card
 * inset within it - §6's "glass cards appear only where they overlap a
 * photography band". That inset is also the contrast strategy: because
 * `.glass`'s base fill is near-opaque, the text stays legible even when
 * backdrop-filter is unsupported, which a translucent card could not promise.
 */
export function Contact() {
  return (
        <section id="contact" aria-labelledby="contact-heading" className="py-24">
          <div className="relative isolate mx-auto max-w-4xl">
            <div className="photo-region rounded-3xl" aria-hidden="true">
              <picture>
                <source
                  type="image/webp"
                  srcSet={srcSetFor(CONTACT_PHOTO, "image/webp")}
                  sizes={CONTACT_SIZES}
                />
                {/* eslint-disable-next-line @next/next/no-img-element --
                    see hero.tsx: images.unoptimized makes next/image emit no
                    srcset, so hand-written variants are the only correct path.
                    Lazy here, the exact opposite of the hero: this band is far
                    below the fold and must not compete with the LCP image. */}
                <img
                  src={CONTACT_FALLBACK.src}
                  srcSet={srcSetFor(CONTACT_PHOTO, "image/jpeg")}
                  sizes={CONTACT_SIZES}
                  width={CONTACT_FALLBACK.w}
                  height={CONTACT_FALLBACK.h}
                  alt=""
                  data-photo={CONTACT_PHOTO.id}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: CONTACT_PHOTO.objectPosition }}
                />
              </picture>
              <div className="scrim" />
            </div>

            <div className="glass relative z-10 m-6 rounded-3xl border px-6 py-14 text-center md:m-10">
          <BlurFade delay={BLUR_FADE_DELAY * 36}>
            <h2 id="contact-heading" className="display-2 text-foreground mb-6">
              Get In Touch
            </h2>
            <p className="max-w-md mx-auto text-muted-foreground mb-8 leading-relaxed">
              I&apos;m currently open to new opportunities in AI/ML leadership roles.
              Whether you have a question or just want to say hi, my inbox is always open!
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3">
              {/* Primary CTA - Filled */}
              <Button
                asChild
                size="lg"
                className="font-mono bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 px-8"
              >
                <Link href={`mailto:${DATA.contact.email}`}>
                  <span>Say Hello</span>
                  <Mail className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              {/* Icon buttons */}
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 border-border hover:border-strong hover:text-interactive"
                >
                  <Link
                    href={`https://wa.me/${DATA.contact.tel.replace(/\+/g, "")}?text=${encodeURIComponent("Hi Jeril, I found your portfolio and would like to connect!")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    aria-label="Message Jeril on WhatsApp"
                  >
                    <Icons.whatsapp className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 border-border hover:border-strong hover:text-interactive"
                >
                  <Link
                    href={`tel:${DATA.contact.tel}`}
                    title="Call"
                    aria-label="Call Jeril"
                  >
                    <Phone className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 px-5 border-border hover:border-strong hover:text-interactive font-mono"
                >
                  <Link href={DATA.resumeUrl} target="_blank" prefetch={false}>
                    <Icons.download className="mr-2 h-4 w-4" />
                    <span>Resume</span>
                  </Link>
                </Button>
              </div>
            </div>
          </BlurFade>
            </div>
          </div>
        </section>
  );
}
