import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { BLUR_FADE_DELAY } from "@/components/sections/constants";
import { DATA } from "@/data/resume";

/**
 * The hardcoded `05. What's Next?` eyebrow was deleted: section numbers come
 * from `.numbered-heading`'s positional counter, and this literal was already
 * wrong before the resequence.
 */
export function Contact() {
  return (
        <section id="contact" className="py-24 text-center">
          <BlurFade delay={BLUR_FADE_DELAY * 36}>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
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
                  className="h-12 w-12 border-border hover:border-primary hover:text-primary"
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
                  className="h-12 w-12 border-border hover:border-primary hover:text-primary"
                >
                  <Link href={`tel:${DATA.contact.tel}`} title="Call">
                    <Phone className="h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 px-5 border-border hover:border-primary hover:text-primary font-mono"
                >
                  <Link href={DATA.resumeUrl} target="_blank">
                    <Icons.download className="mr-2 h-4 w-4" />
                    <span>Resume</span>
                  </Link>
                </Button>
              </div>
            </div>
          </BlurFade>
        </section>
  );
}
