"use client";

import { ArrowUpRight, Compass, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import type { PortfolioSection } from "@/data/portfolio";

type MobileConstellationTrailProps = {
  sections: PortfolioSection[];
  onSectionClick: (section: PortfolioSection) => void;
};

export function MobileConstellationTrail({
  sections,
  onSectionClick,
}: MobileConstellationTrailProps) {
  return (
    <nav
      className="relative z-10 mx-auto min-h-full w-full max-w-[560px] px-4 pt-7 pb-[max(5rem,env(safe-area-inset-bottom))] sm:px-7 sm:pt-9"
      aria-label="Mobile constellation trail"
    >
      <div className="mb-7 flex items-start gap-3 pl-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#b9b5ff]/10 text-[#d4d0ff]">
          <Compass size={20} aria-hidden="true" />
        </span>
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[.16em] text-[#b7b4df] uppercase">
            <Sparkles size={12} aria-hidden="true" />
            Your star map
          </div>
          <p className="mt-1.5 font-display text-[15px] font-medium tracking-[-.025em] text-[#dce2f5]">
            Choose a constellation to explore.
          </p>
        </div>
      </div>

      <div className="relative space-y-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-6 bottom-6 left-[33px] w-px bg-gradient-to-b from-[#b9b5ff]/55 via-[#8ca0e9]/30 to-transparent sm:left-[37px]"
        />
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <button
              id={`mobile-section-${section.id}`}
              key={section.id}
              type="button"
              aria-label={`Explore ${section.title}`}
              onClick={() => onSectionClick(section)}
              style={{ "--node-color": section.color } as CSSProperties}
              className="group relative flex min-h-[86px] w-full items-center gap-4 rounded-[20px] border border-white/12 bg-[#121a30db] px-3 py-3 text-left shadow-[0_12px_35px_rgba(2,5,18,.2)] backdrop-blur-xl transition-colors duration-200 hover:border-white/30 hover:bg-[#1a2540e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6c0ff] active:bg-[#202847] sm:gap-5 sm:px-4"
            >
              <span
                aria-hidden="true"
                className="relative z-10 flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-[#1b2540] text-[#f3f0ff] shadow-[0_0_0_6px_rgba(185,181,255,.05)] sm:h-[60px] sm:w-[60px]"
                style={{
                  borderColor: `color-mix(in srgb, ${section.color} 68%, white)`,
                  boxShadow: `0 0 0 6px color-mix(in srgb, ${section.color} 11%, transparent), inset 0 0 24px color-mix(in srgb, ${section.color} 22%, transparent)`,
                }}
              >
                <Icon className="text-[1.4rem]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[9px] tracking-[.14em] text-[#a8b2d0] uppercase">
                  Constellation {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-1 block font-display text-[17px] leading-[1.25] font-semibold tracking-[-.035em] text-white">
                  {section.title}
                </span>
              </span>
              <ArrowUpRight
                size={18}
                className="shrink-0 text-[#afb4dd] transition-colors group-hover:text-white"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
