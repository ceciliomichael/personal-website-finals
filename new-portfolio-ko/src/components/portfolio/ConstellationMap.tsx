"use client";

import { motion } from "framer-motion";
import { type CSSProperties, useMemo } from "react";
import type { PortfolioSection } from "@/data/portfolio";

type ConstellationMapProps = {
  sections: PortfolioSection[];
  activeSection: PortfolioSection | null;
  onSectionClick: (section: PortfolioSection) => void;
};

export function ConstellationMap({
  sections,
  activeSection,
  onSectionClick,
}: ConstellationMapProps) {
  const connections = useMemo(
    () =>
      sections.flatMap((section, index) =>
        sections
          .filter((other) => other.id !== section.id)
          .sort(
            (a, b) =>
              Math.hypot(
                section.position.x - a.position.x,
                section.position.y - a.position.y,
              ) -
              Math.hypot(
                section.position.x - b.position.x,
                section.position.y - b.position.y,
              ),
          )
          .slice(0, 2)
          .map((target) => ({ from: section, to: target, index })),
      ),
    [sections],
  );

  return (
    <div className="orbital-map relative h-full min-h-[950px] w-full overflow-hidden md:min-h-[760px]">
      <svg
        aria-hidden="true"
        className="orbital-map-lines pointer-events-none absolute inset-0 hidden h-full w-full md:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {connections.map(({ from, to }) => (
            <linearGradient
              key={`gradient-${from.id}-${to.id}`}
              id={`orbital-gradient-${from.id}-${to.id}`}
            >
              <stop offset="0%" stopColor={from.color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={to.color} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>
        {connections.map(({ from, to, index }) => (
          <motion.path
            key={`line-${from.id}-${to.id}`}
            d={`M${from.position.x} ${from.position.y} L${to.position.x} ${to.position.y}`}
            stroke={`url(#orbital-gradient-${from.id}-${to.id})`}
            strokeWidth=".32"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 1.1, delay: index * 0.09 }}
          />
        ))}
      </svg>

      <svg
        aria-hidden="true"
        className="orbital-map-lines pointer-events-none absolute inset-0 h-full w-full md:hidden"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {sections.slice(0, -1).map((section, index) => (
          <motion.path
            key={section.id}
            d={`M28 ${16 + (index * 68) / sections.length} L28 ${16 + ((index + 1) * 68) / sections.length}`}
            stroke="#a8a3e6"
            strokeOpacity=".45"
            strokeWidth=".24"
            strokeDasharray="1 1.1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: index * 0.09 }}
          />
        ))}
      </svg>

      {sections.map((section, index) => {
        const Icon = section.icon;
        const style = {
          "--desktop-left": `${section.position.x}%`,
          "--desktop-top": `${section.position.y}%`,
          "--mobile-top": `${16 + (index * 68) / sections.length}%`,
          "--node-color": section.color,
        } as CSSProperties;

        return (
          <button
            id={`section-${section.id}`}
            key={section.id}
            type="button"
            aria-label={`Explore ${section.title}`}
            aria-pressed={activeSection?.id === section.id}
            onClick={() => onSectionClick(section)}
            className={`orbital-map-node group absolute z-10 flex h-[62px] w-[62px] items-center justify-center rounded-full p-0 text-[#edeaff] transition-all duration-300 focus-visible:z-20 max-[480px]:h-[52px] max-[480px]:w-[52px] ${activeSection?.id === section.id ? "active" : ""}`}
            style={style}
          >
            <span className="absolute inset-[5px] rounded-full border border-white/8" />
            <Icon
              className="relative z-[1] text-[1.5rem] transition-transform duration-300 group-hover:scale-110 max-[480px]:text-[1.3rem]"
              aria-hidden="true"
            />
            <span className="orbital-node-label absolute top-[calc(100%+18px)] left-1/2 z-[20] -translate-x-1/2 rounded-full border border-[#b9b5ff28] bg-[#11182cdb] px-3.5 py-2 font-display text-[11px] font-medium whitespace-nowrap text-[#d5d9ee] opacity-75 shadow-[0_8px_24px_rgba(0,0,0,.3)] backdrop-blur-lg transition-opacity duration-200">
              {section.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
