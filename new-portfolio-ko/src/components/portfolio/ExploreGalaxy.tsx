"use client";

import { motion } from "framer-motion";
import {
  Maximize2,
  Minus,
  Orbit,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useRef } from "react";
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from "react-zoom-pan-pinch";
import type { PortfolioSection } from "@/data/portfolio";
import { ConstellationMap } from "./ConstellationMap";
import { GalaxyBackdrop } from "./GalaxyBackdrop";
import { MobileConstellationTrail } from "./MobileConstellationTrail";

type ExploreGalaxyProps = {
  sections: PortfolioSection[];
  visitorName: string;
  activeSection: PortfolioSection | null;
  onSelectSection: (section: PortfolioSection) => void;
  onOpenProfile: () => void;
};

const controlClass =
  "flex h-11 w-11 items-center justify-center rounded-xl border border-white/14 bg-[#151b2dcc] text-[#e5e3ff] backdrop-blur-lg transition-all duration-200 hover:border-orbit/55 hover:bg-orbit/15";

function ResetViewOnModalClose({
  activeSection,
}: {
  activeSection: PortfolioSection | null;
}) {
  const { resetTransform } = useControls();
  const wasModalOpen = useRef(activeSection !== null);

  useEffect(() => {
    const isModalOpen = activeSection !== null;

    if (wasModalOpen.current && !isModalOpen) {
      void resetTransform(650, "easeInOutCubic");
    }

    wasModalOpen.current = isModalOpen;
  }, [activeSection, resetTransform]);

  return null;
}

export function ExploreGalaxy({
  sections,
  visitorName,
  activeSection,
  onSelectSection,
  onOpenProfile,
}: ExploreGalaxyProps) {
  return (
    <motion.section
      key="galaxy"
      initial={{ opacity: 0, scale: 1.025 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-[#070b17]"
      aria-label="Interactive constellation explorer"
    >
      <header className="relative z-[40] flex min-h-[72px] shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0b1020df] px-3 backdrop-blur-xl sm:px-8 lg:px-12">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orbit/30 bg-orbit/10">
            <Orbit size={20} className="text-orbit" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-[15px] font-semibold tracking-[-.04em] text-white lg:text-[21px]">
              ORBITAL<span className="text-orbit">.</span>
            </div>
            <div className="max-w-[55vw] truncate font-mono text-[9px] tracking-[.09em] text-[#b4bfd7] sm:max-w-none sm:tracking-[.13em] lg:hidden">
              Welcome to orbit, {visitorName}!
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 hidden max-w-[min(54vw,620px)] -translate-x-1/2 text-center font-display text-[19px] font-semibold tracking-[-.035em] text-[#e9e9ff] lg:block xl:text-[22px]">
          <span className="block truncate">
            Welcome to orbit, {visitorName}!
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenProfile}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 font-display text-[12px] font-medium text-[#e4e8f7] transition-colors hover:bg-white/10 sm:px-5 sm:text-[13px]"
        >
          <UserRound size={16} aria-hidden="true" />
          <span>Profile</span>
        </button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <GalaxyBackdrop />
        <div className="relative h-full overflow-x-hidden overflow-y-auto overscroll-y-contain lg:hidden">
          <MobileConstellationTrail
            sections={sections}
            onSectionClick={onSelectSection}
          />
        </div>
        <div className="hidden h-full lg:block">
          <TransformWrapper
            initialScale={1}
            minScale={0.65}
            maxScale={2.4}
            centerOnInit
            limitToBounds={false}
            smooth={false}
            wheel={{ step: 0.035 }}
            panning={{ velocityDisabled: false }}
            zoomAnimation={{
              size: 0,
              animationTime: 450,
              animationType: "easeInOutCubic",
            }}
            doubleClick={{
              animationTime: 500,
              animationType: "easeInOutCubic",
            }}
            velocityAnimation={{
              disabled: false,
              sensitivityMouse: 0.65,
              sensitivityTouch: 0.85,
              maxStrengthMouse: 10,
              maxStrengthTouch: 18,
              inertia: 0.9,
              animationTime: 420,
              maxAnimationTime: 850,
              animationType: "easeOutCubic",
            }}
            autoAlignment={{
              animationTime: 440,
              animationType: "easeInOutCubic",
            }}
          >
            {({ zoomIn, zoomOut, resetTransform, zoomToElement }) => {
              function selectSection(section: PortfolioSection) {
                onSelectSection(section);
                zoomToElement(`section-${section.id}`, {
                  maxScale: 1.65,
                  animationTime: 680,
                  animationType: "easeInOutCubic",
                });
              }

              return (
                <>
                  <ResetViewOnModalClose activeSection={activeSection} />
                  <TransformComponent
                    wrapperClass="!w-full !h-full"
                    contentClass="!w-full !h-full !min-h-[950px] md:!min-h-[760px]"
                  >
                    <ConstellationMap
                      sections={sections}
                      activeSection={activeSection}
                      onSectionClick={selectSection}
                    />
                  </TransformComponent>

                  <div className="pointer-events-none absolute top-5 right-5 z-[20] hidden rounded-full border border-white/10 bg-[#0b1021a6] px-4 py-2.5 backdrop-blur-xl sm:block sm:top-8 sm:right-8">
                    <div className="flex items-center gap-2 font-mono text-[10px] tracking-[.12em] text-[#bdc8de] uppercase">
                      <Sparkles size={12} className="text-orbit" /> Drag to
                      explore
                    </div>
                  </div>

                  <div className="absolute right-5 bottom-5 z-[30] flex items-center gap-2 sm:right-8 sm:bottom-8">
                    <button
                      type="button"
                      aria-label="Zoom out"
                      onClick={() => zoomOut(0.16, 420, "easeInOutCubic")}
                      className={controlClass}
                    >
                      <Minus size={17} />
                    </button>
                    <button
                      type="button"
                      aria-label="Zoom in"
                      onClick={() => zoomIn(0.16, 420, "easeInOutCubic")}
                      className={controlClass}
                    >
                      <Plus size={17} />
                    </button>
                    <button
                      type="button"
                      aria-label="Reset galaxy view"
                      onClick={() => resetTransform(560, "easeInOutCubic")}
                      className={controlClass}
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>

                  <div className="pointer-events-none absolute bottom-7 left-6 z-[20] hidden font-mono text-[10px] tracking-[.12em] text-[#7887a4] uppercase md:block lg:left-8">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-orbit" /> WHEEL
                      TO ZOOM · DRAG TO PAN · CLICK TO DISCOVER
                    </span>
                  </div>
                </>
              );
            }}
          </TransformWrapper>
        </div>
      </div>
    </motion.section>
  );
}
