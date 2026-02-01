"use client";

import { DATA } from "@/data/resume";
import BlurFade from "@/components/magicui/blur-fade";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  ChevronDown,
  ExternalLink,
  ArrowDown,
  Sparkles,
  Terminal,
  Calendar,
  Building2,
} from "lucide-react";

const BLUR_FADE_DELAY = 0.04;

// Featured Projects Component
function FeaturedProject({
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
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 aspect-video flex items-center justify-center border border-primary/20">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="relative z-10 text-center">
              <div className="text-4xl font-bold text-primary/40 font-mono mb-2">
                {project.title.split(" ")[0]}
              </div>
              <div className="text-sm text-muted-foreground">{project.company}</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Project Content */}
        <div
          className={`md:col-span-7 relative z-10 ${
            isOdd ? "md:col-start-6" : "md:col-start-1"
          } md:row-start-1`}
        >
          <p className="font-mono text-sm text-primary mb-2">Featured Project</p>
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

// Experience Card Component
function ExperienceCard({
  job,
  delay,
}: {
  job: (typeof DATA.work)[number];
  delay: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BlurFade delay={delay}>
      <div className="card-hover group relative bg-card rounded-lg border border-border p-6 hover:border-primary/50">
        {/* Timeline dot */}
        <div className="absolute -left-[41px] top-8 w-3 h-3 rounded-full bg-primary border-4 border-background hidden md:block" />
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="text-primary font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {job.company}
            </p>
          </div>
          <div className="text-sm text-muted-foreground font-mono text-right">
            <p className="flex items-center gap-1 sm:justify-end">
              <Calendar className="h-3 w-3" />
              {job.start} — {job.end}
            </p>
            <p className="flex items-center gap-1 sm:justify-end">
              <MapPin className="h-3 w-3" />
              {job.location}
            </p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4">{job.description}</p>

        {job.highlights.length > 0 && (
          <div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <span>Key achievements ({job.highlights.length})</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>
            <motion.div
              initial={false}
              animate={{
                height: isOpen ? "auto" : 0,
                opacity: isOpen ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <ul className="mt-4 space-y-2">
                {job.highlights.map((highlight, j) => (
                  <li
                    key={j}
                    className="text-sm text-muted-foreground pl-4 relative before:content-['▹'] before:absolute before:left-0 before:text-primary"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        )}
      </div>
    </BlurFade>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Hero Section - Full Screen */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 max-w-7xl mx-auto"
      >
        {/* Background gradient */}
        <div className="hero-gradient" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-[0.02] dark:opacity-[0.05]" />

        <div className="relative z-10 py-24">
          {/* Greeting */}
          <BlurFade delay={BLUR_FADE_DELAY}>
            <p className="font-mono text-primary mb-5 text-sm md:text-base">
              Hi, my name is
            </p>
          </BlurFade>

          {/* Name - Big Heading */}
          <BlurFade delay={BLUR_FADE_DELAY * 2}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4">
              {DATA.name}
            </h1>
          </BlurFade>

          {/* Tagline */}
          <BlurFade delay={BLUR_FADE_DELAY * 3}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-muted-foreground mb-6">
              I build intelligent AI systems.
            </h2>
          </BlurFade>

          {/* Description */}
          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <p className="max-w-xl text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
              I&apos;m a <span className="text-primary font-medium">{DATA.title}</span> at{" "}
              <span className="text-foreground font-medium">SDAIA</span>, specializing in
              large language models, agentic AI systems, and production-scale ML deployment.
              Currently building{" "}
              <span className="text-primary font-medium">ALLaM</span> — the Arabic Large Language Model.
            </p>
          </BlurFade>

          {/* Location and Avatar Row */}
          <BlurFade delay={BLUR_FADE_DELAY * 5}>
            <div className="flex items-center gap-6 mb-8">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-primary/50 ring-4 ring-primary/10 pulse-glow">
                <AvatarImage src={DATA.avatarUrl} alt={DATA.name} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                  {DATA.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="flex items-center gap-2 text-muted-foreground text-sm md:text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  {DATA.location}
                </p>
                <p className="text-xs text-muted-foreground/70 font-mono mt-1">
                  {DATA.extraInfo}
                </p>
              </div>
            </div>
          </BlurFade>

          {/* CTA Buttons */}
          <BlurFade delay={BLUR_FADE_DELAY * 6}>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="font-mono bg-transparent border-2 border-primary text-primary hover:bg-primary/10"
              >
                <Link href={`mailto:${DATA.contact.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Get In Touch
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="font-mono text-primary hover:bg-primary/10"
              >
                <Link href={DATA.resumeUrl} target="_blank">
                  <Icons.download className="mr-2 h-4 w-4" />
                  Resume
                </Link>
              </Button>
            </div>
          </BlurFade>
        </div>

        {/* Scroll indicator */}
        <BlurFade delay={BLUR_FADE_DELAY * 8}>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-xs font-mono">scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowDown className="h-4 w-4 text-primary" />
            </motion.div>
          </div>
        </BlurFade>
      </section>

      {/* Fixed Side Elements */}
      <div className="hidden lg:flex fixed left-8 bottom-0 flex-col items-center gap-6 after:content-[''] after:w-px after:h-24 after:bg-muted-foreground/30">
        <TooltipProvider>
          {DATA.contact.social.map((social, i) => (
            <BlurFade key={social.name} delay={BLUR_FADE_DELAY * (10 + i)}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary hover:-translate-y-1 transition-all duration-200"
                  >
                    <social.icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{social.name}</p>
                </TooltipContent>
              </Tooltip>
            </BlurFade>
          ))}
        </TooltipProvider>
      </div>

      {/* Right Side - Email */}
      <div className="hidden lg:flex fixed right-8 bottom-0 flex-col items-center gap-6 after:content-[''] after:w-px after:h-24 after:bg-muted-foreground/30">
        <BlurFade delay={BLUR_FADE_DELAY * 12}>
          <Link
            href={`mailto:${DATA.contact.email}`}
            className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors tracking-widest"
            style={{ writingMode: "vertical-rl" }}
          >
            {DATA.contact.email}
          </Link>
        </BlurFade>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 md:px-12 lg:px-24 max-w-5xl mx-auto pb-24">
        {/* About Section */}
        <BlurFade delay={BLUR_FADE_DELAY * 9}>
          <section id="about" className="py-24">
            <h2 className="numbered-heading font-bold text-foreground">About Me</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="md:col-span-2 space-y-4">
                {DATA.summary.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed">
                    {paragraph.split("**").map((part, j) =>
                      j % 2 === 1 ? (
                        <span key={j} className="text-primary font-medium">
                          {part}
                        </span>
                      ) : (
                        part
                      )
                    )}
                  </p>
                ))}

                <p className="text-muted-foreground leading-relaxed">
                  Here are some technologies I&apos;ve been working with recently:
                </p>

                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {DATA.skills.slice(0, 12).map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      <span className="text-primary">▹</span>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <div className="relative z-10">
                  <div className="relative overflow-hidden rounded-lg">
                    <Image
                      src={DATA.avatarUrl}
                      alt={DATA.name}
                      width={400}
                      height={400}
                      className="w-full aspect-square object-cover grayscale hover:grayscale-0 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-primary/20 mix-blend-multiply group-hover:opacity-0 transition-opacity" />
                  </div>
                </div>
                {/* Decorative border */}
                <div className="absolute top-4 left-4 w-full h-full border-2 border-primary rounded-lg -z-10 group-hover:top-2 group-hover:left-2 transition-all duration-200" />
              </div>
            </div>
          </section>
        </BlurFade>

        {/* Skills Section */}
        <BlurFade delay={BLUR_FADE_DELAY * 10}>
          <section id="skills" className="py-12">
            <h2 className="numbered-heading font-bold text-foreground">Skills & Technologies</h2>
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

        {/* Experience Section */}
        <section id="experience" className="py-24">
          <BlurFade delay={BLUR_FADE_DELAY * 12}>
            <h2 className="numbered-heading font-bold text-foreground">Where I&apos;ve Worked</h2>
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

        {/* Projects Section */}
        <section id="projects" className="py-24">
          <BlurFade delay={BLUR_FADE_DELAY * 14}>
            <h2 className="numbered-heading font-bold text-foreground">Things I&apos;ve Built</h2>
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
                <h3 className="text-center text-xl font-semibold mb-8 text-foreground">
                  Other Noteworthy Projects
                </h3>
              </BlurFade>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DATA.projects.slice(4).map((project, i) => (
                  <BlurFade key={project.title} delay={BLUR_FADE_DELAY * (19 + i)}>
                    <div className="card-hover bg-card rounded-lg border border-border p-6 h-full flex flex-col hover:border-primary/50">
                      <div className="flex items-center justify-between mb-4">
                        <Terminal className="h-10 w-10 text-primary" />
                        <span className="text-xs font-mono text-muted-foreground">
                          {project.company}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        {project.title}
                      </h4>
                      <p className="text-sm text-muted-foreground flex-grow mb-4">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 font-mono text-xs text-muted-foreground">
                        {project.technologies.slice(0, 4).map((tech) => (
                          <span key={tech}>{tech}</span>
                        ))}
                      </div>
                    </div>
                  </BlurFade>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Publications Section */}
        <section id="publications" className="py-24">
          <BlurFade delay={BLUR_FADE_DELAY * 20}>
            <h2 className="numbered-heading font-bold text-foreground">Research & Publications</h2>
          </BlurFade>

          <div className="space-y-4">
            {DATA.publications.map((pub, i) => (
              <BlurFade key={pub.title} delay={BLUR_FADE_DELAY * (21 + i)}>
                <div className="card-hover bg-card rounded-lg border border-border p-6 hover:border-primary/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow">
                      <h3 className="font-medium text-foreground mb-1 leading-tight">
                        {pub.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        {pub.authors}
                      </p>
                      <p className="text-sm text-primary font-mono">{pub.journal}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-primary/50 text-primary font-mono"
                    >
                      {pub.year}
                    </Badge>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>

          <BlurFade delay={BLUR_FADE_DELAY * 26}>
            <div className="text-center mt-8">
              <Link
                href={
                  DATA.contact.social.find((s) => s.name === "Google Scholar")?.url ||
                  "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-sm text-primary hover:underline"
              >
                View all 30+ publications on Google Scholar
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </BlurFade>
        </section>

        {/* Education Section */}
        <section id="education" className="py-24">
          <BlurFade delay={BLUR_FADE_DELAY * 27}>
            <h2 className="numbered-heading font-bold text-foreground">Education</h2>
          </BlurFade>

          <div className="space-y-6">
            {DATA.education.map((edu, i) => (
              <BlurFade key={edu.school} delay={BLUR_FADE_DELAY * (28 + i)}>
                <div className="card-hover bg-card rounded-lg border border-border p-6 hover:border-primary/50">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{edu.degree}</h3>
                      <p className="text-muted-foreground">{edu.school}</p>
                      {edu.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {edu.description}
                        </p>
                      )}
                      {edu.gpa && (
                        <Badge className="mt-2 bg-primary/10 text-primary border-primary/30">
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
        </section>

        {/* Awards Section */}
        <section id="awards" className="py-24">
          <BlurFade delay={BLUR_FADE_DELAY * 31}>
            <h2 className="numbered-heading font-bold text-foreground">Awards & Recognition</h2>
          </BlurFade>

          <div className="grid sm:grid-cols-2 gap-4">
            {DATA.awards.map((award, i) => (
              <BlurFade key={award.title} delay={BLUR_FADE_DELAY * (32 + i)}>
                <div className="card-hover bg-card rounded-lg border border-border p-6 hover:border-primary/50">
                  <Sparkles className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground">{award.title}</h3>
                  <p className="text-sm text-primary">{award.organization}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {award.date}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 text-center">
          <BlurFade delay={BLUR_FADE_DELAY * 36}>
            <p className="font-mono text-primary mb-2">05. What&apos;s Next?</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Get In Touch
            </h2>
            <p className="max-w-md mx-auto text-muted-foreground mb-8 leading-relaxed">
              I&apos;m currently open to new opportunities in AI/ML leadership roles.
              Whether you have a question or just want to say hi, my inbox is always open!
            </p>
            <Button
              asChild
              size="lg"
              className="font-mono bg-transparent border-2 border-primary text-primary hover:bg-primary/10 px-8"
            >
              <Link href={`mailto:${DATA.contact.email}`}>Say Hello</Link>
            </Button>
          </BlurFade>
        </section>
      </div>

      {/* Mobile Social Dock */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <BlurFade delay={BLUR_FADE_DELAY * 8}>
          <TooltipProvider>
            <Dock className="glass border border-border/50 shadow-lg">
              {DATA.contact.social.map((social) => (
                <DockIcon key={social.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-full w-full items-center justify-center rounded-full hover:bg-primary/10"
                      >
                        <social.icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{social.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </DockIcon>
              ))}
              <DockIcon>
                <ThemeToggle />
              </DockIcon>
            </Dock>
          </TooltipProvider>
        </BlurFade>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center">
        <BlurFade delay={BLUR_FADE_DELAY * 40}>
          <p className="font-mono text-xs text-muted-foreground">
            Designed & Built by {DATA.name}
          </p>
        </BlurFade>
      </footer>
    </main>
  );
}
