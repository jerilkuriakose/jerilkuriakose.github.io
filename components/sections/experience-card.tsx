"use client";

import { useId, useState } from "react";
import { motion } from "motion/react";
import { Building2, Calendar, ChevronDown, MapPin } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { RoleMetrics } from "@/components/sections/role-metrics";
import type { DATA } from "@/data/resume";

export function ExperienceCard({
  job,
  delay,
}: {
  job: (typeof DATA.work)[number];
  delay: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <BlurFade delay={delay}>
      <div className="card-hover group relative bg-card rounded-lg border border-border p-6 hover:border-brand-vivid/50">
        {/* Timeline dot */}
        <div className="absolute -left-[41px] top-8 w-3 h-3 rounded-full bg-primary border-4 border-background hidden md:block" />
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-interactive transition-colors">
              {job.title}
            </h3>
            <p className="text-interactive font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {job.company}
              </a>
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

        {/* Per-role evidence: outside the disclosure, so it reads without expanding. */}
        <RoleMetrics metrics={job.metrics} />

        {job.highlights.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex items-center gap-2 text-sm font-medium text-interactive hover:underline"
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
              id={panelId}
              aria-hidden={!isOpen}
              inert={!isOpen}
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
                    className="text-sm text-muted-foreground pl-4 relative before:content-['▹'] before:absolute before:left-0 before:text-brand-vivid"
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
