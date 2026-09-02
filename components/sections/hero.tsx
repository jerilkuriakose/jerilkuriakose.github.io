import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { HeroProofRow } from "@/components/sections/hero-proof-row";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";
import { resolveFeaturedMetrics } from "@/data/metrics";
import { HERO_PHOTO, fallbackFor, srcSetFor } from "@/data/media";

/**
 * Layout widths for the hero photo, matching the right grid cell: ~380px at xl
 * (col-span-4 of a 1088px content box), ~460px at lg (col-span-5), and full
 * content width below that, where the cell spans the single column.
 *
 * This is not decorative. With images.unoptimized there is no framework
 * fallback, so a wrong `sizes` means the browser picks the wrong variant for
 * the LCP element and the performance gate is the only thing that would notice.
 */
const HERO_SIZES =
  "(min-width: 1280px) 380px, (min-width: 1024px) 460px, calc(100vw - 3rem)";

const HERO_FALLBACK = fallbackFor(HERO_PHOTO);

export function Hero() {
  return (
    <>
      {/* Hero Section - Full Screen */}
      <section
        id="hero"
        aria-labelledby="hero-heading"
        className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 max-w-7xl mx-auto py-20 lg:py-0"
      >
        {/* The two decorative gradient blobs were removed in Phase 5: the
            photograph now supplies the hero's depth, and stacking a photo
            behind two blur-[100px] filters was both redundant and the most
            expensive paint on the page. Their clipping container went with
            them - it existed solely to contain their overflow. The zero
            horizontal overflow ASSERTION is the invariant, not that container,
            and it still holds because nothing now sits at -10%. */}

        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-[0.02] dark:opacity-[0.05]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left column - Text content */}
          <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1 space-y-6">
            {/* Greeting */}
            <BlurFade delay={BLUR_FADE_DELAY}>
              <p className="font-mono text-interactive mb-4 text-sm tracking-wide">
                Hi, my name is
              </p>
            </BlurFade>

            {/* Name - Big Heading */}
            <BlurFade delay={BLUR_FADE_DELAY * 2}>
              <h1 id="hero-heading" className="display-1 text-foreground mb-4">
                {DATA.name}
              </h1>
            </BlurFade>

            {/* Tagline */}
            <BlurFade delay={BLUR_FADE_DELAY * 3}>
              <h2 className="display-2 text-display-accent mb-8">
                I build intelligent AI systems.
              </h2>
            </BlurFade>

            {/* Description */}
            <BlurFade delay={BLUR_FADE_DELAY * 4}>
              <div className="max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground space-y-4">
                <p>
                  I&apos;m a <span className="text-interactive font-medium">{DATA.title}</span> at{" "}
                  <span className="text-foreground font-semibold">SDAIA</span>, specializing in
                  large language models, agentic AI systems, and production-scale ML deployment.
                </p>
                <p>
                  Currently building{" "}
                  <span className="text-interactive font-medium">ALLaM</span> — the Arabic Large Language Model.
                </p>
              </div>
            </BlurFade>

            {/* Location Row */}
            <BlurFade delay={BLUR_FADE_DELAY * 5}>
              <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-muted-foreground py-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-interactive shrink-0" />
                  <span>{DATA.location}</span>
                </span>
                <span className="px-2 py-0.5 bg-primary/10 text-interactive rounded-sm text-xs font-semibold whitespace-nowrap">
                  {DATA.extraInfo}
                </span>
                <span className="px-2 py-0.5 bg-primary/10 text-interactive rounded-sm text-xs font-semibold whitespace-nowrap">
                  {DATA.yearsOfExperience} Years Experience
                </span>
              </div>
            </BlurFade>

            {/* Quantified impact. Renders nothing until G3 names the claims. */}
            <BlurFade delay={BLUR_FADE_DELAY * 5}>
              <HeroProofRow metrics={resolveFeaturedMetrics(DATA)} />
            </BlurFade>

            {/* CTA Buttons - Redesigned */}
            <BlurFade delay={BLUR_FADE_DELAY * 6}>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 pt-4">
                {/* Primary CTA - Filled */}
                <Button
                  asChild
                  size="lg"
                  className="font-mono bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 px-8"
                >
                  <Link href={`mailto:${DATA.contact.email}`}>
                    <span>Get In Touch</span>
                    <Mail className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                {/* Secondary buttons - grouped together */}
                <div className="flex items-center gap-3">
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

          {/* Right column - Profile Photo, over a bounded photographic region.

              The photo lives in THIS CELL, not in a section-level container.
              That is load-bearing, not cosmetic: below `lg` the grid collapses
              to one column and this cell is ordered FIRST (order-1 vs the text
              column's order-2), so a section-level "right side" background
              would not be right-bounded at mobile at all - it would sit behind
              the proof row and break §6's rule that no photography appears
              there. Confining it to the cell keeps it in the portrait row at
              every breakpoint.

              The cell itself is NOT clipped. `.photo-region` clips itself, so
              the portrait rings and the "Open to work" badge - which
              deliberately overflow this cell - survive intact. */}
          <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2 relative isolate flex justify-center lg:justify-end">
            <div className="photo-region photo-region-hero" aria-hidden="true">
              <picture>
                <source
                  type="image/webp"
                  srcSet={srcSetFor(HERO_PHOTO, "image/webp")}
                  sizes={HERO_SIZES}
                />
                {/* eslint-disable-next-line @next/next/no-img-element --
                    next/image cannot be used here. next.config.mjs sets
                    images.unoptimized, under which next/image emits a single
                    src and NO srcset - it would ship the full 1774px file as
                    the LCP image. Hand-written srcSet is the only correct
                    option, and every width descriptor below was asserted
                    against the file header when the variant was produced. */}
                <img
                  src={HERO_FALLBACK.src}
                  srcSet={srcSetFor(HERO_PHOTO, "image/jpeg")}
                  sizes={HERO_SIZES}
                  width={HERO_FALLBACK.w}
                  height={HERO_FALLBACK.h}
                  alt=""
                  data-photo={HERO_PHOTO.id}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  style={{ objectPosition: HERO_PHOTO.objectPosition }}
                />
              </picture>
              <div className="scrim" />
            </div>

            <div className="relative z-10">
              <BlurFade delay={BLUR_FADE_DELAY * 3}>
              <div className="relative">
                {/* Outer ring. The `animate-[spin_10s_linear_infinite]` was
                    removed: this is a 288px SQUARE with a uniform `border-2`
                    and `rounded-full`, i.e. a perfect annulus, so rotating it
                    is a visual no-op - while its ROTATED BOUNDING BOX grows to
                    288*sqrt(2) = 407px and overflowed a 375px viewport.

                    Measured: overflow was 0px at t=0 and 7px from 500ms on,
                    peaking with a ring bbox of 404.6px. That is also why the
                    `toBe(0)` overflow gate passed - it sampled at rotation 0.
                    Confirmed pre-existing, not a Phase 5 regression: the live
                    pre-Phase-5 site measures the same 7px. */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-80 md:h-80 border-2 border-brand-vivid/20 rounded-full dark:border-brand-vivid/10" />
                
                {/* Static outer ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[19rem] md:w-[21rem] h-[19rem] md:h-[21rem] border border-border rounded-full" />
                
                {/* Profile image container */}
                <div className="relative w-64 h-64 md:w-72 md:h-72">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-linear-to-tr from-primary to-interactive rounded-full opacity-20 blur-2xl transform translate-x-4 translate-y-4" />
                  
                  {/* Image */}
                  <div className="relative w-full h-full rounded-full border-4 border-background shadow-2xl overflow-hidden group">
                    <Image
                      src={DATA.avatarUrl}
                      alt={DATA.name}
                      fill
                      className="object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-110"
                      priority
                    />
                  </div>
                  
                  {/* Open to work badge */}
                  <div className="absolute -bottom-2 -right-2 bg-background p-3 rounded-xl shadow-lg border border-border flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-vivid rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-foreground">Open to work</span>
                  </div>
                </div>
              </div>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
