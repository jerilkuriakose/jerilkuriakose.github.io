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

export function Hero() {
  return (
    <>
      {/* Hero Section - Full Screen */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 max-w-7xl mx-auto py-20 lg:py-0"
      >
        {/* Background gradient blobs */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-interactive/20 rounded-full blur-[100px]" />
        </div>
        
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
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 tracking-tight">
                {DATA.name}
              </h1>
            </BlurFade>

            {/* Tagline */}
            <BlurFade delay={BLUR_FADE_DELAY * 3}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-muted-foreground mb-8">
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
                    <Link href={`tel:${DATA.contact.tel}`} title="Call">
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

          {/* Right column - Profile Photo */}
          <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2 flex justify-center lg:justify-end">
            <BlurFade delay={BLUR_FADE_DELAY * 3}>
              <div className="relative">
                {/* Animated outer ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-80 md:h-80 border-2 border-brand-vivid/20 rounded-full dark:border-brand-vivid/10 animate-[spin_10s_linear_infinite]" />
                
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
      </section>
    </>
  );
}
