"use client";

import { motion } from "framer-motion";
import { CircuitBoard, Layers3, Sparkles } from "lucide-react";
import Image from "next/image";
import type { PortfolioSection } from "@/data/portfolio";

type NarrativeProps = {
  section: PortfolioSection;
};

const entrance = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

function AboutNarrative({ section }: NarrativeProps) {
  const { content } = section;
  const details = content.details ?? [];

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,285px)_1fr]">
        {content.image && (
          <motion.div
            {...entrance}
            transition={{ duration: 0.45 }}
            className="relative mx-auto w-full max-w-[320px] md:max-w-none"
          >
            <div className="archive-portrait relative aspect-square overflow-hidden rounded-[18px]">
              <Image
                src={content.image}
                alt="Michael Cecilio"
                fill
                sizes="(max-width: 768px) 320px, 285px"
                className="object-cover object-center"
                priority
              />
            </div>
          </motion.div>
        )}
        <motion.div
          {...entrance}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="relative flex flex-col justify-start gap-5"
        >
          <div>
            <span className="archive-kicker">
              <Sparkles size={13} aria-hidden="true" />
              The person behind the orbit
            </span>
            <h3 className="mt-4 font-display text-[clamp(1.6rem,3.2vw,2.2rem)] leading-[1.16] font-semibold tracking-[-.05em] text-white">
              Curious by nature.
              <br />
              <span className="archive-text-gradient">Building by choice.</span>
            </h3>
            {details[0] && (
              <p className="mt-5 text-[15px] leading-[1.85] text-[#b5c0d7]">
                {details[0]}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {details.slice(1).map((detail, index) => (
          <motion.div
            key={detail}
            {...entrance}
            transition={{ duration: 0.4, delay: 0.12 + index * 0.06 }}
            className={`archive-card relative min-w-0 overflow-hidden rounded-[16px] p-4 sm:p-5 ${index === 0 ? "sm:col-span-2" : ""}`}
          >
            <span className="mb-4 block font-mono text-[10px] tracking-[.15em] text-[#b6aedc]">
              {String(index + 1).padStart(2, "0")} / PROFILE
            </span>
            <p className="relative z-[1] text-[13px] leading-[1.85] text-[#d0d8ea] sm:text-sm">
              {detail}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TimelineNarrative({ section }: NarrativeProps) {
  const isAi = section.id === "ai-expertise";
  const milestones = isAi
    ? (section.content.timeline ?? []).map((item) => ({
        key: `${item.role}-${item.year}`,
        title: item.role,
        period: item.year,
        context: item.company,
        description: item.description,
      }))
    : (section.content.qualifications ?? []).map((item) => ({
        key: `${item.degree}-${item.year}`,
        title: item.degree,
        period: item.year,
        context: item.institution,
        description: item.description,
      }));

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <span className="archive-kicker">
          {isAi ? <CircuitBoard size={13} /> : <Layers3 size={13} />}
          {isAi ? "AI activity" : "Development activity"}
        </span>
        <span className="font-mono text-[10px] tracking-[.08em] text-[#a7b1c8]">
          {milestones.length} entries
        </span>
      </div>

      <div className="archive-timeline relative ml-2 space-y-4 pl-7 sm:ml-3 sm:pl-10">
        {milestones.map((item, index) => (
          <motion.article
            key={item.key}
            {...entrance}
            transition={{ duration: 0.4, delay: Math.min(index * 0.055, 0.35) }}
            className="archive-card archive-timeline-item relative rounded-[16px] p-5 sm:p-6"
          >
            <span className="archive-timeline-dot absolute top-8 -left-[35px] h-3.5 w-3.5 rounded-full sm:-left-[47px]" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="archive-label-chip">{item.period}</span>
              <span className="font-mono text-[10px] tracking-[.13em] text-[#7f8ca9]">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(milestones.length).padStart(2, "0")}
              </span>
            </div>
            <h4 className="mt-4 font-display text-[1.13rem] leading-[1.3] font-semibold tracking-[-.03em] text-white sm:text-[1.3rem]">
              {item.title}
            </h4>
            <p className="mt-1 text-xs font-medium text-[#bbb8db]">
              {item.context}
            </p>
            <div className="my-4 h-px bg-white/9" />
            <p className="text-sm leading-[1.85] text-[#a9b6cd]">
              {item.description}
            </p>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

function SkillsNarrative({ section }: NarrativeProps) {
  const categories = section.content.skillCategories ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {categories.map((category, index) => (
        <motion.article
          key={category.name}
          {...entrance}
          transition={{ duration: 0.4, delay: index * 0.075 }}
          className="archive-card relative overflow-hidden rounded-[18px] p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] tracking-[.15em] text-[#a99dcd] uppercase">
                Capability / {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-[1.25rem] font-semibold tracking-[-.035em] text-white">
                {category.name}
              </h3>
            </div>
            <span className="archive-icon-well flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]">
              <Layers3 size={18} aria-hidden="true" />
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {category.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-[12px] leading-5 font-medium text-[#d5ddef]"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.article>
      ))}
    </div>
  );
}

export function SectionModalNarratives({ section }: NarrativeProps) {
  if (section.id === "about") {
    return <AboutNarrative section={section} />;
  }

  if (section.id === "technical-skills") {
    return <SkillsNarrative section={section} />;
  }

  return <TimelineNarrative section={section} />;
}
