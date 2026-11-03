"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Compass, ExternalLink, Flag, Orbit } from "lucide-react";
import Image from "next/image";
import type { PortfolioSection } from "@/data/portfolio";

type ShowcaseProps = {
  section: PortfolioSection;
};

const entrance = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function ProjectsShowcase({ section }: ShowcaseProps) {
  const projects = section.content.projects ?? [];

  return (
    <div className="space-y-5">
      {projects.map((project, index) => (
        <motion.article
          key={project.title}
          {...entrance}
          transition={{ duration: 0.5, delay: index * 0.08 }}
          className="archive-project relative overflow-hidden rounded-[18px]"
        >
          <div className="relative z-[1] p-6 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-[500px]">
                <span className="archive-kicker">
                  <Orbit size={13} aria-hidden="true" />
                  Project {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-[clamp(1.7rem,3.5vw,2.5rem)] leading-[1.16] font-semibold tracking-[-.05em] text-white">
                  {project.title}
                </h3>
              </div>
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="archive-external-link inline-flex items-center gap-2 rounded-full px-4 py-3 font-display text-xs font-semibold transition-colors"
                >
                  Visit project <ExternalLink size={15} aria-hidden="true" />
                </a>
              )}
            </div>
            <p className="mt-6 max-w-[650px] text-[14px] leading-[1.9] text-[#b7c2d7]">
              {project.description}
            </p>
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="mb-4 font-mono text-[10px] tracking-[.15em] text-[#a39dc7] uppercase">
                Technologies & focus
              </p>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((technology) => (
                  <span key={technology} className="archive-label-chip">
                    {technology}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

function HobbiesShowcase({ section }: ShowcaseProps) {
  const hobbies = section.content.hobbies ?? [];

  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      {hobbies.map((hobby, index) => {
        const HobbyIcon = hobby.icon;

        return (
          <motion.article
            key={hobby.name}
            {...entrance}
            transition={{ duration: 0.42, delay: index * 0.07 }}
            className="archive-card group relative flex flex-col overflow-hidden rounded-[18px] p-5 sm:p-6"
          >
            <div className="relative z-[1] flex items-start justify-between gap-4">
              <div className="archive-icon-well flex h-14 w-14 items-center justify-center rounded-[19px] transition-transform duration-300 group-hover:scale-105">
                <HobbyIcon className="text-[1.5rem]" aria-hidden="true" />
              </div>
              <span className="font-mono text-[10px] tracking-[.13em] text-[#8390aa]">
                / {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="relative z-[1] mt-5">
              <h3 className="font-display text-xl leading-[1.2] font-semibold tracking-[-.04em] text-white sm:text-[1.45rem]">
                {hobby.name}
              </h3>
              <p className="mt-3 max-w-[340px] text-sm leading-[1.8] text-[#aeb9ce]">
                {hobby.description}
              </p>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

function GoalsShowcase({ section }: ShowcaseProps) {
  const goals = section.content.goals ?? [];

  return (
    <div>
      <div className="archive-feature-banner relative mb-7 overflow-hidden rounded-[24px] p-6 sm:p-8">
        <div className="relative z-[1] flex items-center gap-4">
          <span className="archive-icon-well flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]">
            <Compass size={23} aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-[10px] tracking-[.15em] text-[#bbb7e6] uppercase">
              Future coordinates
            </p>
            <h3 className="mt-1 font-display text-[1.5rem] leading-[1.2] font-semibold tracking-[-.04em] text-white">
              Always moving forward.
            </h3>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {goals.map((goal, index) => (
          <motion.article
            key={goal.title}
            {...entrance}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.35) }}
            className="archive-goal group grid gap-3 rounded-[20px] p-5 sm:grid-cols-[58px_minmax(0,1fr)] sm:gap-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="font-display text-[1.65rem] leading-none font-semibold tracking-[-.06em] text-[#bdb6ee]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Flag
                size={15}
                className="text-[#8f8ab4] sm:hidden"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="archive-label-chip">{goal.timeline}</span>
                <ArrowUpRight
                  size={15}
                  className="hidden text-[#8d88b7] sm:block"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-display text-[1.12rem] leading-[1.35] font-semibold tracking-[-.025em] text-white">
                {goal.title}
              </h3>
              <p className="mt-2 text-sm leading-[1.8] text-[#aab6cd]">
                {goal.description}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

function GalleryShowcase({ section }: ShowcaseProps) {
  const images = section.content.images ?? [];

  return (
    <div className="columns-1 gap-4 sm:columns-2">
      {images.map((image, index) => (
        <motion.figure
          key={image.url}
          {...entrance}
          transition={{ duration: 0.46, delay: index * 0.065 }}
          className="archive-gallery-frame group mb-4 inline-block w-fit max-w-full break-inside-avoid overflow-hidden rounded-[16px] align-top"
        >
          <Image
            src={image.url}
            alt={image.caption}
            width={image.width}
            height={image.height}
            sizes="(max-width: 640px) 100vw, 370px"
            className="block h-auto max-w-full"
          />
          <figcaption className="flex items-start justify-between gap-3 px-3 py-3 text-xs text-[#d6deed]">
            <span>{image.caption}</span>
            <span className="shrink-0 font-mono text-[10px] text-[#9b9dbd]">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(images.length).padStart(2, "0")}
            </span>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}

export function SectionModalShowcases({ section }: ShowcaseProps) {
  switch (section.id) {
    case "projects":
      return <ProjectsShowcase section={section} />;
    case "hobbies":
      return <HobbiesShowcase section={section} />;
    case "goals":
      return <GoalsShowcase section={section} />;
    default:
      return <GalleryShowcase section={section} />;
  }
}
