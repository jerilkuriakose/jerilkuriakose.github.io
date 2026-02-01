import { DATA } from "@/data/resume";
import BlurFade from "@/components/magicui/blur-fade";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import {
  MapPin,
  Mail,
  ChevronDown,
  ExternalLink,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Code2,
  FileText,
} from "lucide-react";

const BLUR_FADE_DELAY = 0.04;

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full max-w-2xl space-y-8 px-4 py-12 sm:px-6 sm:py-24">
        {/* Hero Section */}
        <section id="hero">
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-between sm:gap-8">
            <div className="flex flex-col space-y-2">
              <BlurFade delay={BLUR_FADE_DELAY}>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {DATA.name}
                </h1>
              </BlurFade>
              <BlurFade delay={BLUR_FADE_DELAY * 2}>
                <p className="text-lg font-medium text-primary">{DATA.title}</p>
              </BlurFade>
              <BlurFade delay={BLUR_FADE_DELAY * 3}>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{DATA.location}</span>
                </div>
              </BlurFade>
              <BlurFade delay={BLUR_FADE_DELAY * 4}>
                <p className="max-w-md text-sm text-muted-foreground">
                  {DATA.description}
                </p>
              </BlurFade>
              <BlurFade delay={BLUR_FADE_DELAY * 5}>
                <div className="flex gap-2 pt-2">
                  <Button asChild size="sm">
                    <Link href={DATA.resumeUrl} target="_blank">
                      <Icons.download className="mr-2 h-4 w-4" />
                      Download CV
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`mailto:${DATA.contact.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Contact
                    </Link>
                  </Button>
                </div>
              </BlurFade>
            </div>
            <BlurFade delay={BLUR_FADE_DELAY}>
              <Avatar className="h-28 w-28 border-2 border-border">
                <AvatarImage src={DATA.avatarUrl} alt={DATA.name} />
                <AvatarFallback>{DATA.initials}</AvatarFallback>
              </Avatar>
            </BlurFade>
          </div>
        </section>

        {/* Social Links Dock */}
        <BlurFade delay={BLUR_FADE_DELAY * 6}>
          <section id="social" className="flex justify-center">
            <TooltipProvider>
              <Dock className="mt-0">
                {DATA.contact.social.map((social) => (
                  <DockIcon key={social.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-full w-full items-center justify-center rounded-full bg-background/80 hover:bg-accent"
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
                <Separator orientation="vertical" className="h-8" />
                <DockIcon>
                  <ThemeToggle />
                </DockIcon>
              </Dock>
            </TooltipProvider>
          </section>
        </BlurFade>

        {/* About Section */}
        <BlurFade delay={BLUR_FADE_DELAY * 7}>
          <section id="about">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <BookOpen className="h-5 w-5 text-primary" />
              About
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {DATA.summary.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {paragraph.split("**").map((part, j) =>
                    j % 2 === 1 ? (
                      <strong key={j} className="text-foreground font-medium">
                        {part}
                      </strong>
                    ) : (
                      part
                    )
                  )}
                </p>
              ))}
            </div>
          </section>
        </BlurFade>

        {/* Skills Section */}
        <BlurFade delay={BLUR_FADE_DELAY * 8}>
          <section id="skills">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Code2 className="h-5 w-5 text-primary" />
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {DATA.skills.map((skill, i) => (
                <BlurFade key={skill} delay={BLUR_FADE_DELAY * 9 + i * 0.02}>
                  <Badge variant="secondary">{skill}</Badge>
                </BlurFade>
              ))}
            </div>
          </section>
        </BlurFade>

        {/* Experience Section */}
        <BlurFade delay={BLUR_FADE_DELAY * 10}>
          <section id="experience">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Briefcase className="h-5 w-5 text-primary" />
              Experience
            </h2>
            <div className="space-y-4">
              {DATA.work.map((job, i) => (
                <BlurFade key={job.company} delay={BLUR_FADE_DELAY * 11 + i * 0.1}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{job.title}</CardTitle>
                          <p className="text-sm font-medium text-primary">
                            {job.company}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          <p>{job.start} - {job.end}</p>
                          <p>{job.location}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2 text-sm text-muted-foreground">
                        {job.description}
                      </p>
                      {job.highlights.length > 0 && (
                        <details className="group">
                          <summary className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline">
                            <span>Key achievements ({job.highlights.length})</span>
                            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                          </summary>
                          <ul className="mt-2 space-y-1">
                            {job.highlights.map((highlight, j) => (
                              <li
                                key={j}
                                className="text-xs text-muted-foreground before:mr-2 before:content-['▹'] before:text-primary"
                              >
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                </BlurFade>
              ))}
            </div>
          </section>
        </BlurFade>

        {/* Projects Section */}
        <BlurFade delay={BLUR_FADE_DELAY * 12}>
          <section id="projects">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <FileText className="h-5 w-5 text-primary" />
              Key Projects
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {DATA.projects.map((project, i) => (
                <BlurFade key={project.title} delay={BLUR_FADE_DELAY * 13 + i * 0.05}>
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{project.title}</CardTitle>
                      <p className="text-xs text-primary">{project.company}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3 text-xs text-muted-foreground">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-[10px] px-1.5 py-0">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </BlurFade>
              ))}
            </div>
          </section>
        </BlurFade>

        {/* Publications Section */}
        <BlurFade delay={BLUR_FADE_DELAY * 14}>
          <section id="publications">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <BookOpen className="h-5 w-5 text-primary" />
              Selected Publications
            </h2>
            <div className="space-y-3">
              {DATA.publications.map((pub, i) => (
                <BlurFade key={pub.title} delay={BLUR_FADE_DELAY * 15 + i * 0.05}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium leading-tight">
                          {pub.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pub.authors}
                        </p>
                        <p className="text-xs text-primary">{pub.journal}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {pub.year}
                      </Badge>
                    </div>
                  </Card>
                </BlurFade>
              ))}
              <BlurFade delay={BLUR_FADE_DELAY * 16}>
                <div className="text-center">
                  <Button asChild variant="link" size="sm">
                    <Link
                      href={DATA.contact.social.find((s) => s.name === "Google Scholar")?.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View all 30+ publications on Google Scholar
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </BlurFade>
            </div>
          </section>
        </BlurFade>

        {/* Education Section */}
        <BlurFade delay={BLUR_FADE_DELAY * 17}>
          <section id="education">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <GraduationCap className="h-5 w-5 text-primary" />
              Education
            </h2>
            <div className="space-y-4">
              {DATA.education.map((edu, i) => (
                <BlurFade key={edu.school} delay={BLUR_FADE_DELAY * 18 + i * 0.1}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{edu.degree}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {edu.school}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          <p>{edu.start ? `${edu.start} - ` : ""}{edu.end}</p>
                          <p>{edu.location}</p>
                        </div>
                      </div>
                    </CardHeader>
                    {(edu.description || edu.gpa) && (
                      <CardContent className="pt-0">
                        {edu.gpa && (
                          <Badge variant="secondary" className="mb-2 text-xs">
                            {edu.gpa.includes("%") ? `Grade: ${edu.gpa}` : `CGPA: ${edu.gpa}`}
                          </Badge>
                        )}
                        {edu.description && (
                          <p className="text-xs text-muted-foreground">
                            {edu.description}
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </BlurFade>
              ))}
            </div>
          </section>
        </BlurFade>

        {/* Awards Section */}
        <BlurFade delay={BLUR_FADE_DELAY * 19}>
          <section id="awards">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Award className="h-5 w-5 text-primary" />
              Awards & Honors
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {DATA.awards.map((award, i) => (
                <BlurFade key={award.title} delay={BLUR_FADE_DELAY * 20 + i * 0.05}>
                  <Card className="p-4">
                    <h3 className="text-sm font-medium">{award.title}</h3>
                    <p className="text-xs text-primary">{award.organization}</p>
                    <p className="text-xs text-muted-foreground">{award.date}</p>
                  </Card>
                </BlurFade>
              ))}
            </div>
          </section>
        </BlurFade>

        {/* Contact Section */}
        <BlurFade delay={BLUR_FADE_DELAY * 21}>
          <section id="contact" className="text-center">
            <Separator className="mb-8" />
            <h2 className="mb-2 text-xl font-bold">Get in Touch</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Interested in collaborating or have questions? Feel free to reach out.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href={`mailto:${DATA.contact.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  {DATA.contact.email}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={DATA.resumeUrl} target="_blank">
                  <Icons.download className="mr-2 h-4 w-4" />
                  Download Resume
                </Link>
              </Button>
            </div>
          </section>
        </BlurFade>

        {/* Footer */}
        <BlurFade delay={BLUR_FADE_DELAY * 22}>
          <footer className="pt-8 text-center text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {DATA.name}. All rights reserved.</p>
          </footer>
        </BlurFade>
      </div>
    </main>
  );
}
